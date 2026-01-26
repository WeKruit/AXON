import { Test, TestingModule } from '@nestjs/testing';
import { MatrixRepository } from './matrix.repository';
import { PrismaRepository } from '../prisma.service';

describe('MatrixRepository', () => {
  let repository: MatrixRepository;
  let prisma: jest.Mocked<any>;

  const mockOrganizationId = 'org-123';
  const mockUserId = 'user-123';

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
    integration: {
      id: 'int-1',
      name: '@testaccount',
      providerIdentifier: 'twitter',
      picture: 'https://example.com/pic.jpg',
      type: 'social',
      disabled: false,
    },
  };

  const mockIntegration = {
    id: 'int-1',
    name: '@testaccount',
    providerIdentifier: 'twitter',
    picture: 'https://example.com/pic.jpg',
    type: 'social',
    disabled: false,
    deletedAt: null,
  };

  beforeEach(async () => {
    const mockPrisma = {
      soulIntegrationMapping: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
      },
      integration: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((fn) => fn(mockPrisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatrixRepository,
        { provide: PrismaRepository, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<MatrixRepository>(MatrixRepository);
    prisma = module.get(PrismaRepository);
  });

  describe('findAll', () => {
    it('should return all mappings for an organization', async () => {
      prisma.soulIntegrationMapping.findMany.mockResolvedValue([mockMapping]);

      const result = await repository.findAll(mockOrganizationId);

      expect(result).toEqual([mockMapping]);
      expect(prisma.soulIntegrationMapping.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: mockOrganizationId },
        })
      );
    });

    it('should apply soulId filter when provided', async () => {
      prisma.soulIntegrationMapping.findMany.mockResolvedValue([mockMapping]);

      await repository.findAll(mockOrganizationId, { soulId: 'soul-1' });

      expect(prisma.soulIntegrationMapping.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ soulId: 'soul-1' }),
        })
      );
    });

    it('should apply integrationId filter when provided', async () => {
      prisma.soulIntegrationMapping.findMany.mockResolvedValue([mockMapping]);

      await repository.findAll(mockOrganizationId, { integrationId: 'int-1' });

      expect(prisma.soulIntegrationMapping.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ integrationId: 'int-1' }),
        })
      );
    });
  });

  describe('getAllMappings', () => {
    it('should return all mappings with integration data', async () => {
      prisma.soulIntegrationMapping.findMany.mockResolvedValue([mockMapping]);

      const result = await repository.getAllMappings(mockOrganizationId);

      expect(result).toEqual([mockMapping]);
      expect(prisma.soulIntegrationMapping.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { integration: true },
        })
      );
    });
  });

  describe('getAllIntegrations', () => {
    it('should return all non-deleted integrations', async () => {
      prisma.integration.findMany.mockResolvedValue([mockIntegration]);

      const result = await repository.getAllIntegrations(mockOrganizationId);

      expect(result).toEqual([mockIntegration]);
      expect(prisma.integration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: mockOrganizationId,
            deletedAt: null,
          }),
        })
      );
    });
  });

  describe('create', () => {
    it('should create a new mapping', async () => {
      prisma.soulIntegrationMapping.create.mockResolvedValue(mockMapping);

      const result = await repository.create(
        mockOrganizationId,
        { soulId: 'soul-1', integrationId: 'int-1' },
        mockUserId
      );

      expect(result).toEqual(mockMapping);
      expect(prisma.soulIntegrationMapping.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          soulId: 'soul-1',
          integrationId: 'int-1',
          organizationId: mockOrganizationId,
          createdBy: mockUserId,
        }),
      });
    });

    it('should set isPrimary and priority when provided', async () => {
      prisma.soulIntegrationMapping.create.mockResolvedValue({
        ...mockMapping,
        isPrimary: true,
        priority: 5,
      });

      await repository.create(
        mockOrganizationId,
        { soulId: 'soul-1', integrationId: 'int-1', isPrimary: true, priority: 5 },
        mockUserId
      );

      expect(prisma.soulIntegrationMapping.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isPrimary: true,
          priority: 5,
        }),
      });
    });
  });

  describe('findExisting', () => {
    it('should find existing mapping by soulId and integrationId', async () => {
      prisma.soulIntegrationMapping.findFirst.mockResolvedValue(mockMapping);

      const result = await repository.findExisting(mockOrganizationId, 'soul-1', 'int-1');

      expect(result).toEqual(mockMapping);
      expect(prisma.soulIntegrationMapping.findFirst).toHaveBeenCalledWith({
        where: {
          organizationId: mockOrganizationId,
          soulId: 'soul-1',
          integrationId: 'int-1',
        },
      });
    });

    it('should return null when mapping does not exist', async () => {
      prisma.soulIntegrationMapping.findFirst.mockResolvedValue(null);

      const result = await repository.findExisting(mockOrganizationId, 'soul-1', 'int-2');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find mapping by id with integration data', async () => {
      prisma.soulIntegrationMapping.findFirst.mockResolvedValue(mockMapping);

      const result = await repository.findById(mockOrganizationId, 'map-1');

      expect(result).toEqual(mockMapping);
      expect(prisma.soulIntegrationMapping.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'map-1',
          organizationId: mockOrganizationId,
        },
        include: { integration: true },
      });
    });
  });

  describe('delete', () => {
    it('should delete a mapping', async () => {
      prisma.soulIntegrationMapping.delete.mockResolvedValue(mockMapping);

      await repository.delete(mockOrganizationId, 'map-1');

      expect(prisma.soulIntegrationMapping.delete).toHaveBeenCalledWith({
        where: { id: 'map-1' },
      });
    });
  });

  describe('update', () => {
    it('should update mapping properties', async () => {
      const updatedMapping = { ...mockMapping, isPrimary: true };
      prisma.soulIntegrationMapping.update.mockResolvedValue(updatedMapping);

      const result = await repository.update(mockOrganizationId, 'map-1', { isPrimary: true });

      expect(result).toEqual(updatedMapping);
      expect(prisma.soulIntegrationMapping.update).toHaveBeenCalledWith({
        where: { id: 'map-1' },
        data: { isPrimary: true },
      });
    });
  });

  describe('setPrimary', () => {
    it('should set mapping as primary and unset others for the same soul', async () => {
      // First call returns the mapping to get the soulId
      prisma.soulIntegrationMapping.findFirst.mockResolvedValue(mockMapping);
      // Transaction operations
      prisma.soulIntegrationMapping.updateMany.mockResolvedValue({ count: 1 });
      prisma.soulIntegrationMapping.update.mockResolvedValue({ ...mockMapping, isPrimary: true });

      const result = await repository.setPrimary(mockOrganizationId, 'map-1');

      expect(result.isPrimary).toBe(true);
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple mappings', async () => {
      prisma.soulIntegrationMapping.findFirst.mockResolvedValue(null); // No existing
      prisma.soulIntegrationMapping.create.mockResolvedValue(mockMapping);

      const result = await repository.bulkCreate(
        mockOrganizationId,
        [
          { soulId: 'soul-1', integrationId: 'int-1' },
          { soulId: 'soul-1', integrationId: 'int-2' },
        ],
        mockUserId
      );

      expect(result.succeeded).toBe(2);
      expect(result.createdIds).toHaveLength(2);
    });

    it('should skip existing mappings', async () => {
      prisma.soulIntegrationMapping.findFirst
        .mockResolvedValueOnce(mockMapping) // First exists
        .mockResolvedValueOnce(null); // Second doesn't
      prisma.soulIntegrationMapping.create.mockResolvedValue(mockMapping);

      const result = await repository.bulkCreate(
        mockOrganizationId,
        [
          { soulId: 'soul-1', integrationId: 'int-1' },
          { soulId: 'soul-1', integrationId: 'int-2' },
        ],
        mockUserId
      );

      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(1);
    });
  });

  describe('bulkDelete', () => {
    it('should delete multiple mappings', async () => {
      prisma.soulIntegrationMapping.findFirst.mockResolvedValue(mockMapping);
      prisma.soulIntegrationMapping.delete.mockResolvedValue(mockMapping);

      const result = await repository.bulkDelete(mockOrganizationId, [
        { soulId: 'soul-1', integrationId: 'int-1' },
        { soulId: 'soul-1', integrationId: 'int-2' },
      ]);

      expect(result.succeeded).toBe(2);
    });
  });

  describe('integrationExists', () => {
    it('should return true when integration exists', async () => {
      prisma.integration.findFirst.mockResolvedValue(mockIntegration);

      const result = await repository.integrationExists(mockOrganizationId, 'int-1');

      expect(result).toBe(true);
    });

    it('should return false when integration does not exist', async () => {
      prisma.integration.findFirst.mockResolvedValue(null);

      const result = await repository.integrationExists(mockOrganizationId, 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('findBySoulId', () => {
    it('should return all mappings for a soul', async () => {
      prisma.soulIntegrationMapping.findMany.mockResolvedValue([mockMapping]);

      const result = await repository.findBySoulId(mockOrganizationId, 'soul-1');

      expect(result).toEqual([mockMapping]);
      expect(prisma.soulIntegrationMapping.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: mockOrganizationId, soulId: 'soul-1' },
        })
      );
    });
  });

  describe('findByIntegrationId', () => {
    it('should return all mappings for an integration', async () => {
      prisma.soulIntegrationMapping.findMany.mockResolvedValue([mockMapping]);

      const result = await repository.findByIntegrationId(mockOrganizationId, 'int-1');

      expect(result).toEqual([mockMapping]);
      expect(prisma.soulIntegrationMapping.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: mockOrganizationId, integrationId: 'int-1' },
        })
      );
    });
  });
});
