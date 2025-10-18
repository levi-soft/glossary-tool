/**
 * CSV Parser for CSV/TSV game translation files
 * Supports flexible column mapping
 */

import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import type { ParsedEntry } from './jsonParser';

export interface ColumnMapping {
  fileColumn: string;
  dbField: 'id' | 'context' | 'originalText' | 'translation' | 'skip';
  prefix?: string;
}

export class CSVParser {
  /**
   * Get column names from CSV
   */
  getColumns(content: string): string[] {
    try {
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        to: 1, // Only first row
      });

      if (records.length > 0) {
        return Object.keys(records[0]);
      }

      return [];
    } catch (error) {
      throw new Error(`Failed to get columns: ${error}`);
    }
  }

  /**
   * Auto-detect column mapping
   */
  autoDetectMapping(columns: string[]): ColumnMapping[] {
    return columns.map(col => {
      const lower = col.toLowerCase();
      
      // Original text detection
      if (lower.includes('original') || lower.includes('source') || 
          lower.includes('text_en') || lower.includes('string_en') ||
          lower.match(/string_?1/i) || lower.includes('text')) {
        return { fileColumn: col, dbField: 'originalText' };
      }
      
      // Translation detection
      if (lower.includes('translation') || lower.includes('target') || 
          lower.includes('text_vi') || lower.includes('string_vi') ||
          lower.match(/string_?2/i)) {
        return { fileColumn: col, dbField: 'translation' };
      }
      
      // Context detection
      if (lower.includes('context') || lower.includes('type') || lower.includes('category')) {
        return { fileColumn: col, dbField: 'context' };
      }
      
      // Character detection (becomes context with prefix)
      if (lower.includes('character') || lower.includes('speaker') || lower.includes('char')) {
        return { fileColumn: col, dbField: 'context', prefix: 'Character: ' };
      }
      
      // ID columns (skip)
      if (lower.match(/^(id|line|num|game|index)/i)) {
        return { fileColumn: col, dbField: 'skip' };
      }
      
      // Default: skip unknown columns
      return { fileColumn: col, dbField: 'skip' };
    });
  }

  /**
   * Parse CSV with column mapping
   */
  parseWithMapping(
    content: string,
    filename: string,
    columnMapping: ColumnMapping[]
  ): ParsedEntry[] {
    try {
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });

      return records.map((record: any, index: number) => {
        const entry: any = {
          lineNumber: index + 1,
          sourceFile: filename,
        };

        // Apply column mapping
        for (const map of columnMapping) {
          if (map.dbField === 'skip') continue;

          let value = record[map.fileColumn] || '';
          
          // Apply prefix if specified
          if (map.prefix && value) {
            value = map.prefix + value;
          }

          if (map.dbField === 'originalText') {
            entry.originalText = value.trim();
          } else if (map.dbField === 'translation') {
            entry.currentTranslation = value.trim();
          } else if (map.dbField === 'context') {
            entry.context = value.trim() || undefined;
          }
        }

        // Ensure originalText exists
        if (!entry.originalText) {
          entry.originalText = 'Empty';
        }

        return entry as ParsedEntry;
      });
    } catch (error) {
      throw new Error(`Failed to parse CSV with mapping: ${error}`);
    }
  }

  /**
   * Parse CSV file (legacy method with auto-detection)
   */
  parse(content: string, filename: string): ParsedEntry[] {
    try {
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
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