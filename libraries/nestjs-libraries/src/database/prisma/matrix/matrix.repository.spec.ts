import { Test, TestingModule } from '@nestjs/testing';
import { MatrixRepository } from './matrix.repository';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { BulkActionType } from '@gitroom/nestjs-libraries/dtos/matrix/matrix.dto';

describe('MatrixRepository', () => {
  let repository: MatrixRepository;
  let mockSoulIntegrationMappingPrisma: any;
  let mockIntegrationPrisma: any;

  const mockOrganizationId = 'org-123';
  const mockSoulId = 'soul-456';
  const mockIntegrationId = 'int-789';
  const mockMappingId = 'mapping-abc';

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
    mockSoulIntegrationMappingPrisma = {
      model: {
        soulIntegrationMapping: {
          findMany: jest.fn(),
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          updateMany: jest.fn(),
          delete: jest.fn(),
          deleteMany: jest.fn(),
          count: jest.fn(),
        },
      },
    };

    mockIntegrationPrisma = {
      model: {
        integration: {
          findMany: jest.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatrixRepository,
        {
          provide: PrismaRepository,
          useFactory: (token: string) => {
            if (token === 'soulIntegrationMapping') {
              return mockSoulIntegrationMappingPrisma;
            }
            if (token === 'integration') {
              return mockIntegrationPrisma;
            }
            return {};
          },
        },
      ],
    })
      .overrideProvider(PrismaRepository)
      .useValue({})
      .compile();

    // Manually create repository with mocked dependencies
    repository = new MatrixRepository(
      mockSoulIntegrationMappingPrisma,
      mockIntegrationPrisma
    );
  });

  describe('findAllMappings', () => {
    it('should return all mappings for an organization', async () => {
      mockSoulIntegrationMappingPrisma.model.soulIntegrationMapping.findMany.mockResolvedValue(
        [mockMapping]
      );

      const result = await repository.findAllMappings(mockOrganizationId);

      expect(result).toEqual([mockMapping]);
      expect(
        mockSoulIntegrationMappingPrisma.model.soulIntegrationMapping.findMany
      ).toHaveBeenCalledWith({
        where: { organizationId: mockOrganizationId },
        include: { integration: true },
        orderBy: [{ soulId: 'asc' }, { priority: 'asc' }],
      });
    });
  });

  describe('findMappingsBySoul', () => {
    it('should return mappings for a specific soul', async () => {
      mockSoulIntegrationMappingPrisma.model.soulIntegrationMapping.findMany.mockResolvedValue(
        [mockMapping]
      );

      const result = await repository.findMappingsBySoul(
        mockSoulId,
        mockOrganizationId
      );

      expect(result).toEqual([mockMapping]);
      expect(
        mockSoulIntegrationMappingPrisma.model.soulIntegrationMapping.findMany
      ).toHaveBeenCalledWith({
        where: { soulId: mockSoulId, organizationId: mockOrganizationId },
        include: { integration: true },
        orderBy: { priority: 'asc' },
      });
    });
  });

  describe('findMapping', () => {
    it('should find a mapping by soul and integration', async () => {
      mockSoulIntegrationMappingPrisma.model.soulIntegrationMapping.findUnique.mockResolvedValue(
        mockMapping
      );

      const result = await repository.findMapping(mockSoulId, mockIntegrationId);

      expect(result).toEqual(mockMapping);
      expect(
        mockSoulIntegrationMappingPrisma.model.soulIntegrationMapping.findUnique
      ).toHaveBeenCalledWith({
        where: {
          soulId_integrationId: { soulId: mockSoulId, integrationId: mockIntegrationId },
        },
      });
    });

    it('should return null if mapping not found', async () => {
      mockSoulIntegrationMappingPrisma.model.soulIntegrationMapping.findUnique.mockResolvedValue(
        null
      );

      const result = await repository.findMapping(mockSoulId, mockIntegrationId);

      expect(result).toBeNull();
    });
  });

  describe('createMapping', () => {
    it('should create a new mapping', async () => {
      mockSoulIntegrationMappingPrisma.model.soulIntegrationMapping.create.mockResolvedValue(
        mockMapping
      );

      const result = await repository.createMapping({
        soulId: mockSoulId,
        integrationId: mockIntegrationId,
        organizationId: mockOrganizationId,
      });

      expect(result).toEqual(mockMapping);
      expect(
        mockSoulIntegrationMappingPrisma.model.soulIntegrationMapping.create
      ).toHaveBeenCalled();
    });

    it('should unset other primaries when creating a primary mapping', async () => {
      mockSoulIntegrationMappingPrisma.model.soulIntegrationMapping.updateMany.mockResolvedValue(
        { count: 1 }
      );
      mockSoulIntegrationMappingPrisma.model.soulIntegrationMapping.create.mockResolvedValue({
        ...mockMapping,
        isPrimary: true,
      });

      const result = await repository.createMapping({
        soulId: mockSoulId,
        integrationId: mockIntegrationId,
        organizationId: mockOrganizationId,
        isPrimary: true,
      });

      expect(result.isPrimary).toBe(true);
      expect(
        mockSoulIntegrationMappingPrisma.model.soulIntegrationMapping.updateMany
      ).toHaveBeenCalledWith({
        where: { soulId: mockSoulId, organizationId: mockOrganizationId },
        data: { isPrimary: false },
      });
    });
  });

  describe('deleteMapping', () => {
    it('should delete a mapping by id', async () => {
      mockSoulIntegrationMappingPrisma.model.soulIntegrationMapping.delete.mockResolvedValue(
        mockMapping
      );

      const result = await repository.deleteMapping(mockMappingId);

      expect(result).toEqual(mockMapping);
      expect(
        mockSoulIntegrationMappingPrisma.model.soulIntegrationMapping.delete
      ).toHaveBeenCalledWith({
        where: { id: mockMappingId },
      });
    });
  });

  describe('bulkOperations', () => {
    it('should create mappings in bulk', async () => {
      mockSoulIntegrationMappingPrisma.model.soulIntegrationMapping.findUnique.mockResolvedValue(
        null
      );
      mockSoulIntegrationMappingPrisma.model.soulIntegrationMapping.create.mockResolvedValue(
        mockMapping
      );

      const operations = [
        {
          action: BulkActionType.CREATE,
          soulId: mockSoulId,
          integrationId: mockIntegrationId,
        },
      ];

      const result = await repository.bulkOperations(
        operations,
        mockOrganizationId
      );

      expect(result.created).toBe(1);
      expect(result.deleted).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should delete mappings in bulk', async () => {
      mockSoulIntegrationMappingPrisma.model.soulIntegrationMapping.delete.mockResolvedValue(
        mockMapping
      );

      const operations = [
        {
          action: BulkActionType.DELETE,
          soulId: mockSoulId,
          integrationId: mockIntegrationId,
        },
      ];

      const result = await repository.bulkOperations(
        operations,
        mockOrganizationId
      );

      expect(result.created).toBe(0);
      expect(result.deleted).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle errors in bulk operations', async () => {
      mockSoulIntegrationMappingPrisma.model.soulIntegrationMapping.findUnique.mockResolvedValue(
        mockMapping
      );

      const operations = [
        {
          action: BulkActionType.CREATE,
          soulId: mockSoulId,
          integrationId: mockIntegrationId,
        },
      ];

      const result = await repository.bulkOperations(
        operations,
        mockOrganizationId
      );

      expect(result.created).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Mapping already exists');
    });
  });

  describe('getIntegrationsForOrg', () => {
    it('should return all integrations for an organization', async () => {
      const mockIntegration = {
        id: mockIntegrationId,
        name: 'Test Integration',
        providerIdentifier: 'twitter',
        picture: null,
        disabled: false,
        soulMappings: [{ soulId: mockSoulId }],
      };

      mockIntegrationPrisma.model.integration.findMany.mockResolvedValue([
        mockIntegration,
      ]);

      const result = await repository.getIntegrationsForOrg(mockOrganizationId);

      expect(result).toEqual([mockIntegration]);
      expect(mockIntegrationPrisma.model.integration.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: mockOrganizationId,
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
    });
  });
});
