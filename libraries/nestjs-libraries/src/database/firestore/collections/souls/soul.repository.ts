import { Injectable } from '@nestjs/common';
import { FirestoreService, FirestoreQueryOptions } from '../../firestore.service';
import { Soul, CreateSoulDto, UpdateSoulDto, SoulListQueryDto } from '@gitroom/nestjs-libraries/dtos/axon';

const COLLECTION = 'souls';

@Injectable()
export class SoulRepository {
  constructor(private readonly firestore: FirestoreService) {}

  async create(organizationId: string, dto: CreateSoulDto): Promise<Soul> {
    const data: Omit<Soul, 'id' | 'createdAt' | 'updatedAt'> = {
      organizationId,
      type: dto.type,
      email: dto.email,
      phone: dto.phone,
      displayName: dto.displayName,
      firstName: dto.firstName,
      lastName: dto.lastName,
      accountIds: [],
      personaId: dto.personaId,
      recoveryInfo: dto.recoveryInfo,
      metadata: dto.metadata,
      notes: dto.notes,
    };

    return this.firestore.create<Soul>(COLLECTION, data);
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
      throw new Error('Soul not found');
    }

    const updateData: Partial<Soul> = {};
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.displayName !== undefined) updateData.displayName = dto.displayName;
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.personaId !== undefined) updateData.personaId = dto.personaId;
    if (dto.recoveryInfo !== undefined) updateData.recoveryInfo = dto.recoveryInfo;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    await this.firestore.update<Soul>(COLLECTION, id, updateData);
  }

  async delete(organizationId: string, id: string): Promise<void> {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      throw new Error('Soul not found');
    }
    await this.firestore.softDelete(COLLECTION, id);
  }

  async addAccountId(organizationId: string, soulId: string, accountId: string): Promise<void> {
    const soul = await this.findById(organizationId, soulId);
    if (!soul) {
      throw new Error('Soul not found');
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
      throw new Error('Soul not found');
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
