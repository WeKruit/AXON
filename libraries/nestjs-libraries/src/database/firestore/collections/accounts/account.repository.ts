import { Injectable, NotFoundException } from '@nestjs/common';
import { FirestoreService, FirestoreQueryOptions } from '../../firestore.service';
import {
  Account,
  CreateAccountDto,
  UpdateAccountDto,
  AccountListQueryDto,
  AccountStatus,
  Platform,
} from '@gitroom/nestjs-libraries/dtos/axon';

const COLLECTION = 'accounts';

@Injectable()
export class AccountRepository {
  constructor(private readonly firestore: FirestoreService) {}

  async create(organizationId: string, dto: CreateAccountDto): Promise<Account> {
    const data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'> = {
      organizationId,
      soulId: dto.soulId,
      platform: dto.platform,
      platformUserId: dto.platformUserId,
      handle: dto.handle,
      displayName: dto.displayName,
      profileUrl: dto.profileUrl,
      avatarUrl: dto.avatarUrl,
      bio: dto.bio,
      status: dto.status || AccountStatus.ACTIVE,
      credentials: dto.credentials || {},
      proxyId: dto.proxyId,
      warmingConfig: dto.warmingConfig,
      notes: dto.notes,
      tags: dto.tags || [],
    };

    return this.firestore.create<Account>(COLLECTION, data);
  }

  async createBatch(organizationId: string, accounts: CreateAccountDto[]): Promise<string[]> {
    const ids: string[] = [];
    const operations = accounts.map((dto) => {
      const id = this.firestore.generateId(COLLECTION);
      ids.push(id);
      return {
        type: 'create' as const,
        id,
        data: {
          organizationId,
          soulId: dto.soulId,
          platform: dto.platform,
          platformUserId: dto.platformUserId,
          handle: dto.handle,
          displayName: dto.displayName,
          profileUrl: dto.profileUrl,
          avatarUrl: dto.avatarUrl,
          bio: dto.bio,
          status: dto.status || AccountStatus.ACTIVE,
          credentials: dto.credentials || {},
          proxyId: dto.proxyId,
          warmingConfig: dto.warmingConfig,
          notes: dto.notes,
          tags: dto.tags || [],
        },
      };
    });

    await this.firestore.batchWrite<Account>(COLLECTION, operations);
    return ids;
  }

  async findById(organizationId: string, id: string): Promise<Account | null> {
    const account = await this.firestore.getById<Account>(COLLECTION, id);
    if (!account || account.organizationId !== organizationId || account.deletedAt) {
      return null;
    }
    return account;
  }

  async findByHandle(organizationId: string, platform: Platform, handle: string): Promise<Account | null> {
    const results = await this.firestore.query<Account>(COLLECTION, {
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'platform', operator: '==', value: platform },
        { field: 'handle', operator: '==', value: handle },
        { field: 'deletedAt', operator: '==', value: null },
      ],
      limit: 1,
    });
    return results[0] || null;
  }

  async findBySoulId(organizationId: string, soulId: string): Promise<Account[]> {
    return this.firestore.query<Account>(COLLECTION, {
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'soulId', operator: '==', value: soulId },
        { field: 'deletedAt', operator: '==', value: null },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  async findByProxyId(organizationId: string, proxyId: string): Promise<Account[]> {
    return this.firestore.query<Account>(COLLECTION, {
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'proxyId', operator: '==', value: proxyId },
        { field: 'deletedAt', operator: '==', value: null },
      ],
    });
  }

  async findAll(organizationId: string, query: AccountListQueryDto): Promise<{ data: Account[]; hasMore: boolean }> {
    const options: FirestoreQueryOptions = {
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'deletedAt', operator: '==', value: null },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: query.limit || 20,
    };

    if (query.platform) {
      options.where!.push({ field: 'platform', operator: '==', value: query.platform });
    }

    if (query.status) {
      options.where!.push({ field: 'status', operator: '==', value: query.status });
    }

    if (query.soulId) {
      options.where!.push({ field: 'soulId', operator: '==', value: query.soulId });
    }

    if (query.proxyId) {
      options.where!.push({ field: 'proxyId', operator: '==', value: query.proxyId });
    }

    if (query.cursor) {
      const cursorDoc = await this.firestore.getById<Account>(COLLECTION, query.cursor);
      if (cursorDoc) {
        options.startAfter = cursorDoc.createdAt;
      }
    }

    const result = await this.firestore.queryPaginated<Account>(COLLECTION, options);
    return { data: result.data, hasMore: result.hasMore };
  }

  async update(organizationId: string, id: string, dto: UpdateAccountDto): Promise<void> {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundException('Account not found');
    }

    const updateData: Partial<Account> = {};
    if (dto.platformUserId !== undefined) updateData.platformUserId = dto.platformUserId;
    if (dto.handle !== undefined) updateData.handle = dto.handle;
    if (dto.displayName !== undefined) updateData.displayName = dto.displayName;
    if (dto.profileUrl !== undefined) updateData.profileUrl = dto.profileUrl;
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl;
    if (dto.bio !== undefined) updateData.bio = dto.bio;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.credentials !== undefined) updateData.credentials = dto.credentials;
    if (dto.proxyId !== undefined) updateData.proxyId = dto.proxyId;
    if (dto.metrics !== undefined) updateData.metrics = dto.metrics;
    if (dto.warmingConfig !== undefined) updateData.warmingConfig = dto.warmingConfig;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.tags !== undefined) updateData.tags = dto.tags;

    await this.firestore.update<Account>(COLLECTION, id, updateData);
  }

  async delete(organizationId: string, id: string): Promise<void> {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundException('Account not found');
    }
    await this.firestore.softDelete(COLLECTION, id);
  }

  async updateStatus(organizationId: string, id: string, status: AccountStatus): Promise<void> {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundException('Account not found');
    }
    await this.firestore.update<Account>(COLLECTION, id, { status });
  }

  async updateLastActivity(organizationId: string, id: string): Promise<void> {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundException('Account not found');
    }
    await this.firestore.update<Account>(COLLECTION, id, { lastActivityAt: new Date() });
  }

  async assignProxy(organizationId: string, accountId: string, proxyId: string | null): Promise<void> {
    const existing = await this.findById(organizationId, accountId);
    if (!existing) {
      throw new NotFoundException('Account not found');
    }
    await this.firestore.update<Account>(COLLECTION, accountId, { proxyId: proxyId || undefined });
  }

  async count(organizationId: string): Promise<number> {
    return this.firestore.count(COLLECTION, {
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'deletedAt', operator: '==', value: null },
      ],
    });
  }

  async countByStatus(organizationId: string, status: AccountStatus): Promise<number> {
    return this.firestore.count(COLLECTION, {
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'status', operator: '==', value: status },
        { field: 'deletedAt', operator: '==', value: null },
      ],
    });
  }

  async countByPlatform(organizationId: string, platform: Platform): Promise<number> {
    return this.firestore.count(COLLECTION, {
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'platform', operator: '==', value: platform },
        { field: 'deletedAt', operator: '==', value: null },
      ],
    });
  }

  async countBySoulId(organizationId: string, soulId: string): Promise<number> {
    return this.firestore.count(COLLECTION, {
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'soulId', operator: '==', value: soulId },
        { field: 'deletedAt', operator: '==', value: null },
      ],
    });
  }
}
