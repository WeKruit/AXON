import { Test, TestingModule } from '@nestjs/testing';
import { MatrixService } from './matrix.service';
import { MatrixRepository } from './matrix.repository';
import { SoulService } from '@gitroom/nestjs-libraries/database/firestore/collections/souls/soul.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BulkActionType } from '@gitroom/nestjs-libraries/dtos/matrix/matrix.dto';

describe('MatrixService', () => {
  let service: MatrixService;
  let matrixRepository: jest.Mocked<MatrixRepository>;
  let soulService: jest.Mocked<SoulService>;

  const mockOrganizationId = 'org-123';
  const mockSoulId = 'soul-456';
  const mockIntegrationId = 'int-789';
  const mockMappingId = 'mapping-abc';
  const mockUserId = 'user-xyz';

  const mockSoul = {
    id: mockSoulId,
    organizationId: mockOrganizationId,
    displayName: 'Test Soul',
    firstName: 'Test',
    lastName: 'Soul',
    email: 'test@example.com',
    phone: null,
    personaId: 'persona-1',
    accountIds: [],
    accountCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockIntegration = {
    id: mockIntegrationId,
    name: 'Test Integration',
    providerIdentifier: 'twitter',
    picture: null,
    disabled: false,
    soulMappings: [{ soulId: mockSoulId }],
  };

  const mockMapping = {
    id: mockMappingId,
    soulId: mockSoulId,
    integrationId: mockIntegrationId,
    organizationId: mockOrganizationId,
    isPrimary: false,
    priority: 0,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    integration: {
      id: mockIntegrationId,
      name: 'Test Integration',
      providerIdentifier: 'twitter',
      picture: null,
      disabled: false,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatrixService,
        {
          provide: MatrixRepository,
          useValue: {
            findAllMappings: jest.fn(),
            findMappingsBySoul: jest.fn(),
            findMappingsByIntegration: jest.fn(),
            findMapping: jest.fn(),
            findMappingById: jest.fn(),
            createMapping: jest.fn(),
            updateMapping: jest.fn(),
            deleteMapping: jest.fn(),
            deleteMappingsBySoul: jest.fn(),
            bulkOperations: jest.fn(),
            getIntegrationsForOrg: jest.fn(),
            countMappings: jest.fn(),
          },
        },
        {
          provide: SoulService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MatrixService>(MatrixService);
    matrixRepository = module.get(MatrixRepository);
    soulService = module.get(SoulService);
  });

  describe('getMatrix', () => {
    it('should return the full matrix', async () => {
      matrixRepository.findAllMappings.mockResolvedValue([mockMapping]);
      matrixRepository.getIntegrationsForOrg.mockResolvedValue([mockIntegration]);
      soulService.findAll.mockResolvedValue({
        data: [mockSoul as any],
        hasMore: false,
      });

      const result = await service.getMatrix(mockOrganizationId);

      expect(result.souls).toHaveLength(1);
      expect(result.integrations).toHaveLength(1);
      expect(result.mappings).toHaveLength(1);
      expect(result.stats.totalSouls).toBe(1);
      expect(result.stats.totalIntegrations).toBe(1);
      expect(result.stats.totalMappings).toBe(1);
    });

    it('should filter by platform', async () => {
      const twitterIntegration = { ...mockIntegration, providerIdentifier: 'twitter' };
      const instagramIntegration = {
        ...mockIntegration,
        id: 'int-instagram',
        providerIdentifier: 'instagram',
      };

      matrixRepository.findAllMappings.mockResolvedValue([]);
      matrixRepository.getIntegrationsForOrg.mockResolvedValue([
        twitterIntegration,
        instagramIntegration,
      ]);
      soulService.findAll.mockResolvedValue({
        data: [mockSoul as any],
        hasMore: false,
      });

      const result = await service.getMatrix(mockOrganizationId, {
        platform: 'twitter',
      });

      expect(result.integrations).toHaveLength(1);
      expect(result.integrations[0].platform).toBe('twitter');
    });

    it('should filter by search', async () => {
      matrixRepository.findAllMappings.mockResolvedValue([]);
      matrixRepository.getIntegrationsForOrg.mockResolvedValue([mockIntegration]);
      soulService.findAll.mockResolvedValue({
        data: [mockSoul as any],
        hasMore: false,
      });

      const result = await service.getMatrix(mockOrganizationId, {
        search: 'Test',
      });

      expect(result.souls).toHaveLength(1);

      const resultNoMatch = await service.getMatrix(mockOrganizationId, {
        search: 'NonExistent',
      });

      expect(resultNoMatch.souls).toHaveLength(0);
    });
  });

  describe('getIntegrationsForSoul', () => {
    it('should return integrations for a soul', async () => {
      soulService.findById.mockResolvedValue(mockSoul as any);
      matrixRepository.findMappingsBySoul.mockResolvedValue([mockMapping]);

      const result = await service.getIntegrationsForSoul(
        mockSoulId,
        mockOrganizationId
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockIntegrationId);
    });

    it('should throw NotFoundException if soul not found', async () => {
      soulService.findById.mockRejectedValue(new NotFoundException());

      await expect(
        service.getIntegrationsForSoul(mockSoulId, mockOrganizationId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createMapping', () => {
    it('should create a new mapping', async () => {
      soulService.findById.mockResolvedValue(mockSoul as any);
      matrixRepository.findMapping.mockResolvedValue(null);
      matrixRepository.createMapping.mockResolvedValue(mockMapping);

      const result = await service.createMapping(
        { soulId: mockSoulId, integrationId: mockIntegrationId },
        mockOrganizationId,
        mockUserId
      );

      expect(result.id).toBe(mockMappingId);
      expect(matrixRepository.createMapping).toHaveBeenCalledWith({
        soulId: mockSoulId,
        integrationId: mockIntegrationId,
        organizationId: mockOrganizationId,
        createdBy: mockUserId,
      });
    });

    it('should throw BadRequestException if mapping already exists', async () => {
      soulService.findById.mockResolvedValue(mockSoul as any);
      matrixRepository.findMapping.mockResolvedValue(mockMapping);

      await expect(
        service.createMapping(
          { soulId: mockSoulId, integrationId: mockIntegrationId },
          mockOrganizationId,
          mockUserId
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if soul not found', async () => {
      soulService.findById.mockRejectedValue(new NotFoundException());

      await expect(
        service.createMapping(
          { soulId: mockSoulId, integrationId: mockIntegrationId },
          mockOrganizationId,
          mockUserId
        )
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMapping', () => {
    it('should update a mapping', async () => {
      matrixRepository.findMappingById.mockResolvedValue(mockMapping);
      matrixRepository.updateMapping.mockResolvedValue({
        ...mockMapping,
        isPrimary: true,
      });

      const result = await service.updateMapping(
        mockMappingId,
        { isPrimary: true },
        mockOrganizationId
      );

      expect(result.isPrimary).toBe(true);
    });

    it('should throw NotFoundException if mapping not found', async () => {
      matrixRepository.findMappingById.mockResolvedValue(null);

      await expect(
        service.updateMapping(mockMappingId, { isPrimary: true }, mockOrganizationId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if mapping belongs to different org', async () => {
      matrixRepository.findMappingById.mockResolvedValue({
        ...mockMapping,
        organizationId: 'different-org',
      });

      await expect(
        service.updateMapping(mockMappingId, { isPrimary: true }, mockOrganizationId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteMapping', () => {
    it('should delete a mapping', async () => {
      matrixRepository.findMappingById.mockResolvedValue(mockMapping);
      matrixRepository.deleteMapping.mockResolvedValue(mockMapping);

      await service.deleteMapping(mockMappingId, mockOrganizationId);

      expect(matrixRepository.deleteMapping).toHaveBeenCalledWith(mockMappingId);
    });

    it('should throw NotFoundException if mapping not found', async () => {
      matrixRepository.findMappingById.mockResolvedValue(null);

      await expect(
        service.deleteMapping(mockMappingId, mockOrganizationId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleMapping', () => {
    it('should create mapping if it does not exist', async () => {
      matrixRepository.findMapping.mockResolvedValue(null);
      soulService.findById.mockResolvedValue(mockSoul as any);
      matrixRepository.createMapping.mockResolvedValue(mockMapping);

      const result = await service.toggleMapping(
        mockSoulId,
        mockIntegrationId,
        mockOrganizationId,
        mockUserId
      );

      expect(result.action).toBe('created');
      expect(result.mapping).not.toBeNull();
    });

    it('should delete mapping if it exists', async () => {
      matrixRepository.findMapping.mockResolvedValue(mockMapping);
      matrixRepository.deleteMapping.mockResolvedValue(mockMapping);

      const result = await service.toggleMapping(
        mockSoulId,
        mockIntegrationId,
        mockOrganizationId,
        mockUserId
      );

      expect(result.action).toBe('deleted');
      expect(result.mapping).toBeNull();
    });
  });

  describe('bulkOperations', () => {
    it('should perform bulk operations', async () => {
      matrixRepository.bulkOperations.mockResolvedValue({
        created: 2,
        deleted: 1,
        errors: [],
      });

      const result = await service.bulkOperations(
        {
          operations: [
            { action: BulkActionType.CREATE, soulId: 'soul-1', integrationId: 'int-1' },
            { action: BulkActionType.CREATE, soulId: 'soul-2', integrationId: 'int-2' },
            { action: BulkActionType.DELETE, soulId: 'soul-3', integrationId: 'int-3' },
          ],
        },
        mockOrganizationId,
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.created).toBe(2);
      expect(result.deleted).toBe(1);
    });

    it('should return success false if there are errors', async () => {
      matrixRepository.bulkOperations.mockResolvedValue({
        created: 1,
        deleted: 0,
        errors: [
          {
            operation: {
              action: BulkActionType.CREATE,
              soulId: 'soul-1',
              integrationId: 'int-1',
            },
            error: 'Mapping already exists',
          },
        ],
      });

      const result = await service.bulkOperations(
        {
          operations: [
            { action: BulkActionType.CREATE, soulId: 'soul-1', integrationId: 'int-1' },
          ],
        },
        mockOrganizationId,
        mockUserId
      );

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('onSoulDeleted', () => {
    it('should delete all mappings for a soul', async () => {
      matrixRepository.deleteMappingsBySoul.mockResolvedValue({ count: 3 });

      await service.onSoulDeleted(mockSoulId, mockOrganizationId);

      expect(matrixRepository.deleteMappingsBySoul).toHaveBeenCalledWith(
        mockSoulId,
        mockOrganizationId
      );
    });
  });

  describe('getMappingCount', () => {
    it('should return the mapping count', async () => {
      matrixRepository.countMappings.mockResolvedValue(42);

      const result = await service.getMappingCount(mockOrganizationId);

      expect(result).toBe(42);
    });
  });
});
