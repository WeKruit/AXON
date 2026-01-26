import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { SoulRepository } from './soul.repository';
import {
  Soul,
  CreateSoulDto,
  UpdateSoulDto,
  SoulListQueryDto,
  SoulResponseDto,
  SoulStatus,
} from '@gitroom/nestjs-libraries/dtos/axon';

@Injectable()
export class SoulService {
  constructor(private readonly soulRepository: SoulRepository) {}

  async create(organizationId: string, dto: CreateSoulDto): Promise<SoulResponseDto> {
    // Create soul with default status
    const soulData = {
      ...dto,
      status: SoulStatus.ACTIVE,
      accountIds: [],
    };

    const soul = await this.soulRepository.create(organizationId, soulData);
    return this.toResponseDto(soul);
  }

  async findById(organizationId: string, id: string): Promise<SoulResponseDto> {
    const soul = await this.soulRepository.findById(organizationId, id);
    if (!soul) {
      throw new NotFoundException('Soul not found');
    }
    return this.toResponseDto(soul);
  }

  async findAll(
    organizationId: string,
    query: SoulListQueryDto
  ): Promise<{ data: SoulResponseDto[]; hasMore: boolean }> {
    const result = await this.soulRepository.findAll(organizationId, query);
    return {
      data: result.data.map((soul) => this.toResponseDto(soul)),
      hasMore: result.hasMore,
    };
  }

  async update(organizationId: string, id: string, dto: UpdateSoulDto): Promise<SoulResponseDto> {
    // Check if soul exists
    const existing = await this.soulRepository.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundException('Soul not found');
    }

    // Check for email uniqueness if updating email
    if (dto.email && dto.email !== existing.email) {
      const existingByEmail = await this.soulRepository.findByEmail(organizationId, dto.email);
      if (existingByEmail && existingByEmail.id !== id) {
        throw new ConflictException('A soul with this email already exists');
      }
    }

    // Check for phone uniqueness if updating phone
    if (dto.phone && dto.phone !== existing.phone) {
      const existingByPhone = await this.soulRepository.findByPhone(organizationId, dto.phone);
      if (existingByPhone && existingByPhone.id !== id) {
        throw new ConflictException('A soul with this phone already exists');
      }
    }

    await this.soulRepository.update(organizationId, id, dto);
    return this.findById(organizationId, id);
  }

  async delete(organizationId: string, id: string): Promise<void> {
    const existing = await this.soulRepository.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundException('Soul not found');
    }

    // Check if soul has associated accounts
    if (existing.accountIds && existing.accountIds.length > 0) {
      throw new ConflictException(
        'Cannot delete soul with associated accounts. Remove all accounts first.'
      );
    }

    await this.soulRepository.delete(organizationId, id);
  }

  async addAccount(organizationId: string, soulId: string, accountId: string): Promise<void> {
    await this.soulRepository.addAccountId(organizationId, soulId, accountId);
  }

  async removeAccount(organizationId: string, soulId: string, accountId: string): Promise<void> {
    await this.soulRepository.removeAccountId(organizationId, soulId, accountId);
  }

  async getCount(organizationId: string): Promise<number> {
    return this.soulRepository.count(organizationId);
  }

  private toResponseDto(soul: Soul): SoulResponseDto {
    return {
      id: soul.id,
      organizationId: soul.organizationId,
      name: soul.name,
      description: soul.description,
      status: soul.status || SoulStatus.ACTIVE,
      personaId: soul.personaId,
      proxyId: soul.proxyId,
      accountIds: soul.accountIds || [],
      accountCount: (soul.accountIds || []).length,
      metadata: soul.metadata,
      createdAt: soul.createdAt instanceof Date ? soul.createdAt : new Date((soul.createdAt as any)._seconds * 1000),
      updatedAt: soul.updatedAt instanceof Date ? soul.updatedAt : new Date((soul.updatedAt as any)._seconds * 1000),
      // Legacy fields
      type: soul.type,
      email: soul.email,
      phone: soul.phone,
      displayName: soul.displayName,
      firstName: soul.firstName,
      lastName: soul.lastName,
    };
  }
}
