import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MatrixRepository } from './matrix.repository';
import { SoulService } from '@gitroom/nestjs-libraries/database/firestore/collections/souls/soul.service';
import {
  MatrixResponseDto,
  CreateMappingDto,
  UpdateMappingDto,
  BulkMappingRequestDto,
  BulkMappingResponseDto,
  MatrixQueryDto,
  MappingDto,
  SoulWithMappingsDto,
  IntegrationWithMappingsDto,
  ToggleMappingResponseDto,
  SoulIntegrationDto,
  IntegrationSoulDto,
} from '@gitroom/nestjs-libraries/dtos/matrix/matrix.dto';

@Injectable()
export class MatrixService {
  constructor(
    private readonly matrixRepository: MatrixRepository,
    private readonly soulService: SoulService
  ) {}

  /**
   * Get the full matrix view with all souls, integrations, and mappings
   */
  async getMatrix(
    organizationId: string,
    query?: MatrixQueryDto
  ): Promise<MatrixResponseDto> {
    // Fetch all data in parallel
    const [mappings, integrations, soulsResult] = await Promise.all([
      this.matrixRepository.findAllMappings(organizationId),
      this.matrixRepository.getIntegrationsForOrg(organizationId),
      this.soulService.findAll(organizationId, { limit: 1000 }),
    ]);

    const souls = soulsResult.data;

    // Filter integrations by platform if specified
    let filteredIntegrations = integrations;
    if (query?.platform) {
      filteredIntegrations = integrations.filter(
        (i) => i.providerIdentifier === query.platform
      );
    }

    // Filter souls by search if specified
    let filteredSouls = souls;
    if (query?.search) {
      const searchLower = query.search.toLowerCase();
      filteredSouls = souls.filter(
        (s) =>
          s.displayName?.toLowerCase().includes(searchLower) ||
          s.firstName?.toLowerCase().includes(searchLower) ||
          s.lastName?.toLowerCase().includes(searchLower) ||
          s.email?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by specific soul if specified
    if (query?.soulId) {
      filteredSouls = filteredSouls.filter((s) => s.id === query.soulId);
    }

    // Build soul mappings
    const soulsWithMappings: SoulWithMappingsDto[] = filteredSouls.map((soul) => {
      const soulMappings = mappings.filter((m) => m.soulId === soul.id);

      return {
        id: soul.id,
        name: soul.displayName || `${soul.firstName || ''} ${soul.lastName || ''}`.trim() || soul.email || 'Unknown',
        description: undefined, // Could be added if soul has description
        status: 'active', // Souls don't have a status field currently
        persona: soul.personaId
          ? {
              id: soul.personaId,
              name: '', // Would need to fetch from persona service
              tone: undefined,
              style: undefined,
            }
          : undefined,
        integrationIds: soulMappings.map((m) => m.integrationId),
        mappings: soulMappings.map((m) => ({
          id: m.id,
          soulId: m.soulId,
          integrationId: m.integrationId,
          isPrimary: m.isPrimary,
          priority: m.priority,
          notes: m.notes || undefined,
          createdAt: m.createdAt,
        })),
      };
    });

    // Build integration mappings
    const integrationsWithMappings: IntegrationWithMappingsDto[] =
      filteredIntegrations.map((integration) => ({
        id: integration.id,
        name: integration.name,
        platform: integration.providerIdentifier,
        picture: integration.picture || undefined,
        disabled: integration.disabled,
        soulIds: integration.soulMappings.map((m) => m.soulId),
      }));

    return {
      souls: soulsWithMappings,
      integrations: integrationsWithMappings,
      mappings: mappings.map((m) => ({
        id: m.id,
        soulId: m.soulId,
        integrationId: m.integrationId,
        isPrimary: m.isPrimary,
        priority: m.priority,
        notes: m.notes || undefined,
        createdAt: m.createdAt,
      })),
      stats: {
        totalSouls: soulsWithMappings.length,
        totalIntegrations: integrationsWithMappings.length,
        totalMappings: mappings.length,
      },
    };
  }

  /**
   * Get integrations mapped to a specific soul
   */
  async getIntegrationsForSoul(
    soulId: string,
    organizationId: string
  ): Promise<SoulIntegrationDto[]> {
    // Verify soul exists
    try {
      await this.soulService.findById(organizationId, soulId);
    } catch (error) {
      throw new NotFoundException('Soul not found');
    }

    const mappings = await this.matrixRepository.findMappingsBySoul(
      soulId,
      organizationId
    );

    return mappings.map((m) => ({
      id: m.integration.id,
      name: m.integration.name,
      platform: m.integration.providerIdentifier,
      picture: m.integration.picture || undefined,
      isPrimary: m.isPrimary,
      priority: m.priority,
    }));
  }

  /**
   * Get souls mapped to a specific integration
   */
  async getSoulsForIntegration(
    integrationId: string,
    organizationId: string
  ): Promise<IntegrationSoulDto[]> {
    const mappings = await this.matrixRepository.findMappingsByIntegration(
      integrationId,
      organizationId
    );

    const souls: IntegrationSoulDto[] = [];

    for (const m of mappings) {
      try {
        const soul = await this.soulService.findById(organizationId, m.soulId);
        souls.push({
          id: soul.id,
          name:
            soul.displayName ||
            `${soul.firstName || ''} ${soul.lastName || ''}`.trim() ||
            soul.email ||
            'Unknown',
          status: 'active',
          isPrimary: m.isPrimary,
        });
      } catch {
        // Soul may have been deleted, skip it
        continue;
      }
    }

    return souls;
  }

  /**
   * Create a new mapping
   */
  async createMapping(
    data: CreateMappingDto,
    organizationId: string,
    userId?: string
  ): Promise<MappingDto> {
    // Verify soul exists
    try {
      await this.soulService.findById(organizationId, data.soulId);
    } catch (error) {
      throw new NotFoundException('Soul not found');
    }

    // Check if mapping already exists
    const existing = await this.matrixRepository.findMapping(
      data.soulId,
      data.integrationId
    );
    if (existing) {
      throw new BadRequestException('Mapping already exists');
    }

    const mapping = await this.matrixRepository.createMapping({
      ...data,
      organizationId,
      createdBy: userId,
    });

    return {
      id: mapping.id,
      soulId: mapping.soulId,
      integrationId: mapping.integrationId,
      isPrimary: mapping.isPrimary,
      priority: mapping.priority,
      notes: mapping.notes || undefined,
      createdAt: mapping.createdAt,
    };
  }

  /**
   * Update a mapping
   */
  async updateMapping(
    id: string,
    data: UpdateMappingDto,
    organizationId: string
  ): Promise<MappingDto> {
    const existing = await this.matrixRepository.findMappingById(id);
    if (!existing || existing.organizationId !== organizationId) {
      throw new NotFoundException('Mapping not found');
    }

    const updated = await this.matrixRepository.updateMapping(
      id,
      data,
      organizationId
    );

    return {
      id: updated.id,
      soulId: updated.soulId,
      integrationId: updated.integrationId,
      isPrimary: updated.isPrimary,
      priority: updated.priority,
      notes: updated.notes || undefined,
      createdAt: updated.createdAt,
    };
  }

  /**
   * Delete a mapping
   */
  async deleteMapping(id: string, organizationId: string): Promise<void> {
    const existing = await this.matrixRepository.findMappingById(id);
    if (!existing || existing.organizationId !== organizationId) {
      throw new NotFoundException('Mapping not found');
    }

    await this.matrixRepository.deleteMapping(id);
  }

  /**
   * Toggle a mapping (create if doesn't exist, delete if exists)
   */
  async toggleMapping(
    soulId: string,
    integrationId: string,
    organizationId: string,
    userId?: string
  ): Promise<ToggleMappingResponseDto> {
    const existing = await this.matrixRepository.findMapping(soulId, integrationId);

    if (existing) {
      await this.matrixRepository.deleteMapping(existing.id);
      return { action: 'deleted', mapping: null };
    } else {
      const mapping = await this.createMapping(
        { soulId, integrationId },
        organizationId,
        userId
      );
      return { action: 'created', mapping };
    }
  }

  /**
   * Perform bulk operations
   */
  async bulkOperations(
    data: BulkMappingRequestDto,
    organizationId: string,
    userId?: string
  ): Promise<BulkMappingResponseDto> {
    const results = await this.matrixRepository.bulkOperations(
      data.operations,
      organizationId,
      userId
    );

    return {
      success: results.errors.length === 0,
      created: results.created,
      deleted: results.deleted,
      errors: results.errors,
    };
  }

  /**
   * Called when a Soul is deleted - cleanup all its mappings
   */
  async onSoulDeleted(soulId: string, organizationId: string): Promise<void> {
    await this.matrixRepository.deleteMappingsBySoul(soulId, organizationId);
  }

  /**
   * Get mapping count for an organization
   */
  async getMappingCount(organizationId: string): Promise<number> {
    return this.matrixRepository.countMappings(organizationId);
  }
}
