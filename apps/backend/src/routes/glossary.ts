import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createGlossaryTermSchema = z.object({
  projectId: z.string(),
  sourceTerm: z.string().min(1),
  targetTerm: z.string().min(1),
  category: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  description: z.string().optional(),
  isGlobal: z.boolean().default(false),
});

const updateGlossaryTermSchema = z.object({
  sourceTerm: z.string().min(1).optional(),
  targetTerm: z.string().min(1).optional(),
  category: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  description: z.string().optional(),
  isGlobal: z.boolean().optional(),
});

// GET /api/glossary?projectId=xxx - List glossary terms for a project
router.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId, category, search } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'projectId is required',
      });
    }

    // Build where clause
    const where: any = { projectId: projectId as string };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { sourceTerm: { contains: search as string, mode: 'insensitive' } },
        { targetTerm: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const terms = await prisma.glossaryTerm.findMany({
      where,
      include: {
        _count: {
          select: {
            matches: true,
          },
        },
      },
      orderBy: [{ category: 'asc' }, { sourceTerm: 'asc' }],
    });

    res.json({
      success: true,
      data: terms,
    });
  } catch (error) {
    console.error('Error fetching glossary terms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch glossary terms',
    });
  }
});

// GET /api/glossary/:id - Get single glossary term
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const term = await prisma.glossaryTerm.findUnique({
      where: { id },
      include: {
        matches: {
          include: {
            textEntry: {
              select: {
                id: true,
                originalText: true,
                currentTranslation: true,
              },
            },
          },
        },
      },
    });

    if (!term) {
      return res.status(404).json({
        success: false,
        error: 'Glossary term not found',
      });
    }

    res.json({
      success: true,
      data: term,
    });
  } catch (error) {
    console.error('Error fetching glossary term:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch glossary term',
    });
  }
});

// POST /api/glossary - Create glossary term
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createGlossaryTermSchema.parse(req.body);

    const term = await prisma.glossaryTerm.create({
      data: {
        ...validatedData,
        aliases: validatedData.aliases || [],
      },
    });

    // Auto-apply to existing entries if requested
    if (req.body.autoApply !== false) {
      await applyGlossaryToEntries(term.projectId, term.id, term.sourceTerm);
    }

    res.status(201).json({
      success: true,
      data: term,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error creating glossary term:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create glossary term',
    });
  }
});

// PUT /api/glossary/:id - Update glossary term
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateGlossaryTermSchema.parse(req.body);

    const term = await prisma.glossaryTerm.update({
      where: { id },
      data: validatedData,
    });

    res.json({
      success: true,
      data: term,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error updating glossary term:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update glossary term',
    });
  }
});

// DELETE /api/glossary/:id - Delete glossary term
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.glossaryTerm.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Glossary term deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting glossary term:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete glossary term',
    });
  }
});

// GET /api/glossary/categories/:projectId - Get all categories for a project
router.get('/categories/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const categories = await prisma.glossaryTerm.findMany({
      where: { projectId },
      select: { category: true },
      distinct: ['category'],
    });

    const categoryList = categories
      .map((c) => c.category)
      .filter((c) => c !== null)
      .sort();

    res.json({
      success: true,
      data: categoryList,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
    });
  }
});

// POST /api/glossary/:id/apply - Apply glossary term to entries
router.post('/:id/apply', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const term = await prisma.glossaryTerm.findUnique({
      where: { id },
    });

    if (!term) {
      return res.status(404).json({
        success: false,
        error: 'Glossary term not found',
      });
    }

    const matchedCount = await applyGlossaryToEntries(
      term.projectId,
      term.id,
      term.sourceTerm
    );

    res.json({
      success: true,
      data: {
        matchedEntries: matchedCount,
      },
    });
  } catch (error) {
    console.error('Error applying glossary term:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply glossary term',
    });
  }
});

// POST /api/glossary/bulk-import - Bulk import glossary terms
router.post('/bulk-import', async (req: Request, res: Response) => {
  try {
    const { projectId, terms } = req.body;

    if (!projectId || !Array.isArray(terms)) {
      return res.status(400).json({
        success: false,
        error: 'projectId and terms array are required',
      });
    }

    const validatedTerms = terms.map((term) =>
      createGlossaryTermSchema.parse({ ...term, projectId })
    );

    const result = await prisma.glossaryTerm.createMany({
      data: validatedTerms,
      skipDuplicates: true,
    });

    res.status(201).json({
      success: true,
      data: {
        count: result.count,
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

    console.error('Error bulk importing glossary terms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk import glossary terms',
    });
  }
});

// Helper function to apply glossary term to matching entries
async function applyGlossaryToEntries(
  projectId: string,
  glossaryTermId: string,
  sourceTerm: string
): Promise<number> {
  // Find all entries that contain the source term
  const matchingEntries = await prisma.textEntry.findMany({
    where: {
      projectId,
      originalText: {
        contains: sourceTerm,
        mode: 'insensitive',
      },
    },
    select: { id: true },
  });

  if (matchingEntries.length === 0) {
    return 0;
  }

  // Create glossary matches for these entries
  await prisma.glossaryMatch.createMany({
    data: matchingEntries.map((entry) => ({
      textEntryId: entry.id,
      glossaryTermId,
      autoApplied: true,
    })),
    skipDuplicates: true,
  });

  return matchingEntries.length;
}

export default router;