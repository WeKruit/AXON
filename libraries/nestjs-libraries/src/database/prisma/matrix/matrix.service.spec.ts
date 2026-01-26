import { Test, TestingModule } from '@nestjs/testing';
import { MatrixService } from './matrix.service';
import { MatrixRepository } from './matrix.repository';
import { SoulRepository } from '@gitroom/nestjs-libraries/database/firestore/collections/souls/soul.repository';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { BulkOperationType } from '@gitroom/nestjs-libraries/dtos/axon';

describe('MatrixService', () => {
  let service: MatrixService;
  let matrixRepository: jest.Mocked<MatrixRepository>;
  let soulRepository: jest.Mocked<SoulRepository>;

  const mockOrganizationId = 'org-123';
  const mockUserId = 'user-123';

  const mockSoul = {
    id: 'soul-1',
    displayName: 'Test Soul',
    email: 'test@example.com',
    organizationId: mockOrganizationId,
  };

  const mockIntegration = {
    id: 'int-1',
    name: '@testaccount',
    providerIdentifier: 'twitter',
    picture: 'https://example.com/pic.jpg',
    type: 'social',
    disabled: false,
  };

  const mockMapping = {
    id: 'map-1',
    soulId: 'soul-1',
    integrationId: 'int-1',
    organizationId: mockOrganizationId,
    isPrimary: false,
    priority: 0,
    notes: null,
    createdBy: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
    integration: mockIntegration,
  };

  beforeEach(async () => {
    const mockMatrixRepository = {
      getAllMappings: jest.fn(),
      getAllIntegrations: jest.fn(),
      findBySoulId: jest.fn(),
      findByIntegrationId: jest.fn(),
      findExisting: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      bulkCreate: jest.fn(),
      bulkDelete: jest.fn(),
      setPrimary: jest.fn(),
      integrationExists: jest.fn(),
      getIntegration: jest.fn(),
    };

    const mockSoulRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatrixService,
        { provide: MatrixRepository, useValue: mockMatrixRepository },
        { provide: SoulRepository, useValue: mockSoulRepository },
      ],
    }).compile();

    service = module.get<MatrixService>(MatrixService);
    matrixRepository = module.get(MatrixRepository);
    soulRepository = module.get(SoulRepository);
  });

  describe('getMatrix', () => {
    it('should return formatted matrix data with souls, integrations, and mappings', async () => {
      soulRepository.findAll.mockResolvedValue({
        data: [mockSoul],
        total: 1,
        hasMore: false,
      });
      matrixRepository.getAllIntegrations.mockResolvedValue([mockIntegration]);
      matrixRepository.getAllMappings.mockResolvedValue([mockMapping]);

      const result = await service.getMatrix(mockOrganizationId, {});

      expect(result).toEqual({
        souls: [
          {
            id: 'soul-1',
            name: 'Test Soul',
            email: 'test@example.com',
            integrationIds: ['int-1'],
          },
        ],
        integrations: [
          {
            id: 'int-1',
            name: '@testaccount',
            platform: 'twitter',
            picture: 'https://example.com/pic.jpg',
            disabled: false,
          },
        ],
        mappings: expect.arrayContaining([
          expect.objectContaining({
            id: 'map-1',
            soulId: 'soul-1',
            integrationId: 'int-1',
          }),
        ]),
        stats: {
          totalSouls: 1,
          totalIntegrations: 1,
          totalMappings: 1,
        },
      });
    });

    it('should return empty arrays when no data exists', async () => {
      soulRepository.findAll.mockResolvedValue({ data: [], total: 0, hasMore: false });
      matrixRepository.getAllIntegrations.mockResolvedValue([]);
      matrixRepository.getAllMappings.mockResolvedValue([]);

      const result = await service.getMatrix(mockOrganizationId, {});

      expect(result.souls).toEqual([]);
      expect(result.integrations).toEqual([]);
      expect(result.mappings).toEqual([]);
      expect(result.stats).toEqual({
        totalSouls: 0,
        totalIntegrations: 0,
        totalMappings: 0,
      });
    });
  });

  describe('createMapping', () => {
    it('should create a new mapping when soul and integration exist', async () => {
      soulRepository.findById.mockResolvedValue(mockSoul);
      matrixRepository.integrationExists.mockResolvedValue(true);
      matrixRepository.findExisting.mockResolvedValue(null);
      matrixRepository.create.mockResolvedValue(mockMapping);
      matrixRepository.findById.mockResolvedValue(mockMapping);

      const result = await service.createMapping(
        mockOrganizationId,
        { soulId: 'soul-1', integrationId: 'int-1' },
        mockUserId
      );

      expect(result).toEqual(expect.objectContaining({
        id: 'map-1',
        soulId: 'soul-1',
        integrationId: 'int-1',
      }));
      expect(matrixRepository.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when soul does not exist', async () => {
      soulRepository.findById.mockResolvedValue(null);

      await expect(
        service.createMapping(
          mockOrganizationId,
          { soulId: 'nonexistent', integrationId: 'int-1' },
          mockUserId
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when integration does not exist', async () => {
      soulRepository.findById.mockResolvedValue(mockSoul);
      matrixRepository.integrationExists.mockResolvedValue(false);

      await expect(
        service.createMapping(
          mockOrganizationId,
          { soulId: 'soul-1', integrationId: 'nonexistent' },
          mockUserId
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when mapping already exists', async () => {
      soulRepository.findById.mockResolvedValue(mockSoul);
      matrixRepository.integrationExists.mockResolvedValue(true);
      matrixRepository.findExisting.mockResolvedValue(mockMapping);

      await expect(
        service.createMapping(
          mockOrganizationId,
          { soulId: 'soul-1', integrationId: 'int-1' },
          mockUserId
        )
      ).rejects.toThrow(ConflictException);
    });

    it('should unset other primaries when creating a primary mapping', async () => {
      const existingPrimaryMapping = { ...mockMapping, isPrimary: true };
      soulRepository.findById.mockResolvedValue(mockSoul);
      matrixRepository.integrationExists.mockResolvedValue(true);
      matrixRepository.findExisting.mockResolvedValue(null);
      matrixRepository.findBySoulId.mockResolvedValue([existingPrimaryMapping]);
      matrixRepository.create.mockResolvedValue({ ...mockMapping, isPrimary: true });
      matrixRepository.findById.mockResolvedValue({ ...mockMapping, isPrimary: true });

      await service.createMapping(
        mockOrganizationId,
        { soulId: 'soul-1', integrationId: 'int-2', isPrimary: true },
        mockUserId
      );

      expect(matrixRepository.update).toHaveBeenCalledWith(
        mockOrganizationId,
        existingPrimaryMapping.id,
        { isPrimary: false }
      );
    });
  });

  describe('toggleMapping', () => {
    it('should create mapping when it does not exist', async () => {
      soulRepository.findById.mockResolvedValue(mockSoul);
      matrixRepository.integrationExists.mockResolvedValue(true);
      matrixRepository.findExisting.mockResolvedValue(null);
      matrixRepository.create.mockResolvedValue(mockMapping);
      matrixRepository.findById.mockResolvedValue(mockMapping);

      const result = await service.toggleMapping(
        mockOrganizationId,
        { soulId: 'soul-1', integrationId: 'int-1' },
        mockUserId
      );

      expect(result.action).toBe('created');
      expect(result.mapping).toBeDefined();
    });

    it('should delete mapping when it exists', async () => {
      soulRepository.findById.mockResolvedValue(mockSoul);
      matrixRepository.integrationExists.mockResolvedValue(true);
      matrixRepository.findExisting.mockResolvedValue(mockMapping);

      const result = await service.toggleMapping(
        mockOrganizationId,
        { soulId: 'soul-1', integrationId: 'int-1' },
        mockUserId
      );

      expect(result.action).toBe('deleted');
      expect(matrixRepository.delete).toHaveBeenCalledWith(mockOrganizationId, mockMapping.id);
    });
  });

  describe('bulkOperations', () => {
    it('should process bulk create operations', async () => {
      soulRepository.findById.mockResolvedValue(mockSoul);
      matrixRepository.integrationExists.mockResolvedValue(true);
      matrixRepository.bulkCreate.mockResolvedValue({
        succeeded: 2,
        failed: 0,
        createdIds: ['map-1', 'map-2'],
        errors: [],
      });

      const result = await service.bulkOperations(
        mockOrganizationId,
        {
          operation: BulkOperationType.CREATE,
          mappings: [
            { soulId: 'soul-1', integrationId: 'int-1' },
            { soulId: 'soul-1', integrationId: 'int-2' },
          ],
        },
        mockUserId
      );

      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should throw BadRequestException when no mappings provided', async () => {
      await expect(
        service.bulkOperations(
          mockOrganizationId,
          { operation: BulkOperationType.CREATE, mappings: [] },
          mockUserId
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when exceeding 100 mappings', async () => {
      const tooManyMappings = Array(101).fill({ soulId: 'soul-1', integrationId: 'int-1' });

      await expect(
        service.bulkOperations(
          mockOrganizationId,
          { operation: BulkOperationType.CREATE, mappings: tooManyMappings },
          mockUserId
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteMapping', () => {
    it('should delete an existing mapping', async () => {
      matrixRepository.findById.mockResolvedValue(mockMapping);

      await service.deleteMapping(mockOrganizationId, 'map-1');

      expect(matrixRepository.delete).toHaveBeenCalledWith(mockOrganizationId, 'map-1');
    });

    it('should throw NotFoundException when mapping does not exist', async () => {
      matrixRepository.findById.mockResolvedValue(null);

      await expect(
        service.deleteMapping(mockOrganizationId, 'nonexistent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setPrimaryChannel', () => {
    it('should set a mapping as primary', async () => {
      matrixRepository.findById.mockResolvedValue(mockMapping);
      matrixRepository.setPrimary.mockResolvedValue({ ...mockMapping, isPrimary: true });

      const result = await service.setPrimaryChannel(mockOrganizationId, 'map-1');

      expect(matrixRepository.setPrimary).toHaveBeenCalledWith(mockOrganizationId, 'map-1');
      expect(result.isPrimary).toBe(true);
    });

    it('should throw NotFoundException when mapping does not exist', async () => {
      matrixRepository.findById.mockResolvedValue(null);

      await expect(
        service.setPrimaryChannel(mockOrganizationId, 'nonexistent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getIntegrationsForSoul', () => {
    it('should return integrations for a soul', async () => {
      soulRepository.findById.mockResolvedValue(mockSoul);
      matrixRepository.findBySoulId.mockResolvedValue([mockMapping]);

      const result = await service.getIntegrationsForSoul(mockOrganizationId, 'soul-1');

      expect(result.soulId).toBe('soul-1');
      expect(result.totalIntegrations).toBe(1);
      expect(result.mappings).toHaveLength(1);
    });

    it('should throw NotFoundException when soul does not exist', async () => {
      soulRepository.findById.mockResolvedValue(null);

      await expect(
        service.getIntegrationsForSoul(mockOrganizationId, 'nonexistent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSoulsForIntegration', () => {
    it('should return souls for an integration', async () => {
      matrixRepository.getIntegration.mockResolvedValue(mockIntegration);
      matrixRepository.findByIntegrationId.mockResolvedValue([mockMapping]);

      const result = await service.getSoulsForIntegration(mockOrganizationId, 'int-1');

      expect(result.integrationId).toBe('int-1');
      expect(result.totalSouls).toBe(1);
      expect(result.mappings).toHaveLength(1);
    });

    it('should throw NotFoundException when integration does not exist', async () => {
      matrixRepository.getIntegration.mockResolvedValue(null);

      await expect(
        service.getSoulsForIntegration(mockOrganizationId, 'nonexistent')
      ).rejects.toThrow(NotFoundException);
    });
  });
});
