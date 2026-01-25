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
  MinLength,
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
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  interests?: string[];

  @ApiPropertyOptional({
    description: 'Writing style preference',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  writingStyle?: string;

  @ApiPropertyOptional({ description: 'Tone of voice', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tone?: string;
}

export class GeneratePersonaDto {
  @ApiProperty({ description: 'Keywords to generate persona from' })
  @ValidateNested()
  @Type(() => PersonaKeywordsDto)
  keywords: PersonaKeywordsDto;
}

export class CreatePersonaDto {
  @ApiProperty({ description: 'Persona name', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
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
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  interests: string[];

  @ApiProperty({ description: 'List of hashtags', type: [String] })
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  hashtags: string[];

  @ApiProperty({ description: 'Sample posts in persona voice', type: [String] })
  @IsArray()
  @ArrayMaxSize(10)
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
  @ApiPropertyOptional({
    description: 'Persona name',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
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
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  interests?: string[];

  @ApiPropertyOptional({ description: 'List of hashtags', type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  hashtags?: string[];

  @ApiPropertyOptional({ description: 'Sample posts', type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
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
  @ApiProperty({ description: 'Content to adapt', maxLength: 5000 })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;
}

export class GenerateContentDto {
  @ApiProperty({ description: 'Topic to generate content about', maxLength: 200 })
  @IsString()
  @MinLength(1)
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
