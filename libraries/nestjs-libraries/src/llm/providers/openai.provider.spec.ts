/**
 * OpenAI Provider Tests - WEC-144
 */

import { OpenAIProvider } from './openai.provider';

// Mock OpenAI SDK
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
      embeddings: {
        create: jest.fn(),
      },
    })),
    APIError: class APIError extends Error {
      constructor(
        public status: number,
        message: string
      ) {
        super(message);
      }
    },
  };
});

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    provider = new OpenAIProvider({
      apiKey: 'sk-test-api-key',
    });
  });

  describe('isAvailable', () => {
    it('should return true when valid API key is set', () => {
      expect(provider.isAvailable()).toBe(true);
    });

    it('should return false when API key is empty', () => {
      const emptyProvider = new OpenAIProvider({
        apiKey: '',
      });
      expect(emptyProvider.isAvailable()).toBe(false);
    });

    it('should return false when API key is placeholder', () => {
      const placeholderProvider = new OpenAIProvider({
        apiKey: 'sk-proj-',
      });
      expect(placeholderProvider.isAvailable()).toBe(false);
    });
  });

  describe('getDefaultModel', () => {
    it('should return gpt-4o-mini as default model', () => {
      expect(provider.getDefaultModel()).toBe('gpt-4o-mini');
    });

    it('should return custom model when configured', () => {
      const customProvider = new OpenAIProvider({
        apiKey: 'sk-test-api-key',
        defaultModel: 'gpt-4',
      });
      expect(customProvider.getDefaultModel()).toBe('gpt-4');
    });
  });

  describe('getAvailableModels', () => {
    it('should return available models', () => {
      const models = provider.getAvailableModels();
      expect(models).toContain('gpt-4-turbo');
      expect(models).toContain('gpt-4');
      expect(models).toContain('gpt-4o');
      expect(models).toContain('gpt-4o-mini');
      expect(models).toContain('gpt-3.5-turbo');
    });
  });

  describe('identifier and name', () => {
    it('should have correct identifier', () => {
      expect(provider.identifier).toBe('openai');
    });

    it('should have correct name', () => {
      expect(provider.name).toBe('OpenAI');
    });
  });
});
