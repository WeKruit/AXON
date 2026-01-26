import { Test, TestingModule } from '@nestjs/testing';
import { MatrixController } from './matrix.controller';
import { MatrixService } from '@gitroom/nestjs-libraries/database/prisma/matrix/matrix.service';
import { Organization, User } from '@prisma/client';
import { BulkOperationType } from '@gitroom/nestjs-libraries/dtos/axon';

describe('MatrixController', () => {
  let controller: MatrixController;
  let matrixService: jest.Mocked<MatrixService>;

  const mockOrganization: Partial<Organization> = {
    id: 'org-123',
    name: 'Test Org',
  };

  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockMatrixResponse = {
    souls: [
      {
        id: 'soul-1',
        name: 'Test Soul',
        email: 'soul@test.com',
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
    mappings: [
      {
        id: 'map-1',
        soulId: 'soul-1',
        integrationId: 'int-1',
        organizationId: 'org-123',
        isPrimary: false,
        priority: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    stats: {
      totalSouls: 1,
      totalIntegrations: 1,
      totalMappings: 1,
    },
  };

  const mockMappingResponse = {
    id: 'map-1',
    soulId: 'soul-1',
    integrationId: 'int-1',
    organizationId: 'org-123',
    isPrimary: false,
    priority: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockMatrixService = {
      getMatrix: jest.fn(),
      getIntegrationsForSoul: jest.fn(),
      getSoulsForIntegration: jest.fn(),
      createMapping: jest.fn(),
      toggleMapping: jest.fn(),
      bulkOperations: jest.fn(),
      getMappingById: jest.fn(),
      updateMapping: jest.fn(),
      deleteMapping: jest.fn(),
      setPrimaryChannel: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatrixController],
      providers: [
        { provide: MatrixService, useValue: mockMatrixService },
      ],
    }).compile();

    controller = module.get<MatrixController>(MatrixController);
    matrixService = module.get(MatrixService);
  });

  describe('getMatrix', () => {
    it('should return the full matrix', async () => {
      matrixService.getMatrix.mockResolvedValue(mockMatrixResponse);

      const result = await controller.getMatrix(
        mockOrganization as Organization,
        {}
      );

      expect(result).toEqual(mockMatrixResponse);
      expect(matrixService.getMatrix).toHaveBeenCalledWith('org-123', {});
    });

    it('should pass filters to service', async () => {
      matrixService.getMatrix.mockResolvedValue(mockMatrixResponse);

      await controller.getMatrix(
        mockOrganization as Organization,
        { soulId: 'soul-1', limit: 10 }
      );

      expect(matrixService.getMatrix).toHaveBeenCalledWith('org-123', {
        soulId: 'soul-1',
        limit: 10,
      });
    });
  });

  describe('getIntegrationsForSoul', () => {
    it('should return integrations for a soul', async () => {
      const mockResponse = {
        soulId: 'soul-1',
        mappings: [mockMappingResponse],
        totalIntegrations: 1,
      };
      matrixService.getIntegrationsForSoul.mockResolvedValue(mockResponse);

      const result = await controller.getIntegrationsForSoul(
        mockOrganization as Organization,
        'soul-1'
      );

      expect(result).toEqual(mockResponse);
      expect(matrixService.getIntegrationsForSoul).toHaveBeenCalledWith('org-123', 'soul-1');
    });
  });

  describe('getSoulsForIntegration', () => {
    it('should return souls for an integration', async () => {
      const mockResponse = {
        integrationId: 'int-1',
        integration: {
          id: 'int-1',
          name: '@testaccount',
          providerIdentifier: 'twitter',
          picture: 'https://example.com/pic.jpg',
          type: 'social',
          disabled: false,
        },
        mappings: [mockMappingResponse],
        totalSouls: 1,
      };
      matrixService.getSoulsForIntegration.mockResolvedValue(mockResponse);

      const result = await controller.getSoulsForIntegration(
        mockOrganization as Organization,
        'int-1'
      );

      expect(result).toEqual(mockResponse);
      expect(matrixService.getSoulsForIntegration).toHaveBeenCalledWith('org-123', 'int-1');
    });
  });

  describe('createMapping', () => {
    it('should create a new mapping', async () => {
      matrixService.createMapping.mockResolvedValue(mockMappingResponse);

      const result = await controller.createMapping(
        mockOrganization as Organization,
        mockUser as User,
        { soulId: 'soul-1', integrationId: 'int-1' }
      );

      expect(result).toEqual(mockMappingResponse);
      expect(matrixService.createMapping).toHaveBeenCalledWith(
        'org-123',
        { soulId: 'soul-1', integrationId: 'int-1' },
        'user-123'
      );
    });
  });

  describe('toggleMapping', () => {
    it('should toggle a mapping', async () => {
      matrixService.toggleMapping.mockResolvedValue({
        action: 'created',
        mapping: mockMappingResponse,
      });

      const result = await controller.toggleMapping(
        mockOrganization as Organization,
        mockUser as User,
        { soulId: 'soul-1', integrationId: 'int-1' }
      );

      expect(result.action).toBe('created');
      expect(result.mapping).toBeDefined();
    });

    it('should return deleted action when mapping is removed', async () => {
      matrixService.toggleMapping.mockResolvedValue({
        action: 'deleted',
      });

      const result = await controller.toggleMapping(
        mockOrganization as Organization,
        mockUser as User,
        { soulId: 'soul-1', integrationId: 'int-1' }
      );

      expect(result.action).toBe('deleted');
      expect(result.mapping).toBeUndefined();
    });
  });

  describe('bulkOperations', () => {
    it('should process bulk create operations', async () => {
      const mockResult = {
        succeeded: 2,
        failed: 0,
        createdIds: ['map-1', 'map-2'],
        errors: [],
      };
      matrixService.bulkOperations.mockResolvedValue(mockResult);

      const result = await controller.bulkOperations(
        mockOrganization as Organization,
        mockUser as User,
        {
          operation: BulkOperationType.CREATE,
          mappings: [
            { soulId: 'soul-1', integrationId: 'int-1' },
            { soulId: 'soul-1', integrationId: 'int-2' },
          ],
        }
      );

      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should process bulk delete operations', async () => {
      const mockResult = {
        succeeded: 1,
        failed: 0,
        errors: [],
      };
      matrixService.bulkOperations.mockResolvedValue(mockResult);

      const result = await controller.bulkOperations(
        mockOrganization as Organization,
        mockUser as User,
        {
          operation: BulkOperationType.DELETE,
          mappings: [{ soulId: 'soul-1', integrationId: 'int-1' }],
        }
      );

      expect(result.succeeded).toBe(1);
    });
  });

  describe('getMappingById', () => {
    it('should return a mapping by ID', async () => {
      matrixService.getMappingById.mockResolvedValue(mockMappingResponse);

      const result = await controller.getMappingById(
        mockOrganization as Organization,
        'map-1'
      );

      expect(result).toEqual(mockMappingResponse);
      expect(matrixService.getMappingById).toHaveBeenCalledWith('org-123', 'map-1');
    });
  });

  describe('updateMapping', () => {
    it('should update a mapping', async () => {
      const updatedMapping = { ...mockMappingResponse, isPrimary: true };
      matrixService.updateMapping.mockResolvedValue(updatedMapping);

      const result = await controller.updateMapping(
        mockOrganization as Organization,
        'map-1',
        { isPrimary: true }
      );

      expect(result.isPrimary).toBe(true);
      expect(matrixService.updateMapping).toHaveBeenCalledWith('org-123', 'map-1', { isPrimary: true });
    });
  });

  describe('deleteMapping', () => {
    it('should delete a mapping', async () => {
      matrixService.deleteMapping.mockResolvedValue(undefined);

      await controller.deleteMapping(
        mockOrganization as Organization,
        'map-1'
      );

      expect(matrixService.deleteMapping).toHaveBeenCalledWith('org-123', 'map-1');
    });
  });

  describe('setPrimaryChannel', () => {
    it('should set a mapping as primary', async () => {
      const primaryMapping = { ...mockMappingResponse, isPrimary: true };
      matrixService.setPrimaryChannel.mockResolvedValue(primaryMapping);

      const result = await controller.setPrimaryChannel(
        mockOrganization as Organization,
        'map-1'
      );

      expect(result.isPrimary).toBe(true);
      expect(matrixService.setPrimaryChannel).toHaveBeenCalledWith('org-123', 'map-1');
    });
  });
});
