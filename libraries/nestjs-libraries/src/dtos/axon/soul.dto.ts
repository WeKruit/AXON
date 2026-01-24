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
  IsUUID,
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

// Soul entity interface (Firestore document)
export interface Soul extends FirestoreDocument {
  organizationId: string;
  type: SoulType;
  email?: string;
  phone?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  accountIds: string[];
  personaId?: string;
  recoveryInfo?: RecoveryInfo;
  metadata?: SoulMetadata;
  notes?: string;
}

// Create Soul DTO
export class CreateSoulDto {
  @ApiProperty({ description: 'Type of soul identity', enum: SoulType })
  @IsEnum(SoulType)
  type: SoulType;

  @ApiPropertyOptional({ description: 'Primary email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Primary phone number' })
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Display name' })
  @IsString()
  @MinLength(1)
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

  @ApiPropertyOptional({ description: 'Associated persona ID' })
  @IsUUID()
  @IsOptional()
  personaId?: string;

  @ApiPropertyOptional({ description: 'Recovery information' })
  @ValidateNested()
  @Type(() => RecoveryInfo)
  @IsOptional()
  recoveryInfo?: RecoveryInfo;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @ValidateNested()
  @Type(() => SoulMetadata)
  @IsOptional()
  metadata?: SoulMetadata;

  @ApiPropertyOptional({ description: 'Internal notes' })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  notes?: string;
}

// Update Soul DTO
export class UpdateSoulDto {
  @ApiPropertyOptional({ description: 'Type of soul identity', enum: SoulType })
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

  @ApiPropertyOptional({ description: 'Display name' })
  @IsString()
  @MinLength(1)
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

  @ApiPropertyOptional({ description: 'Associated persona ID' })
  @IsUUID()
  @IsOptional()
  personaId?: string;

  @ApiPropertyOptional({ description: 'Recovery information' })
  @ValidateNested()
  @Type(() => RecoveryInfo)
  @IsOptional()
  recoveryInfo?: RecoveryInfo;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @ValidateNested()
  @Type(() => SoulMetadata)
  @IsOptional()
  metadata?: SoulMetadata;

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

  @ApiProperty({ description: 'Type of soul identity', enum: SoulType })
  type: SoulType;

  @ApiPropertyOptional({ description: 'Primary email address' })
  email?: string;

  @ApiPropertyOptional({ description: 'Primary phone number' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Display name' })
  displayName?: string;

  @ApiPropertyOptional({ description: 'First name' })
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  lastName?: string;

  @ApiProperty({ description: 'Associated account IDs', type: [String] })
  accountIds: string[];

  @ApiPropertyOptional({ description: 'Associated persona ID' })
  personaId?: string;

  @ApiPropertyOptional({ description: 'Number of associated accounts' })
  accountCount?: number;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
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
  @IsUUID()
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
