/**
 * JSON Parser for generic JSON game files
 * Supports common JSON structures used in games
 */

export interface ParsedEntry {
  context?: string;
  originalText: string;
  lineNumber?: number;
  sourceFile?: string;
  metadata?: any;
}

export class JSONParser {
  /**
   * Parse JSON file and extract text entries
   */
  parse(content: string, filename: string): ParsedEntry[] {
    try {
      const data = JSON.parse(content);
      const entries: ParsedEntry[] = [];

      // Recursive function to extract all strings
      this.extractStrings(data, entries, '', filename);

      return entries;
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error}`);
    }
  }

  /**
   * Recursively extract strings from object
   */
  private extractStrings(
    obj: any,
    entries: ParsedEntry[],
    path: string,
    filename: string,
    depth: number = 0
  ): void {
    if (depth > 10) return; // Prevent infinite recursion

    if (typeof obj === 'string' && obj.trim().length > 0) {
      // Found a string
      entries.push({
        context: path || 'text',
        originalText: obj,
        sourceFile: filename,
        metadata: { path },
      });
    } else if (Array.isArray(obj)) {
      // Array: iterate through items
      obj.forEach((item, index) => {
        this.extractStrings(
          item,
          entries,
          `${path}[${index}]`,
          filename,
          depth + 1
        );
      });
    } else if (typeof obj === 'object' && obj !== null) {
      // Object: iterate through keys
      Object.entries(obj).forEach(([key, value]) => {
        const newPath = path ? `${path}.${key}` : key;
        this.extractStrings(value, entries, newPath, filename, depth + 1);
      });
    }
  }

  /**
   * Export translations back to JSON format
   */
  export(entries: Array<{ originalText: string; currentTranslation?: string; metadata?: any }>): string {
    const result: any = {};

    entries.forEach((entry) => {
      if (entry.metadata?.path && entry.currentTranslation) {
        const path = entry.metadata.path;
        this.setByPath(result, path, entry.currentTranslation);
      }
    });

    return JSON.stringify(result, null, 2);
  }

  /**
   * Set value by path (e.g., "dialogue.0.text")
   */
  private setByPath(obj: any, path: string, value: string): void {
    const parts = path.split(/[\.\[\]]+/).filter(Boolean);
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const nextPart = parts[i + 1];
      const isNextArray = !isNaN(parseInt(nextPart));

      if (!current[part]) {
        current[part] = isNextArray ? [] : {};
      }

      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }
}

export const jsonParser = new JSONParser();