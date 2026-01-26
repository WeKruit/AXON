/**
 * Claude (Anthropic) LLM Provider - WEC-145
 *
 * Implements the LLM provider interface for Anthropic's Claude.
 * Supports Claude 3 models with streaming capabilities.
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  LLMProviderConfig,
  LLMCompletionOptions,
  LLMCompletionResponse,
  LLMStreamChunk,
} from '../llm.interface';
import {
  LLMAbstract,
  LLMError,
  LLMRateLimitError,
  LLMAuthError,
  LLMContextLengthError,
} from '../llm.abstract';

export class ClaudeProvider extends LLMAbstract {
  readonly identifier = 'claude';
  readonly name = 'Claude (Anthropic)';

  private client: Anthropic;

  private static readonly MODELS = {
    CLAUDE_3_5_SONNET: 'claude-3-5-sonnet-20241022',
    CLAUDE_3_5_HAIKU: 'claude-3-5-haiku-20241022',
    CLAUDE_3_OPUS: 'claude-3-opus-20240229',
    CLAUDE_3_SONNET: 'claude-3-sonnet-20240229',
    CLAUDE_3_HAIKU: 'claude-3-haiku-20240307',
  };

  constructor(config: LLMProviderConfig) {
    super(config);
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeout || 60000,
      maxRetries: 0, // We handle retries ourselves
    });
    this.availableModels = Object.values(ClaudeProvider.MODELS);
  }

  isAvailable(): boolean {
    return Boolean(this.config.apiKey && this.config.apiKey.length > 0);
  }

  getAvailableModels(): string[] {
    return this.availableModels;
  }

  getDefaultModel(): string {
    return this.config.defaultModel || ClaudeProvider.MODELS.CLAUDE_3_5_SONNET;
  }

  async complete(options: LLMCompletionOptions): Promise<LLMCompletionResponse> {
    this.validateOptions(options);

    return this.withRetry(async () => {
      try {
        const { systemMessage, userMessages } = this.separateMessages(
          options.messages
        );

        const response = await this.client.messages.create({
          model: options.model || this.getDefaultModel(),
          max_tokens: options.maxTokens ?? 4096,
          system: systemMessage,
          messages: userMessages,
          temperature: options.temperature ?? 0.7,
          top_p: options.topP ?? 1,
          stop_sequences: options.stop,
        });

        const content = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map((block) => block.text)
          .join('');

        return {
          content,
          model: response.model,
          usage: {
            promptTokens: response.usage.input_tokens,
            completionTokens: response.usage.output_tokens,
            totalTokens:
              response.usage.input_tokens + response.usage.output_tokens,
          },
          finishReason: this.mapFinishReason(response.stop_reason),
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
      const { systemMessage, userMessages } = this.separateMessages(
        options.messages
      );

      const stream = this.client.messages.stream({
        model: options.model || this.getDefaultModel(),
        max_tokens: options.maxTokens ?? 4096,
        system: systemMessage,
        messages: userMessages,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP ?? 1,
        stop_sequences: options.stop,
      });

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          yield { content: event.delta.text, done: false };
        } else if (event.type === 'message_stop') {
          yield { content: '', done: true };
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private separateMessages(
    messages: LLMCompletionOptions['messages']
  ): {
    systemMessage: string | undefined;
    userMessages: Anthropic.MessageParam[];
  } {
    let systemMessage: string | undefined;
    const userMessages: Anthropic.MessageParam[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemMessage = msg.content;
      } else {
        userMessages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    // Ensure conversation starts with user message
    if (userMessages.length > 0 && userMessages[0].role !== 'user') {
      userMessages.unshift({ role: 'user', content: 'Hello' });
    }

    return { systemMessage, userMessages };
  }

  private handleError(error: unknown): LLMError {
    if (error instanceof Anthropic.APIError) {
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
        case 529:
          // Anthropic overloaded error
          return new LLMError(
            error.message,
            this.identifier,
            'OVERLOADED',
            529,
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
      case 'end_turn':
      case 'stop_sequence':
        return 'stop';
      case 'max_tokens':
        return 'length';
      default:
        return undefined;
    }
  }
}
