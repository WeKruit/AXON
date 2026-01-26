import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { ProxyRepository } from './proxy.repository';
import {
  ProxyType,
  ProxyPurpose,
  ProxyStatus,
  ProxyProvider,
  Proxy,
  CreateProxyDto,
  UpdateProxyDto,
} from '@gitroom/nestjs-libraries/dtos/axon';

describe('ProxyService', () => {
  let service: ProxyService;
  let repository: jest.Mocked<ProxyRepository>;

  const mockProxy: Proxy = {
    id: 'proxy-1',
    organizationId: 'org-1',
    name: 'Test Proxy',
    provider: ProxyProvider.IPROYAL,
    type: ProxyType.RESIDENTIAL,
    purposes: [ProxyPurpose.ACCOUNT_MANAGEMENT],
    status: ProxyStatus.ACTIVE,
    credentials: {
      host: '192.168.1.1',
      port: 8080,
      username: 'user',
      password: 'encrypted-password',
    },
    assignedAccountIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByExternalId: jest.fn(),
      findAll: jest.fn(),
      findAvailableForPurpose: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      assignAccount: jest.fn(),
      unassignAccount: jest.fn(),
      updateStatus: jest.fn(),
      count: jest.fn(),
      countByStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        {
          provide: ProxyRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProxyService>(ProxyService);
    repository = module.get(ProxyRepository);
  });

  describe('create', () => {
    const createDto: CreateProxyDto = {
      name: 'New Proxy',
      provider: ProxyProvider.IPROYAL,
      type: ProxyType.RESIDENTIAL,
      purposes: [ProxyPurpose.ACCOUNT_MANAGEMENT],
      credentials: {
        host: '192.168.1.1',
        port: 8080,
        username: 'user',
        password: 'plain-password',
      },
    };

    it('should create a proxy when valid data provided', async () => {
      repository.create.mockResolvedValue(mockProxy);

      const result = await service.create('org-1', createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('proxy-1');
      expect(repository.create).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({
          name: 'New Proxy',
          provider: ProxyProvider.IPROYAL,
          type: ProxyType.RESIDENTIAL,
        })
      );
    });

    it('should throw BadRequestException when proxy type not suitable for purpose', async () => {
      const invalidDto: CreateProxyDto = {
        ...createDto,
        type: ProxyType.DATACENTER,
        purposes: [ProxyPurpose.WARMING], // Datacenter not allowed for warming
      };

      await expect(service.create('org-1', invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when external ID already exists', async () => {
      const dtoWithExternalId: CreateProxyDto = {
        ...createDto,
        externalId: 'ext-123',
      };
      repository.findByExternalId.mockResolvedValue(mockProxy);

      await expect(service.create('org-1', dtoWithExternalId)).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should return proxy when found', async () => {
      repository.findById.mockResolvedValue(mockProxy);

      const result = await service.findById('org-1', 'proxy-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('proxy-1');
    });

    it('should throw NotFoundException when proxy not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('org-1', 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateProxyDto = {
      name: 'Updated Proxy',
    };

    it('should update proxy when valid data provided', async () => {
      repository.findById.mockResolvedValue(mockProxy);
      repository.update.mockResolvedValue(undefined);

      const result = await service.update('org-1', 'proxy-1', updateDto);

      expect(result).toBeDefined();
      expect(repository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when proxy not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('org-1', 'non-existent', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when updating to invalid type/purpose combination', async () => {
      repository.findById.mockResolvedValue(mockProxy);
      const invalidUpdate: UpdateProxyDto = {
        type: ProxyType.DATACENTER,
        // mockProxy has ACCOUNT_MANAGEMENT purpose, datacenter not allowed
      };

      await expect(service.update('org-1', 'proxy-1', invalidUpdate)).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete proxy when no accounts assigned', async () => {
      repository.findById.mockResolvedValue(mockProxy);
      repository.delete.mockResolvedValue(undefined);

      await service.delete('org-1', 'proxy-1');

      expect(repository.delete).toHaveBeenCalledWith('org-1', 'proxy-1');
    });

    it('should throw NotFoundException when proxy not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.delete('org-1', 'non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when proxy has assigned accounts', async () => {
      const proxyWithAccounts = { ...mockProxy, assignedAccountIds: ['acc-1', 'acc-2'] };
      repository.findById.mockResolvedValue(proxyWithAccounts);

      await expect(service.delete('org-1', 'proxy-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('assignAccount', () => {
    it('should assign account to active proxy', async () => {
      repository.findById.mockResolvedValue(mockProxy);
      repository.assignAccount.mockResolvedValue(undefined);

      await service.assignAccount('org-1', 'proxy-1', 'acc-1');

      expect(repository.assignAccount).toHaveBeenCalledWith('org-1', 'proxy-1', 'acc-1');
    });

    it('should throw NotFoundException when proxy not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.assignAccount('org-1', 'non-existent', 'acc-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when proxy is not active', async () => {
      const inactiveProxy = { ...mockProxy, status: ProxyStatus.INACTIVE };
      repository.findById.mockResolvedValue(inactiveProxy);

      await expect(service.assignAccount('org-1', 'proxy-1', 'acc-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAllCounts', () => {
    it('should return all counts in parallel', async () => {
      repository.count.mockResolvedValue(100);
      repository.countByStatus.mockResolvedValue(20);

      const result = await service.getAllCounts('org-1');

      expect(result.total).toBe(100);
      expect(result.byStatus).toBeDefined();
      expect(Object.keys(result.byStatus).length).toBe(Object.keys(ProxyStatus).length);
    });
  });

  describe('validateProxyPurposeMatrix', () => {
    it('should return true for valid type/purpose combination', () => {
      const result = service.validateProxyPurposeMatrix(ProxyType.RESIDENTIAL, ProxyPurpose.ACCOUNT_MANAGEMENT);
      expect(result).toBe(true);
    });

    it('should return false for invalid type/purpose combination', () => {
      const result = service.validateProxyPurposeMatrix(ProxyType.DATACENTER, ProxyPurpose.WARMING);
      expect(result).toBe(false);
    });
  });

  describe('getRecommendedProxyTypes', () => {
    it('should return recommended types for account management', () => {
      const result = service.getRecommendedProxyTypes(ProxyPurpose.ACCOUNT_MANAGEMENT);
      expect(result).toContain(ProxyType.RESIDENTIAL);
      expect(result).toContain(ProxyType.MOBILE);
      expect(result).toContain(ProxyType.ISP);
      expect(result).not.toContain(ProxyType.DATACENTER);
    });

    it('should return recommended types for scraping', () => {
      const result = service.getRecommendedProxyTypes(ProxyPurpose.SCRAPING);
      expect(result).toContain(ProxyType.DATACENTER);
      expect(result).toContain(ProxyType.RESIDENTIAL);
    });
  });
});
