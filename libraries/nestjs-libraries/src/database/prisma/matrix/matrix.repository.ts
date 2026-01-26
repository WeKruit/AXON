import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { SoulIntegrationMapping, Prisma } from '@prisma/client';
import {
  CreateMappingDto,
  UpdateMappingDto,
  MatrixFiltersDto,
  BulkMappingItem,
} from '@gitroom/nestjs-libraries/dtos/axon';

// Type for mapping with integration
export type MappingWithIntegration = SoulIntegrationMapping & {
  integration?: {
    id: string;
    name: string;
    picture: string | null;
    providerIdentifier: string;
    type: string;
    disabled: boolean;
  };
};

@Injectable()
export class MatrixRepository {
  constructor(
    private _soulIntegrationMapping: PrismaRepository<'soulIntegrationMapping'>,
    private _integration: PrismaRepository<'integration'>
  ) {}

  /**
   * Find all mappings for an organization with optional filters
   */
  async findAll(
    organizationId: string,
    filters: MatrixFiltersDto
  ): Promise<{ mappings: MappingWithIntegration[]; total: number }> {
    const where: Prisma.SoulIntegrationMappingWhereInput = {
      organizationId,
      ...(filters.soulId && { soulId: filters.soulId }),
      ...(filters.integrationId && { integrationId: filters.integrationId }),
      ...(filters.isPrimary !== undefined && { isPrimary: filters.isPrimary }),
    };

    const [mappings, total] = await Promise.all([
      this._soulIntegrationMapping.model.soulIntegrationMapping.findMany({
        where,
        include: {
          integration: {
            select: {
              id: true,
              name: true,
              picture: true,
              providerIdentifier: true,
              type: true,
              disabled: true,
            },
          },
        },
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this._soulIntegrationMapping.model.soulIntegrationMapping.count({ where }),
    ]);

    return { mappings, total };
  }

  /**
   * Find all mappings for a specific Soul
   */
  async findBySoulId(
    organizationId: string,
    soulId: string
  ): Promise<MappingWithIntegration[]> {
    return this._soulIntegrationMapping.model.soulIntegrationMapping.findMany({
      where: {
        organizationId,
        soulId,
      },
      include: {
        integration: {
          select: {
            id: true,
            name: true,
            picture: true,
            providerIdentifier: true,
            type: true,
            disabled: true,
          },
        },
      },
      orderBy: [{ isPrimary: 'desc' }, { priority: 'asc' }],
    });
  }

  /**
   * Find all mappings for a specific Integration
   */
  async findByIntegrationId(
    organizationId: string,
    integrationId: string
  ): Promise<SoulIntegrationMapping[]> {
    return this._soulIntegrationMapping.model.soulIntegrationMapping.findMany({
      where: {
        organizationId,
        integrationId,
      },
      orderBy: [{ isPrimary: 'desc' }, { priority: 'asc' }],
    });
  }

  /**
   * Create a new mapping
   */
  async create(
    organizationId: string,
    dto: CreateMappingDto,
    createdBy?: string
  ): Promise<SoulIntegrationMapping> {
    return this._soulIntegrationMapping.model.soulIntegrationMapping.create({
      data: {
        organizationId,
        soulId: dto.soulId,
        integrationId: dto.integrationId,
        isPrimary: dto.isPrimary ?? false,
        priority: dto.priority ?? 0,
        notes: dto.notes,
        createdBy,
      },
    });
  }

  /**
   * Find an existing mapping by soul and integration
   */
  async findExisting(
    organizationId: string,
    soulId: string,
    integrationId: string
  ): Promise<SoulIntegrationMapping | null> {
    return this._soulIntegrationMapping.model.soulIntegrationMapping.findFirst({
      where: {
        organizationId,
        soulId,
        integrationId,
      },
    });
  }

  /**
   * Find a mapping by ID
   */
  async findById(
    organizationId: string,
    id: string
  ): Promise<MappingWithIntegration | null> {
    return this._soulIntegrationMapping.model.soulIntegrationMapping.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        integration: {
          select: {
            id: true,
            name: true,
            picture: true,
            providerIdentifier: true,
            type: true,
            disabled: true,
          },
        },
      },
    });
  }

  /**
   * Update an existing mapping
   */
  async update(
    organizationId: string,
    id: string,
    dto: UpdateMappingDto
  ): Promise<SoulIntegrationMapping> {
    return this._soulIntegrationMapping.model.soulIntegrationMapping.update({
      where: {
        id,
        organizationId,
      },
      data: {
        ...(dto.isPrimary !== undefined && { isPrimary: dto.isPrimary }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  /**
   * Delete a mapping by ID
   */
  async delete(organizationId: string, id: string): Promise<void> {
    await this._soulIntegrationMapping.model.soulIntegrationMapping.delete({
      where: {
        id,
        organizationId,
      },
    });
  }

  /**
   * Delete a mapping by soul and integration pair
   */
  async deleteByPair(
    organizationId: string,
    soulId: string,
    integrationId: string
  ): Promise<void> {
    await this._soulIntegrationMapping.model.soulIntegrationMapping.deleteMany({
      where: {
        organizationId,
        soulId,
        integrationId,
      },
    });
  }

  /**
   * Bulk create mappings
   */
  async bulkCreate(
    organizationId: string,
    items: BulkMappingItem[],
    createdBy?: string
  ): Promise<{ succeeded: number; failed: number; createdIds: string[]; errors: Array<{ soulId: string; integrationId: string; error: string }> }> {
    const result = {
      succeeded: 0,
      failed: 0,
      createdIds: [] as string[],
      errors: [] as Array<{ soulId: string; integrationId: string; error: string }>,
    };

    for (const item of items) {
      try {
        const created = await this._soulIntegrationMapping.model.soulIntegrationMapping.create({
          data: {
            organizationId,
            soulId: item.soulId,
            integrationId: item.integrationId,
            priority: item.priority ?? 0,
            notes: item.notes,
            createdBy,
          },
        });
        result.succeeded++;
        result.createdIds.push(created.id);
      } catch (error) {
        result.failed++;
        result.errors.push({
          soulId: item.soulId,
          integrationId: item.integrationId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Bulk delete mappings
   */
  async bulkDelete(
    organizationId: string,
    items: Array<{ soulId: string; integrationId: string }>
  ): Promise<{ succeeded: number; failed: number; errors: Array<{ soulId: string; integrationId: string; error: string }> }> {
    const result = {
      succeeded: 0,
      failed: 0,
      errors: [] as Array<{ soulId: string; integrationId: string; error: string }>,
    };

    for (const item of items) {
      try {
        const deleted = await this._soulIntegrationMapping.model.soulIntegrationMapping.deleteMany({
          where: {
            organizationId,
            soulId: item.soulId,
            integrationId: item.integrationId,
          },
        });
        if (deleted.count > 0) {
          result.succeeded++;
        } else {
          result.failed++;
          result.errors.push({
            soulId: item.soulId,
            integrationId: item.integrationId,
            error: 'Mapping not found',
          });
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          soulId: item.soulId,
          integrationId: item.integrationId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Set a mapping as primary (and unset all other primaries for the same soul)
   */
  async setPrimary(
    organizationId: string,
    id: string
  ): Promise<SoulIntegrationMapping> {
    // First get the mapping to find the soulId
    const mapping = await this._soulIntegrationMapping.model.soulIntegrationMapping.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!mapping) {
      throw new Error('Mapping not found');
    }

    // Unset all other primaries for this soul
    await this._soulIntegrationMapping.model.soulIntegrationMapping.updateMany({
      where: {
        organizationId,
        soulId: mapping.soulId,
        id: {
          not: id,
        },
      },
      data: {
        isPrimary: false,
      },
    });

    // Set this mapping as primary
    return this._soulIntegrationMapping.model.soulIntegrationMapping.update({
      where: {
        id,
        organizationId,
      },
      data: {
        isPrimary: true,
      },
    });
  }

  /**
   * Get the full matrix view (souls grouped with their integrations)
   */
  async getMatrix(organizationId: string): Promise<Map<string, MappingWithIntegration[]>> {
    const mappings = await this._soulIntegrationMapping.model.soulIntegrationMapping.findMany({
      where: {
        organizationId,
      },
      include: {
        integration: {
          select: {
            id: true,
            name: true,
            picture: true,
            providerIdentifier: true,
            type: true,
            disabled: true,
          },
        },
      },
      orderBy: [{ soulId: 'asc' }, { isPrimary: 'desc' }, { priority: 'asc' }],
    });

    // Group by soulId
    const matrix = new Map<string, MappingWithIntegration[]>();
    for (const mapping of mappings) {
      const existing = matrix.get(mapping.soulId) || [];
      existing.push(mapping);
      matrix.set(mapping.soulId, existing);
    }

    return matrix;
  }

  /**
   * Check if an integration exists in the organization
   */
  async integrationExists(
    organizationId: string,
    integrationId: string
  ): Promise<boolean> {
    const integration = await this._integration.model.integration.findFirst({
      where: {
        id: integrationId,
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });
    return !!integration;
  }

  /**
   * Get integration details
   */
  async getIntegration(
    organizationId: string,
    integrationId: string
  ): Promise<{
    id: string;
    name: string;
    picture: string | null;
    providerIdentifier: string;
    type: string;
    disabled: boolean;
  } | null> {
    return this._integration.model.integration.findFirst({
      where: {
        id: integrationId,
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        picture: true,
        providerIdentifier: true,
        type: true,
        disabled: true,
      },
    });
  }

  /**
   * Count mappings for a soul
   */
  async countBySoulId(organizationId: string, soulId: string): Promise<number> {
    return this._soulIntegrationMapping.model.soulIntegrationMapping.count({
      where: {
        organizationId,
        soulId,
      },
    });
  }

  /**
   * Count mappings for an integration
   */
  async countByIntegrationId(
    organizationId: string,
    integrationId: string
  ): Promise<number> {
    return this._soulIntegrationMapping.model.soulIntegrationMapping.count({
      where: {
        organizationId,
        integrationId,
      },
    });
  }

  /**
   * Get all integrations for an organization (for matrix view)
   */
  async getAllIntegrations(
    organizationId: string
  ): Promise<Array<{
    id: string;
    name: string;
    picture: string | null;
    providerIdentifier: string;
    type: string;
    disabled: boolean;
  }>> {
    return this._integration.model.integration.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        picture: true,
        providerIdentifier: true,
        type: true,
        disabled: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get all mappings for an organization (without pagination, for matrix view)
   */
  async getAllMappings(
    organizationId: string
  ): Promise<MappingWithIntegration[]> {
    return this._soulIntegrationMapping.model.soulIntegrationMapping.findMany({
      where: {
        organizationId,
      },
      include: {
        integration: {
          select: {
            id: true,
            name: true,
            picture: true,
            providerIdentifier: true,
            type: true,
            disabled: true,
          },
        },
      },
      orderBy: [{ soulId: 'asc' }, { isPrimary: 'desc' }, { priority: 'asc' }],
    });
  }
}
