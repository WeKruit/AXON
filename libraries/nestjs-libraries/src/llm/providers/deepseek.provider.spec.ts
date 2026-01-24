/**
 * DeepSeek Provider Tests - WEC-143
 */

import { DeepSeekProvider } from './deepseek.provider';
import { LLMAuthError, LLMRateLimitError } from '../llm.abstract';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('DeepSeekProvider', () => {
  let provider: DeepSeekProvider;

  beforeEach(() => {
    provider = new DeepSeekProvider({
      apiKey: 'test-api-key',
    });
    mockFetch.mockReset();
  });

  describe('isAvailable', () => {
    it('should return true when API key is set', () => {
      expect(provider.isAvailable()).toBe(true);
    });

    it('should return false when API key is empty', () => {
      const emptyProvider = new DeepSeekProvider({
        apiKey: '',
      });
      expect(emptyProvider.isAvailable()).toBe(false);
    });
  });

  describe('getDefaultModel', () => {
    it('should return deepseek-chat as default model', () => {
      expect(provider.getDefaultModel()).toBe('deepseek-chat');
    });

    it('should return custom model when configured', () => {
      const customProvider = new DeepSeekProvider({
        apiKey: 'test-api-key',
        defaultModel: 'deepseek-coder',
      });
      expect(customProvider.getDefaultModel()).toBe('deepseek-coder');
    });
  });

  describe('getAvailableModels', () => {
    it('should return available models', () => {
      const models = provider.getAvailableModels();
      expect(models).toContain('deepseek-chat');
      expect(models).toContain('deepseek-coder');
      expect(models).toContain('deepseek-reasoner');
    });
  });

  describe('complete', () => {
    it('should make successful completion request', async () => {
      const mockResponse = {
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'deepseek-chat',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Hello!' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await provider.complete({
        messages: [{ role: 'user', content: 'Hi' }],
      });

      expect(result.content).toBe('Hello!');
      expect(result.model).toBe('deepseek-chat');
      expect(result.usage?.totalTokens).toBe(15);
      expect(result.finishReason).toBe('stop');
    });

    it('should throw LLMAuthError on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: { get: () => null },
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      await expect(
        provider.complete({
          messages: [{ role: 'user', content: 'Hi' }],
        })
      ).rejects.toThrow(LLMAuthError);
    });

    it('should throw LLMRateLimitError on 429', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: { get: () => '60' },
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      });

      await expect(
        provider.complete({
          messages: [{ role: 'user', content: 'Hi' }],
        })
      ).rejects.toThrow(LLMRateLimitError);
    });

    it('should throw error when messages are empty', async () => {
      await expect(
        provider.complete({
          messages: [],
        })
      ).rejects.toThrow('Messages array cannot be empty');
    });
  });

  describe('identifier and name', () => {
    it('should have correct identifier', () => {
      expect(provider.identifier).toBe('deepseek');
    });

    it('should have correct name', () => {
      expect(provider.name).toBe('DeepSeek');
    });
  });
});
