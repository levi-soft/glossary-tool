import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface TranslationContext {
  gameGenre?: string;
  characterContext?: string;
  previousDialogue?: string[];
  glossaryTerms?: Array<{ source: string; target: string }>;
}

interface TranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
  context?: TranslationContext;
  contextType?: string; // dialogue, menu, item, etc.
}

interface TranslationResponse {
  translation: string;
  confidence: number;
  alternatives?: string[];
  reasoning?: string;
}

export class AIService {
  private model: any;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️  GEMINI_API_KEY not set. AI translation will not work.');
    }
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * Translate text using Gemini AI
   */
  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      const prompt = this.buildPrompt(request);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response from AI
      try {
        const parsed = JSON.parse(text);
        return {
          translation: parsed.translation,
          confidence: parsed.confidence || 0.85,
          alternatives: parsed.alternatives || [],
          reasoning: parsed.reasoning,
        };
      } catch {
        // If AI doesn't return JSON, use text directly
        return {
          translation: text.trim(),
          confidence: 0.8,
          alternatives: [],
        };
      }
    } catch (error) {
      console.error('AI Translation Error:', error);
      throw new Error('AI translation failed');
    }
  }

  /**
   * Batch translate multiple texts
   */
  async batchTranslate(
    requests: TranslationRequest[]
  ): Promise<TranslationResponse[]> {
    // Translate in parallel with rate limiting
    const batchSize = 5; // Gemini allows ~60 req/min
    const results: TranslationResponse[] = [];

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((req) => this.translate(req))
      );
      results.push(...batchResults);

      // Small delay to avoid rate limiting
      if (i + batchSize < requests.length) {
        await this.delay(1000); // 1 second delay between batches
      }
    }

    return results;
  }

  /**
   * Build prompt for game translation
   */
  private buildPrompt(request: TranslationRequest): string {
    const { text, sourceLang, targetLang, context, contextType } = request;

    let prompt = `You are a professional game translator specializing in translating from ${sourceLang} to ${targetLang}.

**Task:** Translate the following game text accurately and naturally.

`;

    // Add context if available
    if (contextType) {
      prompt += `**Context Type:** ${contextType}\n`;
    }

    if (context?.gameGenre) {
      prompt += `**Game Genre:** ${context.gameGenre}\n`;
    }

    if (context?.characterContext) {
      prompt += `**Character/Speaker:** ${context.characterContext}\n`;
    }

    // Add glossary terms
    if (context?.glossaryTerms && context.glossaryTerms.length > 0) {
      prompt += `\n**Required Terminology (MUST USE):**\n`;
      context.glossaryTerms.forEach((term) => {
        prompt += `- "${term.source}" → "${term.target}"\n`;
      });
    }

    // Add previous dialogue for context
    if (context?.previousDialogue && context.previousDialogue.length > 0) {
      prompt += `\n**Previous Dialogue:**\n`;
      context.previousDialogue.forEach((line, i) => {
        prompt += `${i + 1}. ${line}\n`;
      });
    }

    // Add the text to translate
    prompt += `\n**Text to Translate:**
"${text}"

**Requirements:**
1. Keep the same tone and style appropriate for the context type
2. Use the provided glossary terms exactly as specified
3. Maintain consistency with previous dialogue if provided
4. Keep any special formatting (e.g., {placeholders}, variables)
5. Sound natural in ${targetLang}

**Output Format (JSON):**
{
  "translation": "your translation here",
  "confidence": 0.95,
  "alternatives": ["alternative 1", "alternative 2"],
  "reasoning": "brief explanation of translation choices"
}
`;

    return prompt;
  }

  /**
   * Get AI model capabilities
   */
  getCapabilities() {
    return {
      provider: 'Google Gemini',
      model: 'gemini-pro',
      maxTokens: 30720,
      rateLimit: '60 requests/minute',
      cost: 'Free (with limits)',
      features: [
        'Context-aware translation',
        'Glossary integration',
        'Multiple alternatives',
        'Confidence scoring',
        'JSON output parsing',
      ],
    };
  }

  /**
   * Utility: delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const aiService = new AIService();