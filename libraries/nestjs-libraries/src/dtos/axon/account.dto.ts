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
  IsUUID,
  IsUrl,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Platform,
  AccountStatus,
  FirestoreDocument,
} from './types';

export class AccountCredentials {
  @ApiPropertyOptional({ description: 'Username for the platform' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ description: 'Password (encrypted)' })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ description: 'OAuth access token (encrypted)' })
  @IsString()
  @IsOptional()
  accessToken?: string;

  @ApiPropertyOptional({ description: 'OAuth refresh token (encrypted)' })
  @IsString()
  @IsOptional()
  refreshToken?: string;

  @ApiPropertyOptional({ description: 'Token expiry date' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  tokenExpiresAt?: Date;

  @ApiPropertyOptional({ description: 'API key (encrypted)' })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'API secret (encrypted)' })
  @IsString()
  @IsOptional()
  apiSecret?: string;

  @ApiPropertyOptional({ description: '2FA secret (encrypted)' })
  @IsString()
  @IsOptional()
  twoFactorSecret?: string;

  @ApiPropertyOptional({ description: '2FA backup codes (encrypted)' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  backupCodes?: string[];
}

export class AccountMetrics {
  @ApiPropertyOptional({ description: 'Number of followers' })
  @IsOptional()
  followers?: number;

  @ApiPropertyOptional({ description: 'Number of following' })
  @IsOptional()
  following?: number;

  @ApiPropertyOptional({ description: 'Total posts count' })
  @IsOptional()
  postsCount?: number;

  @ApiPropertyOptional({ description: 'Average engagement rate' })
  @IsOptional()
  engagementRate?: number;

  @ApiPropertyOptional({ description: 'Last metrics update' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  lastUpdated?: Date;
}

export class WarmingConfig {
  @ApiPropertyOptional({ description: 'Is warming enabled' })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Warming start date' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Current warming day' })
  @IsOptional()
  currentDay?: number;

  @ApiPropertyOptional({ description: 'Target warming days' })
  @IsOptional()
  targetDays?: number;

  @ApiPropertyOptional({ description: 'Daily action limit' })
  @IsOptional()
  dailyActionLimit?: number;

  @ApiPropertyOptional({ description: 'Actions performed today' })
  @IsOptional()
  actionsToday?: number;
}

// Account entity interface (Firestore document)
export interface Account extends FirestoreDocument {
  organizationId: string;
  soulId: string;
  platform: Platform;
  platformUserId?: string;
  handle: string;
  displayName?: string;
  profileUrl?: string;
  avatarUrl?: string;
  bio?: string;
  status: AccountStatus;
  credentials: AccountCredentials;
  proxyId?: string;
  metrics?: AccountMetrics;
  warmingConfig?: WarmingConfig;
  lastActivityAt?: Date;
  notes?: string;
  tags?: string[];
}

// Create Account DTO
export class CreateAccountDto {
  @ApiProperty({ description: 'Soul ID this account belongs to' })
  @IsUUID()
  soulId: string;

  @ApiProperty({ description: 'Platform', enum: Platform })
  @IsEnum(Platform)
  platform: Platform;

  @ApiPropertyOptional({ description: 'Platform-specific user ID' })
  @IsString()
  @IsOptional()
  platformUserId?: string;

  @ApiProperty({ description: 'Account handle/username on the platform' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  handle: string;

  @ApiPropertyOptional({ description: 'Display name' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Profile URL' })
  @IsUrl()
  @IsOptional()
  profileUrl?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Bio/description' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ description: 'Account status', enum: AccountStatus, default: AccountStatus.ACTIVE })
  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus;

  @ApiPropertyOptional({ description: 'Account credentials' })
  @ValidateNested()
  @Type(() => AccountCredentials)
  @IsOptional()
  credentials?: AccountCredentials;

  @ApiPropertyOptional({ description: 'Assigned proxy ID' })
  @IsUUID()
  @IsOptional()
  proxyId?: string;

  @ApiPropertyOptional({ description: 'Warming configuration' })
  @ValidateNested()
  @Type(() => WarmingConfig)
  @IsOptional()
  warmingConfig?: WarmingConfig;

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

// Update Account DTO
export class UpdateAccountDto {
  @ApiPropertyOptional({ description: 'Platform-specific user ID' })
  @IsString()
  @IsOptional()
  platformUserId?: string;

  @ApiPropertyOptional({ description: 'Account handle/username on the platform' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  handle?: string;

  @ApiPropertyOptional({ description: 'Display name' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Profile URL' })
  @IsUrl()
  @IsOptional()
  profileUrl?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Bio/description' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ description: 'Account status', enum: AccountStatus })
  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus;

  @ApiPropertyOptional({ description: 'Account credentials' })
  @ValidateNested()
  @Type(() => AccountCredentials)
  @IsOptional()
  credentials?: AccountCredentials;

  @ApiPropertyOptional({ description: 'Assigned proxy ID' })
  @IsUUID()
  @IsOptional()
  proxyId?: string;

  @ApiPropertyOptional({ description: 'Account metrics' })
  @ValidateNested()
  @Type(() => AccountMetrics)
  @IsOptional()
  metrics?: AccountMetrics;

  @ApiPropertyOptional({ description: 'Warming configuration' })
  @ValidateNested()
  @Type(() => WarmingConfig)
  @IsOptional()
  warmingConfig?: WarmingConfig;

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

// Account Response DTO
export class AccountResponseDto {
  @ApiProperty({ description: 'Account ID' })
  id: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Soul ID' })
  soulId: string;

  @ApiProperty({ description: 'Platform', enum: Platform })
  platform: Platform;

  @ApiPropertyOptional({ description: 'Platform-specific user ID' })
  platformUserId?: string;

  @ApiProperty({ description: 'Account handle' })
  handle: string;

  @ApiPropertyOptional({ description: 'Display name' })
  displayName?: string;

  @ApiPropertyOptional({ description: 'Profile URL' })
  profileUrl?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  avatarUrl?: string;

  @ApiProperty({ description: 'Account status', enum: AccountStatus })
  status: AccountStatus;

  @ApiPropertyOptional({ description: 'Assigned proxy ID' })
  proxyId?: string;

  @ApiPropertyOptional({ description: 'Account metrics' })
  metrics?: AccountMetrics;

  @ApiPropertyOptional({ description: 'Warming configuration' })
  warmingConfig?: WarmingConfig;

  @ApiPropertyOptional({ description: 'Last activity timestamp' })
  lastActivityAt?: Date;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  tags?: string[];

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}

// Account List Query DTO
export class AccountListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by platform', enum: Platform })
  @IsEnum(Platform)
  @IsOptional()
  platform?: Platform;

  @ApiPropertyOptional({ description: 'Filter by status', enum: AccountStatus })
  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus;

  @ApiPropertyOptional({ description: 'Filter by soul ID' })
  @IsUUID()
  @IsOptional()
  soulId?: string;

  @ApiPropertyOptional({ description: 'Filter by proxy ID' })
  @IsUUID()
  @IsOptional()
  proxyId?: string;

  @ApiPropertyOptional({ description: 'Search by handle or display name' })
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

// Bulk Import DTO
export class BulkImportAccountDto {
  @ApiProperty({ description: 'Soul ID for all imported accounts' })
  @IsUUID()
  soulId: string;

  @ApiProperty({ description: 'Platform for all imported accounts', enum: Platform })
  @IsEnum(Platform)
  platform: Platform;

  @ApiProperty({ description: 'CSV data with account information' })
  @IsString()
  csvData: string;
}

export class BulkImportResultDto {
  @ApiProperty({ description: 'Total rows processed' })
  total: number;

  @ApiProperty({ description: 'Successfully imported accounts' })
  success: number;

  @ApiProperty({ description: 'Failed imports' })
  failed: number;

  @ApiProperty({ description: 'Error details for failed rows' })
  errors: Array<{ row: number; error: string }>;

  @ApiProperty({ description: 'IDs of created accounts', type: [String] })
  createdIds: string[];
}
