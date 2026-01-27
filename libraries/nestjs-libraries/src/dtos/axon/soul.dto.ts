import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  IsPhoneNumber,
  IsDate,
  ValidateNested,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SoulType, Gender, FirestoreDocument } from './types';

export class RecoveryInfo {
  @ApiPropertyOptional({ description: 'Recovery email address' })
  @IsEmail()
  @IsOptional()
  recoveryEmail?: string;

  @ApiPropertyOptional({ description: 'Recovery phone number' })
  @IsPhoneNumber()
  @IsOptional()
  recoveryPhone?: string;

  @ApiPropertyOptional({ description: 'Security questions and answers' })
  @IsObject()
  @IsOptional()
  securityQuestions?: Record<string, string>;
}

export class SoulMetadata {
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

  @ApiPropertyOptional({ description: 'Timezone (IANA format)' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Language preference (ISO 639-1)' })
  @IsString()
  @MinLength(2)
  @MaxLength(5)
  @IsOptional()
  language?: string;
}

// Soul status enum
export enum SoulStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  WARMING = 'warming',
  SUSPENDED = 'suspended',
}

// Soul entity interface (Firestore document)
export interface Soul extends FirestoreDocument {
  organizationId: string;
  name: string;
  description?: string;
  status: SoulStatus;
  personaId?: string;
  proxyId?: string;
  accountIds: string[];
  soulOrgId?: string;
  metadata?: Record<string, unknown>;
  // Legacy fields
  type?: SoulType;
  email?: string;
  phone?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  recoveryInfo?: RecoveryInfo;
  notes?: string;
}

// Create Soul DTO - Simplified model for AXON
export class CreateSoulDto {
  @ApiProperty({ description: 'Name of the soul (identity container)' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Description of this soul' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Associated persona ID' })
  @IsString()
  @IsOptional()
  personaId?: string;

  @ApiPropertyOptional({ description: 'Default proxy ID' })
  @IsString()
  @IsOptional()
  proxyId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  // Legacy fields for backward compatibility
  @ApiPropertyOptional({ description: 'Type of soul identity (legacy)', enum: SoulType })
  @IsEnum(SoulType)
  @IsOptional()
  type?: SoulType;

  @ApiPropertyOptional({ description: 'Primary email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Primary phone number' })
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Display name (legacy - use name instead)' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  displayName?: string;

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

  @ApiPropertyOptional({ description: 'Recovery information' })
  @ValidateNested()
  @Type(() => RecoveryInfo)
  @IsOptional()
  recoveryInfo?: RecoveryInfo;

  @ApiPropertyOptional({ description: 'Internal notes' })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  notes?: string;
}

// Update Soul DTO
export class UpdateSoulDto {
  @ApiPropertyOptional({ description: 'Name of the soul' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Status', enum: SoulStatus })
  @IsEnum(SoulStatus)
  @IsOptional()
  status?: SoulStatus;

  @ApiPropertyOptional({ description: 'Associated persona ID' })
  @IsString()
  @IsOptional()
  personaId?: string;

  @ApiPropertyOptional({ description: 'Default proxy ID' })
  @IsString()
  @IsOptional()
  proxyId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  // Legacy fields
  @ApiPropertyOptional({ description: 'Type of soul identity (legacy)', enum: SoulType })
  @IsEnum(SoulType)
  @IsOptional()
  type?: SoulType;

  @ApiPropertyOptional({ description: 'Primary email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Primary phone number' })
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Display name (legacy)' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  displayName?: string;

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

  @ApiPropertyOptional({ description: 'Recovery information' })
  @ValidateNested()
  @Type(() => RecoveryInfo)
  @IsOptional()
  recoveryInfo?: RecoveryInfo;

  @ApiPropertyOptional({ description: 'Internal notes' })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  notes?: string;
}

// Soul Response DTO
export class SoulResponseDto {
  @ApiProperty({ description: 'Soul ID' })
  id: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Name of the soul' })
  name: string;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiProperty({ description: 'Status', enum: SoulStatus })
  status: SoulStatus;

  @ApiPropertyOptional({ description: 'Associated persona ID' })
  personaId?: string;

  @ApiPropertyOptional({ description: 'Default proxy ID' })
  proxyId?: string;

  @ApiProperty({ description: 'Associated account IDs', type: [String] })
  accountIds: string[];

  @ApiPropertyOptional({ description: 'Number of associated accounts' })
  accountCount?: number;

  @ApiPropertyOptional({ description: 'Associated soul organization ID' })
  soulOrgId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, unknown>;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;

  // Legacy fields for backward compatibility
  @ApiPropertyOptional({ description: 'Type of soul identity (legacy)', enum: SoulType })
  type?: SoulType;

  @ApiPropertyOptional({ description: 'Primary email address' })
  email?: string;

  @ApiPropertyOptional({ description: 'Primary phone number' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Display name (legacy)' })
  displayName?: string;

  @ApiPropertyOptional({ description: 'First name' })
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  lastName?: string;
}

// Soul List Query DTO
export class SoulListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by soul type', enum: SoulType })
  @IsEnum(SoulType)
  @IsOptional()
  type?: SoulType;

  @ApiPropertyOptional({ description: 'Search by email or display name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by persona ID' })
  @IsString()
  @IsOptional()
  personaId?: string;

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Pagination cursor (last document ID)' })
  @IsString()
  @IsOptional()
  cursor?: string;
}
