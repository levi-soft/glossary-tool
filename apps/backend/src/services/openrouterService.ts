/**
 * OpenRouter AI Service
 * Unified API for multiple AI providers (GPT-4, Claude, Gemini, etc.)
 * Website: https://openrouter.ai
 */

import axios from 'axios';

interface OpenRouterRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
  model?: string;
  context?: any;
  contextType?: string;
}

interface OpenRouterResponse {
  translation: string;
  confidence: number;
  alternatives?: string[];
  reasoning?: string;
  model: string;
  cost?: number;
}

export class OpenRouterService {
  private apiKey: string;
  private baseURL = 'https://openrouter.ai/api/v1';
  private defaultModel: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.defaultModel = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';
    
    if (!this.apiKey) {
      console.warn('⚠️  OPENROUTER_API_KEY not set');
    } else {
      console.log('✅ OpenRouter initialized with model:', this.defaultModel);
    }
  }

  /**
   * Translate using OpenRouter
   */
  async translate(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    try {
      const prompt = this.buildPrompt(request);
      const model = request.model || this.defaultModel;

      console.log(`📝 Calling OpenRouter with model: ${model}`);

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3, // Lower for more consistent translation
          max_tokens: 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://glossary-tool.local',
            'X-Title': 'Glossary Tool',
          },
        }
      );

      const aiText = response.data.choices[0].message.content.trim();
      console.log('✅ OpenRouter response received');

      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(aiText);
        return {
          translation: parsed.translation || aiText,
          confidence: parsed.confidence || 0.9,
          alternatives: parsed.alternatives || [],
          reasoning: parsed.reasoning,
          model,
          cost: this.calculateCost(response.data.usage),
        };
      } catch {
        // Use raw text as translation
        return {
          translation: aiText,
          confidence: 0.9,
          alternatives: [],
          model,
          cost: this.calculateCost(response.data.usage),
        };
      }
    } catch (error: any) {
      console.error('❌ OpenRouter Error:', error.response?.data || error.message);
      throw new Error(`OpenRouter translation failed: ${error.message}`);
    }
  }

  /**
   * Batch translate
   */
  async batchTranslate(requests: OpenRouterRequest[]): Promise<OpenRouterResponse[]> {
    const results: OpenRouterResponse[] = [];
    
    // Sequential to avoid rate limiting
    for (const req of requests) {
      const result = await this.translate(req);
      results.push(result);
      
      // Small delay
      await this.delay(500);
    }

    return results;
  }

  /**
   * Build translation prompt
   */
  private buildPrompt(request: OpenRouterRequest): string {
    const { text, sourceLang, targetLang, context, contextType } = request;

    let prompt = `Translate this ${sourceLang} game text to ${targetLang}:\n\n"${text}"\n\n`;

    if (contextType) {
      prompt += `Context: ${contextType}\n`;
    }

    if (context?.glossaryTerms && context.glossaryTerms.length > 0) {
      prompt += `\nRequired terms:\n`;
      context.glossaryTerms.forEach((term: any) => {
        prompt += `- "${term.source}" must be "${term.target}"\n`;
      });
    }

    prompt += `\nProvide ONLY the translation, no explanations.`;

    return prompt;
  }

  /**
   * Calculate cost from usage
   */
  private calculateCost(usage: any): number {
    if (!usage) return 0;
    
    // Rough estimate (varies by model)
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    
    // Average pricing: $0.002 per 1K tokens
    return ((inputTokens + outputTokens) / 1000) * 0.002;
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return [
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        cost: 'Low',
        quality: 'Excellent',
        recommended: true,
      },
      {
        id: 'openai/gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'OpenAI',
        cost: 'Medium',
        quality: 'Excellent',
      },
      {
        id: 'openai/gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'OpenAI',
        cost: 'Very Low',
        quality: 'Good',
      },
      {
        id: 'google/gemini-pro',
        name: 'Gemini Pro',
        provider: 'Google',
        cost: 'Low',
        quality: 'Very Good',
      },
      {
        id: 'meta-llama/llama-3.1-70b-instruct',
        name: 'Llama 3.1 70B',
        provider: 'Meta',
        cost: 'Very Low',
        quality: 'Good',
      },
    ];
  }

  /**
   * Get service capabilities
   */
  getCapabilities() {
    return {
      provider: 'OpenRouter',
      defaultModel: this.defaultModel,
      apiKeySet: !!this.apiKey,
      features: [
        'Multiple AI providers',
        'Pay as you go',
        'No rate limits (paid)',
        'GPT-4, Claude, Gemini support',
        'Cost tracking',
      ],
      availableModels: this.getAvailableModels(),
    };
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const openRouterService = new OpenRouterService();