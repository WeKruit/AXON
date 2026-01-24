/**
 * LLM Service - High-level service for LLM operations
 *
 * Provides convenient methods for common LLM operations like
 * text generation, persona creation, and content analysis.
 */

import { Injectable, Logger } from '@nestjs/common';
import { LLMFactory } from './llm.factory';
import {
  LLMCompletionOptions,
  LLMCompletionResponse,
  LLMMessage,
  LLMProviderType,
} from './llm.interface';

export interface GenerateTextOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: LLMProviderType;
}

export interface PersonaKeywords {
  industry?: string;
  role?: string;
  personality?: string[];
  interests?: string[];
  writingStyle?: string;
  tone?: string;
}

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
    const systemPrompt = `You are an expert at creating social media personas for content creators.
Generate a detailed persona based on the provided keywords.
Respond with a valid JSON object only, no markdown or additional text.`;

    const userPrompt = `Create a social media persona with the following characteristics:
${keywords.industry ? `- Industry: ${keywords.industry}` : ''}
${keywords.role ? `- Role/Position: ${keywords.role}` : ''}
${keywords.personality?.length ? `- Personality traits: ${keywords.personality.join(', ')}` : ''}
${keywords.interests?.length ? `- Interests: ${keywords.interests.join(', ')}` : ''}
${keywords.writingStyle ? `- Writing style: ${keywords.writingStyle}` : ''}
${keywords.tone ? `- Tone: ${keywords.tone}` : ''}

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
      return JSON.parse(jsonMatch[0]) as GeneratedPersona;
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
    const systemPrompt = `You are a skilled content editor.
Improve the provided content based on the given instructions.
Return only the improved content, no explanations.`;

    return this.generateText({
      prompt: `Original content:
${content}

Instructions:
${instructions}

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
    const systemPrompt = `You are a creative content writer.
Generate variations of the provided content while maintaining the core message.
Return only a JSON array of strings, no markdown or additional text.`;

    const response = await this.generateText({
      prompt: `Generate ${count} different variations of this content:

"${content}"

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
      return JSON.parse(jsonMatch[0]) as string[];
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
  ): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    tone: string;
    topics: string[];
    suggestions: string[];
  }> {
    const systemPrompt = `You are a content analysis expert.
Analyze the provided content and return insights.
Return only a valid JSON object, no markdown or additional text.`;

    const response = await this.generateText({
      prompt: `Analyze this social media content:

"${content}"

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
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.error('Failed to parse analysis response:', error);
      return {
        sentiment: 'neutral',
        tone: 'unknown',
        topics: [],
        suggestions: [],
      };
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
