import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { AccountRepository } from './account.repository';
import { SoulRepository } from '../souls/soul.repository';
import { ProxyRepository } from '../proxies/proxy.repository';
import {
  Account,
  CreateAccountDto,
  UpdateAccountDto,
  AccountListQueryDto,
  AccountResponseDto,
  BulkImportAccountDto,
  BulkImportResultDto,
  AccountStatus,
  Platform,
} from '@gitroom/nestjs-libraries/dtos/axon';
import { AuthService } from '@gitroom/helpers/auth/auth.service';
import { MatrixRepository } from '@gitroom/nestjs-libraries/database/prisma/matrix/matrix.repository';

// Map from AXON providerIdentifier to AXON Platform enum
const PROVIDER_TO_PLATFORM: Record<string, Platform> = {
  twitter: Platform.TWITTER,
  x: Platform.TWITTER,
  instagram: Platform.INSTAGRAM,
  facebook: Platform.FACEBOOK,
  linkedin: Platform.LINKEDIN,
  tiktok: Platform.TIKTOK,
  youtube: Platform.YOUTUBE,
  reddit: Platform.REDDIT,
  pinterest: Platform.PINTEREST,
  threads: Platform.THREADS,
  bluesky: Platform.BLUESKY,
  mastodon: Platform.MASTODON,
};

@Injectable()
export class AccountService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly soulRepository: SoulRepository,
    private readonly proxyRepository: ProxyRepository,
    private readonly matrixRepository: MatrixRepository
  ) {}

  async create(organizationId: string, dto: CreateAccountDto): Promise<AccountResponseDto> {
    // Validate soul exists
    const soul = await this.soulRepository.findById(organizationId, dto.soulId);
    if (!soul) {
      throw new NotFoundException('Soul not found');
    }

    // Check for duplicate handle on same platform
    const existing = await this.accountRepository.findByHandle(organizationId, dto.platform, dto.handle);
    if (existing) {
      throw new ConflictException(`Account with handle '${dto.handle}' already exists on ${dto.platform}`);
    }

    // Validate proxy if provided
    if (dto.proxyId) {
      const proxy = await this.proxyRepository.findById(organizationId, dto.proxyId);
      if (!proxy) {
        throw new NotFoundException('Proxy not found');
      }
    }

    // Encrypt sensitive credentials
    const credentials = dto.credentials ? this.encryptCredentials(dto.credentials) : {};

    const account = await this.accountRepository.create(organizationId, {
      ...dto,
      credentials,
    });

    // Update soul's account list
    await this.soulRepository.addAccountId(organizationId, dto.soulId, account.id);

    // Update proxy's assigned accounts if proxy was assigned
    if (dto.proxyId) {
      await this.proxyRepository.assignAccount(organizationId, dto.proxyId, account.id);
    }

    return this.toResponseDto(account);
  }

  async findById(organizationId: string, id: string): Promise<AccountResponseDto> {
    const account = await this.accountRepository.findById(organizationId, id);
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return this.toResponseDto(account);
  }

  async findAll(
    organizationId: string,
    query: AccountListQueryDto
  ): Promise<{ data: AccountResponseDto[]; hasMore: boolean }> {
    const result = await this.accountRepository.findAll(organizationId, query);
    return {
      data: result.data.map((account) => this.toResponseDto(account)),
      hasMore: result.hasMore,
    };
  }

  async findBySoulId(organizationId: string, soulId: string): Promise<AccountResponseDto[]> {
    const accounts = await this.accountRepository.findBySoulId(organizationId, soulId);
    return accounts.map((account) => this.toResponseDto(account));
  }

  async update(organizationId: string, id: string, dto: UpdateAccountDto): Promise<AccountResponseDto> {
    const existing = await this.accountRepository.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundException('Account not found');
    }

    // Check for duplicate handle if changing
    if (dto.handle && dto.handle !== existing.handle) {
      const duplicate = await this.accountRepository.findByHandle(organizationId, existing.platform, dto.handle);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(`Account with handle '${dto.handle}' already exists on ${existing.platform}`);
      }
    }

    // Handle proxy changes
    if (dto.proxyId !== undefined && dto.proxyId !== existing.proxyId) {
      // Unassign from old proxy
      if (existing.proxyId) {
        await this.proxyRepository.unassignAccount(organizationId, existing.proxyId, id);
      }
      // Assign to new proxy
      if (dto.proxyId) {
        const proxy = await this.proxyRepository.findById(organizationId, dto.proxyId);
        if (!proxy) {
          throw new NotFoundException('Proxy not found');
        }
        await this.proxyRepository.assignAccount(organizationId, dto.proxyId, id);
      }
    }

    // Encrypt credentials if being updated
    const updateData = { ...dto };
    if (dto.credentials) {
      updateData.credentials = this.encryptCredentials(dto.credentials);
    }

    await this.accountRepository.update(organizationId, id, updateData);
    return this.findById(organizationId, id);
  }

  async delete(organizationId: string, id: string): Promise<void> {
    const existing = await this.accountRepository.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundException('Account not found');
    }

    // Remove from soul's account list
    await this.soulRepository.removeAccountId(organizationId, existing.soulId, id);

    // Unassign from proxy if assigned
    if (existing.proxyId) {
      await this.proxyRepository.unassignAccount(organizationId, existing.proxyId, id);
    }

    await this.accountRepository.delete(organizationId, id);
  }

  async updateStatus(organizationId: string, id: string, status: AccountStatus): Promise<AccountResponseDto> {
    const existing = await this.accountRepository.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundException('Account not found');
    }

    await this.accountRepository.updateStatus(organizationId, id, status);
    return this.findById(organizationId, id);
  }

  async assignProxy(organizationId: string, accountId: string, proxyId: string | null): Promise<AccountResponseDto> {
    const account = await this.accountRepository.findById(organizationId, accountId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Unassign from current proxy if exists
    if (account.proxyId) {
      await this.proxyRepository.unassignAccount(organizationId, account.proxyId, accountId);
    }

    // Assign to new proxy if provided
    if (proxyId) {
      const proxy = await this.proxyRepository.findById(organizationId, proxyId);
      if (!proxy) {
        throw new NotFoundException('Proxy not found');
      }
      await this.proxyRepository.assignAccount(organizationId, proxyId, accountId);
    }

    await this.accountRepository.assignProxy(organizationId, accountId, proxyId);
    return this.findById(organizationId, accountId);
  }

  async bulkImport(organizationId: string, dto: BulkImportAccountDto): Promise<BulkImportResultDto> {
    // Validate soul exists
    const soul = await this.soulRepository.findById(organizationId, dto.soulId);
    if (!soul) {
      throw new NotFoundException('Soul not found');
    }

    const result: BulkImportResultDto = {
      total: 0,
      success: 0,
      failed: 0,
      errors: [],
      createdIds: [],
    };

    // Parse CSV data
    const rows = this.parseCSV(dto.csvData);
    result.total = rows.length;

    const validAccounts: CreateAccountDto[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Validate required fields
        if (!row.handle) {
          throw new Error('Handle is required');
        }

        // Check for duplicate handle
        const existing = await this.accountRepository.findByHandle(organizationId, dto.platform, row.handle);
        if (existing) {
          throw new Error(`Account with handle '${row.handle}' already exists`);
        }

        const accountDto: CreateAccountDto = {
          soulId: dto.soulId,
          platform: dto.platform,
          handle: row.handle,
          displayName: row.displayName || row.handle,
          credentials: row.username && row.password ? {
            username: row.username,
            password: row.password,
          } : undefined,
          status: AccountStatus.ACTIVE,
          notes: row.notes,
        };

        validAccounts.push(accountDto);
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Batch create valid accounts
    if (validAccounts.length > 0) {
      // Encrypt credentials for all accounts
      const accountsWithEncryptedCreds = validAccounts.map((acc) => ({
        ...acc,
        credentials: acc.credentials ? this.encryptCredentials(acc.credentials) : undefined,
      }));

      const createdIds = await this.accountRepository.createBatch(organizationId, accountsWithEncryptedCreds);
      result.createdIds = createdIds;
      result.success = createdIds.length;

      // Update soul's account list
      for (const accountId of createdIds) {
        await this.soulRepository.addAccountId(organizationId, dto.soulId, accountId);
      }
    }

    return result;
  }

  async getCount(organizationId: string): Promise<number> {
    return this.accountRepository.count(organizationId);
  }

  async getCountByStatus(organizationId: string, status: AccountStatus): Promise<number> {
    return this.accountRepository.countByStatus(organizationId, status);
  }

  async getCountByPlatform(organizationId: string, platform: Platform): Promise<number> {
    return this.accountRepository.countByPlatform(organizationId, platform);
  }

  /**
   * Get all counts in parallel to avoid N+1 query problem
   */
  async getAllCounts(organizationId: string): Promise<{
    total: number;
    byStatus: Record<AccountStatus, number>;
    byPlatform: Record<Platform, number>;
  }> {
    const statusValues = Object.values(AccountStatus);
    const platformValues = Object.values(Platform);

    // Execute all count queries in parallel
    const [total, ...statusAndPlatformCounts] = await Promise.all([
      this.accountRepository.count(organizationId),
      ...statusValues.map((status) => this.accountRepository.countByStatus(organizationId, status)),
      ...platformValues.map((platform) => this.accountRepository.countByPlatform(organizationId, platform)),
    ]);

    // Build status counts object
    const byStatus = {} as Record<AccountStatus, number>;
    statusValues.forEach((status, index) => {
      byStatus[status] = statusAndPlatformCounts[index];
    });

    // Build platform counts object
    const byPlatform = {} as Record<Platform, number>;
    platformValues.forEach((platform, index) => {
      byPlatform[platform] = statusAndPlatformCounts[statusValues.length + index];
    });

    return { total, byStatus, byPlatform };
  }

  private encryptCredentials(credentials: any): any {
    const encrypted = { ...credentials };
    if (encrypted.password) {
      encrypted.password = AuthService.fixedEncryption(encrypted.password);
    }
    if (encrypted.accessToken) {
      encrypted.accessToken = AuthService.fixedEncryption(encrypted.accessToken);
    }
    if (encrypted.refreshToken) {
      encrypted.refreshToken = AuthService.fixedEncryption(encrypted.refreshToken);
    }
    if (encrypted.apiKey) {
      encrypted.apiKey = AuthService.fixedEncryption(encrypted.apiKey);
    }
    if (encrypted.apiSecret) {
      encrypted.apiSecret = AuthService.fixedEncryption(encrypted.apiSecret);
    }
    if (encrypted.twoFactorSecret) {
      encrypted.twoFactorSecret = AuthService.fixedEncryption(encrypted.twoFactorSecret);
    }
    return encrypted;
  }

  private parseCSV(csvData: string): Array<Record<string, string>> {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new BadRequestException('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const rows: Array<Record<string, string>> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length !== headers.length) {
        continue; // Skip malformed rows
      }

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index].trim();
      });
      rows.push(row);
    }

    return rows;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);

    return result;
  }

  private toResponseDto(account: Account): AccountResponseDto {
    return {
      id: account.id,
      organizationId: account.organizationId,
      soulId: account.soulId,
      platform: account.platform,
      platformUserId: account.platformUserId,
      handle: account.handle,
      displayName: account.displayName,
      profileUrl: account.profileUrl,
      avatarUrl: account.avatarUrl,
      status: account.status,
      proxyId: account.proxyId,
      integrationId: account.integrationId,
      metrics: account.metrics,
      warmingConfig: account.warmingConfig,
      lastActivityAt: account.lastActivityAt,
      tags: account.tags,
      createdAt: account.createdAt instanceof Date ? account.createdAt : new Date((account.createdAt as any)._seconds * 1000),
      updatedAt: account.updatedAt instanceof Date ? account.updatedAt : new Date((account.updatedAt as any)._seconds * 1000),
    };
  }

  /**
   * Link an account to an AXON integration.
   * Validates that the integration exists and matches the account's platform.
   */
  async linkToIntegration(
    organizationId: string,
    accountId: string,
    integrationId: string
  ): Promise<AccountResponseDto> {
    const account = await this.accountRepository.findById(organizationId, accountId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Validate the integration exists
    const integration = await this.matrixRepository.getIntegration(organizationId, integrationId);
    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    // Validate platform match
    const integrationPlatform = PROVIDER_TO_PLATFORM[integration.providerIdentifier.toLowerCase()];
    if (!integrationPlatform) {
      throw new BadRequestException(
        `Unknown integration platform: ${integration.providerIdentifier}`
      );
    }

    if (integrationPlatform !== account.platform) {
      throw new BadRequestException(
        `Platform mismatch: Account is ${account.platform} but integration is ${integration.providerIdentifier}`
      );
    }

    // Check if another account is already linked to this integration
    const existingLinked = await this.accountRepository.findByIntegrationId(organizationId, integrationId);
    if (existingLinked && existingLinked.id !== accountId) {
      throw new ConflictException(
        `Integration is already linked to account '${existingLinked.handle}'`
      );
    }

    // Link the account
    await this.accountRepository.linkIntegration(organizationId, accountId, integrationId);

    return this.findById(organizationId, accountId);
  }

  /**
   * Unlink an account from its AXON integration.
   */
  async unlinkFromIntegration(
    organizationId: string,
    accountId: string
  ): Promise<AccountResponseDto> {
    const account = await this.accountRepository.findById(organizationId, accountId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (!account.integrationId) {
      throw new BadRequestException('Account is not linked to any integration');
    }

    await this.accountRepository.unlinkIntegration(organizationId, accountId);

    return this.findById(organizationId, accountId);
  }

  /**
   * Auto-link an account to an integration by matching handle.
   * Used when creating a soul-integration mapping to automatically find the corresponding account.
   *
   * @param organizationId Organization ID
   * @param soulId Soul ID
   * @param integrationId Integration ID
   * @returns Account ID if found and linked, null otherwise
   */
  async autoLinkByHandle(
    organizationId: string,
    soulId: string,
    integrationId: string
  ): Promise<string | null> {
    // Get integration details to determine platform
    const integration = await this.matrixRepository.getIntegration(organizationId, integrationId);
    if (!integration) {
      return null;
    }

    const integrationPlatform = PROVIDER_TO_PLATFORM[integration.providerIdentifier.toLowerCase()];
    if (!integrationPlatform) {
      return null;
    }

    // Find accounts for this soul with matching platform
    const accounts = await this.accountRepository.findBySoulIdAndPlatform(
      organizationId,
      soulId,
      integrationPlatform
    );

    if (accounts.length === 0) {
      return null;
    }

    // Check if integration is already linked
    const existingLinked = await this.accountRepository.findByIntegrationId(organizationId, integrationId);
    if (existingLinked) {
      // Already linked, return existing account ID
      return existingLinked.id;
    }

    // Try to match by handle (integration name is often the handle)
    const integrationName = integration.name.toLowerCase().trim();

    // First try exact match
    let matchedAccount = accounts.find(
      (acc) => acc.handle.toLowerCase().trim() === integrationName && !acc.integrationId
    );

    // If no exact match, use first unlinked account for this platform
    if (!matchedAccount) {
      matchedAccount = accounts.find((acc) => !acc.integrationId);
    }

    if (matchedAccount) {
      await this.accountRepository.linkIntegration(organizationId, matchedAccount.id, integrationId);
      return matchedAccount.id;
    }

    return null;
  }

  /**
   * Find account by integration ID
   */
  async findByIntegrationId(organizationId: string, integrationId: string): Promise<AccountResponseDto | null> {
    const account = await this.accountRepository.findByIntegrationId(organizationId, integrationId);
    if (!account) {
      return null;
    }
    return this.toResponseDto(account);
  }
}
