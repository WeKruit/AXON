/**
 * LLM Factory Tests - WEC-142
 */

import { LLMFactory } from './llm.factory';
import { LLMProviderType } from './llm.interface';

describe('LLMFactory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('initialization', () => {
    it('should initialize with no providers when no API keys are set', () => {
      delete process.env.DEEPSEEK_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const factory = new LLMFactory();
      const available = factory.getAvailableProviders();

      expect(available).toEqual([]);
    });

    it('should initialize DeepSeek provider when DEEPSEEK_API_KEY is set', () => {
      process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const factory = new LLMFactory();
      const available = factory.getAvailableProviders();

      expect(available).toContain('deepseek');
    });

    it('should initialize OpenAI provider when OPENAI_API_KEY is set', () => {
      delete process.env.DEEPSEEK_API_KEY;
      process.env.OPENAI_API_KEY = 'sk-test-openai-key';
      delete process.env.ANTHROPIC_API_KEY;

      const factory = new LLMFactory();
      const available = factory.getAvailableProviders();

      expect(available).toContain('openai');
    });

    it('should initialize Claude provider when ANTHROPIC_API_KEY is set', () => {
      delete process.env.DEEPSEEK_API_KEY;
      delete process.env.OPENAI_API_KEY;
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

      const factory = new LLMFactory();
      const available = factory.getAvailableProviders();

      expect(available).toContain('claude');
    });

    it('should initialize all providers when all API keys are set', () => {
      process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
      process.env.OPENAI_API_KEY = 'sk-test-openai-key';
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

      const factory = new LLMFactory();
      const available = factory.getAvailableProviders();

      expect(available).toContain('deepseek');
      expect(available).toContain('openai');
      expect(available).toContain('claude');
    });
  });

  describe('getProvider', () => {
    it('should return undefined for non-configured provider', () => {
      delete process.env.DEEPSEEK_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const factory = new LLMFactory();
      const provider = factory.getProvider('deepseek');

      expect(provider).toBeUndefined();
    });

    it('should return configured provider', () => {
      process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';

      const factory = new LLMFactory();
      const provider = factory.getProvider('deepseek');

      expect(provider).toBeDefined();
      expect(provider?.identifier).toBe('deepseek');
    });
  });

  describe('isProviderAvailable', () => {
    it('should return false for non-configured provider', () => {
      delete process.env.DEEPSEEK_API_KEY;

      const factory = new LLMFactory();
      expect(factory.isProviderAvailable('deepseek')).toBe(false);
    });

    it('should return true for configured provider', () => {
      process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';

      const factory = new LLMFactory();
      expect(factory.isProviderAvailable('deepseek')).toBe(true);
    });
  });

  describe('getDefaultProvider', () => {
    it('should return DeepSeek as default when available', () => {
      process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
      process.env.OPENAI_API_KEY = 'sk-test-openai-key';

      const factory = new LLMFactory();
      const defaultProvider = factory.getDefaultProvider();

      expect(defaultProvider?.identifier).toBe('deepseek');
    });

    it('should fallback to OpenAI when DeepSeek is not available', () => {
      delete process.env.DEEPSEEK_API_KEY;
      process.env.OPENAI_API_KEY = 'sk-test-openai-key';

      const factory = new LLMFactory();
      const defaultProvider = factory.getDefaultProvider();

      expect(defaultProvider?.identifier).toBe('openai');
    });

    it('should fallback to Claude when DeepSeek and OpenAI are not available', () => {
      delete process.env.DEEPSEEK_API_KEY;
      delete process.env.OPENAI_API_KEY;
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

      const factory = new LLMFactory();
      const defaultProvider = factory.getDefaultProvider();

      expect(defaultProvider?.identifier).toBe('claude');
    });
  });
});
