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
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PersonaKeywordsDto {
  @ApiPropertyOptional({ description: 'Industry or field', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @ApiPropertyOptional({ description: 'Role or position', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  role?: string;

  @ApiPropertyOptional({ description: 'Personality traits', type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  personality?: string[];

  @ApiPropertyOptional({ description: 'Areas of interest', type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  interests?: string[];

  @ApiPropertyOptional({ description: 'Writing style preference', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  writingStyle?: string;

  @ApiPropertyOptional({ description: 'Tone of voice', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tone?: string;
}

export class GeneratePersonaDto {
  @ApiProperty({ description: 'Keywords to generate persona from' })
  @ValidateNested()
  @Type(() => PersonaKeywordsDto)
  keywords: PersonaKeywordsDto;
}

export class CreatePersonaDto {
  @ApiProperty({ description: 'Persona name', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Short bio (max 160 chars)', maxLength: 160 })
  @IsString()
  @MaxLength(160)
  bio: string;

  @ApiProperty({ description: 'Personality description', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  personality: string;

  @ApiProperty({ description: 'Writing style', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  writingStyle: string;

  @ApiProperty({ description: 'Tone of voice', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  tone: string;

  @ApiProperty({ description: 'List of interests', type: [String] })
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  interests: string[];

  @ApiProperty({ description: 'List of hashtags', type: [String] })
  @IsArray()
  @ArrayMaxSize(15)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  hashtags: string[];

  @ApiProperty({ description: 'Sample posts in persona voice', type: [String] })
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  samplePosts: string[];

  @ApiPropertyOptional({ description: 'Keywords used to generate' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonaKeywordsDto)
  keywords?: PersonaKeywordsDto;
}

export class UpdatePersonaDto {
  @ApiPropertyOptional({ description: 'Persona name', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Short bio', maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  bio?: string;

  @ApiPropertyOptional({ description: 'Personality description', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  personality?: string;

  @ApiPropertyOptional({ description: 'Writing style', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  writingStyle?: string;

  @ApiPropertyOptional({ description: 'Tone of voice', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tone?: string;

  @ApiPropertyOptional({ description: 'List of interests', type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  interests?: string[];

  @ApiPropertyOptional({ description: 'List of hashtags', type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(15)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  hashtags?: string[];

  @ApiPropertyOptional({ description: 'Sample posts', type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
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
  @ApiProperty({ description: 'Content to adapt', maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  content: string;
}

export class GenerateContentDto {
  @ApiProperty({ description: 'Topic to generate content about', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  topic: string;
}

export class RegeneratePersonaDto {
  @ApiPropertyOptional({ description: 'New keywords (optional)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonaKeywordsDto)
  keywords?: PersonaKeywordsDto;
}
