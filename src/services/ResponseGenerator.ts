/**
 * ResponseGenerator - Calls Claude Haiku to generate fun, dynamic responses
 * Falls back to static responses if the API is unavailable
 */

const EDGE_FUNCTION_URL = 'https://nklzshibigalolujosjz.supabase.co/functions/v1/generate-response';

interface GenerateResponseParams {
  verb: string;
  target: string;
  baseResponse: string;
  context?: string;
}

class ResponseGeneratorClass {
  private enabled: boolean = true;
  private cache: Map<string, string> = new Map();

  /**
   * Generate a dynamic response using Claude Haiku
   * Falls back to baseResponse if API fails
   */
  async generate(params: GenerateResponseParams): Promise<string> {
    const { verb, target, baseResponse, context } = params;

    // If disabled, return base response immediately
    if (!this.enabled) {
      return baseResponse;
    }

    // Check cache first (same action = same response this session)
    const cacheKey = `${verb}:${target}:${baseResponse}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verb,
          target,
          base_response: baseResponse,
          context,
        }),
      });

      if (!response.ok) {
        console.warn('Response generator API error, using fallback');
        return baseResponse;
      }

      const data = await response.json();
      const generatedResponse = data.response || baseResponse;

      // Cache the response
      this.cache.set(cacheKey, generatedResponse);

      return generatedResponse;
    } catch (error) {
      console.warn('Response generator failed, using fallback:', error);
      return baseResponse;
    }
  }

  /**
   * Enable/disable dynamic responses
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if dynamic responses are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Clear the response cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const responseGenerator = new ResponseGeneratorClass();
