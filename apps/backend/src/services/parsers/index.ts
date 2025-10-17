/**
 * Parser Manager
 * Auto-detects file format and routes to appropriate parser
 */

import { jsonParser } from './jsonParser';
import { csvParser } from './csvParser';
import { renpyParser } from './renpyParser';
import type { ParsedEntry } from './jsonParser';

export type GameFormat = 'json' | 'csv' | 'tsv' | 'renpy' | 'rpgmaker' | 'xml';

export interface ParseResult {
  entries: ParsedEntry[];
  format: GameFormat;
  stats: {
    totalEntries: number;
    fileSize: number;
    parseTime: number;
  };
}

export class ParserManager {
  /**
   * Auto-detect and parse file
   */
  async parse(
    content: string,
    filename: string,
    format?: GameFormat
  ): Promise<ParseResult> {
    const startTime = Date.now();
    let detectedFormat = format || this.detectFormat(filename, content);
    let entries: ParsedEntry[] = [];

    try {
      switch (detectedFormat) {
        case 'json':
        case 'rpgmaker': // RPG Maker uses JSON
          entries = jsonParser.parse(content, filename);
          break;

        case 'csv':
        case 'tsv':
          entries = csvParser.parse(content, filename);
          break;

        case 'renpy':
          entries = renpyParser.parse(content, filename);
          break;

        default:
          throw new Error(`Unsupported format: ${detectedFormat}`);
      }

      // Filter out empty entries
      entries = entries.filter((e) => e.originalText && e.originalText.trim().length > 0);

      // Remove duplicates
      entries = this.deduplicateEntries(entries);

      const parseTime = Date.now() - startTime;

      return {
        entries,
        format: detectedFormat,
        stats: {
          totalEntries: entries.length,
          fileSize: content.length,
          parseTime,
        },
      };
    } catch (error) {
      throw new Error(`Parse failed: ${error}`);
    }
  }

  /**
   * Export entries to specific format
   */
  async export(
    entries: Array<{
      originalText: string;
      currentTranslation?: string;
      context?: string;
      lineNumber?: number;
      metadata?: any;
    }>,
    format: GameFormat,
    originalContent?: string
  ): Promise<string> {
    switch (format) {
      case 'json':
      case 'rpgmaker':
        return jsonParser.export(entries);

      case 'csv':
        return csvParser.export(entries);

      case 'tsv':
        return csvParser.exportTSV(entries);

      case 'renpy':
        return renpyParser.export(entries, originalContent);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Detect file format from filename and content
   */
  private detectFormat(filename: string, content: string): GameFormat {
    const ext = filename.split('.').pop()?.toLowerCase();

    // By extension
    switch (ext) {
      case 'json':
        return 'json';
      case 'csv':
        return 'csv';
      case 'tsv':
        return 'tsv';
      case 'rpy':
        return 'renpy';
      case 'xml':
        return 'xml';
    }

    // By content
    if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
      return 'json';
    }

    if (content.includes('\t') && content.split('\n')[0].includes('\t')) {
      return 'tsv';
    }

    if (content.includes(',') && content.split('\n')[0].includes(',')) {
      return 'csv';
    }

    if (content.includes('label ') && content.includes('menu:')) {
      return 'renpy';
    }

    // Default
    return 'json';
  }

  /**
   * Remove duplicate entries (same text)
   */
  private deduplicateEntries(entries: ParsedEntry[]): ParsedEntry[] {
    const seen = new Set<string>();
    return entries.filter((entry) => {
      const key = entry.originalText.toLowerCase().trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Get supported formats
   */
  getSupportedFormats(): Array<{
    format: GameFormat;
    name: string;
    extensions: string[];
    description: string;
  }> {
    return [
      {
        format: 'json',
        name: 'JSON',
        extensions: ['.json'],
        description: 'Generic JSON game files',
      },
      {
        format: 'csv',
        name: 'CSV',
        extensions: ['.csv'],
        description: 'Comma-separated values',
      },
      {
        format: 'tsv',
        name: 'TSV',
        extensions: ['.tsv'],
        description: 'Tab-separated values',
      },
      {
        format: 'renpy',
        name: "Ren'Py",
        extensions: ['.rpy'],
        description: 'Visual Novel script files',
      },
      {
        format: 'rpgmaker',
        name: 'RPG Maker',
        extensions: ['.json'],
        description: 'RPG Maker game data',
      },
    ];
  }
}

export const parserManager = new ParserManager();
export * from './jsonParser';