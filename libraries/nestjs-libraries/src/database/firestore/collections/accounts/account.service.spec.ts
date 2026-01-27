import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountRepository } from './account.repository';
import { SoulRepository } from '../souls/soul.repository';
import { ProxyRepository } from '../proxies/proxy.repository';
import { MatrixRepository } from '@gitroom/nestjs-libraries/database/prisma/matrix/matrix.repository';
import {
  Platform,
  AccountStatus,
  ProxyStatus,
  SoulType,
  Account,
  CreateAccountDto,
  Soul,
  Proxy,
  ProxyType,
  ProxyPurpose,
  ProxyProvider,
  BulkImportAccountDto,
} from '@gitroom/nestjs-libraries/dtos/axon';

describe('AccountService', () => {
  let service: AccountService;
  let accountRepository: jest.Mocked<AccountRepository>;
  let soulRepository: jest.Mocked<SoulRepository>;
  let proxyRepository: jest.Mocked<ProxyRepository>;
  let matrixRepository: jest.Mocked<MatrixRepository>;

  const mockSoul: Soul = {
    id: 'soul-1',
    organizationId: 'org-1',
    type: SoulType.EMAIL,
    email: 'test@example.com',
    displayName: 'Test Soul',
    accountIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAccount: Account = {
    id: 'acc-1',
    organizationId: 'org-1',
    soulId: 'soul-1',
    platform: Platform.TWITTER,
    handle: 'testuser',
    displayName: 'Test User',
    status: AccountStatus.ACTIVE,
    credentials: {},
    integrationId: undefined,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProxy: Proxy = {
    id: 'proxy-1',
    organizationId: 'org-1',
    name: 'Test Proxy',
    provider: ProxyProvider.IPROYAL,
    type: ProxyType.RESIDENTIAL,
    purposes: [ProxyPurpose.ACCOUNT_MANAGEMENT],
    status: ProxyStatus.ACTIVE,
    credentials: { host: '192.168.1.1', port: 8080 },
    assignedAccountIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockAccountRepository = {
      create: jest.fn(),
      createBatch: jest.fn(),
      findById: jest.fn(),
      findByHandle: jest.fn(),
      findBySoulId: jest.fn(),
      findByProxyId: jest.fn(),
      findByIntegrationId: jest.fn(),
      findBySoulIdAndPlatform: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateStatus: jest.fn(),
      assignProxy: jest.fn(),
      linkIntegration: jest.fn(),
      unlinkIntegration: jest.fn(),
      count: jest.fn(),
      countByStatus: jest.fn(),
      countByPlatform: jest.fn(),
      countBySoulId: jest.fn(),
      updateLastActivity: jest.fn(),
    };

    const mockSoulRepository = {
      findById: jest.fn(),
      addAccountId: jest.fn(),
      removeAccountId: jest.fn(),
    };

    const mockProxyRepository = {
      findById: jest.fn(),
      assignAccount: jest.fn(),
      unassignAccount: jest.fn(),
    };

    const mockMatrixRepository = {
      getIntegration: jest.fn(),
      integrationExists: jest.fn(),
      findBySoulId: jest.fn(),
      findByIntegrationId: jest.fn(),
      findByAccountId: jest.fn(),
      findExisting: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateAccountId: jest.fn(),
      delete: jest.fn(),
      bulkCreate: jest.fn(),
      bulkDelete: jest.fn(),
      setPrimary: jest.fn(),
      getAllMappings: jest.fn(),
      getAllMappingsLean: jest.fn(),
      getAllIntegrations: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        { provide: AccountRepository, useValue: mockAccountRepository },
        { provide: SoulRepository, useValue: mockSoulRepository },
        { provide: ProxyRepository, useValue: mockProxyRepository },
        { provide: MatrixRepository, useValue: mockMatrixRepository },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
    accountRepository = module.get(AccountRepository);
    soulRepository = module.get(SoulRepository);
    proxyRepository = module.get(ProxyRepository);
    matrixRepository = module.get(MatrixRepository);
  });

  describe('create', () => {
    const createDto: CreateAccountDto = {
      soulId: 'soul-1',
      platform: Platform.TWITTER,
      handle: 'newuser',
      displayName: 'New User',
    };

    it('should create account when valid data provided', async () => {
      soulRepository.findById.mockResolvedValue(mockSoul);
      accountRepository.findByHandle.mockResolvedValue(null);
      accountRepository.create.mockResolvedValue(mockAccount);

      const result = await service.create('org-1', createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('acc-1');
      expect(soulRepository.addAccountId).toHaveBeenCalledWith('org-1', 'soul-1', 'acc-1');
    });

    it('should throw NotFoundException when soul not found', async () => {
      soulRepository.findById.mockResolvedValue(null);

      await expect(service.create('org-1', createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when handle already exists on platform', async () => {
      soulRepository.findById.mockResolvedValue(mockSoul);
      accountRepository.findByHandle.mockResolvedValue(mockAccount);

      await expect(service.create('org-1', createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when proxy not found', async () => {
      const dtoWithProxy: CreateAccountDto = { ...createDto, proxyId: 'non-existent' };
      soulRepository.findById.mockResolvedValue(mockSoul);
      accountRepository.findByHandle.mockResolvedValue(null);
      proxyRepository.findById.mockResolvedValue(null);

      await expect(service.create('org-1', dtoWithProxy)).rejects.toThrow(NotFoundException);
    });

    it('should assign proxy when proxyId provided', async () => {
      const dtoWithProxy: CreateAccountDto = { ...createDto, proxyId: 'proxy-1' };
      soulRepository.findById.mockResolvedValue(mockSoul);
      accountRepository.findByHandle.mockResolvedValue(null);
      proxyRepository.findById.mockResolvedValue(mockProxy);
      accountRepository.create.mockResolvedValue({ ...mockAccount, proxyId: 'proxy-1' });

      await service.create('org-1', dtoWithProxy);

      expect(proxyRepository.assignAccount).toHaveBeenCalledWith('org-1', 'proxy-1', 'acc-1');
    });
  });

  describe('findById', () => {
    it('should return account when found', async () => {
      accountRepository.findById.mockResolvedValue(mockAccount);

      const result = await service.findById('org-1', 'acc-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('acc-1');
    });

    it('should throw NotFoundException when account not found', async () => {
      accountRepository.findById.mockResolvedValue(null);

      await expect(service.findById('org-1', 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update account when valid data provided', async () => {
      accountRepository.findById.mockResolvedValue(mockAccount);

      const result = await service.update('org-1', 'acc-1', { displayName: 'Updated Name' });

      expect(result).toBeDefined();
      expect(accountRepository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when account not found', async () => {
      accountRepository.findById.mockResolvedValue(null);

      await expect(service.update('org-1', 'non-existent', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when updating handle to existing one', async () => {
      const existingAccount = { ...mockAccount, handle: 'existing' };
      accountRepository.findById.mockResolvedValue(mockAccount);
      accountRepository.findByHandle.mockResolvedValue(existingAccount);

      await expect(service.update('org-1', 'acc-1', { handle: 'existing' })).rejects.toThrow(ConflictException);
    });

    it('should handle proxy change correctly', async () => {
      const accountWithProxy = { ...mockAccount, proxyId: 'old-proxy' };
      accountRepository.findById.mockResolvedValue(accountWithProxy);
      proxyRepository.findById.mockResolvedValue(mockProxy);

      await service.update('org-1', 'acc-1', { proxyId: 'proxy-1' });

      expect(proxyRepository.unassignAccount).toHaveBeenCalledWith('org-1', 'old-proxy', 'acc-1');
      expect(proxyRepository.assignAccount).toHaveBeenCalledWith('org-1', 'proxy-1', 'acc-1');
    });
  });

  describe('delete', () => {
    it('should delete account and update references', async () => {
      accountRepository.findById.mockResolvedValue(mockAccount);

      await service.delete('org-1', 'acc-1');

      expect(soulRepository.removeAccountId).toHaveBeenCalledWith('org-1', 'soul-1', 'acc-1');
      expect(accountRepository.delete).toHaveBeenCalledWith('org-1', 'acc-1');
    });

    it('should throw NotFoundException when account not found', async () => {
      accountRepository.findById.mockResolvedValue(null);

      await expect(service.delete('org-1', 'non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should unassign from proxy when deleting account with proxy', async () => {
      const accountWithProxy = { ...mockAccount, proxyId: 'proxy-1' };
      accountRepository.findById.mockResolvedValue(accountWithProxy);

      await service.delete('org-1', 'acc-1');

      expect(proxyRepository.unassignAccount).toHaveBeenCalledWith('org-1', 'proxy-1', 'acc-1');
    });
  });

  describe('updateStatus', () => {
    it('should update account status', async () => {
      accountRepository.findById.mockResolvedValue(mockAccount);

      const result = await service.updateStatus('org-1', 'acc-1', AccountStatus.SUSPENDED);

      expect(accountRepository.updateStatus).toHaveBeenCalledWith('org-1', 'acc-1', AccountStatus.SUSPENDED);
    });

    it('should throw NotFoundException when account not found', async () => {
      accountRepository.findById.mockResolvedValue(null);

      await expect(service.updateStatus('org-1', 'non-existent', AccountStatus.ACTIVE)).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignProxy', () => {
    it('should assign new proxy to account', async () => {
      accountRepository.findById.mockResolvedValue(mockAccount);
      proxyRepository.findById.mockResolvedValue(mockProxy);

      await service.assignProxy('org-1', 'acc-1', 'proxy-1');

      expect(proxyRepository.assignAccount).toHaveBeenCalledWith('org-1', 'proxy-1', 'acc-1');
      expect(accountRepository.assignProxy).toHaveBeenCalledWith('org-1', 'acc-1', 'proxy-1');
    });

    it('should unassign current proxy and assign new one', async () => {
      const accountWithProxy = { ...mockAccount, proxyId: 'old-proxy' };
      accountRepository.findById.mockResolvedValue(accountWithProxy);
      proxyRepository.findById.mockResolvedValue(mockProxy);

      await service.assignProxy('org-1', 'acc-1', 'proxy-1');

      expect(proxyRepository.unassignAccount).toHaveBeenCalledWith('org-1', 'old-proxy', 'acc-1');
      expect(proxyRepository.assignAccount).toHaveBeenCalledWith('org-1', 'proxy-1', 'acc-1');
    });

    it('should unassign proxy when null provided', async () => {
      const accountWithProxy = { ...mockAccount, proxyId: 'proxy-1' };
      accountRepository.findById.mockResolvedValue(accountWithProxy);

      await service.assignProxy('org-1', 'acc-1', null);

      expect(proxyRepository.unassignAccount).toHaveBeenCalledWith('org-1', 'proxy-1', 'acc-1');
      expect(proxyRepository.assignAccount).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when account not found', async () => {
      accountRepository.findById.mockResolvedValue(null);

      await expect(service.assignProxy('org-1', 'non-existent', 'proxy-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when proxy not found', async () => {
      accountRepository.findById.mockResolvedValue(mockAccount);
      proxyRepository.findById.mockResolvedValue(null);

      await expect(service.assignProxy('org-1', 'acc-1', 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkImport', () => {
    const bulkImportDto: BulkImportAccountDto = {
      soulId: 'soul-1',
      platform: Platform.TWITTER,
      csvData: 'handle,displayName\nuser1,User One\nuser2,User Two',
    };

    it('should import accounts from CSV', async () => {
      soulRepository.findById.mockResolvedValue(mockSoul);
      accountRepository.findByHandle.mockResolvedValue(null);
      accountRepository.createBatch.mockResolvedValue(['acc-1', 'acc-2']);

      const result = await service.bulkImport('org-1', bulkImportDto);

      expect(result.total).toBe(2);
      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.createdIds).toEqual(['acc-1', 'acc-2']);
    });

    it('should throw NotFoundException when soul not found', async () => {
      soulRepository.findById.mockResolvedValue(null);

      await expect(service.bulkImport('org-1', bulkImportDto)).rejects.toThrow(NotFoundException);
    });

    it('should handle duplicate handles in bulk import', async () => {
      soulRepository.findById.mockResolvedValue(mockSoul);
      accountRepository.findByHandle.mockResolvedValueOnce(mockAccount).mockResolvedValueOnce(null);
      accountRepository.createBatch.mockResolvedValue(['acc-2']);

      const result = await service.bulkImport('org-1', bulkImportDto);

      expect(result.total).toBe(2);
      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors.length).toBe(1);
    });
  });

  describe('getAllCounts', () => {
    it('should return all counts in parallel', async () => {
      accountRepository.count.mockResolvedValue(100);
      accountRepository.countByStatus.mockResolvedValue(50);
      accountRepository.countByPlatform.mockResolvedValue(25);

      const result = await service.getAllCounts('org-1');

      expect(result.total).toBe(100);
      expect(result.byStatus).toBeDefined();
      expect(result.byPlatform).toBeDefined();
      expect(Object.keys(result.byStatus).length).toBe(Object.keys(AccountStatus).length);
      expect(Object.keys(result.byPlatform).length).toBe(Object.keys(Platform).length);
    });
  });

  // ===== Phase 2: Account-Integration Linking Tests =====

  const mockIntegration = {
    id: 'int-1',
    name: '@testuser',
    providerIdentifier: 'twitter',
    picture: null,
    type: 'social',
    disabled: false,
  };

  describe('linkToIntegration', () => {
    it('should link account when platform matches', async () => {
      accountRepository.findById.mockResolvedValue(mockAccount); // platform: TWITTER
      matrixRepository.getIntegration.mockResolvedValue(mockIntegration as any); // providerIdentifier: twitter
      accountRepository.findByIntegrationId.mockResolvedValue(null);
      accountRepository.linkIntegration.mockResolvedValue(undefined);
      accountRepository.findById.mockResolvedValue({ ...mockAccount, integrationId: 'int-1' } as any);

      const result = await service.linkToIntegration('org-1', 'acc-1', 'int-1');

      expect(accountRepository.linkIntegration).toHaveBeenCalledWith('org-1', 'acc-1', 'int-1');
    });

    it('should throw NotFoundException when account not found', async () => {
      accountRepository.findById.mockResolvedValue(null);

      await expect(service.linkToIntegration('org-1', 'bad-id', 'int-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when integration not found', async () => {
      accountRepository.findById.mockResolvedValue(mockAccount);
      matrixRepository.getIntegration.mockResolvedValue(null);

      await expect(service.linkToIntegration('org-1', 'acc-1', 'bad-int')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on platform mismatch', async () => {
      accountRepository.findById.mockResolvedValue(mockAccount); // TWITTER
      matrixRepository.getIntegration.mockResolvedValue({
        ...mockIntegration,
        providerIdentifier: 'instagram', // MISMATCH
      } as any);

      await expect(service.linkToIntegration('org-1', 'acc-1', 'int-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when integration already linked to another account', async () => {
      accountRepository.findById.mockResolvedValue(mockAccount);
      matrixRepository.getIntegration.mockResolvedValue(mockIntegration as any);
      accountRepository.findByIntegrationId.mockResolvedValue({ ...mockAccount, id: 'other-acc' } as any);

      await expect(service.linkToIntegration('org-1', 'acc-1', 'int-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('unlinkFromIntegration', () => {
    it('should unlink when account has integration', async () => {
      accountRepository.findById.mockResolvedValue({ ...mockAccount, integrationId: 'int-1' } as any);
      accountRepository.unlinkIntegration.mockResolvedValue(undefined);
      accountRepository.findById.mockResolvedValue(mockAccount);

      await service.unlinkFromIntegration('org-1', 'acc-1');

      expect(accountRepository.unlinkIntegration).toHaveBeenCalledWith('org-1', 'acc-1');
    });

    it('should throw NotFoundException when account not found', async () => {
      accountRepository.findById.mockResolvedValue(null);

      await expect(service.unlinkFromIntegration('org-1', 'bad-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when not linked', async () => {
      accountRepository.findById.mockResolvedValue(mockAccount); // no integrationId

      await expect(service.unlinkFromIntegration('org-1', 'acc-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('autoLinkByHandle', () => {
    it('should match account by exact handle', async () => {
      matrixRepository.getIntegration.mockResolvedValue(mockIntegration as any);
      accountRepository.findBySoulIdAndPlatform.mockResolvedValue([
        { ...mockAccount, handle: 'testuser' },
      ]);
      accountRepository.findByIntegrationId.mockResolvedValue(null);
      accountRepository.linkIntegration.mockResolvedValue(undefined);

      const result = await service.autoLinkByHandle('org-1', 'soul-1', 'int-1');

      expect(result).toBe('acc-1');
      expect(accountRepository.linkIntegration).toHaveBeenCalled();
    });

    it('should fallback to first unlinked account when no exact match', async () => {
      matrixRepository.getIntegration.mockResolvedValue({ ...mockIntegration, name: 'nomatch' } as any);
      accountRepository.findBySoulIdAndPlatform.mockResolvedValue([mockAccount]);
      accountRepository.findByIntegrationId.mockResolvedValue(null);
      accountRepository.linkIntegration.mockResolvedValue(undefined);

      const result = await service.autoLinkByHandle('org-1', 'soul-1', 'int-1');

      expect(result).toBe('acc-1');
    });

    it('should return null when no accounts match platform', async () => {
      matrixRepository.getIntegration.mockResolvedValue(mockIntegration as any);
      accountRepository.findBySoulIdAndPlatform.mockResolvedValue([]);

      const result = await service.autoLinkByHandle('org-1', 'soul-1', 'int-1');

      expect(result).toBeNull();
    });

    it('should return existing ID when integration already linked', async () => {
      matrixRepository.getIntegration.mockResolvedValue(mockIntegration as any);
      accountRepository.findBySoulIdAndPlatform.mockResolvedValue([mockAccount]);
      accountRepository.findByIntegrationId.mockResolvedValue({ ...mockAccount, id: 'existing-acc' } as any);

      const result = await service.autoLinkByHandle('org-1', 'soul-1', 'int-1');

      expect(result).toBe('existing-acc');
    });

    it('should return null when integration not found', async () => {
      matrixRepository.getIntegration.mockResolvedValue(null);

      const result = await service.autoLinkByHandle('org-1', 'soul-1', 'bad-int');

      expect(result).toBeNull();
    });
  });
});
