/**
 * Persona Controller - WEC-147
 *
 * API endpoints for managing AI-powered personas.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { Organization, User } from '@prisma/client';
import { PersonaService } from '@gitroom/nestjs-libraries/persona/persona.service';
import {
  GeneratePersonaDto,
  CreatePersonaDto,
  UpdatePersonaDto,
  AdaptContentDto,
  GenerateContentDto,
  RegeneratePersonaDto,
} from '@gitroom/nestjs-libraries/dtos/personas/persona.dto';

@ApiTags('Personas')
@Controller('/personas')
export class PersonasController {
  constructor(private readonly personaService: PersonaService) {}

  @Post('/generate')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute for AI generation
  @ApiOperation({ summary: 'Generate a new persona from keywords using AI' })
  @ApiResponse({ status: 201, description: 'Persona generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @ApiResponse({ status: 500, description: 'AI generation failed' })
  async generatePersona(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Body() dto: GeneratePersonaDto
  ) {
    return this.personaService.generateFromKeywords(
      org.id,
      user.id,
      dto.keywords
    );
  }

  @Post('/')
  @ApiOperation({ summary: 'Create a new persona manually' })
  @ApiResponse({ status: 201, description: 'Persona created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createPersona(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Body() dto: CreatePersonaDto
  ) {
    return this.personaService.create(org.id, user.id, {
      ...dto,
      keywords: dto.keywords || {},
    });
  }

  @Get('/')
  @ApiOperation({ summary: 'Get all personas for the organization' })
  @ApiResponse({ status: 200, description: 'List of personas' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPersonas(@GetOrgFromRequest() org: Organization) {
    return { personas: await this.personaService.getByOrganization(org.id) };
  }

  @Get('/active')
  @ApiOperation({ summary: 'Get active personas for the organization' })
  @ApiResponse({ status: 200, description: 'List of active personas' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getActivePersonas(@GetOrgFromRequest() org: Organization) {
    return {
      personas: await this.personaService.getActiveByOrganization(org.id),
    };
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get a specific persona by ID' })
  @ApiResponse({ status: 200, description: 'Persona details' })
  @ApiResponse({ status: 404, description: 'Persona not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPersona(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this.personaService.getById(id, org.id);
  }

  @Put('/:id')
  @ApiOperation({ summary: 'Update a persona' })
  @ApiResponse({ status: 200, description: 'Persona updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Persona not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updatePersona(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() dto: UpdatePersonaDto
  ) {
    return this.personaService.update(id, org.id, dto);
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete a persona' })
  @ApiResponse({ status: 200, description: 'Persona deleted successfully' })
  @ApiResponse({ status: 404, description: 'Persona not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deletePersona(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    await this.personaService.delete(id, org.id);
    return { success: true };
  }

  @Post('/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate a persona (soft delete)' })
  @ApiResponse({ status: 200, description: 'Persona deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Persona not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deactivatePersona(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this.personaService.deactivate(id, org.id);
  }

  @Post('/:id/activate')
  @ApiOperation({ summary: 'Activate a deactivated persona' })
  @ApiResponse({ status: 200, description: 'Persona activated successfully' })
  @ApiResponse({ status: 404, description: 'Persona not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async activatePersona(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this.personaService.activate(id, org.id);
  }

  @Post('/:id/regenerate')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute for AI generation
  @ApiOperation({ summary: 'Regenerate a persona with AI' })
  @ApiResponse({ status: 200, description: 'Persona regenerated successfully' })
  @ApiResponse({ status: 404, description: 'Persona not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @ApiResponse({ status: 500, description: 'AI generation failed' })
  async regeneratePersona(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() dto: RegeneratePersonaDto
  ) {
    return this.personaService.regenerate(id, org.id, dto.keywords);
  }

  @Post('/:id/adapt')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute for content adaptation
  @ApiOperation({ summary: 'Adapt content to match persona voice' })
  @ApiResponse({ status: 200, description: 'Content adapted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Persona not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @ApiResponse({ status: 500, description: 'AI processing failed' })
  async adaptContent(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() dto: AdaptContentDto
  ) {
    const adapted = await this.personaService.adaptContent(
      id,
      org.id,
      dto.content
    );
    return { content: adapted };
  }

  @Post('/:id/generate-content')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute for content generation
  @ApiOperation({ summary: 'Generate content using persona voice' })
  @ApiResponse({ status: 200, description: 'Content generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Persona not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @ApiResponse({ status: 500, description: 'AI generation failed' })
  async generateContent(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() dto: GenerateContentDto
  ) {
    const posts = await this.personaService.generateContent(
      id,
      org.id,
      dto.topic
    );
    return { posts };
  }
}
