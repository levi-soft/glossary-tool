import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/analytics/:projectId - Get project analytics
router.get('/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    // Overview stats
    const [totalEntries, statusCounts, aiCacheCount] = await Promise.all([
      prisma.textEntry.count({ where: { projectId } }),
      prisma.textEntry.groupBy({
        by: ['status'],
        where: { projectId },
        _count: true,
      }),
      prisma.aICache.count(),
    ]);

    const statusStats = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    const translated = (statusStats.TRANSLATED || 0) + 
                       (statusStats.IN_REVIEW || 0) + 
                       (statusStats.APPROVED || 0);

    const progress = totalEntries > 0 
      ? Math.round((translated / totalEntries) * 100) 
      : 0;

    // Glossary stats
    const glossaryCount = await prisma.glossaryTerm.count({ where: { projectId } });

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTranslations = await prisma.translation.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
        textEntry: { projectId },
      },
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalEntries,
          translated,
          untranslated: statusStats.UNTRANSLATED || 0,
          inProgress: statusStats.IN_PROGRESS || 0,
          inReview: statusStats.IN_REVIEW || 0,
          approved: statusStats.APPROVED || 0,
          needsRevision: statusStats.NEEDS_REVISION || 0,
          progress,
          glossaryTerms: glossaryCount,
          aiCacheHits: aiCacheCount,
        },
        byStatus: statusStats,
        recentActivity: {
          translationsLast7Days: recentTranslations,
        },
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
    });
  }
});

// GET /api/analytics/:projectId/progress - Get progress over time
router.get('/:projectId/progress', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { days = '30' } = req.query;

    const daysInt = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysInt);

    // Get translations grouped by date
    const translations = await prisma.translation.findMany({
      where: {
        createdAt: { gte: startDate },
        textEntry: { projectId },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const progressByDate = translations.reduce((acc, t) => {
      const date = t.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: progressByDate,
    });
  } catch (error) {
    console.error('Progress analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch progress data',
    });
  }
});

export default router;