/**
 * LLM Service Tests - WEC-142
 *
 * Unit tests for LLMService covering text generation,
 * persona creation, and content analysis.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { LLMService, PersonaKeywords, GeneratedPersona } from './llm.service';
import { LLMFactory } from './llm.factory';
import { LLMCompletionResponse, LLMProviderType } from './llm.interface';

describe('LLMService', () => {
  let service: LLMService;
  let llmFactory: jest.Mocked<LLMFactory>;

  const mockCompletionResponse: LLMCompletionResponse = {
    content: 'Generated response',
    model: 'gpt-4o-mini',
    provider: 'openai',
    usage: {
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
    },
  };

  beforeEach(async () => {
    const mockLLMFactory = {
      complete: jest.fn().mockResolvedValue(mockCompletionResponse),
      getProvider: jest.fn(),
      getDefaultProvider: jest.fn(),
      getAvailableProviders: jest.fn().mockReturnValue(['openai', 'claude', 'deepseek']),
      isProviderAvailable: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LLMService,
        { provide: LLMFactory, useValue: mockLLMFactory },
      ],
    }).compile();

    service = module.get<LLMService>(LLMService);
    llmFactory = module.get(LLMFactory);
  });

  describe('generateText', () => {
    it('should generate text with prompt only', async () => {
      const result = await service.generateText({
        prompt: 'Write a haiku about coding',
      });

      expect(llmFactory.complete).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: 'Write a haiku about coding' }],
          temperature: 0.7,
          maxTokens: 2048,
        }),
        undefined
      );
      expect(result).toBe('Generated response');
    });

    it('should include system prompt when provided', async () => {
      await service.generateText({
        prompt: 'Write a haiku about coding',
        systemPrompt: 'You are a poet',
      });

      expect(llmFactory.complete).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'system', content: 'You are a poet' },
            { role: 'user', content: 'Write a haiku about coding' },
          ],
        }),
        undefined
      );
    });

    it('should use custom temperature when provided', async () => {
      await service.generateText({
        prompt: 'Test',
        temperature: 0.5,
      });

      expect(llmFactory.complete).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.5,
        }),
        undefined
      );
    });

    it('should use custom maxTokens when provided', async () => {
      await service.generateText({
        prompt: 'Test',
        maxTokens: 500,
      });

      expect(llmFactory.complete).toHaveBeenCalledWith(
        expect.objectContaining({
          maxTokens: 500,
        }),
        undefined
      );
    });

    it('should use specified provider when provided', async () => {
      await service.generateText({
        prompt: 'Test',
        provider: 'claude',
      });

      expect(llmFactory.complete).toHaveBeenCalledWith(
        expect.anything(),
        'claude'
      );
    });
  });

  describe('complete', () => {
    it('should delegate to LLMFactory', async () => {
      const options = {
        messages: [{ role: 'user' as const, content: 'Hello' }],
        temperature: 0.7,
      };

      const result = await service.complete(options, 'openai');

      expect(llmFactory.complete).toHaveBeenCalledWith(options, 'openai');
      expect(result).toEqual(mockCompletionResponse);
    });
  });

  describe('input sanitization', () => {
    it('should sanitize input with dangerous characters', async () => {
      const keywords: PersonaKeywords = {
        industry: 'Technology<script>alert("xss")</script>',
        role: 'Developer{inject}',
        personality: ['curious', 'analytical[test]'],
        interests: ['AI\\malicious', 'programming'],
        writingStyle: 'casual',
        tone: 'friendly',
      };

      const mockPersonaJson = JSON.stringify({
        name: 'Tech Enthusiast',
        bio: 'Passionate about technology',
        personality: 'Curious mind',
        writingStyle: 'Casual',
        tone: 'Friendly',
        interests: ['AI'],
        hashtags: ['#tech'],
        samplePosts: ['Hello!'],
      });

      llmFactory.complete.mockResolvedValue({
        ...mockCompletionResponse,
        content: mockPersonaJson,
      });

      await service.generatePersona(keywords);

      const callArgs = llmFactory.complete.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: any) => m.role === 'user');

      // Dangerous characters should be removed
      expect(userMessage.content).not.toContain('<script>');
      expect(userMessage.content).not.toContain('{inject}');
      expect(userMessage.content).not.toContain('[test]');
      expect(userMessage.content).not.toContain('\\malicious');
    });

    it('should limit input length to 200 characters', async () => {
      const longIndustry = 'A'.repeat(300);
      const keywords: PersonaKeywords = {
        industry: longIndustry,
      };

      const mockPersonaJson = JSON.stringify({
        name: 'Tech Enthusiast',
        bio: 'Passionate about technology',
        personality: 'Curious mind',
        writingStyle: 'Casual',
        tone: 'Friendly',
        interests: ['AI'],
        hashtags: ['#tech'],
        samplePosts: ['Hello!'],
      });

      llmFactory.complete.mockResolvedValue({
        ...mockCompletionResponse,
        content: mockPersonaJson,
      });

      await service.generatePersona(keywords);

      const callArgs = llmFactory.complete.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: any) => m.role === 'user');

      // Long strings should be truncated
      expect(userMessage.content).not.toContain(longIndustry);
      expect(userMessage.content.length).toBeLessThan(longIndustry.length + 500);
    });

    it('should normalize newlines in input', async () => {
      const keywords: PersonaKeywords = {
        industry: 'Technology\n\nwith\nnewlines',
      };

      const mockPersonaJson = JSON.stringify({
        name: 'Tech Enthusiast',
        bio: 'Passionate about technology',
        personality: 'Curious mind',
        writingStyle: 'Casual',
        tone: 'Friendly',
        interests: ['AI'],
        hashtags: ['#tech'],
        samplePosts: ['Hello!'],
      });

      llmFactory.complete.mockResolvedValue({
        ...mockCompletionResponse,
        content: mockPersonaJson,
      });

      await service.generatePersona(keywords);

      const callArgs = llmFactory.complete.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: any) => m.role === 'user');

      // Newlines should be normalized to spaces
      expect(userMessage.content).toContain('Technology with newlines');
    });
  });

  describe('zod validation', () => {
    it('should reject persona response missing required fields', async () => {
      const keywords: PersonaKeywords = { industry: 'Tech' };

      // Response missing required fields
      llmFactory.complete.mockResolvedValue({
        ...mockCompletionResponse,
        content: JSON.stringify({
          name: 'Test',
          // missing other required fields
        }),
      });

      await expect(service.generatePersona(keywords)).rejects.toThrow(
        'Failed to generate valid persona'
      );
    });

    it('should reject persona response with invalid field types', async () => {
      const keywords: PersonaKeywords = { industry: 'Tech' };

      // Response with wrong types
      llmFactory.complete.mockResolvedValue({
        ...mockCompletionResponse,
        content: JSON.stringify({
          name: 123, // should be string
          bio: 'Bio',
          personality: 'Personality',
          writingStyle: 'Style',
          tone: 'Tone',
          interests: 'should be array',
          hashtags: ['#test'],
          samplePosts: ['Post'],
        }),
      });

      await expect(service.generatePersona(keywords)).rejects.toThrow(
        'Failed to generate valid persona'
      );
    });

    it('should accept valid persona response', async () => {
      const keywords: PersonaKeywords = { industry: 'Tech' };

      const validPersona = {
        name: 'Valid Name',
        bio: 'Valid bio description',
        personality: 'Valid personality',
        writingStyle: 'Casual',
        tone: 'Friendly',
        interests: ['interest1', 'interest2'],
        hashtags: ['#tag1', '#tag2'],
        samplePosts: ['Sample post 1'],
      };

      llmFactory.complete.mockResolvedValue({
        ...mockCompletionResponse,
        content: JSON.stringify(validPersona),
      });

      const result = await service.generatePersona(keywords);

      expect(result).toEqual(validPersona);
    });

    it('should validate content analysis response sentiment', async () => {
      // Invalid sentiment value
      llmFactory.complete.mockResolvedValue({
        ...mockCompletionResponse,
        content: JSON.stringify({
          sentiment: 'invalid-sentiment', // not one of positive/negative/neutral
          tone: 'friendly',
          topics: ['tech'],
          suggestions: ['none'],
        }),
      });

      const result = await service.analyzeContent('Test content');

      // Should return fallback values when validation fails
      expect(result).toEqual({
        sentiment: 'neutral',
        tone: 'unknown',
        topics: [],
        suggestions: [],
      });
    });

    it('should accept valid content analysis response', async () => {
      const validAnalysis = {
        sentiment: 'positive' as const,
        tone: 'enthusiastic',
        topics: ['technology', 'AI'],
        suggestions: ['Add more details'],
      };

      llmFactory.complete.mockResolvedValue({
        ...mockCompletionResponse,
        content: JSON.stringify(validAnalysis),
      });

      const result = await service.analyzeContent('Test content');

      expect(result).toEqual(validAnalysis);
    });
  });

  describe('generatePersona', () => {
    const keywords: PersonaKeywords = {
      industry: 'Technology',
      role: 'Developer',
      personality: ['curious', 'analytical'],
      interests: ['AI', 'programming'],
      writingStyle: 'casual',
      tone: 'friendly',
    };

    const mockPersonaJson = JSON.stringify({
      name: 'Tech Enthusiast',
      bio: 'Passionate about technology and innovation',
      personality: 'Curious and analytical mind',
      writingStyle: 'Casual and conversational',
      tone: 'Friendly and approachable',
      interests: ['AI', 'programming', 'startups'],
      hashtags: ['#tech', '#AI', '#coding'],
      samplePosts: ['Just discovered an amazing new framework!'],
    });

    it('should generate persona from keywords', async () => {
      llmFactory.complete.mockResolvedValue({
        ...mockCompletionResponse,
        content: mockPersonaJson,
      });

      const result = await service.generatePersona(keywords);

      expect(llmFactory.complete).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user' }),
          ]),
          temperature: 0.8,
          maxTokens: 1500,
        }),
        undefined
      );
      expect(result.name).toBe('Tech Enthusiast');
      expect(result.interests).toContain('AI');
    });

    it('should extract JSON from response with surrounding text', async () => {
      llmFactory.complete.mockResolvedValue({
        ...mockCompletionResponse,
        content: `Here's the persona:\n${mockPersonaJson}\nHope this helps!`,
      });

      const result = await service.generatePersona(keywords);

      expect(result.name).toBe('Tech Enthusiast');
    });

    it('should throw error when no JSON found in response', async () => {
      llmFactory.complete.mockResolvedValue({
        ...mockCompletionResponse,
        content: 'This is just plain text without JSON',
      });

      await expect(service.generatePersona(keywords)).rejects.toThrow(
        'Failed to generate valid persona'
      );
    });

    it('should throw error when JSON is invalid', async () => {
      llmFactory.complete.mockResolvedValue({
        ...mockCompletionResponse,
        content: '{ invalid json }',
      });

      await expect(service.generatePersona(keywords)).rejects.toThrow(
        'Failed to generate valid persona'
      );
    });

    it('should include all keyword fields in prompt', async () => {
      await service.generatePersona(keywords).catch(() => {});

      const callArgs = llmFactory.complete.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: any) => m.role === 'user');

      expect(userMessage.content).toContain('Technology');
      expect(userMessage.content).toContain('Developer');
      expect(userMessage.content).toContain('curious');
      expect(userMessage.content).toContain('AI');
      expect(userMessage.content).toContain('casual');
      expect(userMessage.content).toContain('friendly');
    });
  });

  describe('refineContent', () => {
    it('should refine content with instructions', async () => {
      llmFactory.complete.mockResolvedValue({
        ...mockCompletionResponse,
        content: 'Refined content here',
      });

      const result = await service.refineContent(
        'Original content',
        'Make it more engaging'
      );

      expect(llmFactory.complete).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('Original content'),
            }),
            expect.objectContaining({
              content: expect.stringContaining('Make it more engaging'),
            }),
          ]),
          temperature: 0.5,
        }),
        undefined
      );
      expect(result).toBe('Refined content here');
    });

    it('should use specified provider', async () => {
      await service.refineContent('Content', 'Instructions', 'claude');

      expect(llmFactory.complete).toHaveBeenCalledWith(
        expect.anything(),
        'claude'
      );
    });
  });

  describe('generateVariations', () => {
    const mockVariations = ['Variation 1', 'Variation 2', 'Variation 3'];

    it('should generate content variations', async () => {
      llmFactory.complete.mockResolvedValue({
        ...mockCompletionResponse,
        content: JSON.stringify(mockVariations),
      });

      const result = await service.generateVariations('Original content', 3);

      expect(llmFactory.complete).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.9,
          maxTokens: 2000,
        }),
        undefined
      );
      expect(result).toEqual(mockVariations);
    });

    it('should default to 3 variations', async () => {
      llmFactory.complete.mockResolvedValue({
        ...mockCompletionResponse,
        content: JSON.stringify(mockVariations),
      });

      await service.generateVariations('Original content');

      const callArgs = llmFactory.complete.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: any) => m.role === 'user');
      expect(userMessage.content).toContain('3');
    });

    it('should return original content when JSON parsing fails', async () => {
      llmFactory.complete.mockResolvedValue({
        ...mockCompletionResponse,
        content: 'Invalid response',
      });

      const result = await service.generateVariations('Original content');

      expect(result).toEqual(['Original content']);
    });

    it('should use specified provider', async () => {
      llmFactory.complete.mockResolvedValue({
        ...mockCompletionResponse,
        content: JSON.stringify(mockVariations),
      });

      await service.generateVariations('Content', 3, 'deepseek');

      expect(llmFactory.complete).toHaveBeenCalledWith(
        expect.anything(),
        'deepseek'
      );
    });
  });

  describe('analyzeContent', () => {
    const mockAnalysis = {
      sentiment: 'positive',
      tone: 'friendly and enthusiastic',
      topics: ['technology', 'innovation'],
      suggestions: ['Add more details', 'Include a call to action'],
    };

    it('should analyze content and return structured result', async () => {
      llmFactory.complete.mockResolvedValue({
        ...mockCompletionResponse,
        content: JSON.stringify(mockAnalysis),
      });

      const result = await service.analyzeContent('Amazing new product!');

      expect(llmFactory.complete).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.3,
          maxTokens: 500,
        }),
        undefined
      );
      expect(result.sentiment).toBe('positive');
      expect(result.tone).toBe('friendly and enthusiastic');
      expect(result.topics).toContain('technology');
      expect(result.suggestions).toHaveLength(2);
    });

    it('should return default values when JSON parsing fails', async () => {
      llmFactory.complete.mockResolvedValue({
        ...mockCompletionResponse,
        content: 'Invalid response',
      });

      const result = await service.analyzeContent('Test content');

      expect(result).toEqual({
        sentiment: 'neutral',
        tone: 'unknown',
        topics: [],
        suggestions: [],
      });
    });

    it('should use specified provider', async () => {
      llmFactory.complete.mockResolvedValue({
        ...mockCompletionResponse,
        content: JSON.stringify(mockAnalysis),
      });

      await service.analyzeContent('Content', 'claude');

      expect(llmFactory.complete).toHaveBeenCalledWith(
        expect.anything(),
        'claude'
      );
    });
  });

  describe('getAvailableProviders', () => {
    it('should return available providers from factory', () => {
      const result = service.getAvailableProviders();

      expect(llmFactory.getAvailableProviders).toHaveBeenCalled();
      expect(result).toEqual(['openai', 'claude', 'deepseek']);
    });
  });

  describe('isProviderAvailable', () => {
    it('should check provider availability', () => {
      const result = service.isProviderAvailable('openai');

      expect(llmFactory.isProviderAvailable).toHaveBeenCalledWith('openai');
      expect(result).toBe(true);
    });

    it('should return false for unavailable provider', () => {
      llmFactory.isProviderAvailable.mockReturnValue(false);

      const result = service.isProviderAvailable('gemini' as LLMProviderType);

      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should propagate LLM factory errors in generateText', async () => {
      llmFactory.complete.mockRejectedValue(new Error('API rate limited'));

      await expect(
        service.generateText({ prompt: 'Test' })
      ).rejects.toThrow('API rate limited');
    });

    it('should propagate LLM factory errors in refineContent', async () => {
      llmFactory.complete.mockRejectedValue(new Error('API error'));

      await expect(
        service.refineContent('Content', 'Instructions')
      ).rejects.toThrow('API error');
    });
  });
});
