import { Router, Request, Response } from 'express';
import { PrismaClient, EntryStatus } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createEntrySchema = z.object({
  projectId: z.string(),
  context: z.string().optional(),
  originalText: z.string().min(1),
  currentTranslation: z.string().optional(),
  lineNumber: z.number().optional(),
  sourceFile: z.string().optional(),
});

const updateEntrySchema = z.object({
  context: z.string().optional(),
  currentTranslation: z.string().optional(),
  status: z.nativeEnum(EntryStatus).optional(),
});

const bulkCreateEntriesSchema = z.array(createEntrySchema);

// GET /api/entries?projectId=xxx - List entries for a project
router.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId, status, search, page = '1', limit = '50' } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'projectId is required',
      });
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // Build where clause
    const where: any = { projectId: projectId as string };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { originalText: { contains: search as string, mode: 'insensitive' } },
        {
          currentTranslation: {
            contains: search as string,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [entries, total] = await Promise.all([
      prisma.textEntry.findMany({
        where,
        include: {
          translations: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          glossaryMatches: {
            include: {
              glossaryTerm: true,
            },
          },
        },
        orderBy: [{ lineNumber: 'asc' }, { createdAt: 'asc' }],
        skip,
        take,
      }),
      prisma.textEntry.count({ where }),
    ]);

    res.json({
      success: true,
      data: entries,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch entries',
    });
  }
});

// GET /api/entries/:id - Get single entry
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const entry = await prisma.textEntry.findUnique({
      where: { id },
      include: {
        translations: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        glossaryMatches: {
          include: {
            glossaryTerm: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found',
      });
    }

    res.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error('Error fetching entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch entry',
    });
  }
});

// POST /api/entries - Create single entry
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createEntrySchema.parse(req.body);

    const entry = await prisma.textEntry.create({
      data: {
        ...validatedData,
        status: EntryStatus.UNTRANSLATED,
      },
    });

    res.status(201).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error creating entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create entry',
    });
  }
});

// POST /api/entries/bulk - Bulk create entries
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const validatedData = bulkCreateEntriesSchema.parse(req.body);

    const entries = await prisma.textEntry.createMany({
      data: validatedData.map((entry) => ({
        ...entry,
        status: EntryStatus.UNTRANSLATED,
      })),
      skipDuplicates: true,
    });

    res.status(201).json({
      success: true,
      data: {
        count: entries.count,
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

    console.error('Error creating entries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create entries',
    });
  }
});

// PUT /api/entries/:id - Update entry
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateEntrySchema.parse(req.body);

    // Auto-update status based on translation
    if (validatedData.currentTranslation && !validatedData.status) {
      validatedData.status = EntryStatus.TRANSLATED;
    }

    const entry = await prisma.textEntry.update({
      where: { id },
      data: validatedData,
    });

    res.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error updating entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update entry',
    });
  }
});

// DELETE /api/entries/:id - Delete entry
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.textEntry.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Entry deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete entry',
    });
  }
});

// POST /api/entries/:id/translate - Save translation
router.post('/:id/translate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { translation, userId, source = 'manual' } = req.body;

    if (!translation) {
      return res.status(400).json({
        success: false,
        error: 'Translation text is required',
      });
    }

    // Update entry and create translation record
    const [updatedEntry, translationRecord] = await prisma.$transaction([
      prisma.textEntry.update({
        where: { id },
        data: {
          currentTranslation: translation,
          status: EntryStatus.TRANSLATED,
        },
      }),
      prisma.translation.create({
        data: {
          textEntryId: id,
          userId: userId || 'system', // TODO: Get from auth
          translationText: translation,
          source,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        entry: updatedEntry,
        translation: translationRecord,
      },
    });
  } catch (error) {
    console.error('Error saving translation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save translation',
    });
  }
});

// GET /api/entries/:id/history - Get translation history
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const history = await prisma.translation.findMany({
      where: { textEntryId: id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching translation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch translation history',
    });
  }
});

export default router;