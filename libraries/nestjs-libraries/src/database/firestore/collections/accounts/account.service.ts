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

@Injectable()
export class AccountService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly soulRepository: SoulRepository,
    private readonly proxyRepository: ProxyRepository
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
      metrics: account.metrics,
      warmingConfig: account.warmingConfig,
      lastActivityAt: account.lastActivityAt,
      tags: account.tags,
      createdAt: account.createdAt instanceof Date ? account.createdAt : new Date((account.createdAt as any)._seconds * 1000),
      updatedAt: account.updatedAt instanceof Date ? account.updatedAt : new Date((account.updatedAt as any)._seconds * 1000),
    };
  }
}
