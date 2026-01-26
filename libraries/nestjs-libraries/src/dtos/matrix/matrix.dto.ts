import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================
// Response DTOs
// ============================================

export class MappingDto {
  @ApiProperty({ description: 'Mapping ID' })
  id: string;

  @ApiProperty({ description: 'Soul ID (Firestore document ID)' })
  soulId: string;

  @ApiProperty({ description: 'Integration ID (PostgreSQL)' })
  integrationId: string;

  @ApiProperty({ description: 'Whether this is the primary channel for the soul' })
  isPrimary: boolean;

  @ApiProperty({ description: 'Priority order for the mapping' })
  priority: number;

  @ApiPropertyOptional({ description: 'Optional notes for the mapping' })
  notes?: string;

  @ApiProperty({ description: 'When the mapping was created' })
  createdAt: Date;
}

export class PersonaInfoDto {
  @ApiProperty({ description: 'Persona ID' })
  id: string;

  @ApiProperty({ description: 'Persona name' })
  name: string;

  @ApiPropertyOptional({ description: 'Persona tone' })
  tone?: string;

  @ApiPropertyOptional({ description: 'Persona style' })
  style?: string;
}

export class SoulWithMappingsDto {
  @ApiProperty({ description: 'Soul ID' })
  id: string;

  @ApiProperty({ description: 'Soul display name' })
  name: string;

  @ApiPropertyOptional({ description: 'Soul description' })
  description?: string;

  @ApiProperty({ description: 'Soul status' })
  status: string;

  @ApiPropertyOptional({ description: 'Associated persona information', type: PersonaInfoDto })
  persona?: PersonaInfoDto;

  @ApiProperty({ description: 'List of integration IDs mapped to this soul', type: [String] })
  integrationIds: string[];

  @ApiProperty({ description: 'Detailed mappings', type: [MappingDto] })
  mappings: MappingDto[];
}

export class IntegrationWithMappingsDto {
  @ApiProperty({ description: 'Integration ID' })
  id: string;

  @ApiProperty({ description: 'Integration name' })
  name: string;

  @ApiProperty({ description: 'Platform identifier (e.g., twitter, instagram)' })
  platform: string;

  @ApiPropertyOptional({ description: 'Integration profile picture URL' })
  picture?: string;

  @ApiProperty({ description: 'Whether the integration is disabled' })
  disabled: boolean;

  @ApiProperty({ description: 'List of soul IDs mapped to this integration', type: [String] })
  soulIds: string[];
}

export class MatrixStatsDto {
  @ApiProperty({ description: 'Total number of souls' })
  totalSouls: number;

  @ApiProperty({ description: 'Total number of integrations' })
  totalIntegrations: number;

  @ApiProperty({ description: 'Total number of mappings' })
  totalMappings: number;
}

export class MatrixResponseDto {
  @ApiProperty({ description: 'List of souls with their mappings', type: [SoulWithMappingsDto] })
  souls: SoulWithMappingsDto[];

  @ApiProperty({ description: 'List of integrations with their mappings', type: [IntegrationWithMappingsDto] })
  integrations: IntegrationWithMappingsDto[];

  @ApiProperty({ description: 'All mappings', type: [MappingDto] })
  mappings: MappingDto[];

  @ApiProperty({ description: 'Matrix statistics', type: MatrixStatsDto })
  stats: MatrixStatsDto;
}

// ============================================
// Request DTOs
// ============================================

export class CreateMappingDto {
  @ApiProperty({ description: 'Soul ID to map' })
  @IsString()
  soulId: string;

  @ApiProperty({ description: 'Integration ID to map' })
  @IsString()
  integrationId: string;

  @ApiPropertyOptional({ description: 'Whether this is the primary channel for the soul', default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({ description: 'Priority order for the mapping', default: 0 })
  @IsNumber()
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ description: 'Optional notes for the mapping' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateMappingDto {
  @ApiPropertyOptional({ description: 'Whether this is the primary channel for the soul' })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({ description: 'Priority order for the mapping' })
  @IsNumber()
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ description: 'Optional notes for the mapping' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export enum BulkActionType {
  CREATE = 'create',
  DELETE = 'delete',
}

export class BulkMappingOperationDto {
  @ApiProperty({ description: 'Action to perform', enum: BulkActionType })
  @IsEnum(BulkActionType)
  action: BulkActionType;

  @ApiProperty({ description: 'Soul ID' })
  @IsString()
  soulId: string;

  @ApiProperty({ description: 'Integration ID' })
  @IsString()
  integrationId: string;
}

export class BulkMappingRequestDto {
  @ApiProperty({ description: 'List of operations to perform', type: [BulkMappingOperationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkMappingOperationDto)
  operations: BulkMappingOperationDto[];
}

export class BulkMappingErrorDto {
  @ApiProperty({ description: 'The operation that failed', type: BulkMappingOperationDto })
  operation: BulkMappingOperationDto;

  @ApiProperty({ description: 'Error message' })
  error: string;
}

export class BulkMappingResponseDto {
  @ApiProperty({ description: 'Whether all operations succeeded' })
  success: boolean;

  @ApiProperty({ description: 'Number of mappings created' })
  created: number;

  @ApiProperty({ description: 'Number of mappings deleted' })
  deleted: number;

  @ApiProperty({ description: 'List of errors', type: [BulkMappingErrorDto] })
  errors: BulkMappingErrorDto[];
}

// ============================================
// Query DTOs
// ============================================

export class MatrixQueryDto {
  @ApiPropertyOptional({ description: 'Filter by platform (e.g., twitter, instagram)' })
  @IsString()
  @IsOptional()
  platform?: string;

  @ApiPropertyOptional({ description: 'Filter by soul ID' })
  @IsString()
  @IsOptional()
  soulId?: string;

  @ApiPropertyOptional({ description: 'Search by soul name' })
  @IsString()
  @IsOptional()
  search?: string;
}

// ============================================
// Toggle Response DTO
// ============================================

export class ToggleMappingResponseDto {
  @ApiProperty({ description: 'Action performed', enum: ['created', 'deleted'] })
  action: 'created' | 'deleted';

  @ApiPropertyOptional({ description: 'The mapping if created', type: MappingDto })
  mapping: MappingDto | null;
}

// ============================================
// Soul Integrations Response DTO
// ============================================

export class SoulIntegrationDto {
  @ApiProperty({ description: 'Integration ID' })
  id: string;

  @ApiProperty({ description: 'Integration name' })
  name: string;

  @ApiProperty({ description: 'Platform identifier' })
  platform: string;

  @ApiPropertyOptional({ description: 'Profile picture URL' })
  picture?: string;

  @ApiProperty({ description: 'Whether this is the primary channel' })
  isPrimary: boolean;

  @ApiProperty({ description: 'Priority order' })
  priority: number;
}

// ============================================
// Integration Souls Response DTO
// ============================================

export class IntegrationSoulDto {
  @ApiProperty({ description: 'Soul ID' })
  id: string;

  @ApiProperty({ description: 'Soul name' })
  name: string;

  @ApiProperty({ description: 'Soul status' })
  status: string;

  @ApiProperty({ description: 'Whether this is the primary channel for the soul' })
  isPrimary: boolean;
}
