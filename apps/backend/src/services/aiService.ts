import { GoogleGenerativeAI } from '@google/generative-ai';
import { mockAiService } from './mockAiService';
import { openRouterService } from './openrouterService';

// Determine which AI service to use
const USE_OPENROUTER = process.env.USE_OPENROUTER === 'true';
const USE_GEMINI = process.env.USE_GEMINI === 'true';

let genAI: GoogleGenerativeAI | null = null;
let aiMode: 'openrouter' | 'gemini' | 'mock' = 'mock';

// Priority: OpenRouter > Gemini > Mock
if (USE_OPENROUTER && process.env.OPENROUTER_API_KEY) {
  aiMode = 'openrouter';
  console.log('🎯 Using OpenRouter AI');
} else if (USE_GEMINI && process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    aiMode = 'gemini';
    console.log('🤖 Using Gemini AI');
  } catch (error) {
    console.warn('⚠️  Gemini init failed, using Mock AI');
    aiMode = 'mock';
  }
} else {
  console.log('🎭 Using Mock AI (No API keys configured)');
  aiMode = 'mock';
}

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
  contextType?: string;
  model?: string;
}

interface TranslationResponse {
  translation: string;
  confidence: number;
  alternatives?: string[];
  reasoning?: string;
  model?: string;
  cost?: number;
}

export class AIService {
  private model: any;
  private mode: 'openrouter' | 'gemini' | 'mock';

  constructor() {
    this.mode = aiMode;
    
    if (this.mode === 'gemini') {
      try {
        this.model = genAI!.getGenerativeModel({ model: 'gemini-pro' });
      } catch (error) {
        console.warn('⚠️  Gemini model init failed, switching to Mock');
        this.mode = 'mock';
        this.model = null;
      }
    } else {
      this.model = null;
    }
  }

  /**
   * Translate text using configured AI service
   */
  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    // Route to appropriate AI service
    switch (this.mode) {
      case 'openrouter':
        return openRouterService.translate(request);
      
      case 'gemini':
        return this.translateWithGemini(request);
      
      case 'mock':
      default:
        return mockAiService.translate(request);
    }
  }

  private async translateWithGemini(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      const prompt = this.buildPrompt(request);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        translation: text.trim(),
        confidence: 0.85,
        alternatives: [],
        reasoning: 'Translated by Gemini Pro',
      };
    } catch (error: any) {
      console.error('❌ Gemini failed, using Mock AI');
      return mockAiService.translate(request);
    }
  }

  /**
   * Batch translate multiple texts
   */
  async batchTranslate(
    requests: TranslationRequest[]
  ): Promise<TranslationResponse[]> {
    switch (this.mode) {
      case 'openrouter':
        return openRouterService.batchTranslate(requests);
      
      case 'gemini':
      case 'mock':
      default:
        return Promise.all(requests.map(req => this.translate(req)));
    }
  }

  /**
   * Build prompt for game translation
   */
  private buildPrompt(request: TranslationRequest): string {
    const { text, sourceLang, targetLang, context, contextType } = request;

    // Simplified prompt for better compatibility
    let prompt = `Translate the following ${sourceLang} game text to ${targetLang}.\n\n`;

    // Add context if available
    if (contextType) {
      prompt += `Context: ${contextType}\n`;
    }

    // Add glossary terms
    if (context?.glossaryTerms && context.glossaryTerms.length > 0) {
      prompt += `\nRequired terms:\n`;
      context.glossaryTerms.forEach((term) => {
        prompt += `- "${term.source}" → "${term.target}"\n`;
      });
    }

    // Add the text to translate
    prompt += `\nText: "${text}"\n\n`;
    prompt += `Translate to ${targetLang}. `;
    
    if (context?.glossaryTerms && context.glossaryTerms.length > 0) {
      prompt += `Use these terms: `;
      context.glossaryTerms.forEach((term) => {
        prompt += `"${term.source}" → "${term.target}", `;
      });
    }
    
    prompt += `\n\nProvide ONLY the translation, nothing else.`;

    return prompt;
  }

  /**
   * Get AI model capabilities
   */
  getCapabilities() {
    switch (this.mode) {
      case 'openrouter':
        return {
          ...openRouterService.getCapabilities(),
          currentMode: 'openrouter',
        };
      
      case 'gemini':
        return {
          provider: 'Google Gemini',
          model: 'gemini-pro',
          currentMode: 'gemini',
          maxTokens: 30720,
          rateLimit: '60 requests/minute',
          cost: 'Free',
          features: [
            'Context-aware translation',
            'Glossary integration',
            'Free tier',
          ],
        };
      
      case 'mock':
      default:
        return {
          ...mockAiService.getCapabilities(),
          currentMode: 'mock',
        };
    }
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