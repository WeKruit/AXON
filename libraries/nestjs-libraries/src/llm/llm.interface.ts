/**
 * LLM Provider Interface - WEC-142
 *
 * Defines the contract that all LLM providers must implement.
 * Supports multi-provider architecture with fallback capabilities.
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionOptions {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

export interface LLMCompletionResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: 'stop' | 'length' | 'content_filter' | 'error';
}

export interface LLMStreamChunk {
  content: string;
  done: boolean;
}

export interface LLMEmbeddingOptions {
  input: string | string[];
  model?: string;
}

export interface LLMEmbeddingResponse {
  embeddings: number[][];
  model: string;
  usage?: {
    promptTokens: number;
    totalTokens: number;
  };
}

export interface LLMProviderConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface LLMProvider {
  /**
   * Unique identifier for this provider (e.g., 'openai', 'deepseek', 'claude')
   */
  readonly identifier: string;

  /**
   * Display name for this provider
   */
  readonly name: string;

  /**
   * Whether this provider is currently available (has valid config)
   */
  isAvailable(): boolean;

  /**
   * Complete a chat conversation
   */
  complete(options: LLMCompletionOptions): Promise<LLMCompletionResponse>;

  /**
   * Stream a chat completion
   */
  stream?(
    options: LLMCompletionOptions
  ): AsyncGenerator<LLMStreamChunk, void, unknown>;

  /**
   * Generate embeddings for text
   */
  embed?(options: LLMEmbeddingOptions): Promise<LLMEmbeddingResponse>;

  /**
   * Get available models for this provider
   */
  getAvailableModels(): string[];

  /**
   * Get the default model for this provider
   */
  getDefaultModel(): string;
}

export type LLMProviderType = 'deepseek' | 'openai' | 'claude';

export interface LLMFactoryConfig {
  defaultProvider?: LLMProviderType;
  fallbackProviders?: LLMProviderType[];
  providers?: {
    deepseek?: LLMProviderConfig;
    openai?: LLMProviderConfig;
    claude?: LLMProviderConfig;
  };
}
