/**
 * Claude Provider Tests - WEC-145
 */

import { ClaudeProvider } from './claude.provider';

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn(),
        stream: jest.fn(),
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

describe('ClaudeProvider', () => {
  let provider: ClaudeProvider;

  beforeEach(() => {
    provider = new ClaudeProvider({
      apiKey: 'test-api-key',
    });
  });

  describe('isAvailable', () => {
    it('should return true when API key is set', () => {
      expect(provider.isAvailable()).toBe(true);
    });

    it('should return false when API key is empty', () => {
      const emptyProvider = new ClaudeProvider({
        apiKey: '',
      });
      expect(emptyProvider.isAvailable()).toBe(false);
    });
  });

  describe('getDefaultModel', () => {
    it('should return claude-3-5-sonnet as default model', () => {
      expect(provider.getDefaultModel()).toBe('claude-3-5-sonnet-20241022');
    });

    it('should return custom model when configured', () => {
      const customProvider = new ClaudeProvider({
        apiKey: 'test-api-key',
        defaultModel: 'claude-3-opus-20240229',
      });
      expect(customProvider.getDefaultModel()).toBe('claude-3-opus-20240229');
    });
  });

  describe('getAvailableModels', () => {
    it('should return available models', () => {
      const models = provider.getAvailableModels();
      expect(models).toContain('claude-3-5-sonnet-20241022');
      expect(models).toContain('claude-3-5-haiku-20241022');
      expect(models).toContain('claude-3-opus-20240229');
      expect(models).toContain('claude-3-sonnet-20240229');
      expect(models).toContain('claude-3-haiku-20240307');
    });
  });

  describe('identifier and name', () => {
    it('should have correct identifier', () => {
      expect(provider.identifier).toBe('claude');
    });

    it('should have correct name', () => {
      expect(provider.name).toBe('Claude (Anthropic)');
    });
  });
});
