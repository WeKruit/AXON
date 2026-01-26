import { Injectable, NotFoundException } from '@nestjs/common';
import { FirestoreService, FirestoreQueryOptions } from '../../firestore.service';
import { Soul, CreateSoulDto, UpdateSoulDto, SoulListQueryDto, SoulStatus } from '@gitroom/nestjs-libraries/dtos/axon';

const COLLECTION = 'souls';

@Injectable()
export class SoulRepository {
  constructor(private readonly firestore: FirestoreService) {}

  async create(organizationId: string, dto: CreateSoulDto & { status?: SoulStatus; accountIds?: string[] }): Promise<Soul> {
    // Build data object, filtering out undefined values (Firestore doesn't accept undefined)
    const data: Record<string, unknown> = {
      organizationId,
      name: dto.name,
      status: dto.status || SoulStatus.ACTIVE,
      accountIds: dto.accountIds || [],
      deletedAt: null, // Explicitly set to null so queries for deletedAt == null work
    };

    // Only add optional fields if they have values
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.personaId !== undefined) data.personaId = dto.personaId;
    if (dto.proxyId !== undefined) data.proxyId = dto.proxyId;
    if (dto.metadata !== undefined) data.metadata = dto.metadata;
    // Legacy fields
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.displayName !== undefined) data.displayName = dto.displayName;
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.recoveryInfo !== undefined) data.recoveryInfo = dto.recoveryInfo;
    if (dto.notes !== undefined) data.notes = dto.notes;

    return this.firestore.create<Soul>(COLLECTION, data as Omit<Soul, 'id' | 'createdAt' | 'updatedAt'>);
  }

  async findById(organizationId: string, id: string): Promise<Soul | null> {
    const soul = await this.firestore.getById<Soul>(COLLECTION, id);
    if (!soul || soul.organizationId !== organizationId || soul.deletedAt) {
      return null;
    }
    return soul;
  }

  async findByEmail(organizationId: string, email: string): Promise<Soul | null> {
    const results = await this.firestore.query<Soul>(COLLECTION, {
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'email', operator: '==', value: email },
        { field: 'deletedAt', operator: '==', value: null },
      ],
      limit: 1,
    });
    return results[0] || null;
  }

  async findByPhone(organizationId: string, phone: string): Promise<Soul | null> {
    const results = await this.firestore.query<Soul>(COLLECTION, {
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'phone', operator: '==', value: phone },
        { field: 'deletedAt', operator: '==', value: null },
      ],
      limit: 1,
    });
    return results[0] || null;
  }

  async findAll(organizationId: string, query: SoulListQueryDto): Promise<{ data: Soul[]; hasMore: boolean }> {
    const options: FirestoreQueryOptions = {
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'deletedAt', operator: '==', value: null },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: query.limit || 20,
    };

    if (query.type) {
      options.where!.push({ field: 'type', operator: '==', value: query.type });
    }

    if (query.personaId) {
      options.where!.push({ field: 'personaId', operator: '==', value: query.personaId });
    }

    if (query.cursor) {
      const cursorDoc = await this.firestore.getById<Soul>(COLLECTION, query.cursor);
      if (cursorDoc) {
        options.startAfter = cursorDoc.createdAt;
      }
    }

    const result = await this.firestore.queryPaginated<Soul>(COLLECTION, options);
    return { data: result.data, hasMore: result.hasMore };
  }

  async update(organizationId: string, id: string, dto: UpdateSoulDto): Promise<void> {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundException('Soul not found');
    }

    const updateData: Partial<Soul> = {};
    // New fields
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.personaId !== undefined) updateData.personaId = dto.personaId;
    if (dto.proxyId !== undefined) updateData.proxyId = dto.proxyId;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata;
    // Legacy fields
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.displayName !== undefined) updateData.displayName = dto.displayName;
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.recoveryInfo !== undefined) updateData.recoveryInfo = dto.recoveryInfo;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    await this.firestore.update<Soul>(COLLECTION, id, updateData);
  }

  async delete(organizationId: string, id: string): Promise<void> {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundException('Soul not found');
    }
    await this.firestore.softDelete(COLLECTION, id);
  }

  async addAccountId(organizationId: string, soulId: string, accountId: string): Promise<void> {
    const soul = await this.findById(organizationId, soulId);
    if (!soul) {
      throw new NotFoundException('Soul not found');
    }

    const accountIds = soul.accountIds || [];
    if (!accountIds.includes(accountId)) {
      accountIds.push(accountId);
      await this.firestore.update<Soul>(COLLECTION, soulId, { accountIds });
    }
  }

  async removeAccountId(organizationId: string, soulId: string, accountId: string): Promise<void> {
    const soul = await this.findById(organizationId, soulId);
    if (!soul) {
      throw new NotFoundException('Soul not found');
    }

    const accountIds = (soul.accountIds || []).filter((id) => id !== accountId);
    await this.firestore.update<Soul>(COLLECTION, soulId, { accountIds });
  }

  async count(organizationId: string): Promise<number> {
    return this.firestore.count(COLLECTION, {
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'deletedAt', operator: '==', value: null },
      ],
    });
  }

  async countByPersona(organizationId: string, personaId: string): Promise<number> {
    return this.firestore.count(COLLECTION, {
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'personaId', operator: '==', value: personaId },
        { field: 'deletedAt', operator: '==', value: null },
      ],
    });
  }
}
