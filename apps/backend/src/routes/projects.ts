import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  gameFormat: z.string(),
  sourceLang: z.string().default('en'),
  targetLang: z.string().default('vi'),
  ownerId: z.string(), // TODO: Get from auth session
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  gameFormat: z.string().optional(),
  sourceLang: z.string().optional(),
  targetLang: z.string().optional(),
});

// GET /api/projects - List all projects
router.get('/', async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        _count: {
          select: {
            textEntries: true,
            glossaryTerms: true,
          },
        },
        textEntries: {
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate stats for each project
    const projectsWithStats = projects.map((project) => {
      const totalEntries = project._count.textEntries;
      const translatedEntries = project.textEntries.filter(
        (entry) =>
          entry.status === 'TRANSLATED' ||
          entry.status === 'IN_REVIEW' ||
          entry.status === 'APPROVED'
      ).length;

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        gameFormat: project.gameFormat,
        sourceLang: project.sourceLang,
        targetLang: project.targetLang,
        totalEntries,
        translatedEntries,
        glossaryCount: project._count.glossaryTerms,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    });

    res.json({
      success: true,
      data: projectsWithStats,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects',
    });
  }
});

// GET /api/projects/:id - Get project by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            textEntries: true,
            glossaryTerms: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project',
    });
  }
});

// POST /api/projects - Create new project
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createProjectSchema.parse(req.body);

    // Get or create default user if ownerId not provided
    let ownerId = validatedData.ownerId;
    
    if (!ownerId || ownerId === 'default-user') {
      // Try to find or create default user
      let defaultUser = await prisma.user.findFirst({
        where: { email: 'default@glossary-tool.com' },
      });

      if (!defaultUser) {
        defaultUser = await prisma.user.create({
          data: {
            email: 'default@glossary-tool.com',
            username: 'default',
            password: 'hashed-password', // TODO: Proper password hashing
            role: 'ADMIN',
          },
        });
      }

      ownerId = defaultUser.id;
    }

    const project = await prisma.project.create({
      data: {
        ...validatedData,
        ownerId,
      },
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateProjectSchema.parse(req.body);

    const project = await prisma.project.update({
      where: { id },
      data: validatedData,
    });

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project',
    });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.project.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project',
    });
  }
});

// GET /api/projects/:id/stats - Get project statistics
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [project, statusCounts] = await Promise.all([
      prisma.project.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
        },
      }),
      prisma.textEntry.groupBy({
        by: ['status'],
        where: { projectId: id },
        _count: true,
      }),
    ]);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    const stats = {
      projectId: project.id,
      projectName: project.name,
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching project stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project statistics',
    });
  }
});

export default router;