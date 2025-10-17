import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { parserManager, GameFormat } from '../services/parsers';

const router = Router();
const prisma = new PrismaClient();

// GET /api/export/:projectId - Export project translations
router.get('/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { 
      format = 'json', 
      includeUntranslated = false,
      includeOriginal = true 
    } = req.query;

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    // Fetch entries
    const where: any = { projectId };
    if (!includeUntranslated) {
      where.status = { not: 'UNTRANSLATED' };
    }

    const entries = await prisma.textEntry.findMany({
      where,
      orderBy: [{ lineNumber: 'asc' }, { createdAt: 'asc' }],
    });

    if (entries.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No entries to export',
      });
    }

    // Export to specified format
    const exportData = await parserManager.export(
      entries.map(e => ({
        originalText: e.originalText,
        currentTranslation: e.currentTranslation ?? undefined,
        context: e.context ?? undefined,
        lineNumber: e.lineNumber ?? undefined,
        metadata: e,
      })),
      format as GameFormat
    );

    // Set filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${project.name}_${format}_${timestamp}.${getExtension(format as GameFormat)}`;

    // Record export history
    await prisma.importExport.create({
      data: {
        projectId,
        type: 'export',
        format: format as string,
        fileName: filename,
        fileSize: Buffer.byteLength(exportData, 'utf-8'),
        status: 'success',
        entriesCount: entries.length,
      },
    });

    // Send file
    res.setHeader('Content-Type', getContentType(format as GameFormat));
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);
  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({
      success: false,
      error: 'Export failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/export/:projectId/preview - Preview export without downloading
router.get('/:projectId/preview', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { format = 'json', limit = '10' } = req.query;

    const entries = await prisma.textEntry.findMany({
      where: { projectId },
      take: parseInt(limit as string),
      orderBy: [{ lineNumber: 'asc' }],
    });

    if (entries.length === 0) {
      return res.json({
        success: true,
        data: {
          preview: 'No entries to preview',
          totalEntries: 0,
        },
      });
    }

    const exportData = await parserManager.export(
      entries.map(e => ({
        originalText: e.originalText,
        currentTranslation: e.currentTranslation ?? undefined,
        context: e.context ?? undefined,
        lineNumber: e.lineNumber ?? undefined,
        metadata: e,
      })),
      format as GameFormat
    );

    const totalCount = await prisma.textEntry.count({
      where: { projectId },
    });

    res.json({
      success: true,
      data: {
        preview: exportData,
        previewEntries: entries.length,
        totalEntries: totalCount,
        format,
      },
    });
  } catch (error) {
    console.error('Preview Error:', error);
    res.status(500).json({
      success: false,
      error: 'Preview failed',
    });
  }
});

// GET /api/export/:projectId/history - Get export history
router.get('/:projectId/history', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const history = await prisma.importExport.findMany({
      where: {
        projectId,
        type: 'export',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching export history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch export history',
    });
  }
});

// Helper methods
function getExtension(format: GameFormat): string {
  switch (format) {
    case 'json':
    case 'rpgmaker':
      return 'json';
    case 'csv':
      return 'csv';
    case 'tsv':
      return 'tsv';
    case 'renpy':
      return 'rpy';
    default:
      return 'txt';
  }
}

function getContentType(format: GameFormat): string {
  switch (format) {
    case 'json':
    case 'rpgmaker':
      return 'application/json';
    case 'csv':
      return 'text/csv';
    case 'tsv':
      return 'text/tab-separated-values';
    default:
      return 'text/plain';
  }
}

export default router;