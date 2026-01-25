/**
 * Persona Service Tests - WEC-146
 *
 * Unit tests for PersonaService covering all CRUD operations,
 * AI generation, and content adaptation.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PersonaService } from './persona.service';
import { PersonaRepository } from './persona.repository';
import { LLMService, GeneratedPersona } from '../llm/llm.service';
import { Persona, PersonaKeywords, CreatePersonaInput } from './persona.interface';

describe('PersonaService', () => {
  let service: PersonaService;
  let personaRepository: jest.Mocked<PersonaRepository>;
  let llmService: jest.Mocked<LLMService>;

  const mockPersona: Persona = {
    id: 'persona-123',
    organizationId: 'org-456',
    userId: 'user-789',
    name: 'Tech Enthusiast',
    bio: 'Passionate about technology and innovation',
    personality: 'Curious, analytical, and forward-thinking',
    writingStyle: 'Conversational and informative',
    tone: 'Friendly and professional',
    interests: ['AI', 'startups', 'programming'],
    hashtags: ['#tech', '#innovation', '#AI'],
    samplePosts: ['Excited about the future of AI!'],
    keywords: {
      industry: 'Technology',
      role: 'Developer',
    },
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockGeneratedPersona: GeneratedPersona = {
    name: 'Tech Enthusiast',
    bio: 'Passionate about technology and innovation',
    personality: 'Curious, analytical, and forward-thinking',
    writingStyle: 'Conversational and informative',
    tone: 'Friendly and professional',
    interests: ['AI', 'startups', 'programming'],
    hashtags: ['#tech', '#innovation', '#AI'],
    samplePosts: ['Excited about the future of AI!'],
  };

  beforeEach(async () => {
    const mockPersonaRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndOrganization: jest.fn(),
      findByOrganization: jest.fn(),
      findActiveByOrganization: jest.fn(),
      findByFilter: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deactivate: jest.fn(),
      activate: jest.fn(),
    };

    const mockLLMService = {
      generatePersona: jest.fn(),
      refineContent: jest.fn(),
      generateText: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonaService,
        { provide: PersonaRepository, useValue: mockPersonaRepository },
        { provide: LLMService, useValue: mockLLMService },
      ],
    }).compile();

    service = module.get<PersonaService>(PersonaService);
    personaRepository = module.get(PersonaRepository);
    llmService = module.get(LLMService);
  });

  describe('generateFromKeywords', () => {
    const keywords: PersonaKeywords = {
      industry: 'Technology',
      role: 'Developer',
      personality: ['curious', 'analytical'],
      interests: ['AI', 'programming'],
    };

    it('should generate a persona from keywords using LLM', async () => {
      llmService.generatePersona.mockResolvedValue(mockGeneratedPersona);
      personaRepository.create.mockResolvedValue(mockPersona);

      const result = await service.generateFromKeywords('org-456', 'user-789', keywords);

      expect(llmService.generatePersona).toHaveBeenCalledWith(keywords);
      expect(personaRepository.create).toHaveBeenCalledWith(
        'org-456',
        'user-789',
        expect.objectContaining({
          name: mockGeneratedPersona.name,
          bio: mockGeneratedPersona.bio,
          keywords,
        })
      );
      expect(result).toEqual(mockPersona);
    });

    it('should propagate LLM errors', async () => {
      llmService.generatePersona.mockRejectedValue(new Error('LLM service unavailable'));

      await expect(
        service.generateFromKeywords('org-456', 'user-789', keywords)
      ).rejects.toThrow('LLM service unavailable');
    });
  });

  describe('create', () => {
    const input: CreatePersonaInput = {
      name: 'Tech Enthusiast',
      bio: 'Passionate about technology',
      personality: 'Curious and analytical',
      writingStyle: 'Conversational',
      tone: 'Friendly',
      interests: ['AI'],
      hashtags: ['#tech'],
      samplePosts: ['Hello world!'],
      keywords: {},
    };

    it('should create a persona manually', async () => {
      personaRepository.create.mockResolvedValue(mockPersona);

      const result = await service.create('org-456', 'user-789', input);

      expect(personaRepository.create).toHaveBeenCalledWith('org-456', 'user-789', input);
      expect(result).toEqual(mockPersona);
    });
  });

  describe('getById', () => {
    it('should return persona when found', async () => {
      personaRepository.findByIdAndOrganization.mockResolvedValue(mockPersona);

      const result = await service.getById('persona-123', 'org-456');

      expect(personaRepository.findByIdAndOrganization).toHaveBeenCalledWith(
        'persona-123',
        'org-456'
      );
      expect(result).toEqual(mockPersona);
    });

    it('should throw NotFoundException when persona not found', async () => {
      personaRepository.findByIdAndOrganization.mockResolvedValue(null);

      await expect(service.getById('nonexistent', 'org-456')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getByOrganization', () => {
    it('should return all personas for organization', async () => {
      personaRepository.findByOrganization.mockResolvedValue([mockPersona]);

      const result = await service.getByOrganization('org-456');

      expect(personaRepository.findByOrganization).toHaveBeenCalledWith('org-456');
      expect(result).toEqual([mockPersona]);
    });

    it('should return empty array when no personas exist', async () => {
      personaRepository.findByOrganization.mockResolvedValue([]);

      const result = await service.getByOrganization('org-456');

      expect(result).toEqual([]);
    });
  });

  describe('getActiveByOrganization', () => {
    it('should return only active personas', async () => {
      personaRepository.findActiveByOrganization.mockResolvedValue([mockPersona]);

      const result = await service.getActiveByOrganization('org-456');

      expect(personaRepository.findActiveByOrganization).toHaveBeenCalledWith('org-456');
      expect(result).toEqual([mockPersona]);
    });
  });

  describe('update', () => {
    const updateInput = { name: 'Updated Name' };

    it('should update persona when authorized', async () => {
      personaRepository.findByIdAndOrganization.mockResolvedValue(mockPersona);
      personaRepository.update.mockResolvedValue({
        ...mockPersona,
        name: 'Updated Name',
      });

      const result = await service.update('persona-123', 'org-456', updateInput);

      expect(personaRepository.findByIdAndOrganization).toHaveBeenCalledWith(
        'persona-123',
        'org-456'
      );
      expect(personaRepository.update).toHaveBeenCalledWith('persona-123', updateInput);
      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundException when persona not found for authorization', async () => {
      personaRepository.findByIdAndOrganization.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', 'org-456', updateInput)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when update fails', async () => {
      personaRepository.findByIdAndOrganization.mockResolvedValue(mockPersona);
      personaRepository.update.mockResolvedValue(null);

      await expect(
        service.update('persona-123', 'org-456', updateInput)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete persona when authorized', async () => {
      personaRepository.findByIdAndOrganization.mockResolvedValue(mockPersona);
      personaRepository.delete.mockResolvedValue(true);

      await service.delete('persona-123', 'org-456');

      expect(personaRepository.findByIdAndOrganization).toHaveBeenCalledWith(
        'persona-123',
        'org-456'
      );
      expect(personaRepository.delete).toHaveBeenCalledWith('persona-123');
    });

    it('should throw NotFoundException when persona not found for authorization', async () => {
      personaRepository.findByIdAndOrganization.mockResolvedValue(null);

      await expect(service.delete('nonexistent', 'org-456')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw NotFoundException when delete fails', async () => {
      personaRepository.findByIdAndOrganization.mockResolvedValue(mockPersona);
      personaRepository.delete.mockResolvedValue(false);

      await expect(service.delete('persona-123', 'org-456')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('deactivate', () => {
    it('should deactivate persona when authorized', async () => {
      personaRepository.findByIdAndOrganization.mockResolvedValue(mockPersona);
      personaRepository.deactivate.mockResolvedValue({
        ...mockPersona,
        isActive: false,
      });

      const result = await service.deactivate('persona-123', 'org-456');

      expect(personaRepository.deactivate).toHaveBeenCalledWith('persona-123');
      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException when persona not found', async () => {
      personaRepository.findByIdAndOrganization.mockResolvedValue(null);

      await expect(service.deactivate('nonexistent', 'org-456')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw NotFoundException when deactivate fails', async () => {
      personaRepository.findByIdAndOrganization.mockResolvedValue(mockPersona);
      personaRepository.deactivate.mockResolvedValue(null);

      await expect(service.deactivate('persona-123', 'org-456')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('activate', () => {
    it('should activate persona when authorized', async () => {
      const inactivePersona = { ...mockPersona, isActive: false };
      personaRepository.findByIdAndOrganization.mockResolvedValue(inactivePersona);
      personaRepository.activate.mockResolvedValue({
        ...inactivePersona,
        isActive: true,
      });

      const result = await service.activate('persona-123', 'org-456');

      expect(personaRepository.activate).toHaveBeenCalledWith('persona-123');
      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException when persona not found', async () => {
      personaRepository.findByIdAndOrganization.mockResolvedValue(null);

      await expect(service.activate('nonexistent', 'org-456')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('regenerate', () => {
    const newKeywords: PersonaKeywords = {
      industry: 'Finance',
      role: 'Analyst',
    };

    it('should regenerate persona with new keywords', async () => {
      personaRepository.findByIdAndOrganization.mockResolvedValue(mockPersona);
      llmService.generatePersona.mockResolvedValue({
        ...mockGeneratedPersona,
        name: 'Finance Expert',
      });
      personaRepository.update.mockResolvedValue({
        ...mockPersona,
        name: 'Finance Expert',
        keywords: newKeywords,
      });

      const result = await service.regenerate('persona-123', 'org-456', newKeywords);

      expect(llmService.generatePersona).toHaveBeenCalledWith(newKeywords);
      expect(personaRepository.update).toHaveBeenCalledWith(
        'persona-123',
        expect.objectContaining({
          name: 'Finance Expert',
          keywords: newKeywords,
        })
      );
      expect(result.name).toBe('Finance Expert');
    });

    it('should use existing keywords when none provided', async () => {
      personaRepository.findByIdAndOrganization.mockResolvedValue(mockPersona);
      llmService.generatePersona.mockResolvedValue(mockGeneratedPersona);
      personaRepository.update.mockResolvedValue(mockPersona);

      await service.regenerate('persona-123', 'org-456');

      expect(llmService.generatePersona).toHaveBeenCalledWith(mockPersona.keywords);
    });

    it('should throw NotFoundException when persona not found', async () => {
      personaRepository.findByIdAndOrganization.mockResolvedValue(null);

      await expect(
        service.regenerate('nonexistent', 'org-456', newKeywords)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('adaptContent', () => {
    const content = 'Check out this new product!';

    it('should adapt content to persona voice', async () => {
      personaRepository.findByIdAndOrganization.mockResolvedValue(mockPersona);
      llmService.refineContent.mockResolvedValue(
        'Hey tech enthusiasts! You gotta check out this amazing new product! #tech #innovation'
      );

      const result = await service.adaptContent('persona-123', 'org-456', content);

      expect(llmService.refineContent).toHaveBeenCalledWith(
        content,
        expect.stringContaining('Tech Enthusiast')
      );
      expect(result).toContain('tech enthusiasts');
    });

    it('should throw NotFoundException when persona not found', async () => {
      personaRepository.findByIdAndOrganization.mockResolvedValue(null);

      await expect(
        service.adaptContent('nonexistent', 'org-456', content)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateContent', () => {
    const topic = 'artificial intelligence trends';

    it('should generate content using persona voice', async () => {
      personaRepository.findByIdAndOrganization.mockResolvedValue(mockPersona);
      llmService.generateText.mockResolvedValue(
        '["AI is transforming everything!", "The future is here!", "Stay curious!"]'
      );

      const result = await service.generateContent('persona-123', 'org-456', topic);

      expect(llmService.generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining(topic),
        })
      );
      expect(result).toHaveLength(3);
    });

    it('should return original response when JSON parsing fails', async () => {
      personaRepository.findByIdAndOrganization.mockResolvedValue(mockPersona);
      llmService.generateText.mockResolvedValue('Just a plain text response');

      const result = await service.generateContent('persona-123', 'org-456', topic);

      expect(result).toEqual(['Just a plain text response']);
    });

    it('should throw NotFoundException when persona not found', async () => {
      personaRepository.findByIdAndOrganization.mockResolvedValue(null);

      await expect(
        service.generateContent('nonexistent', 'org-456', topic)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
