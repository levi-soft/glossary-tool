/**
 * Mock AI Service for development/demo when Gemini API is not available
 * Returns simulated translations based on simple rules
 */

interface TranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
  context?: any;
  contextType?: string;
}

interface TranslationResponse {
  translation: string;
  confidence: number;
  alternatives?: string[];
  reasoning?: string;
}

// Simple translation dictionary for common phrases
const MOCK_TRANSLATIONS: Record<string, string> = {
  'hello': 'xin chào',
  'goodbye': 'tạm biệt',
  'start game': 'bắt đầu game',
  'load game': 'tải game',
  'settings': 'cài đặt',
  'exit': 'thoát',
  'health potion': 'thuốc hồi máu',
  'mana potion': 'thuốc năng lượng phép',
  'dragon': 'rồng',
  'hero': 'anh hùng',
  'warrior': 'chiến binh',
  'adventurer': 'nhà thám hiểm',
  'welcome': 'chào mừng',
  'thank you': 'cảm ơn',
  'attack': 'tấn công',
  'defend': 'phòng thủ',
  'run': 'chạy',
  'hp': 'máu',
  'mp': 'năng lượng phép',
};

export class MockAIService {
  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    console.log('🎭 Using Mock AI Service (Gemini not available)');
    
    // Simulate API delay
    await this.delay(1000 + Math.random() * 2000);

    const text = request.text.toLowerCase();
    let translation = '';

    // Try to find translation in dictionary
    const found = Object.keys(MOCK_TRANSLATIONS).find(key => 
      text.includes(key)
    );

    if (found) {
      // Use dictionary translation
      translation = text.replace(
        new RegExp(found, 'gi'),
        MOCK_TRANSLATIONS[found]
      );
      // Capitalize first letter
      translation = translation.charAt(0).toUpperCase() + translation.slice(1);
    } else {
      // Generate mock translation
      translation = this.generateMockTranslation(request.text, request.targetLang);
    }

    return {
      translation,
      confidence: 0.75, // Mock confidence
      alternatives: this.generateAlternatives(translation),
      reasoning: '🎭 Mock AI - Gemini API không available. Đây là bản dịch mô phỏng.',
    };
  }

  async batchTranslate(requests: TranslationRequest[]): Promise<TranslationResponse[]> {
    return Promise.all(requests.map(req => this.translate(req)));
  }

  getCapabilities() {
    return {
      provider: 'Mock AI Service',
      model: 'mock-translator',
      maxTokens: Infinity,
      rateLimit: 'Unlimited',
      cost: 'Free (Mock)',
      features: [
        'Development/Demo mode',
        'Basic translation',
        'No API key required',
        'Instant response',
      ],
    };
  }

  private generateMockTranslation(text: string, targetLang: string): string {
    // Simple mock: add [Translated] prefix
    return `[${targetLang.toUpperCase()}] ${text}`;
  }

  private generateAlternatives(translation: string): string[] {
    return [
      translation + ' (alt 1)',
      translation + ' (alt 2)',
    ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const mockAiService = new MockAIService();