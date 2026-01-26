import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsDate,
  ValidateNested,
  IsObject,
  MinLength,
  MaxLength,
  IsUrl,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, FirestoreDocument, Platform } from './types';

export class PersonaAppearance {
  @ApiPropertyOptional({ description: 'Hair color' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  hairColor?: string;

  @ApiPropertyOptional({ description: 'Eye color' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  eyeColor?: string;

  @ApiPropertyOptional({ description: 'Ethnicity/background' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  ethnicity?: string;

  @ApiPropertyOptional({ description: 'Height description' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  height?: string;

  @ApiPropertyOptional({ description: 'Build/body type' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  build?: string;

  @ApiPropertyOptional({ description: 'Distinguishing features' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  distinguishingFeatures?: string;
}

export class PersonaBackground {
  @ApiPropertyOptional({ description: 'Education level/institution' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  education?: string;

  @ApiPropertyOptional({ description: 'Occupation/profession' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  occupation?: string;

  @ApiPropertyOptional({ description: 'Company/workplace' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  company?: string;

  @ApiPropertyOptional({ description: 'Industry' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional({ description: 'Income bracket' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  incomeBracket?: string;

  @ApiPropertyOptional({ description: 'Relationship status' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  relationshipStatus?: string;
}

export class PersonaPersonality {
  @ApiPropertyOptional({ description: 'MBTI type (e.g., INTJ, ENFP)' })
  @IsString()
  @MinLength(4)
  @MaxLength(4)
  @IsOptional()
  mbtiType?: string;

  @ApiPropertyOptional({ description: 'Personality traits', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  traits?: string[];

  @ApiPropertyOptional({ description: 'Values', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  values?: string[];

  @ApiPropertyOptional({ description: 'Communication style' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  communicationStyle?: string;

  @ApiPropertyOptional({ description: 'Humor style' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  humorStyle?: string;
}

export class PersonaInterests {
  @ApiPropertyOptional({ description: 'Hobbies', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hobbies?: string[];

  @ApiPropertyOptional({ description: 'Topics of interest', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  topics?: string[];

  @ApiPropertyOptional({ description: 'Favorite brands', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  favoriteBrands?: string[];

  @ApiPropertyOptional({ description: 'Music preferences', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  musicPreferences?: string[];

  @ApiPropertyOptional({ description: 'Sports interests', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sports?: string[];

  @ApiPropertyOptional({ description: 'Entertainment preferences', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  entertainment?: string[];
}

export class PersonaContentStyle {
  @ApiPropertyOptional({ description: 'Tone of voice (formal, casual, etc.)' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  toneOfVoice?: string;

  @ApiPropertyOptional({ description: 'Writing style description' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  writingStyle?: string;

  @ApiPropertyOptional({ description: 'Emoji usage preference (none, minimal, moderate, heavy)' })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  emojiUsage?: string;

  @ApiPropertyOptional({ description: 'Hashtag preferences', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hashtagPreferences?: string[];

  @ApiPropertyOptional({ description: 'Content themes', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  contentThemes?: string[];

  @ApiPropertyOptional({ description: 'Posting frequency per week' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  postingFrequency?: number;

  @ApiPropertyOptional({ description: 'Preferred posting times', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredPostingTimes?: string[];
}

export class PersonaAsset {
  @ApiProperty({ description: 'Asset type (avatar, header, photo, etc.)' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Asset URL' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ description: 'Asset description' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Platform this asset is for', enum: Platform })
  @IsEnum(Platform)
  @IsOptional()
  platform?: Platform;
}

// Persona entity interface (Firestore document)
export interface Persona extends FirestoreDocument {
  organizationId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  country?: string;
  city?: string;
  language?: string;
  bio?: string;
  appearance?: PersonaAppearance;
  background?: PersonaBackground;
  personality?: PersonaPersonality;
  interests?: PersonaInterests;
  contentStyle?: PersonaContentStyle;
  assets?: PersonaAsset[];
  soulIds?: string[];
  notes?: string;
  tags?: string[];
}

// Create Persona DTO
export class CreatePersonaDto {
  @ApiProperty({ description: 'Persona name for identification' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'First name' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Date of birth' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dateOfBirth?: Date;

  @ApiPropertyOptional({ description: 'Gender', enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Country code (ISO 3166-1 alpha-2)' })
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'Primary language (ISO 639-1)' })
  @IsString()
  @MinLength(2)
  @MaxLength(5)
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({ description: 'Biography/description' })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ description: 'Physical appearance details' })
  @ValidateNested()
  @Type(() => PersonaAppearance)
  @IsOptional()
  appearance?: PersonaAppearance;

  @ApiPropertyOptional({ description: 'Background information' })
  @ValidateNested()
  @Type(() => PersonaBackground)
  @IsOptional()
  background?: PersonaBackground;

  @ApiPropertyOptional({ description: 'Personality traits' })
  @ValidateNested()
  @Type(() => PersonaPersonality)
  @IsOptional()
  personality?: PersonaPersonality;

  @ApiPropertyOptional({ description: 'Interests and preferences' })
  @ValidateNested()
  @Type(() => PersonaInterests)
  @IsOptional()
  interests?: PersonaInterests;

  @ApiPropertyOptional({ description: 'Content creation style' })
  @ValidateNested()
  @Type(() => PersonaContentStyle)
  @IsOptional()
  contentStyle?: PersonaContentStyle;

  @ApiPropertyOptional({ description: 'Visual assets', type: [PersonaAsset] })
  @ValidateNested({ each: true })
  @Type(() => PersonaAsset)
  @IsOptional()
  assets?: PersonaAsset[];

  @ApiPropertyOptional({ description: 'Internal notes' })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Tags for categorization', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

// Update Persona DTO
export class UpdatePersonaDto {
  @ApiPropertyOptional({ description: 'Persona name' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'First name' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Date of birth' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dateOfBirth?: Date;

  @ApiPropertyOptional({ description: 'Gender', enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Country code (ISO 3166-1 alpha-2)' })
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'Primary language (ISO 639-1)' })
  @IsString()
  @MinLength(2)
  @MaxLength(5)
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({ description: 'Biography/description' })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ description: 'Physical appearance details' })
  @ValidateNested()
  @Type(() => PersonaAppearance)
  @IsOptional()
  appearance?: PersonaAppearance;

  @ApiPropertyOptional({ description: 'Background information' })
  @ValidateNested()
  @Type(() => PersonaBackground)
  @IsOptional()
  background?: PersonaBackground;

  @ApiPropertyOptional({ description: 'Personality traits' })
  @ValidateNested()
  @Type(() => PersonaPersonality)
  @IsOptional()
  personality?: PersonaPersonality;

  @ApiPropertyOptional({ description: 'Interests and preferences' })
  @ValidateNested()
  @Type(() => PersonaInterests)
  @IsOptional()
  interests?: PersonaInterests;

  @ApiPropertyOptional({ description: 'Content creation style' })
  @ValidateNested()
  @Type(() => PersonaContentStyle)
  @IsOptional()
  contentStyle?: PersonaContentStyle;

  @ApiPropertyOptional({ description: 'Visual assets', type: [PersonaAsset] })
  @ValidateNested({ each: true })
  @Type(() => PersonaAsset)
  @IsOptional()
  assets?: PersonaAsset[];

  @ApiPropertyOptional({ description: 'Internal notes' })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Tags for categorization', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

// Persona Response DTO
export class PersonaResponseDto {
  @ApiProperty({ description: 'Persona ID' })
  id: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Persona name' })
  name: string;

  @ApiPropertyOptional({ description: 'First name' })
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  lastName?: string;

  @ApiPropertyOptional({ description: 'Gender', enum: Gender })
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Country code' })
  country?: string;

  @ApiPropertyOptional({ description: 'City' })
  city?: string;

  @ApiPropertyOptional({ description: 'Biography/description' })
  bio?: string;

  @ApiPropertyOptional({ description: 'Primary avatar URL' })
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Number of associated souls' })
  soulCount?: number;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  tags?: string[];

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}

// Persona List Query DTO
export class PersonaListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by gender', enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Filter by country code' })
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'Search by name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by tags', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Pagination cursor (last document ID)' })
  @IsString()
  @IsOptional()
  cursor?: string;
}
