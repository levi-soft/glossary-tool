import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { parserManager, GameFormat } from '../services/parsers';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.json', '.csv', '.tsv', '.rpy', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not supported. Allowed: ${allowedExts.join(', ')}`));
    }
  },
});
// POST /api/import/preview - Preview file columns
router.post('/preview', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const content = fs.readFileSync(req.file.path, 'utf-8');
    const ext = path.extname(req.file.originalname).toLowerCase();

    if (ext === '.csv' || ext === '.tsv') {
      // CSV/TSV preview
      const { csvParser } = await import('../services/parsers/csvParser');
      const columns = csvParser.getColumns(content);
      const suggestedMapping = csvParser.autoDetectMapping(columns);

      // Get first row as preview
      const records = (await import('csv-parse/sync')).parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        to: 1,
      });

      // Clean up file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        data: {
          columns,
          suggestedMapping,
          previewData: records[0] || {},
          fileType: ext === '.csv' ? 'csv' : 'tsv',
        },
      });
    } else {
      // For non-CSV, just return basic info
      fs.unlinkSync(req.file.path);
      
      res.json({
        success: true,
        data: {
          fileType: ext.replace('.', ''),
          message: 'Column mapping not available for this format',
        },
      });
    }
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Preview Error:', error);
    res.status(500).json({
      success: false,
      error: 'Preview failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});


// POST /api/import/:projectId - Import game file
router.post('/:projectId', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { format, autoApplyGlossary = true, columnMapping } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    // Read file content
    const content = fs.readFileSync(req.file.path, 'utf-8');
    const ext = path.extname(req.file.originalname).toLowerCase();

    let parseResult: any;

    // Check if CSV/TSV with column mapping
    if ((ext === '.csv' || ext === '.tsv') && columnMapping) {
      console.log('📊 Parsing CSV with column mapping:', columnMapping);
      
      const { csvParser } = await import('../services/parsers/csvParser');
      const mapping = typeof columnMapping === 'string' ? JSON.parse(columnMapping) : columnMapping;
      const entries = csvParser.parseWithMapping(content, req.file.originalname, mapping);
      
      parseResult = {
        entries,
        format: ext === '.csv' ? 'csv' : 'tsv',
        stats: {
          totalEntries: entries.length,
          fileSize: content.length,
          parseTime: 0,
        },
      };
    } else {
      // Use regular parser
      parseResult = await parserManager.parse(
        content,
        req.file.originalname,
        format as GameFormat
      );
    }

    // Create entries in database
    const createPromises = parseResult.entries.map((entry) =>
      prisma.textEntry.create({
        data: {
          projectId,
          context: entry.context,
          originalText: entry.originalText,
          lineNumber: entry.lineNumber,
          sourceFile: entry.sourceFile,
        },
      })
    );

    const createdEntries = await Promise.allSettled(createPromises);
    const successCount = createdEntries.filter((r) => r.status === 'fulfilled').length;
    const failCount = createdEntries.filter((r) => r.status === 'rejected').length;

    // Auto-apply glossary if requested
    if (autoApplyGlossary) {
      const glossaryTerms = await prisma.glossaryTerm.findMany({
        where: { projectId },
      });

      for (const term of glossaryTerms) {
        await applyGlossaryToEntries(projectId, term.id, term.sourceTerm);
      }
    }

    // Record import history
    await prisma.importExport.create({
      data: {
        projectId,
        type: 'import',
        format: parseResult.format,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        status: failCount > 0 ? 'partial' : 'success',
        entriesCount: successCount,
        errorLog: failCount > 0 ? { failed: failCount } : undefined,
      },
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      success: true,
      data: {
        format: parseResult.format,
        totalParsed: parseResult.entries.length,
        imported: successCount,
        failed: failCount,
        parseTime: parseResult.stats.parseTime,
        autoAppliedGlossary: autoApplyGlossary,
      },
    });
  } catch (error) {
    // Clean up file if error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Import Error:', error);
    res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/import/:projectId/history - Get import history
router.get('/:projectId/history', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const history = await prisma.importExport.findMany({
      where: {
        projectId,
        type: 'import',
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
    console.error('Error fetching import history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch import history',
    });
  }
});

// GET /api/import/formats - Get supported formats
router.get('/formats', (req: Request, res: Response) => {
  const formats = parserManager.getSupportedFormats();
  res.json({
    success: true,
    data: formats,
  });
});

// Helper: Apply glossary to entries
async function applyGlossaryToEntries(
  projectId: string,
  glossaryTermId: string,
  sourceTerm: string
): Promise<number> {
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