import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { MatrixRepository, MappingWithIntegration } from './matrix.repository';
import { SoulRepository } from '@gitroom/nestjs-libraries/database/firestore/collections/souls/soul.repository';
import {
  CreateMappingDto,
  UpdateMappingDto,
  ToggleMappingDto,
  BulkMappingDto,
  MatrixFiltersDto,
  MappingResponseDto,
  SoulWithIntegrationsDto,
  IntegrationWithSoulsDto,
  MatrixResponseDto,
  BulkOperationResultDto,
  BulkOperationType,
  MatrixSoulDto,
  MatrixIntegrationDto,
} from '@gitroom/nestjs-libraries/dtos/axon';

@Injectable()
export class MatrixService {
  constructor(
    private readonly matrixRepository: MatrixRepository,
    private readonly soulRepository: SoulRepository
  ) {}

  /**
   * Get the full matrix with souls, integrations, and mappings
   */
  async getMatrix(
    organizationId: string,
    filters: MatrixFiltersDto
  ): Promise<MatrixResponseDto> {
    // Use filters.limit or a reasonable default (100 for matrix view)
    const soulsLimit = filters.limit || 100;

    // Fetch all data in parallel for efficiency
    const [soulsResult, integrations, mappings] = await Promise.all([
      this.soulRepository.findAll(organizationId, { limit: soulsLimit }),
      this.matrixRepository.getAllIntegrations(organizationId),
      this.matrixRepository.getAllMappingsLean(organizationId), // Use lean version without integration data
    ]);

    // Build a map of soulId -> integrationIds from mappings
    const soulIntegrationMap = new Map<string, string[]>();
    for (const mapping of mappings) {
      const existing = soulIntegrationMap.get(mapping.soulId) || [];
      existing.push(mapping.integrationId);
      soulIntegrationMap.set(mapping.soulId, existing);
    }

    // Transform souls to MatrixSoulDto
    const souls: MatrixSoulDto[] = soulsResult.data.map((soul) => ({
      id: soul.id,
      name: soul.displayName || soul.email || `Soul ${soul.id.slice(0, 8)}`,
      email: soul.email,
      integrationIds: soulIntegrationMap.get(soul.id) || [],
    }));

    // Transform integrations to MatrixIntegrationDto
    const matrixIntegrations: MatrixIntegrationDto[] = integrations.map((int) => ({
      id: int.id,
      name: int.name,
      platform: int.providerIdentifier,
      picture: int.picture ?? undefined,
      disabled: int.disabled,
    }));

    return {
      souls,
      integrations: matrixIntegrations,
      // Use lean mapping data (no integration details - they're in the integrations array)
      mappings: mappings.map((m) => ({
        id: m.id,
        soulId: m.soulId,
        integrationId: m.integrationId,
        organizationId: m.organizationId,
        isPrimary: m.isPrimary,
        priority: m.priority,
        notes: m.notes ?? undefined,
        createdBy: m.createdBy ?? undefined,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      })),
      stats: {
        totalSouls: souls.length,
        totalIntegrations: integrations.length,
        totalMappings: mappings.length,
      },
    };
  }

  /**
   * Get all integrations mapped to a specific Soul
   */
  async getIntegrationsForSoul(
    organizationId: string,
    soulId: string
  ): Promise<SoulWithIntegrationsDto> {
    // Validate soul exists
    await this.validateSoulExists(organizationId, soulId);

    const mappings = await this.matrixRepository.findBySoulId(
      organizationId,
      soulId
    );

    return {
      soulId,
      mappings: mappings.map((m) => this.toMappingResponseDto(m)),
      totalIntegrations: mappings.length,
    };
  }

  /**
   * Get all Souls mapped to a specific Integration
   */
  async getSoulsForIntegration(
    organizationId: string,
    integrationId: string
  ): Promise<IntegrationWithSoulsDto> {
    // Validate integration exists
    const integration = await this.matrixRepository.getIntegration(
      organizationId,
      integrationId
    );

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    const mappings = await this.matrixRepository.findByIntegrationId(
      organizationId,
      integrationId
    );

    return {
      integrationId,
      integration,
      mappings: mappings.map((m) => this.toMappingResponseDto(m)),
      totalSouls: mappings.length,
    };
  }

  /**
   * Create a new Soul-Integration mapping
   */
  async createMapping(
    organizationId: string,
    dto: CreateMappingDto,
    userId?: string
  ): Promise<MappingResponseDto> {
    // Validate soul exists
    await this.validateSoulExists(organizationId, dto.soulId);

    // Validate integration exists
    const integrationExists = await this.matrixRepository.integrationExists(
      organizationId,
      dto.integrationId
    );

    if (!integrationExists) {
      throw new NotFoundException('Integration not found');
    }

    // Check if mapping already exists
    const existing = await this.matrixRepository.findExisting(
      organizationId,
      dto.soulId,
      dto.integrationId
    );

    if (existing) {
      throw new ConflictException(
        'A mapping between this Soul and Integration already exists'
      );
    }

    // If this is set as primary, unset other primaries for this soul
    if (dto.isPrimary) {
      const existingMappings = await this.matrixRepository.findBySoulId(
        organizationId,
        dto.soulId
      );

      for (const mapping of existingMappings) {
        if (mapping.isPrimary) {
          await this.matrixRepository.update(organizationId, mapping.id, {
            isPrimary: false,
          });
        }
      }
    }

    const mapping = await this.matrixRepository.create(
      organizationId,
      dto,
      userId
    );

    // Fetch the full mapping with integration details
    const fullMapping = await this.matrixRepository.findById(
      organizationId,
      mapping.id
    );

    return this.toMappingResponseDto(fullMapping!);
  }

  /**
   * Toggle a mapping (create if doesn't exist, delete if exists)
   */
  async toggleMapping(
    organizationId: string,
    dto: ToggleMappingDto,
    userId?: string
  ): Promise<{ action: 'created' | 'deleted'; mapping?: MappingResponseDto }> {
    // Validate soul exists
    await this.validateSoulExists(organizationId, dto.soulId);

    // Validate integration exists
    const integrationExists = await this.matrixRepository.integrationExists(
      organizationId,
      dto.integrationId
    );

    if (!integrationExists) {
      throw new NotFoundException('Integration not found');
    }

    // Check if mapping exists
    const existing = await this.matrixRepository.findExisting(
      organizationId,
      dto.soulId,
      dto.integrationId
    );

    if (existing) {
      // Delete the mapping
      await this.matrixRepository.delete(organizationId, existing.id);
      return { action: 'deleted' };
    } else {
      // Create the mapping
      const mapping = await this.matrixRepository.create(
        organizationId,
        {
          soulId: dto.soulId,
          integrationId: dto.integrationId,
        },
        userId
      );

      const fullMapping = await this.matrixRepository.findById(
        organizationId,
        mapping.id
      );

      return {
        action: 'created',
        mapping: this.toMappingResponseDto(fullMapping!),
      };
    }
  }

  /**
   * Update an existing mapping
   */
  async updateMapping(
    organizationId: string,
    id: string,
    dto: UpdateMappingDto
  ): Promise<MappingResponseDto> {
    const existing = await this.matrixRepository.findById(organizationId, id);

    if (!existing) {
      throw new NotFoundException('Mapping not found');
    }

    // If setting as primary, unset other primaries for this soul
    if (dto.isPrimary === true) {
      const existingMappings = await this.matrixRepository.findBySoulId(
        organizationId,
        existing.soulId
      );

      for (const mapping of existingMappings) {
        if (mapping.isPrimary && mapping.id !== id) {
          await this.matrixRepository.update(organizationId, mapping.id, {
            isPrimary: false,
          });
        }
      }
    }

    await this.matrixRepository.update(organizationId, id, dto);

    const updated = await this.matrixRepository.findById(organizationId, id);
    return this.toMappingResponseDto(updated!);
  }

  /**
   * Delete a mapping by ID
   */
  async deleteMapping(organizationId: string, id: string): Promise<void> {
    const existing = await this.matrixRepository.findById(organizationId, id);

    if (!existing) {
      throw new NotFoundException('Mapping not found');
    }

    await this.matrixRepository.delete(organizationId, id);
  }

  /**
   * Bulk operations (create or delete multiple mappings)
   */
  async bulkOperations(
    organizationId: string,
    dto: BulkMappingDto,
    userId?: string
  ): Promise<BulkOperationResultDto> {
    if (!dto.mappings || dto.mappings.length === 0) {
      throw new BadRequestException('No mappings provided');
    }

    if (dto.mappings.length > 100) {
      throw new BadRequestException('Maximum 100 mappings per bulk operation');
    }

    // Validate all souls and integrations first
    const validationErrors: Array<{ soulId: string; integrationId: string; error: string }> = [];
    const validMappings: typeof dto.mappings = [];

    for (const item of dto.mappings) {
      try {
        await this.validateSoulExists(organizationId, item.soulId);
        const integrationExists = await this.matrixRepository.integrationExists(
          organizationId,
          item.integrationId
        );
        if (!integrationExists) {
          validationErrors.push({
            soulId: item.soulId,
            integrationId: item.integrationId,
            error: 'Integration not found',
          });
        } else {
          validMappings.push(item);
        }
      } catch (error) {
        validationErrors.push({
          soulId: item.soulId,
          integrationId: item.integrationId,
          error: error instanceof Error ? error.message : 'Validation failed',
        });
      }
    }

    if (dto.operation === BulkOperationType.CREATE) {
      const result = await this.matrixRepository.bulkCreate(
        organizationId,
        validMappings,
        userId
      );

      return {
        succeeded: result.succeeded,
        failed: result.failed + validationErrors.length,
        createdIds: result.createdIds,
        errors: [...validationErrors, ...result.errors],
      };
    } else {
      const result = await this.matrixRepository.bulkDelete(
        organizationId,
        validMappings.map((m) => ({ soulId: m.soulId, integrationId: m.integrationId }))
      );

      return {
        succeeded: result.succeeded,
        failed: result.failed + validationErrors.length,
        errors: [...validationErrors, ...result.errors],
      };
    }
  }

  /**
   * Set a mapping as the primary channel for a soul
   */
  async setPrimaryChannel(
    organizationId: string,
    id: string
  ): Promise<MappingResponseDto> {
    const existing = await this.matrixRepository.findById(organizationId, id);

    if (!existing) {
      throw new NotFoundException('Mapping not found');
    }

    const updated = await this.matrixRepository.setPrimary(organizationId, id);

    const fullMapping = await this.matrixRepository.findById(
      organizationId,
      updated.id
    );

    return this.toMappingResponseDto(fullMapping!);
  }

  /**
   * Get a mapping by ID
   */
  async getMappingById(
    organizationId: string,
    id: string
  ): Promise<MappingResponseDto> {
    const mapping = await this.matrixRepository.findById(organizationId, id);

    if (!mapping) {
      throw new NotFoundException('Mapping not found');
    }

    return this.toMappingResponseDto(mapping);
  }

  /**
   * Validate that a soul exists in Firestore
   */
  private async validateSoulExists(
    organizationId: string,
    soulId: string
  ): Promise<void> {
    const soul = await this.soulRepository.findById(organizationId, soulId);
    if (!soul) {
      throw new NotFoundException('Soul not found');
    }
  }

  /**
   * Convert mapping entity to response DTO
   */
  private toMappingResponseDto(mapping: MappingWithIntegration): MappingResponseDto {
    return {
      id: mapping.id,
      soulId: mapping.soulId,
      integrationId: mapping.integrationId,
      organizationId: mapping.organizationId,
      isPrimary: mapping.isPrimary,
      priority: mapping.priority,
      notes: mapping.notes ?? undefined,
      createdBy: mapping.createdBy ?? undefined,
      createdAt: mapping.createdAt,
      updatedAt: mapping.updatedAt,
      integration: mapping.integration
        ? {
            id: mapping.integration.id,
            name: mapping.integration.name,
            picture: mapping.integration.picture ?? undefined,
            providerIdentifier: mapping.integration.providerIdentifier,
            type: mapping.integration.type,
            disabled: mapping.integration.disabled,
          }
        : undefined,
    };
  }
}
