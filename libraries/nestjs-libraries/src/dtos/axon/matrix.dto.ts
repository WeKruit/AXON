import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  ValidateNested,
  Min,
  Max,
  MaxLength,
  IsEnum,
  IsDefined,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Bulk operation types
export enum BulkOperationType {
  CREATE = 'create',
  DELETE = 'delete',
}

// Create Mapping DTO
export class CreateMappingDto {
  @ApiProperty({ description: 'Soul ID (from Firestore)' })
  @IsString()
  @IsDefined()
  soulId: string;

  @ApiProperty({ description: 'Integration ID (from PostgreSQL)' })
  @IsString()
  @IsDefined()
  integrationId: string;

  @ApiPropertyOptional({ description: 'Whether this is the primary channel for the soul', default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({ description: 'Priority order (lower = higher priority)', default: 0 })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ description: 'Notes about this mapping' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string;
}

// Update Mapping DTO
export class UpdateMappingDto {
  @ApiPropertyOptional({ description: 'Whether this is the primary channel for the soul' })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({ description: 'Priority order (lower = higher priority)' })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ description: 'Notes about this mapping' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string;
}

// Toggle Mapping DTO (for quick enable/disable)
export class ToggleMappingDto {
  @ApiProperty({ description: 'Soul ID (from Firestore)' })
  @IsString()
  @IsDefined()
  soulId: string;

  @ApiProperty({ description: 'Integration ID (from PostgreSQL)' })
  @IsString()
  @IsDefined()
  integrationId: string;
}

// Single bulk operation item
export class BulkMappingItem {
  @ApiProperty({ description: 'Soul ID (from Firestore)' })
  @IsString()
  @IsDefined()
  soulId: string;

  @ApiProperty({ description: 'Integration ID (from PostgreSQL)' })
  @IsString()
  @IsDefined()
  integrationId: string;

  @ApiPropertyOptional({ description: 'Priority order (lower = higher priority)', default: 0 })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ description: 'Notes about this mapping' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string;
}

// Bulk Mapping DTO
export class BulkMappingDto {
  @ApiProperty({ description: 'Type of bulk operation', enum: BulkOperationType })
  @IsEnum(BulkOperationType)
  @IsDefined()
  operation: BulkOperationType;

  @ApiProperty({ description: 'List of mappings to process', type: [BulkMappingItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkMappingItem)
  @IsDefined()
  mappings: BulkMappingItem[];
}

// Matrix Filters DTO
export class MatrixFiltersDto {
  @ApiPropertyOptional({ description: 'Filter by Soul ID' })
  @IsString()
  @IsOptional()
  soulId?: string;

  @ApiPropertyOptional({ description: 'Filter by Integration ID' })
  @IsString()
  @IsOptional()
  integrationId?: string;

  @ApiPropertyOptional({ description: 'Filter by primary status' })
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({ description: 'Page size', default: 50 })
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Page offset', default: 0 })
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  offset?: number;
}

// Mapping Response DTO
export class MappingResponseDto {
  @ApiProperty({ description: 'Mapping ID' })
  id: string;

  @ApiProperty({ description: 'Soul ID (from Firestore)' })
  soulId: string;

  @ApiProperty({ description: 'Integration ID (from PostgreSQL)' })
  integrationId: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Whether this is the primary channel for the soul' })
  isPrimary: boolean;

  @ApiProperty({ description: 'Priority order' })
  priority: number;

  @ApiPropertyOptional({ description: 'Notes about this mapping' })
  notes?: string;

  @ApiPropertyOptional({ description: 'User who created the mapping' })
  createdBy?: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Integration details (populated when requested)' })
  integration?: {
    id: string;
    name: string;
    picture?: string;
    providerIdentifier: string;
    type: string;
    disabled: boolean;
  };
}

// Soul with integrations response
export class SoulWithIntegrationsDto {
  @ApiProperty({ description: 'Soul ID' })
  soulId: string;

  @ApiProperty({ description: 'List of mapped integrations', type: [MappingResponseDto] })
  mappings: MappingResponseDto[];

  @ApiProperty({ description: 'Total number of integrations' })
  totalIntegrations: number;
}

// Integration with souls response
export class IntegrationWithSoulsDto {
  @ApiProperty({ description: 'Integration ID' })
  integrationId: string;

  @ApiProperty({ description: 'Integration details' })
  integration: {
    id: string;
    name: string;
    picture?: string;
    providerIdentifier: string;
    type: string;
    disabled: boolean;
  };

  @ApiProperty({ description: 'List of mapped souls', type: [MappingResponseDto] })
  mappings: MappingResponseDto[];

  @ApiProperty({ description: 'Total number of souls' })
  totalSouls: number;
}

// Full Matrix Response
export class MatrixResponseDto {
  @ApiProperty({ description: 'List of all mappings', type: [MappingResponseDto] })
  mappings: MappingResponseDto[];

  @ApiProperty({ description: 'Total count of mappings' })
  total: number;

  @ApiProperty({ description: 'Current page size' })
  limit: number;

  @ApiProperty({ description: 'Current page offset' })
  offset: number;

  @ApiProperty({ description: 'Whether there are more results' })
  hasMore: boolean;
}

// Bulk operation result
export class BulkOperationResultDto {
  @ApiProperty({ description: 'Number of successful operations' })
  succeeded: number;

  @ApiProperty({ description: 'Number of failed operations' })
  failed: number;

  @ApiProperty({ description: 'List of created mapping IDs (for create operations)' })
  createdIds?: string[];

  @ApiProperty({ description: 'List of errors encountered' })
  errors?: Array<{
    soulId: string;
    integrationId: string;
    error: string;
  }>;
}
