import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsDate,
  ValidateNested,
  IsNumber,
  MinLength,
  MaxLength,
  IsUUID,
  IsUrl,
  IsBoolean,
  IsIP,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ProxyType,
  ProxyPurpose,
  ProxyStatus,
  ProxyProvider,
  FirestoreDocument,
} from './types';

export class ProxyCredentials {
  @ApiProperty({ description: 'Proxy host/IP address' })
  @IsString()
  host: string;

  @ApiProperty({ description: 'Proxy port' })
  @IsNumber()
  @Min(1)
  @Max(65535)
  port: number;

  @ApiPropertyOptional({ description: 'Proxy username' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ description: 'Proxy password (encrypted)' })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ description: 'Protocol (http, https, socks5)' })
  @IsString()
  @IsOptional()
  protocol?: string;
}

export class ProxyLocation {
  @ApiPropertyOptional({ description: 'Country code (ISO 3166-1 alpha-2)' })
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'Region/State' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'Timezone' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ description: 'ASN (Autonomous System Number)' })
  @IsString()
  @IsOptional()
  asn?: string;

  @ApiPropertyOptional({ description: 'ISP name' })
  @IsString()
  @IsOptional()
  isp?: string;
}

export class ProxyMetrics {
  @ApiPropertyOptional({ description: 'Average response time in ms' })
  @IsNumber()
  @IsOptional()
  avgResponseTime?: number;

  @ApiPropertyOptional({ description: 'Success rate (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  successRate?: number;

  @ApiPropertyOptional({ description: 'Total requests made' })
  @IsNumber()
  @IsOptional()
  totalRequests?: number;

  @ApiPropertyOptional({ description: 'Failed requests' })
  @IsNumber()
  @IsOptional()
  failedRequests?: number;

  @ApiPropertyOptional({ description: 'Last health check timestamp' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  lastHealthCheck?: Date;

  @ApiPropertyOptional({ description: 'Bandwidth used in bytes' })
  @IsNumber()
  @IsOptional()
  bandwidthUsed?: number;
}

export class ProxyRotationConfig {
  @ApiPropertyOptional({ description: 'Is rotation enabled' })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Rotation interval in minutes' })
  @IsNumber()
  @IsOptional()
  intervalMinutes?: number;

  @ApiPropertyOptional({ description: 'Last rotation timestamp' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  lastRotation?: Date;

  @ApiPropertyOptional({ description: 'Rotation endpoint URL' })
  @IsUrl()
  @IsOptional()
  rotationEndpoint?: string;
}

// Proxy entity interface (Firestore document)
export interface Proxy extends FirestoreDocument {
  organizationId: string;
  name: string;
  provider: ProxyProvider;
  type: ProxyType;
  purposes: ProxyPurpose[];
  status: ProxyStatus;
  credentials: ProxyCredentials;
  location?: ProxyLocation;
  metrics?: ProxyMetrics;
  rotationConfig?: ProxyRotationConfig;
  externalId?: string;
  expiresAt?: Date;
  assignedAccountIds?: string[];
  notes?: string;
  tags?: string[];
}

// Create Proxy DTO
export class CreateProxyDto {
  @ApiProperty({ description: 'Proxy name for identification' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Proxy provider', enum: ProxyProvider })
  @IsEnum(ProxyProvider)
  provider: ProxyProvider;

  @ApiProperty({ description: 'Proxy type', enum: ProxyType })
  @IsEnum(ProxyType)
  type: ProxyType;

  @ApiProperty({ description: 'Intended purposes', enum: ProxyPurpose, isArray: true })
  @IsArray()
  @IsEnum(ProxyPurpose, { each: true })
  purposes: ProxyPurpose[];

  @ApiPropertyOptional({ description: 'Proxy status', enum: ProxyStatus, default: ProxyStatus.ACTIVE })
  @IsEnum(ProxyStatus)
  @IsOptional()
  status?: ProxyStatus;

  @ApiProperty({ description: 'Proxy credentials' })
  @ValidateNested()
  @Type(() => ProxyCredentials)
  credentials: ProxyCredentials;

  @ApiPropertyOptional({ description: 'Proxy location information' })
  @ValidateNested()
  @Type(() => ProxyLocation)
  @IsOptional()
  location?: ProxyLocation;

  @ApiPropertyOptional({ description: 'Rotation configuration' })
  @ValidateNested()
  @Type(() => ProxyRotationConfig)
  @IsOptional()
  rotationConfig?: ProxyRotationConfig;

  @ApiPropertyOptional({ description: 'External ID from provider' })
  @IsString()
  @IsOptional()
  externalId?: string;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiresAt?: Date;

  @ApiPropertyOptional({ description: 'Internal notes' })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Tags for categorization', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

// Update Proxy DTO
export class UpdateProxyDto {
  @ApiPropertyOptional({ description: 'Proxy name' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Proxy type', enum: ProxyType })
  @IsEnum(ProxyType)
  @IsOptional()
  type?: ProxyType;

  @ApiPropertyOptional({ description: 'Intended purposes', enum: ProxyPurpose, isArray: true })
  @IsArray()
  @IsEnum(ProxyPurpose, { each: true })
  @IsOptional()
  purposes?: ProxyPurpose[];

  @ApiPropertyOptional({ description: 'Proxy status', enum: ProxyStatus })
  @IsEnum(ProxyStatus)
  @IsOptional()
  status?: ProxyStatus;

  @ApiPropertyOptional({ description: 'Proxy credentials' })
  @ValidateNested()
  @Type(() => ProxyCredentials)
  @IsOptional()
  credentials?: ProxyCredentials;

  @ApiPropertyOptional({ description: 'Proxy location information' })
  @ValidateNested()
  @Type(() => ProxyLocation)
  @IsOptional()
  location?: ProxyLocation;

  @ApiPropertyOptional({ description: 'Proxy metrics' })
  @ValidateNested()
  @Type(() => ProxyMetrics)
  @IsOptional()
  metrics?: ProxyMetrics;

  @ApiPropertyOptional({ description: 'Rotation configuration' })
  @ValidateNested()
  @Type(() => ProxyRotationConfig)
  @IsOptional()
  rotationConfig?: ProxyRotationConfig;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiresAt?: Date;

  @ApiPropertyOptional({ description: 'Internal notes' })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Tags for categorization', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

// Proxy Response DTO
export class ProxyResponseDto {
  @ApiProperty({ description: 'Proxy ID' })
  id: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Proxy name' })
  name: string;

  @ApiProperty({ description: 'Proxy provider', enum: ProxyProvider })
  provider: ProxyProvider;

  @ApiProperty({ description: 'Proxy type', enum: ProxyType })
  type: ProxyType;

  @ApiProperty({ description: 'Intended purposes', enum: ProxyPurpose, isArray: true })
  purposes: ProxyPurpose[];

  @ApiProperty({ description: 'Proxy status', enum: ProxyStatus })
  status: ProxyStatus;

  @ApiPropertyOptional({ description: 'Proxy location' })
  location?: ProxyLocation;

  @ApiPropertyOptional({ description: 'Proxy metrics' })
  metrics?: ProxyMetrics;

  @ApiPropertyOptional({ description: 'External ID from provider' })
  externalId?: string;

  @ApiPropertyOptional({ description: 'Expiry date' })
  expiresAt?: Date;

  @ApiPropertyOptional({ description: 'Number of assigned accounts' })
  assignedAccountCount?: number;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  tags?: string[];

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}

// Proxy List Query DTO
export class ProxyListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by provider', enum: ProxyProvider })
  @IsEnum(ProxyProvider)
  @IsOptional()
  provider?: ProxyProvider;

  @ApiPropertyOptional({ description: 'Filter by type', enum: ProxyType })
  @IsEnum(ProxyType)
  @IsOptional()
  type?: ProxyType;

  @ApiPropertyOptional({ description: 'Filter by purpose', enum: ProxyPurpose })
  @IsEnum(ProxyPurpose)
  @IsOptional()
  purpose?: ProxyPurpose;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ProxyStatus })
  @IsEnum(ProxyStatus)
  @IsOptional()
  status?: ProxyStatus;

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

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Pagination cursor (last document ID)' })
  @IsString()
  @IsOptional()
  cursor?: string;
}

// Proxy Assignment DTO
export class AssignProxyDto {
  @ApiProperty({ description: 'Account ID to assign' })
  @IsUUID()
  accountId: string;
}

// Update Proxy Status DTO
export class UpdateProxyStatusDto {
  @ApiProperty({ description: 'New proxy status', enum: ProxyStatus })
  @IsEnum(ProxyStatus)
  status: ProxyStatus;
}

// Proxy Health Check Response
export class ProxyHealthCheckDto {
  @ApiProperty({ description: 'Is proxy healthy' })
  healthy: boolean;

  @ApiPropertyOptional({ description: 'Response time in ms' })
  responseTime?: number;

  @ApiPropertyOptional({ description: 'Current IP address' })
  currentIp?: string;

  @ApiPropertyOptional({ description: 'Detected location' })
  detectedLocation?: ProxyLocation;

  @ApiPropertyOptional({ description: 'Error message if unhealthy' })
  error?: string;

  @ApiProperty({ description: 'Check timestamp' })
  checkedAt: Date;
}
