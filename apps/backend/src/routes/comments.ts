import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schema
const createCommentSchema = z.object({
  textEntryId: z.string(),
  userId: z.string().default('default-user'), // TODO: Get from auth session
  content: z.string().min(1),
});

const updateCommentSchema = z.object({
  content: z.string().min(1),
});

// GET /api/comments?textEntryId=xxx - Get comments for an entry
router.get('/', async (req: Request, res: Response) => {
  try {
    const { textEntryId } = req.query;

    if (!textEntryId) {
      return res.status(400).json({
        success: false,
        error: 'textEntryId is required',
      });
    }

    const comments = await prisma.comment.findMany({
      where: { textEntryId: textEntryId as string },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments',
    });
  }
});

// POST /api/comments - Create comment
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createCommentSchema.parse(req.body);

    // Get or create default user
    let userId = validatedData.userId;
    if (!userId || userId === 'default-user') {
      let defaultUser = await prisma.user.findFirst({
        where: { email: 'default@glossary-tool.com' },
      });

      if (!defaultUser) {
        defaultUser = await prisma.user.create({
          data: {
            email: 'default@glossary-tool.com',
            username: 'default',
            password: 'hashed-password',
            role: 'ADMIN',
          },
        });
      }

      userId = defaultUser.id;
    }

    const comment = await prisma.comment.create({
      data: {
        textEntryId: validatedData.textEntryId,
        userId,
        content: validatedData.content,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create comment',
    });
  }
});

// PUT /api/comments/:id - Update comment
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateCommentSchema.parse(req.body);

    const comment = await prisma.comment.update({
      where: { id },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update comment',
    });
  }
});

// DELETE /api/comments/:id - Delete comment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.comment.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment',
    });
  }
});

// GET /api/comments/count/:textEntryId - Get comment count for entry
router.get('/count/:textEntryId', async (req: Request, res: Response) => {
  try {
    const { textEntryId } = req.params;

    const count = await prisma.comment.count({
      where: { textEntryId },
    });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Error counting comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to count comments',
    });
  }
});

export default router;