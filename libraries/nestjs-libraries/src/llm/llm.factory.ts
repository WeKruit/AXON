/**
 * LLM Factory - WEC-142
 *
 * Factory for creating and managing LLM providers with fallback support.
 * Uses DeepSeek as default provider, with OpenAI and Claude as fallbacks.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  LLMProvider,
  LLMProviderType,
  LLMCompletionOptions,
  LLMCompletionResponse,
  LLMFactoryConfig,
} from './llm.interface';
import { LLMError } from './llm.abstract';
import { DeepSeekProvider } from './providers/deepseek.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { ClaudeProvider } from './providers/claude.provider';

@Injectable()
export class LLMFactory {
  private readonly logger = new Logger(LLMFactory.name);
  private providers: Map<LLMProviderType, LLMProvider> = new Map();
  private defaultProvider: LLMProviderType;
  private fallbackOrder: LLMProviderType[];

  constructor() {
    this.initializeProviders();
    this.defaultProvider = this.determineDefaultProvider();
    this.fallbackOrder = this.determineFallbackOrder();
  }

  private initializeProviders(): void {
    // Initialize DeepSeek provider
    if (process.env.DEEPSEEK_API_KEY) {
      this.providers.set(
        'deepseek',
        new DeepSeekProvider({
          apiKey: process.env.DEEPSEEK_API_KEY,
          baseUrl: process.env.DEEPSEEK_BASE_URL,
          defaultModel: process.env.DEEPSEEK_DEFAULT_MODEL,
        })
      );
    }

    // Initialize OpenAI provider
    if (process.env.OPENAI_API_KEY) {
      this.providers.set(
        'openai',
        new OpenAIProvider({
          apiKey: process.env.OPENAI_API_KEY,
          baseUrl: process.env.OPENAI_BASE_URL,
          defaultModel: process.env.OPENAI_DEFAULT_MODEL,
        })
      );
    }

    // Initialize Claude provider
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set(
        'claude',
        new ClaudeProvider({
          apiKey: process.env.ANTHROPIC_API_KEY,
          baseUrl: process.env.ANTHROPIC_BASE_URL,
          defaultModel: process.env.ANTHROPIC_DEFAULT_MODEL,
        })
      );
    }

    this.logger.log(
      `Initialized ${this.providers.size} LLM providers: ${Array.from(this.providers.keys()).join(', ')}`
    );
  }

  private determineDefaultProvider(): LLMProviderType {
    // DeepSeek is the default provider as specified
    const preferredOrder: LLMProviderType[] = ['deepseek', 'openai', 'claude'];

    for (const provider of preferredOrder) {
      const p = this.providers.get(provider);
      if (p?.isAvailable()) {
        this.logger.log(`Default LLM provider: ${provider}`);
        return provider;
      }
    }

    this.logger.warn('No LLM providers available');
    return 'deepseek'; // Default even if not available
  }

  private determineFallbackOrder(): LLMProviderType[] {
    const order: LLMProviderType[] = ['deepseek', 'openai', 'claude'];
    return order.filter((p) => p !== this.defaultProvider);
  }

  /**
   * Get a specific LLM provider by type
   */
  getProvider(type: LLMProviderType): LLMProvider | undefined {
    return this.providers.get(type);
  }

  /**
   * Get the default LLM provider
   */
  getDefaultProvider(): LLMProvider | undefined {
    return this.providers.get(this.defaultProvider);
  }

  /**
   * Get all available providers
   */
  getAvailableProviders(): LLMProviderType[] {
    return Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.isAvailable())
      .map(([type, _]) => type);
  }

  /**
   * Check if a specific provider is available
   */
  isProviderAvailable(type: LLMProviderType): boolean {
    return this.providers.get(type)?.isAvailable() ?? false;
  }

  /**
   * Complete a chat conversation with automatic fallback
   */
  async complete(
    options: LLMCompletionOptions,
    preferredProvider?: LLMProviderType
  ): Promise<LLMCompletionResponse> {
    const providerOrder = this.getProviderOrder(preferredProvider);

    let lastError: Error | undefined;

    for (const providerType of providerOrder) {
      const provider = this.providers.get(providerType);
      if (!provider?.isAvailable()) {
        continue;
      }

      try {
        this.logger.debug(`Attempting completion with provider: ${providerType}`);
        const result = await provider.complete(options);
        return result;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Provider ${providerType} failed: ${lastError.message}. Trying fallback...`
        );

        // Don't fallback for non-retryable errors
        if (error instanceof LLMError && !error.retryable) {
          throw error;
        }
      }
    }

    throw (
      lastError ||
      new LLMError('All providers failed', 'factory', 'ALL_PROVIDERS_FAILED')
    );
  }

  /**
   * Complete with a specific provider (no fallback)
   */
  async completeWith(
    providerType: LLMProviderType,
    options: LLMCompletionOptions
  ): Promise<LLMCompletionResponse> {
    const provider = this.providers.get(providerType);
    if (!provider) {
      throw new LLMError(
        `Provider ${providerType} not configured`,
        'factory',
        'PROVIDER_NOT_FOUND'
      );
    }

    if (!provider.isAvailable()) {
      throw new LLMError(
        `Provider ${providerType} is not available`,
        'factory',
        'PROVIDER_NOT_AVAILABLE'
      );
    }

    return provider.complete(options);
  }

  private getProviderOrder(
    preferredProvider?: LLMProviderType
  ): LLMProviderType[] {
    if (preferredProvider && this.providers.has(preferredProvider)) {
      return [
        preferredProvider,
        ...this.fallbackOrder.filter((p) => p !== preferredProvider),
      ];
    }
    return [this.defaultProvider, ...this.fallbackOrder];
  }
}
