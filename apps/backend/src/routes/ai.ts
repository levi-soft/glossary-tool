import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { aiService } from '../services/aiService';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// Validation schema
const translateSchema = z.object({
  text: z.string().min(1),
  sourceLang: z.string().default('en'),
  targetLang: z.string().default('vi'),
  contextType: z.string().optional(),
  projectId: z.string().optional(),
  useGlossary: z.boolean().default(true),
});

const batchTranslateSchema = z.object({
  texts: z.array(z.string()),
  sourceLang: z.string().default('en'),
  targetLang: z.string().default('vi'),
  projectId: z.string().optional(),
  useGlossary: z.boolean().default(true),
});

// POST /api/ai/translate - Single translation
router.post('/translate', async (req: Request, res: Response) => {
  try {
    const validatedData = translateSchema.parse(req.body);
    const { text, sourceLang, targetLang, contextType, projectId, useGlossary } =
      validatedData;

    // Generate cache key
    const cacheKey = generateCacheKey({
      text,
      sourceLang,
      targetLang,
      contextType,
      projectId,
    });

    // Check cache first
    const cached = await checkCache(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: {
          ...cached,
          cached: true,
        },
      });
    }

    // Fetch glossary terms if requested
    let glossaryTerms: Array<{ source: string; target: string }> = [];
    if (useGlossary && projectId) {
      const terms = await prisma.glossaryTerm.findMany({
        where: { projectId },
        select: {
          sourceTerm: true,
          targetTerm: true,
        },
      });
      glossaryTerms = terms.map((t) => ({
        source: t.sourceTerm,
        target: t.targetTerm,
      }));
    }

    // Call AI service
    const result = await aiService.translate({
      text,
      sourceLang,
      targetLang,
      contextType,
      context: {
        glossaryTerms,
      },
    });

    // Cache the result
    await saveToCache(cacheKey, result, {
      text,
      sourceLang,
      targetLang,
    });

    res.json({
      success: true,
      data: {
        ...result,
        cached: false,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('AI Translation Error:', error);
    res.status(500).json({
      success: false,
      error: 'AI translation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/ai/translate/batch - Batch translation
router.post('/translate/batch', async (req: Request, res: Response) => {
  try {
    const validatedData = batchTranslateSchema.parse(req.body);
    const { texts, sourceLang, targetLang, projectId, useGlossary } =
      validatedData;

    if (texts.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 texts per batch',
      });
    }

    // Fetch glossary if needed
    let glossaryTerms: Array<{ source: string; target: string }> = [];
    if (useGlossary && projectId) {
      const terms = await prisma.glossaryTerm.findMany({
        where: { projectId },
        select: {
          sourceTerm: true,
          targetTerm: true,
        },
      });
      glossaryTerms = terms.map((t) => ({
        source: t.sourceTerm,
        target: t.targetTerm,
      }));
    }

    // Prepare requests
    const requests = texts.map((text) => ({
      text,
      sourceLang,
      targetLang,
      context: { glossaryTerms },
    }));

    // Batch translate
    const results = await aiService.batchTranslate(requests);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Batch AI Translation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Batch translation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/ai/translate/entry/:id - Translate specific entry
router.post('/translate/entry/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { useGlossary = true, forceRefresh = false } = req.body;

    // Fetch the entry
    const entry = await prisma.textEntry.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            sourceLang: true,
            targetLang: true,
          },
        },
      },
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found',
      });
    }

    // ALWAYS fetch glossary FIRST to get latest terms
    let glossaryTerms: Array<{ source: string; target: string }> = [];
    if (useGlossary) {
      const terms = await prisma.glossaryTerm.findMany({
        where: { projectId: entry.project.id },
        select: {
          sourceTerm: true,
          targetTerm: true,
        },
      });
      glossaryTerms = terms.map((t) => ({
        source: t.sourceTerm,
        target: t.targetTerm,
      }));
      
      console.log(`📚 Fetched ${glossaryTerms.length} glossary terms for translation`);
    }

    // Generate cache key INCLUDING glossary to ensure cache invalidation when glossary changes
    const cacheKey = generateCacheKey({
      text: entry.originalText,
      sourceLang: entry.project.sourceLang,
      targetLang: entry.project.targetLang,
      contextType: entry.context,
      projectId: entry.project.id,
      glossaryHash: JSON.stringify(glossaryTerms), // Include glossary in cache key!
    });

    // Check cache ONLY if not forcing refresh
    if (!forceRefresh) {
      const cached = await checkCache(cacheKey);
      if (cached) {
        console.log('✅ Using cached translation');
        await prisma.textEntry.update({
          where: { id },
          data: { aiSuggestions: cached },
        });

        return res.json({
          success: true,
          data: { ...cached, cached: true },
        });
      }
    }

    // Translate with glossary
    console.log('🤖 Requesting new AI translation with glossary...');
    const result = await aiService.translate({
      text: entry.originalText,
      sourceLang: entry.project.sourceLang,
      targetLang: entry.project.targetLang,
      contextType: entry.context ?? undefined,
      context: { glossaryTerms },
    });

    // Save to cache and update entry
    await Promise.all([
      saveToCache(cacheKey, result, {
        text: entry.originalText,
        sourceLang: entry.project.sourceLang,
        targetLang: entry.project.targetLang,
      }),
      prisma.textEntry.update({
        where: { id },
        data: { aiSuggestions: result as any },
      }),
    ]);

    res.json({
      success: true,
      data: { ...result, cached: false },
    });
  } catch (error) {
    console.error('Entry Translation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Translation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/ai/capabilities - Get AI service info
router.get('/capabilities', (req: Request, res: Response) => {
  const capabilities = aiService.getCapabilities();
  res.json({
    success: true,
    data: capabilities,
  });
});

// Helper: Generate cache key
function generateCacheKey(params: {
  text: string;
  sourceLang: string;
  targetLang: string;
  contextType?: string;
  projectId?: string;
  glossaryHash?: string;
}): string {
  const str = JSON.stringify(params);
  return crypto.createHash('sha256').update(str).digest('hex');
}

// Helper: Check cache
async function checkCache(
  cacheKey: string
): Promise<{ translation: string; confidence: number; alternatives?: string[] } | null> {
  try {
    const cached = await prisma.aICache.findUnique({
      where: { cacheKey },
    });

    if (!cached) return null;

    // Check if expired
    if (cached.expiresAt < new Date()) {
      // Delete expired cache
      await prisma.aICache.delete({ where: { cacheKey } });
      return null;
    }

    // Update hit count
    await prisma.aICache.update({
      where: { cacheKey },
      data: { hitCount: { increment: 1 } },
    });

    return {
      translation: cached.translation,
      confidence: cached.confidence || 0.85,
      alternatives: (cached.alternatives as any) || [],
    };
  } catch (error) {
    console.error('Cache check error:', error);
    return null;
  }
}

// Helper: Save to cache
async function saveToCache(
  cacheKey: string,
  result: { translation: string; confidence: number; alternatives?: string[] },
  metadata: { text: string; sourceLang: string; targetLang: string }
): Promise<void> {
  try {
    // Cache for 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.aICache.create({
      data: {
        cacheKey,
        originalText: metadata.text,
        translation: result.translation,
        confidence: result.confidence,
        alternatives: result.alternatives || [],
        service: 'gemini',
        expiresAt,
        context: {
          sourceLang: metadata.sourceLang,
          targetLang: metadata.targetLang,
        },
      },
    });
  } catch (error) {
    // Cache save is not critical, just log
    console.error('Cache save error:', error);
  }
}

export default router;