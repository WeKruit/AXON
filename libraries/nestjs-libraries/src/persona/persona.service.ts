/**
 * Persona Service - WEC-146
 *
 * Handles business logic for AI-powered personas including
 * generation, management, and content adaptation.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PersonaRepository } from './persona.repository';
import { LLMService, GeneratedPersona } from '../llm/llm.service';
import {
  Persona,
  PersonaKeywords,
  CreatePersonaInput,
  UpdatePersonaInput,
} from './persona.interface';

@Injectable()
export class PersonaService {
  private readonly logger = new Logger(PersonaService.name);

  constructor(
    private readonly personaRepository: PersonaRepository,
    private readonly llmService: LLMService
  ) {}

  /**
   * Generate a persona from keywords using AI
   */
  async generateFromKeywords(
    organizationId: string,
    userId: string,
    keywords: PersonaKeywords
  ): Promise<Persona> {
    this.logger.log(`Generating persona for org: ${organizationId}`);

    const generated = await this.llmService.generatePersona(keywords);

    const input: CreatePersonaInput = {
      name: generated.name,
      bio: generated.bio,
      personality: generated.personality,
      writingStyle: generated.writingStyle,
      tone: generated.tone,
      interests: generated.interests,
      hashtags: generated.hashtags,
      samplePosts: generated.samplePosts,
      keywords,
    };

    return this.personaRepository.create(organizationId, userId, input);
  }

  /**
   * Create a persona manually (without AI generation)
   */
  async create(
    organizationId: string,
    userId: string,
    input: CreatePersonaInput
  ): Promise<Persona> {
    return this.personaRepository.create(organizationId, userId, input);
  }

  /**
   * Get a persona by ID
   */
  async getById(id: string, organizationId: string): Promise<Persona> {
    const persona = await this.personaRepository.findByIdAndOrganization(
      id,
      organizationId
    );

    if (!persona) {
      throw new NotFoundException(`Persona not found: ${id}`);
    }

    return persona;
  }

  /**
   * Get all personas for an organization
   */
  async getByOrganization(organizationId: string): Promise<Persona[]> {
    return this.personaRepository.findByOrganization(organizationId);
  }

  /**
   * Get active personas for an organization
   */
  async getActiveByOrganization(organizationId: string): Promise<Persona[]> {
    return this.personaRepository.findActiveByOrganization(organizationId);
  }

  /**
   * Update a persona
   */
  async update(
    id: string,
    organizationId: string,
    input: UpdatePersonaInput
  ): Promise<Persona> {
    // Check authorization
    const existing = await this.personaRepository.findByIdAndOrganization(
      id,
      organizationId
    );

    if (!existing) {
      throw new NotFoundException(`Persona not found: ${id}`);
    }

    const updated = await this.personaRepository.update(id, input);
    if (!updated) {
      throw new NotFoundException(`Persona not found: ${id}`);
    }

    return updated;
  }

  /**
   * Delete a persona
   */
  async delete(id: string, organizationId: string): Promise<void> {
    // Check authorization
    const existing = await this.personaRepository.findByIdAndOrganization(
      id,
      organizationId
    );

    if (!existing) {
      throw new NotFoundException(`Persona not found: ${id}`);
    }

    const deleted = await this.personaRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Persona not found: ${id}`);
    }
  }

  /**
   * Deactivate a persona (soft delete)
   */
  async deactivate(id: string, organizationId: string): Promise<Persona> {
    // Check authorization
    const existing = await this.personaRepository.findByIdAndOrganization(
      id,
      organizationId
    );

    if (!existing) {
      throw new NotFoundException(`Persona not found: ${id}`);
    }

    const deactivated = await this.personaRepository.deactivate(id);
    if (!deactivated) {
      throw new NotFoundException(`Persona not found: ${id}`);
    }

    return deactivated;
  }

  /**
   * Activate a persona
   */
  async activate(id: string, organizationId: string): Promise<Persona> {
    // Check authorization
    const existing = await this.personaRepository.findByIdAndOrganization(
      id,
      organizationId
    );

    if (!existing) {
      throw new NotFoundException(`Persona not found: ${id}`);
    }

    const activated = await this.personaRepository.activate(id);
    if (!activated) {
      throw new NotFoundException(`Persona not found: ${id}`);
    }

    return activated;
  }

  /**
   * Regenerate a persona with different or updated keywords
   */
  async regenerate(
    id: string,
    organizationId: string,
    keywords?: PersonaKeywords
  ): Promise<Persona> {
    const existing = await this.getById(id, organizationId);

    const keywordsToUse = keywords || existing.keywords;
    const generated = await this.llmService.generatePersona(keywordsToUse);

    return this.update(id, organizationId, {
      name: generated.name,
      bio: generated.bio,
      personality: generated.personality,
      writingStyle: generated.writingStyle,
      tone: generated.tone,
      interests: generated.interests,
      hashtags: generated.hashtags,
      samplePosts: generated.samplePosts,
      keywords: keywordsToUse,
    });
  }

  /**
   * Adapt content to match a persona's voice
   */
  async adaptContent(
    personaId: string,
    organizationId: string,
    content: string
  ): Promise<string> {
    const persona = await this.getById(personaId, organizationId);

    const instructions = `Rewrite this content to match the following persona:
- Name: ${persona.name}
- Personality: ${persona.personality}
- Writing Style: ${persona.writingStyle}
- Tone: ${persona.tone}
- Interests: ${persona.interests.join(', ')}

Maintain the core message but adapt the voice, style, and tone to match this persona.`;

    return this.llmService.refineContent(content, instructions);
  }

  /**
   * Generate sample content using a persona
   */
  async generateContent(
    personaId: string,
    organizationId: string,
    topic: string
  ): Promise<string[]> {
    const persona = await this.getById(personaId, organizationId);

    const prompt = `Write 3 social media posts about "${topic}" in the voice of this persona:
- Name: ${persona.name}
- Personality: ${persona.personality}
- Writing Style: ${persona.writingStyle}
- Tone: ${persona.tone}
- Interests: ${persona.interests.join(', ')}
- Hashtags they use: ${persona.hashtags.join(', ')}

Return the posts as a JSON array of strings.`;

    const response = await this.llmService.generateText({
      prompt,
      systemPrompt:
        'You are a social media content creator. Generate engaging posts in the specified persona voice. Return only a JSON array of strings.',
      temperature: 0.8,
    });

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [response];
      }
      return JSON.parse(jsonMatch[0]) as string[];
    } catch {
      return [response];
    }
  }
}
