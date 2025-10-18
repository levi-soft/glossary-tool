/**
 * Term Extractor Service
 * Automatically detect and suggest glossary terms from translated texts
 */

interface ExtractedTerm {
  sourceTerm: string;
  targetTerm: string;
  occurrences: number;
  contexts: string[];
  confidence: number;
  category?: string;
  examples: Array<{
    original: string;
    translation: string;
  }>;
}

export class TermExtractor {
  /**
   * Extract potential glossary terms from text entries
   */
  async extract(
    entries: Array<{
      originalText: string;
      currentTranslation?: string;
      context?: string;
    }>,
    minOccurrences: number = 2
  ): Promise<ExtractedTerm[]> {
    const termPairs = this.findTermPairs(entries);
    const candidates = this.scoreCandidates(termPairs, minOccurrences);
    const categorized = this.categorizeTerms(candidates, entries);
    
    return categorized;
  }

  /**
   * Find matching term pairs between original and translation
   */
  private findTermPairs(
    entries: Array<{
      originalText: string;
      currentTranslation?: string;
      context?: string;
    }>
  ): Map<string, Array<{ target: string; context?: string; examples: any[] }>> {
    const termMap = new Map<string, Array<{ target: string; context?: string; examples: any[] }>>();

    // Only process entries with translations
    const translatedEntries = entries.filter(e => e.currentTranslation);

    for (const entry of translatedEntries) {
      // Extract potential terms from source
      const sourceTerms = this.extractTerms(entry.originalText);

      // For each source term, find corresponding target in FULL translation
      for (const sourceTerm of sourceTerms) {
        // If source term appears in original, use full translation as target
        if (entry.originalText.includes(sourceTerm)) {
          const key = sourceTerm.toLowerCase();
          
          if (!termMap.has(key)) {
            termMap.set(key, []);
          }

          termMap.get(key)!.push({
            target: entry.currentTranslation!, // Use FULL translation
            context: entry.context,
            examples: [{
              original: entry.originalText,
              translation: entry.currentTranslation,
            }],
          });
        }
      }
    }

    return termMap;
  }

  /**
   * Extract potential terms from text
   */
  private extractTerms(text: string): string[] {
    const terms: string[] = [];

    // Pattern 1: Capitalized words (English)
    const capitalizedWords = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    terms.push(...capitalizedWords);

    // Pattern 2: All caps words (game terms like HP, MP)
    const allCapsWords = text.match(/\b[A-Z]{2,}\b/g) || [];
    terms.push(...allCapsWords);

    // Pattern 3: Words in quotes
    const quotedWords = text.match(/"([^"]+)"/g) || [];
    terms.push(...quotedWords.map(q => q.replace(/"/g, '')));

    // Pattern 4: Numbers with units
    const numberedTerms = text.match(/\d+\s*[A-Z]{2,}/g) || [];
    terms.push(...numberedTerms);

    // Pattern 5: Japanese Katakana sequences (ア-ン)
    const katakana = text.match(/[ァ-ヴー]+/g) || [];
    terms.push(...katakana);

    // Pattern 6: Japanese Kanji + Hiragana (common names/terms)
    const kanjiTerms = text.match(/[\u4e00-\u9faf]+[\u3040-\u309f]*/g) || [];
    terms.push(...kanjiTerms);

    // Pattern 7: Korean Hangul sequences
    const hangul = text.match(/[가-힣]+/g) || [];
    terms.push(...hangul);

    // Pattern 8: Chinese characters sequences
    const chinese = text.match(/[\u4e00-\u9fff]{2,}/g) || [];
    terms.push(...chinese);

    return [...new Set(terms)]; // Remove duplicates
  }

  /**
   * Score and filter candidates
   */
  private scoreCandidates(
    termMap: Map<string, Array<{ target: string; context?: string; examples: any[] }>>,
    minOccurrences: number
  ): Array<{
    source: string;
    target: string;
    occurrences: number;
    contexts: string[];
    examples: any[];
  }> {
    const candidates: Array<any> = [];

    for (const [source, matches] of termMap.entries()) {
      // Count occurrences of each target translation
      const targetCounts = new Map<string, number>();
      const targetContexts = new Map<string, Set<string>>();
      const targetExamples = new Map<string, any[]>();

      for (const match of matches) {
        const count = targetCounts.get(match.target) || 0;
        targetCounts.set(match.target, count + 1);

        if (!targetContexts.has(match.target)) {
          targetContexts.set(match.target, new Set());
        }
        if (match.context) {
          targetContexts.get(match.target)!.add(match.context);
        }

        if (!targetExamples.has(match.target)) {
          targetExamples.set(match.target, []);
        }
        targetExamples.get(match.target)!.push(...match.examples);
      }

      // Get most common target translation
      let maxCount = 0;
      let mostCommonTarget = '';

      for (const [target, count] of targetCounts.entries()) {
        if (count > maxCount) {
          maxCount = count;
          mostCommonTarget = target;
        }
      }

      // Only include if meets minimum occurrences
      if (maxCount >= minOccurrences) {
        candidates.push({
          source,
          target: mostCommonTarget,
          occurrences: maxCount,
          contexts: Array.from(targetContexts.get(mostCommonTarget) || []),
          examples: targetExamples.get(mostCommonTarget)!.slice(0, 3), // Max 3 examples
        });
      }
    }

    // Sort by occurrences (most frequent first)
    return candidates.sort((a, b) => b.occurrences - a.occurrences);
  }

  /**
   * Categorize terms based on patterns and context
   */
  private categorizeTerms(
    candidates: Array<any>,
    entries: Array<any>
  ): ExtractedTerm[] {
    return candidates.map(candidate => {
      const category = this.detectCategory(
        candidate.source,
        candidate.target,
        candidate.contexts
      );

      const confidence = this.calculateConfidence(
        candidate.occurrences,
        candidate.contexts.length
      );

      return {
        sourceTerm: candidate.source,
        targetTerm: candidate.target,
        occurrences: candidate.occurrences,
        contexts: candidate.contexts,
        confidence,
        category,
        examples: candidate.examples,
      };
    });
  }

  /**
   * Detect category based on patterns
   */
  private detectCategory(
    source: string,
    target: string,
    contexts: string[]
  ): string {
    // All caps = game term
    if (/^[A-Z]{2,}$/.test(source)) {
      return 'Game Terms';
    }

    // Capitalized = possibly character/location
    if (/^[A-Z][a-z]+/.test(source)) {
      if (contexts.includes('dialogue')) {
        return 'Characters';
      }
      return 'Story';
    }

    // Context-based detection
    if (contexts.includes('item')) {
      return 'Items';
    }

    if (contexts.includes('quest')) {
      return 'Quests';
    }

    if (contexts.includes('skill')) {
      return 'Skills';
    }

    if (contexts.includes('menu')) {
      return 'UI';
    }

    return 'General';
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(occurrences: number, contextVariety: number): number {
    // More occurrences = higher confidence
    let score = Math.min(occurrences / 10, 0.5);

    // More context variety = higher confidence  
    score += Math.min(contextVariety / 5, 0.3);

    // Bonus for high frequency
    if (occurrences >= 5) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Get extraction statistics
   */
  getStats(extractedTerms: ExtractedTerm[]) {
    const byCategory = extractedTerms.reduce((acc, term) => {
      const cat = term.category || 'General';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTerms: extractedTerms.length,
      byCategory,
      highConfidence: extractedTerms.filter(t => t.confidence >= 0.8).length,
      mostFrequent: extractedTerms.slice(0, 10),
    };
  }
}

export const termExtractor = new TermExtractor();