/**
 * OpenAI LLM Provider - WEC-144
 *
 * Implements the LLM provider interface for OpenAI.
 * Uses the official OpenAI SDK for reliable API access.
 */

import OpenAI from 'openai';
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

export class OpenAIProvider extends LLMAbstract {
  readonly identifier = 'openai';
  readonly name = 'OpenAI';

  private client: OpenAI;

  private static readonly MODELS = {
    GPT4_TURBO: 'gpt-4-turbo',
    GPT4: 'gpt-4',
    GPT4O: 'gpt-4o',
    GPT4O_MINI: 'gpt-4o-mini',
    GPT35_TURBO: 'gpt-3.5-turbo',
    GPT41: 'gpt-4.1',
  };

  private static readonly EMBEDDING_MODELS = {
    TEXT_EMBEDDING_3_SMALL: 'text-embedding-3-small',
    TEXT_EMBEDDING_3_LARGE: 'text-embedding-3-large',
    TEXT_EMBEDDING_ADA_002: 'text-embedding-ada-002',
  };

  constructor(config: LLMProviderConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeout || 60000,
      maxRetries: 0, // We handle retries ourselves
    });
    this.availableModels = Object.values(OpenAIProvider.MODELS);
  }

  isAvailable(): boolean {
    return Boolean(
      this.config.apiKey &&
        this.config.apiKey.length > 0 &&
        !this.config.apiKey.startsWith('sk-proj-')
    );
  }

  getAvailableModels(): string[] {
    return this.availableModels;
  }

  getDefaultModel(): string {
    return this.config.defaultModel || OpenAIProvider.MODELS.GPT4O_MINI;
  }

  async complete(options: LLMCompletionOptions): Promise<LLMCompletionResponse> {
    this.validateOptions(options);

    return this.withRetry(async () => {
      try {
        const response = await this.client.chat.completions.create({
          model: options.model || this.getDefaultModel(),
          messages: this.normalizeMessages(options.messages).map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 4096,
          top_p: options.topP ?? 1,
          frequency_penalty: options.frequencyPenalty ?? 0,
          presence_penalty: options.presencePenalty ?? 0,
          stop: options.stop,
        });

        return {
          content: response.choices[0]?.message?.content || '',
          model: response.model,
          usage: response.usage
            ? {
                promptTokens: response.usage.prompt_tokens,
                completionTokens: response.usage.completion_tokens,
                totalTokens: response.usage.total_tokens,
              }
            : undefined,
          finishReason: this.mapFinishReason(
            response.choices[0]?.finish_reason
          ),
        };
      } catch (error) {
        throw this.handleError(error);
      }
    });
  }

  async *stream(
    options: LLMCompletionOptions
  ): AsyncGenerator<LLMStreamChunk, void, unknown> {
    this.validateOptions(options);

    try {
      const stream = await this.client.chat.completions.create({
        model: options.model || this.getDefaultModel(),
        messages: this.normalizeMessages(options.messages).map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        top_p: options.topP ?? 1,
        frequency_penalty: options.frequencyPenalty ?? 0,
        presence_penalty: options.presencePenalty ?? 0,
        stop: options.stop,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        const done = chunk.choices[0]?.finish_reason !== null;

        if (content || done) {
          yield { content, done };
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async embed(options: LLMEmbeddingOptions): Promise<LLMEmbeddingResponse> {
    return this.withRetry(async () => {
      try {
        const input = Array.isArray(options.input)
          ? options.input
          : [options.input];

        const response = await this.client.embeddings.create({
          model:
            options.model || OpenAIProvider.EMBEDDING_MODELS.TEXT_EMBEDDING_3_SMALL,
          input,
        });

        return {
          embeddings: response.data.map((d) => d.embedding),
          model: response.model,
          usage: {
            promptTokens: response.usage.prompt_tokens,
            totalTokens: response.usage.total_tokens,
          },
        };
      } catch (error) {
        throw this.handleError(error);
      }
    });
  }

  private handleError(error: unknown): LLMError {
    if (error instanceof OpenAI.APIError) {
      switch (error.status) {
        case 401:
          return new LLMAuthError(this.identifier);
        case 429:
          const retryAfter = parseInt(
            error.headers?.get?.('retry-after') || '60',
            10
          );
          return new LLMRateLimitError(this.identifier, retryAfter);
        case 400:
          if (
            error.message.toLowerCase().includes('context') ||
            error.message.toLowerCase().includes('token')
          ) {
            return new LLMContextLengthError(this.identifier);
          }
          return new LLMError(
            error.message,
            this.identifier,
            'BAD_REQUEST',
            400
          );
        case 500:
        case 502:
        case 503:
          return new LLMError(
            error.message,
            this.identifier,
            'SERVER_ERROR',
            error.status,
            true
          );
        default:
          return new LLMError(
            error.message,
            this.identifier,
            'UNKNOWN',
            error.status
          );
      }
    }

    if (error instanceof Error) {
      return new LLMError(error.message, this.identifier);
    }

    return new LLMError('Unknown error', this.identifier);
  }

  private mapFinishReason(
    reason?: string | null
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
