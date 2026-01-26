/**
 * LLM Service - High-level service for LLM operations
 *
 * Provides convenient methods for common LLM operations like
 * text generation, persona creation, and content analysis.
 */

import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { LLMFactory } from './llm.factory';
import {
  LLMCompletionOptions,
  LLMCompletionResponse,
  LLMMessage,
  LLMProviderType,
} from './llm.interface';
import type { PersonaKeywords } from '../persona/persona.interface';

// Input sanitization constants
const MAX_INPUT_LENGTH = 500;
const MAX_ARRAY_ITEMS = 20;

/**
 * Sanitize user input to prevent prompt injection
 */
function sanitizeInput(input: string | undefined, maxLength = MAX_INPUT_LENGTH): string {
  if (!input) return '';
  return input
    .replace(/[<>{}[\]\\]/g, '') // Remove potentially dangerous characters
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize array of strings
 */
function sanitizeArray(arr: string[] | undefined, maxItems = MAX_ARRAY_ITEMS): string[] {
  if (!arr || !Array.isArray(arr)) return [];
  return arr
    .slice(0, maxItems)
    .map((item) => sanitizeInput(item, 100));
}

// Zod schemas for LLM response validation
const GeneratedPersonaSchema = z.object({
  name: z.string().max(100),
  bio: z.string().max(300),
  personality: z.string().max(500),
  writingStyle: z.string().max(200),
  tone: z.string().max(100),
  interests: z.array(z.string().max(50)).max(10),
  hashtags: z.array(z.string().max(50)).max(15),
  samplePosts: z.array(z.string().max(500)).max(5),
});

const ContentAnalysisSchema = z.object({
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  tone: z.string().max(200),
  topics: z.array(z.string().max(50)).max(10),
  suggestions: z.array(z.string().max(200)).max(5),
});

export interface GenerateTextOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: LLMProviderType;
}

// Re-export PersonaKeywords for backwards compatibility
export type { PersonaKeywords } from '../persona/persona.interface';

export interface GeneratedPersona {
  name: string;
  bio: string;
  personality: string;
  writingStyle: string;
  tone: string;
  interests: string[];
  hashtags: string[];
  samplePosts: string[];
}

export interface ContentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  tone: string;
  topics: string[];
  suggestions: string[];
}

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);

  constructor(private readonly llmFactory: LLMFactory) {}

  /**
   * Generate text using the default or specified provider
   */
  async generateText(options: GenerateTextOptions): Promise<string> {
    const messages: LLMMessage[] = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    messages.push({ role: 'user', content: options.prompt });

    const response = await this.llmFactory.complete(
      {
        messages,
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 2048,
      },
      options.provider
    );

    return response.content;
  }

  /**
   * Complete a conversation with the LLM
   */
  async complete(
    options: LLMCompletionOptions,
    provider?: LLMProviderType
  ): Promise<LLMCompletionResponse> {
    return this.llmFactory.complete(options, provider);
  }

  /**
   * Generate a persona from keywords
   */
  async generatePersona(keywords: PersonaKeywords): Promise<GeneratedPersona> {
    // Sanitize all user inputs to prevent prompt injection
    const sanitizedKeywords = {
      industry: sanitizeInput(keywords.industry, 100),
      role: sanitizeInput(keywords.role, 100),
      personality: sanitizeArray(keywords.personality, 10),
      interests: sanitizeArray(keywords.interests, 10),
      writingStyle: sanitizeInput(keywords.writingStyle, 100),
      tone: sanitizeInput(keywords.tone, 50),
    };

    const systemPrompt = `You are an expert at creating social media personas for content creators.
Generate a detailed persona based on the provided keywords.
Respond with a valid JSON object only, no markdown or additional text.`;

    const characteristics: string[] = [];
    if (sanitizedKeywords.industry) {
      characteristics.push(`- Industry: ${sanitizedKeywords.industry}`);
    }
    if (sanitizedKeywords.role) {
      characteristics.push(`- Role/Position: ${sanitizedKeywords.role}`);
    }
    if (sanitizedKeywords.personality.length > 0) {
      characteristics.push(`- Personality traits: ${sanitizedKeywords.personality.join(', ')}`);
    }
    if (sanitizedKeywords.interests.length > 0) {
      characteristics.push(`- Interests: ${sanitizedKeywords.interests.join(', ')}`);
    }
    if (sanitizedKeywords.writingStyle) {
      characteristics.push(`- Writing style: ${sanitizedKeywords.writingStyle}`);
    }
    if (sanitizedKeywords.tone) {
      characteristics.push(`- Tone: ${sanitizedKeywords.tone}`);
    }

    const userPrompt = `Create a social media persona with the following characteristics:
${characteristics.join('\n')}

Return a JSON object with:
{
  "name": "A creative persona name",
  "bio": "A 160-character bio for social media",
  "personality": "Description of persona's personality",
  "writingStyle": "How they write (casual, formal, etc)",
  "tone": "Their overall tone (friendly, professional, etc)",
  "interests": ["array", "of", "interests"],
  "hashtags": ["relevant", "hashtags", "they", "would", "use"],
  "samplePosts": ["Three", "sample", "posts in their voice"]
}`;

    const response = await this.generateText({
      prompt: userPrompt,
      systemPrompt,
      temperature: 0.8,
      maxTokens: 1500,
    });

    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate with Zod schema
      return GeneratedPersonaSchema.parse(parsed) as GeneratedPersona;
    } catch (error) {
      this.logger.error('Failed to parse persona response:', error);
      throw new Error('Failed to generate valid persona');
    }
  }

  /**
   * Refine/improve existing content
   */
  async refineContent(
    content: string,
    instructions: string,
    provider?: LLMProviderType
  ): Promise<string> {
    // Sanitize inputs
    const sanitizedContent = sanitizeInput(content, 2000);
    const sanitizedInstructions = sanitizeInput(instructions, 500);

    const systemPrompt = `You are a skilled content editor.
Improve the provided content based on the given instructions.
Return only the improved content, no explanations.`;

    return this.generateText({
      prompt: `Original content:
${sanitizedContent}

Instructions:
${sanitizedInstructions}

Improved content:`,
      systemPrompt,
      temperature: 0.5,
      provider,
    });
  }

  /**
   * Generate content variations
   */
  async generateVariations(
    content: string,
    count: number = 3,
    provider?: LLMProviderType
  ): Promise<string[]> {
    // Sanitize input and limit count
    const sanitizedContent = sanitizeInput(content, 1000);
    const safeCount = Math.min(Math.max(1, count), 10);

    const systemPrompt = `You are a creative content writer.
Generate variations of the provided content while maintaining the core message.
Return only a JSON array of strings, no markdown or additional text.`;

    const response = await this.generateText({
      prompt: `Generate ${safeCount} different variations of this content:

"${sanitizedContent}"

Return as a JSON array: ["variation1", "variation2", ...]`,
      systemPrompt,
      temperature: 0.9,
      maxTokens: 2000,
      provider,
    });

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate as array of strings
      const schema = z.array(z.string().max(1000)).max(10);
      return schema.parse(parsed);
    } catch (error) {
      this.logger.error('Failed to parse variations response:', error);
      return [content]; // Return original if parsing fails
    }
  }

  /**
   * Analyze content sentiment and characteristics
   */
  async analyzeContent(
    content: string,
    provider?: LLMProviderType
  ): Promise<ContentAnalysis> {
    // Sanitize input
    const sanitizedContent = sanitizeInput(content, 2000);

    const systemPrompt = `You are a content analysis expert.
Analyze the provided content and return insights.
Return only a valid JSON object, no markdown or additional text.`;

    const response = await this.generateText({
      prompt: `Analyze this social media content:

"${sanitizedContent}"

Return a JSON object with:
{
  "sentiment": "positive" | "negative" | "neutral",
  "tone": "description of tone",
  "topics": ["main", "topics"],
  "suggestions": ["improvement", "suggestions"]
}`,
      systemPrompt,
      temperature: 0.3,
      maxTokens: 500,
      provider,
    });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate with Zod schema
      return ContentAnalysisSchema.parse(parsed) as ContentAnalysis;
    } catch (error) {
      this.logger.error('Failed to parse analysis response:', error);
      return {
        sentiment: 'neutral',
        tone: 'unknown',
        topics: [],
        suggestions: [],
      } satisfies ContentAnalysis;
    }
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): LLMProviderType[] {
    return this.llmFactory.getAvailableProviders();
  }

  /**
   * Check if a specific provider is available
   */
  isProviderAvailable(provider: LLMProviderType): boolean {
    return this.llmFactory.isProviderAvailable(provider);
  }
}
