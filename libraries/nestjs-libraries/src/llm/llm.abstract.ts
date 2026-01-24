/**
 * LLM Provider Abstract Base Class - WEC-142
 *
 * Provides common functionality for all LLM providers including
 * retry logic, error handling, and response normalization.
 */

import {
  LLMProvider,
  LLMProviderConfig,
  LLMCompletionOptions,
  LLMCompletionResponse,
  LLMStreamChunk,
  LLMEmbeddingOptions,
  LLMEmbeddingResponse,
} from './llm.interface';

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code?: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export class LLMRateLimitError extends LLMError {
  constructor(provider: string, public readonly retryAfter?: number) {
    super('Rate limit exceeded', provider, 'RATE_LIMIT', 429, true);
    this.name = 'LLMRateLimitError';
  }
}

export class LLMAuthError extends LLMError {
  constructor(provider: string) {
    super('Authentication failed', provider, 'AUTH_ERROR', 401, false);
    this.name = 'LLMAuthError';
  }
}

export class LLMContextLengthError extends LLMError {
  constructor(provider: string) {
    super('Context length exceeded', provider, 'CONTEXT_LENGTH', 400, false);
    this.name = 'LLMContextLengthError';
  }
}

export abstract class LLMAbstract implements LLMProvider {
  abstract readonly identifier: string;
  abstract readonly name: string;

  protected config: LLMProviderConfig;
  protected defaultModel: string;
  protected availableModels: string[];

  constructor(config: LLMProviderConfig) {
    this.config = {
      timeout: 60000,
      maxRetries: 3,
      ...config,
    };
    this.defaultModel = config.defaultModel || this.getDefaultModel();
    this.availableModels = [];
  }

  abstract isAvailable(): boolean;
  abstract complete(options: LLMCompletionOptions): Promise<LLMCompletionResponse>;
  abstract getAvailableModels(): string[];
  abstract getDefaultModel(): string;

  stream?(
    options: LLMCompletionOptions
  ): AsyncGenerator<LLMStreamChunk, void, unknown>;

  embed?(options: LLMEmbeddingOptions): Promise<LLMEmbeddingResponse>;

  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.maxRetries || 3
  ): Promise<T> {
    let lastError: Error | undefined;
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (error instanceof LLMError && !error.retryable) {
          throw error;
        }

        if (error instanceof LLMRateLimitError && error.retryAfter) {
          await this.sleep(error.retryAfter * 1000);
        } else {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
          await this.sleep(delay);
        }

        retryCount++;
      }
    }

    throw lastError || new LLMError('Unknown error', this.identifier);
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected normalizeMessages(
    messages: LLMCompletionOptions['messages']
  ): LLMCompletionOptions['messages'] {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content.trim(),
    }));
  }

  protected validateOptions(options: LLMCompletionOptions): void {
    if (!options.messages || options.messages.length === 0) {
      throw new LLMError(
        'Messages array cannot be empty',
        this.identifier,
        'INVALID_INPUT'
      );
    }
  }
}
