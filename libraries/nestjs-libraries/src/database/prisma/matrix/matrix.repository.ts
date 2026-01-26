import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import {
  CreateMappingDto,
  UpdateMappingDto,
  BulkMappingOperationDto,
  BulkActionType,
} from '@gitroom/nestjs-libraries/dtos/matrix/matrix.dto';

@Injectable()
export class MatrixRepository {
  constructor(
    private _soulIntegrationMapping: PrismaRepository<'soulIntegrationMapping'>,
    private _integration: PrismaRepository<'integration'>
  ) {}

  /**
   * Find all mappings for an organization
   */
  async findAllMappings(organizationId: string) {
    return this._soulIntegrationMapping.model.soulIntegrationMapping.findMany({
      where: { organizationId },
      include: {
        integration: true,
      },
      orderBy: [{ soulId: 'asc' }, { priority: 'asc' }],
    });
  }

  /**
   * Find mappings for a specific soul
   */
  async findMappingsBySoul(soulId: string, organizationId: string) {
    return this._soulIntegrationMapping.model.soulIntegrationMapping.findMany({
      where: { soulId, organizationId },
      include: {
        integration: true,
      },
      orderBy: { priority: 'asc' },
    });
  }

  /**
   * Find mappings for a specific integration
   */
  async findMappingsByIntegration(integrationId: string, organizationId: string) {
    return this._soulIntegrationMapping.model.soulIntegrationMapping.findMany({
      where: { integrationId, organizationId },
      orderBy: { priority: 'asc' },
    });
  }

  /**
   * Find a specific mapping by soul and integration
   */
  async findMapping(soulId: string, integrationId: string) {
    return this._soulIntegrationMapping.model.soulIntegrationMapping.findUnique({
      where: {
        soulId_integrationId: { soulId, integrationId },
      },
    });
  }

  /**
   * Find a mapping by ID
   */
  async findMappingById(id: string) {
    return this._soulIntegrationMapping.model.soulIntegrationMapping.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new mapping
   */
  async createMapping(
    data: CreateMappingDto & { organizationId: string; createdBy?: string }
  ) {
    // If setting as primary, unset other primaries for this soul
    if (data.isPrimary) {
      await this._soulIntegrationMapping.model.soulIntegrationMapping.updateMany({
        where: { soulId: data.soulId, organizationId: data.organizationId },
        data: { isPrimary: false },
      });
    }

    return this._soulIntegrationMapping.model.soulIntegrationMapping.create({
      data: {
        soulId: data.soulId,
        integrationId: data.integrationId,
        organizationId: data.organizationId,
        isPrimary: data.isPrimary ?? false,
        priority: data.priority ?? 0,
        notes: data.notes,
        createdBy: data.createdBy,
      },
      include: {
        integration: true,
      },
    });
  }

  /**
   * Update a mapping
   */
  async updateMapping(id: string, data: UpdateMappingDto, organizationId: string) {
    const existing =
      await this._soulIntegrationMapping.model.soulIntegrationMapping.findUnique({
        where: { id },
      });

    if (!existing) {
      throw new Error('Mapping not found');
    }

    // If setting as primary, unset other primaries for this soul
    if (data.isPrimary) {
      await this._soulIntegrationMapping.model.soulIntegrationMapping.updateMany({
        where: {
          soulId: existing.soulId,
          organizationId,
          id: { not: id },
        },
        data: { isPrimary: false },
      });
    }

    return this._soulIntegrationMapping.model.soulIntegrationMapping.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a mapping by ID
   */
  async deleteMapping(id: string) {
    return this._soulIntegrationMapping.model.soulIntegrationMapping.delete({
      where: { id },
    });
  }

  /**
   * Delete a mapping by soul and integration
   */
  async deleteMappingBySoulAndIntegration(soulId: string, integrationId: string) {
    return this._soulIntegrationMapping.model.soulIntegrationMapping.delete({
      where: {
        soulId_integrationId: { soulId, integrationId },
      },
    });
  }

  /**
   * Perform bulk operations
   */
  async bulkOperations(
    operations: BulkMappingOperationDto[],
    organizationId: string,
    createdBy?: string
  ) {
    const results = {
      created: 0,
      deleted: 0,
      errors: [] as Array<{ operation: BulkMappingOperationDto; error: string }>,
    };

    for (const op of operations) {
      try {
        if (op.action === BulkActionType.CREATE) {
          // Check if mapping already exists
          const existing = await this.findMapping(op.soulId, op.integrationId);
          if (existing) {
            results.errors.push({
              operation: op,
              error: 'Mapping already exists',
            });
            continue;
          }

          await this.createMapping({
            soulId: op.soulId,
            integrationId: op.integrationId,
            organizationId,
            createdBy,
          });
          results.created++;
        } else if (op.action === BulkActionType.DELETE) {
          await this.deleteMappingBySoulAndIntegration(op.soulId, op.integrationId);
          results.deleted++;
        }
      } catch (error) {
        results.errors.push({
          operation: op,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Delete all mappings for a soul
   */
  async deleteMappingsBySoul(soulId: string, organizationId: string) {
    return this._soulIntegrationMapping.model.soulIntegrationMapping.deleteMany({
      where: { soulId, organizationId },
    });
  }

  /**
   * Get all integrations for an organization
   */
  async getIntegrationsForOrg(organizationId: string) {
    return this._integration.model.integration.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        providerIdentifier: true,
        picture: true,
        disabled: true,
        soulMappings: {
          select: {
            soulId: true,
          },
        },
      },
    });
  }

  /**
   * Get all active (non-disabled) integrations for an organization
   */
  async getActiveIntegrationsForOrg(organizationId: string) {
    return this._integration.model.integration.findMany({
      where: {
        organizationId,
        disabled: false,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        providerIdentifier: true,
        picture: true,
        disabled: true,
        soulMappings: {
          select: {
            soulId: true,
          },
        },
      },
    });
  }

  /**
   * Count mappings for an organization
   */
  async countMappings(organizationId: string) {
    return this._soulIntegrationMapping.model.soulIntegrationMapping.count({
      where: { organizationId },
    });
  }
}
