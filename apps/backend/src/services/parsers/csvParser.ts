/**
 * CSV Parser for CSV/TSV game translation files
 * Common format: ID, Context, Original, Translation
 */

import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import type { ParsedEntry } from './jsonParser';

export class CSVParser {
  /**
   * Parse CSV file
   */
  parse(content: string, filename: string): ParsedEntry[] {
    try {
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true, // Handle UTF-8 BOM
      });

      return records.map((record: any, index: number) => {
        // Support various column names
        const originalText =
          record.original ||
          record.Original ||
          record.text ||
          record.Text ||
          record.source ||
          record.Source ||
          '';

        const context =
          record.context ||
          record.Context ||
          record.type ||
          record.Type ||
          '';

        return {
          originalText: originalText.trim(),
          context: context.trim() || undefined,
          lineNumber: index + 1,
          sourceFile: filename,
          metadata: record,
        };
      });
    } catch (error) {
      throw new Error(`Failed to parse CSV: ${error}`);
    }
  }

  /**
   * Export to CSV format
   */
  export(
    entries: Array<{
      originalText: string;
      currentTranslation?: string;
      context?: string;
      lineNumber?: number;
    }>
  ): string {
    const records = entries.map((entry, index) => ({
      ID: String(index + 1).padStart(3, '0'),
      Context: entry.context || '',
      Original: entry.originalText,
      Translation: entry.currentTranslation || '',
      Status: entry.currentTranslation ? 'Translated' : 'Pending',
    }));

    return stringify(records, {
      header: true,
      columns: ['ID', 'Context', 'Original', 'Translation', 'Status'],
    });
  }

  /**
   * Export as TSV (Tab-separated)
   */
  exportTSV(
    entries: Array<{
      originalText: string;
      currentTranslation?: string;
      context?: string;
    }>
  ): string {
    const records = entries.map((entry, index) => ({
      ID: String(index + 1).padStart(3, '0'),
      Context: entry.context || '',
      Original: entry.originalText,
      Translation: entry.currentTranslation || '',
    }));

    return stringify(records, {
      header: true,
      columns: ['ID', 'Context', 'Original', 'Translation'],
      delimiter: '\t',
    });
  }
}

export const csvParser = new CSVParser();