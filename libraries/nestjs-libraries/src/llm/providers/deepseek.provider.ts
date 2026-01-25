/**
 * DeepSeek LLM Provider - WEC-143
 *
 * Implements the LLM provider interface for DeepSeek AI.
 * DeepSeek is the default provider for cost-effective AI operations.
 */

import {
  LLMProviderConfig,
  LLMCompletionOptions,
  LLMCompletionResponse,
  LLMStreamChunk,
  LLMEmbeddingOptions,
  LLMEmbeddingResponse,
} from '../llm.interface';
import {
  LLMAbstract,
  LLMError,
  LLMRateLimitError,
  LLMAuthError,
  LLMContextLengthError,
} from '../llm.abstract';

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekCompletionRequest {
  model: string;
  messages: DeepSeekMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
  stream?: boolean;
}

interface DeepSeekCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface DeepSeekErrorResponse {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

export class DeepSeekProvider extends LLMAbstract {
  readonly identifier = 'deepseek';
  readonly name = 'DeepSeek';

  private readonly baseUrl: string;

  private static readonly MODELS = {
    CHAT: 'deepseek-chat',
    CODER: 'deepseek-coder',
    REASONER: 'deepseek-reasoner',
  };

  constructor(config: LLMProviderConfig) {
    super(config);
    this.baseUrl =
      config.baseUrl || 'https://api.deepseek.com/v1';
    this.availableModels = Object.values(DeepSeekProvider.MODELS);
  }

  isAvailable(): boolean {
    return Boolean(this.config.apiKey && this.config.apiKey.length > 0);
  }

  getAvailableModels(): string[] {
    return this.availableModels;
  }

  getDefaultModel(): string {
    return this.config.defaultModel || DeepSeekProvider.MODELS.CHAT;
  }

  async complete(options: LLMCompletionOptions): Promise<LLMCompletionResponse> {
    this.validateOptions(options);

    return this.withRetry(async () => {
      const request: DeepSeekCompletionRequest = {
        model: options.model || this.getDefaultModel(),
        messages: this.normalizeMessages(options.messages) as DeepSeekMessage[],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        top_p: options.topP ?? 1,
        frequency_penalty: options.frequencyPenalty ?? 0,
        presence_penalty: options.presencePenalty ?? 0,
        stop: options.stop,
        stream: false,
      };

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.config.timeout || 60000),
      });

      if (!response.ok) {
        await this.handleError(response);
      }

      const data: DeepSeekCompletionResponse = await response.json();

      return {
        content: data.choices[0]?.message?.content || '',
        model: data.model,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
        finishReason: this.mapFinishReason(data.choices[0]?.finish_reason),
      };
    });
  }

  async *stream(
    options: LLMCompletionOptions
  ): AsyncGenerator<LLMStreamChunk, void, unknown> {
    this.validateOptions(options);

    const request: DeepSeekCompletionRequest = {
      model: options.model || this.getDefaultModel(),
      messages: this.normalizeMessages(options.messages) as DeepSeekMessage[],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      top_p: options.topP ?? 1,
      frequency_penalty: options.frequencyPenalty ?? 0,
      presence_penalty: options.presencePenalty ?? 0,
      stop: options.stop,
      stream: true,
    };

    // Create abort controller for streaming timeout
    const streamTimeout = this.config.timeout || 120000; // 2 minutes for streaming
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), streamTimeout);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(request),
        signal: abortController.signal,
      });

      if (!response.ok) {
        await this.handleError(response);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new LLMError('No response body', this.identifier);
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let lastActivityTime = Date.now();
      const idleTimeout = 30000; // 30 seconds idle timeout

      while (true) {
        // Check for idle timeout
        if (Date.now() - lastActivityTime > idleTimeout) {
          throw new LLMError('Stream idle timeout', this.identifier, 'TIMEOUT');
        }

        const { done, value } = await reader.read();
        if (done) break;

        lastActivityTime = Date.now();

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            yield { content: '', done: true };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              yield { content, done: false };
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

      yield { content: '', done: true };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async handleError(response: Response): Promise<never> {
    let errorMessage = `DeepSeek API error: ${response.status}`;
    let errorData: DeepSeekErrorResponse | undefined;

    try {
      errorData = await response.json();
      errorMessage = errorData?.error?.message || errorMessage;
    } catch {
      // Ignore JSON parsing errors
    }

    switch (response.status) {
      case 401:
        throw new LLMAuthError(this.identifier);
      case 429:
        const retryAfter = parseInt(
          response.headers.get('retry-after') || '60',
          10
        );
        throw new LLMRateLimitError(this.identifier, retryAfter);
      case 400:
        if (
          errorMessage.toLowerCase().includes('context') ||
          errorMessage.toLowerCase().includes('token')
        ) {
          throw new LLMContextLengthError(this.identifier);
        }
        throw new LLMError(errorMessage, this.identifier, 'BAD_REQUEST', 400);
      case 500:
      case 502:
      case 503:
        throw new LLMError(
          errorMessage,
          this.identifier,
          'SERVER_ERROR',
          response.status,
          true
        );
      default:
        throw new LLMError(
          errorMessage,
          this.identifier,
          'UNKNOWN',
          response.status
        );
    }
  }

  private mapFinishReason(
    reason?: string
  ): 'stop' | 'length' | 'content_filter' | 'error' | undefined {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      default:
        return undefined;
    }
  }
}
