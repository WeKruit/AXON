import { Injectable } from '@nestjs/common';
import { FirestoreService, FirestoreQueryOptions } from '../../firestore.service';
import {
  Proxy,
  CreateProxyDto,
  UpdateProxyDto,
  ProxyListQueryDto,
  ProxyStatus,
  ProxyPurpose,
} from '@gitroom/nestjs-libraries/dtos/axon';

const COLLECTION = 'proxies';

@Injectable()
export class ProxyRepository {
  constructor(private readonly firestore: FirestoreService) {}

  async create(organizationId: string, dto: CreateProxyDto): Promise<Proxy> {
    const data: Omit<Proxy, 'id' | 'createdAt' | 'updatedAt'> = {
      organizationId,
      name: dto.name,
      provider: dto.provider,
      type: dto.type,
      purposes: dto.purposes,
      status: dto.status || ProxyStatus.ACTIVE,
      credentials: dto.credentials,
      location: dto.location,
      rotationConfig: dto.rotationConfig,
      externalId: dto.externalId,
      expiresAt: dto.expiresAt,
      assignedAccountIds: [],
      notes: dto.notes,
      tags: dto.tags || [],
    };

    return this.firestore.create<Proxy>(COLLECTION, data);
  }

  async findById(organizationId: string, id: string): Promise<Proxy | null> {
    const proxy = await this.firestore.getById<Proxy>(COLLECTION, id);
    if (!proxy || proxy.organizationId !== organizationId || proxy.deletedAt) {
      return null;
    }
    return proxy;
  }

  async findByExternalId(organizationId: string, externalId: string): Promise<Proxy | null> {
    const results = await this.firestore.query<Proxy>(COLLECTION, {
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'externalId', operator: '==', value: externalId },
        { field: 'deletedAt', operator: '==', value: null },
      ],
      limit: 1,
    });
    return results[0] || null;
  }

  async findAll(organizationId: string, query: ProxyListQueryDto): Promise<{ data: Proxy[]; hasMore: boolean }> {
    const options: FirestoreQueryOptions = {
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'deletedAt', operator: '==', value: null },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: query.limit || 20,
    };

    if (query.provider) {
      options.where!.push({ field: 'provider', operator: '==', value: query.provider });
    }

    if (query.type) {
      options.where!.push({ field: 'type', operator: '==', value: query.type });
    }

    if (query.status) {
      options.where!.push({ field: 'status', operator: '==', value: query.status });
    }

    if (query.purpose) {
      options.where!.push({ field: 'purposes', operator: 'array-contains', value: query.purpose });
    }

    if (query.country) {
      options.where!.push({ field: 'location.country', operator: '==', value: query.country });
    }

    if (query.cursor) {
      const cursorDoc = await this.firestore.getById<Proxy>(COLLECTION, query.cursor);
      if (cursorDoc) {
        options.startAfter = cursorDoc.createdAt;
      }
    }

    const result = await this.firestore.queryPaginated<Proxy>(COLLECTION, options);
    return { data: result.data, hasMore: result.hasMore };
  }

  async findAvailableForPurpose(
    organizationId: string,
    purpose: ProxyPurpose,
    excludeAccountId?: string
  ): Promise<Proxy[]> {
    const options: FirestoreQueryOptions = {
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'purposes', operator: 'array-contains', value: purpose },
        { field: 'status', operator: '==', value: ProxyStatus.ACTIVE },
        { field: 'deletedAt', operator: '==', value: null },
      ],
      orderBy: [{ field: 'createdAt', direction: 'asc' }],
    };

    const proxies = await this.firestore.query<Proxy>(COLLECTION, options);

    // Filter out proxies that are at capacity or have the excluded account
    return proxies.filter((proxy) => {
      const assignedCount = (proxy.assignedAccountIds || []).length;
      const hasExcludedAccount = excludeAccountId && proxy.assignedAccountIds?.includes(excludeAccountId);
      // Arbitrary limit of 10 accounts per proxy - can be made configurable
      return assignedCount < 10 && !hasExcludedAccount;
    });
  }

  async update(organizationId: string, id: string, dto: UpdateProxyDto): Promise<void> {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      throw new Error('Proxy not found');
    }

    const updateData: Partial<Proxy> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.purposes !== undefined) updateData.purposes = dto.purposes;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.credentials !== undefined) updateData.credentials = dto.credentials;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.metrics !== undefined) updateData.metrics = dto.metrics;
    if (dto.rotationConfig !== undefined) updateData.rotationConfig = dto.rotationConfig;
    if (dto.expiresAt !== undefined) updateData.expiresAt = dto.expiresAt;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.tags !== undefined) updateData.tags = dto.tags;

    await this.firestore.update<Proxy>(COLLECTION, id, updateData);
  }

  async delete(organizationId: string, id: string): Promise<void> {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      throw new Error('Proxy not found');
    }
    await this.firestore.softDelete(COLLECTION, id);
  }

  async assignAccount(organizationId: string, proxyId: string, accountId: string): Promise<void> {
    const proxy = await this.findById(organizationId, proxyId);
    if (!proxy) {
      throw new Error('Proxy not found');
    }

    const assignedAccountIds = proxy.assignedAccountIds || [];
    if (!assignedAccountIds.includes(accountId)) {
      assignedAccountIds.push(accountId);
      await this.firestore.update<Proxy>(COLLECTION, proxyId, { assignedAccountIds });
    }
  }

  async unassignAccount(organizationId: string, proxyId: string, accountId: string): Promise<void> {
    const proxy = await this.findById(organizationId, proxyId);
    if (!proxy) {
      throw new Error('Proxy not found');
    }

    const assignedAccountIds = (proxy.assignedAccountIds || []).filter((id) => id !== accountId);
    await this.firestore.update<Proxy>(COLLECTION, proxyId, { assignedAccountIds });
  }

  async updateStatus(organizationId: string, id: string, status: ProxyStatus): Promise<void> {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      throw new Error('Proxy not found');
    }
    await this.firestore.update<Proxy>(COLLECTION, id, { status });
  }

  async count(organizationId: string): Promise<number> {
    return this.firestore.count(COLLECTION, {
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'deletedAt', operator: '==', value: null },
      ],
    });
  }

  async countByStatus(organizationId: string, status: ProxyStatus): Promise<number> {
    return this.firestore.count(COLLECTION, {
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'status', operator: '==', value: status },
        { field: 'deletedAt', operator: '==', value: null },
      ],
    });
  }
}
