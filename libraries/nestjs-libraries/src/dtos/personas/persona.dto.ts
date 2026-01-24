/**
 * Persona DTOs - WEC-147
 *
 * Data Transfer Objects for Persona API endpoints.
 */

import {
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PersonaKeywordsDto {
  @ApiPropertyOptional({ description: 'Industry or field' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ description: 'Role or position' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Personality traits', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  personality?: string[];

  @ApiPropertyOptional({ description: 'Areas of interest', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiPropertyOptional({ description: 'Writing style preference' })
  @IsOptional()
  @IsString()
  writingStyle?: string;

  @ApiPropertyOptional({ description: 'Tone of voice' })
  @IsOptional()
  @IsString()
  tone?: string;
}

export class GeneratePersonaDto {
  @ApiProperty({ description: 'Keywords to generate persona from' })
  @ValidateNested()
  @Type(() => PersonaKeywordsDto)
  keywords: PersonaKeywordsDto;
}

export class CreatePersonaDto {
  @ApiProperty({ description: 'Persona name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Short bio (max 160 chars)' })
  @IsString()
  bio: string;

  @ApiProperty({ description: 'Personality description' })
  @IsString()
  personality: string;

  @ApiProperty({ description: 'Writing style' })
  @IsString()
  writingStyle: string;

  @ApiProperty({ description: 'Tone of voice' })
  @IsString()
  tone: string;

  @ApiProperty({ description: 'List of interests', type: [String] })
  @IsArray()
  @IsString({ each: true })
  interests: string[];

  @ApiProperty({ description: 'List of hashtags', type: [String] })
  @IsArray()
  @IsString({ each: true })
  hashtags: string[];

  @ApiProperty({ description: 'Sample posts in persona voice', type: [String] })
  @IsArray()
  @IsString({ each: true })
  samplePosts: string[];

  @ApiPropertyOptional({ description: 'Keywords used to generate' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonaKeywordsDto)
  keywords?: PersonaKeywordsDto;
}

export class UpdatePersonaDto {
  @ApiPropertyOptional({ description: 'Persona name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Short bio' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Personality description' })
  @IsOptional()
  @IsString()
  personality?: string;

  @ApiPropertyOptional({ description: 'Writing style' })
  @IsOptional()
  @IsString()
  writingStyle?: string;

  @ApiPropertyOptional({ description: 'Tone of voice' })
  @IsOptional()
  @IsString()
  tone?: string;

  @ApiPropertyOptional({ description: 'List of interests', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiPropertyOptional({ description: 'List of hashtags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiPropertyOptional({ description: 'Sample posts', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  samplePosts?: string[];

  @ApiPropertyOptional({ description: 'Keywords' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonaKeywordsDto)
  keywords?: PersonaKeywordsDto;

  @ApiPropertyOptional({ description: 'Whether persona is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AdaptContentDto {
  @ApiProperty({ description: 'Content to adapt' })
  @IsString()
  content: string;
}

export class GenerateContentDto {
  @ApiProperty({ description: 'Topic to generate content about' })
  @IsString()
  topic: string;
}

export class RegeneratePersonaDto {
  @ApiPropertyOptional({ description: 'New keywords (optional)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonaKeywordsDto)
  keywords?: PersonaKeywordsDto;
}
