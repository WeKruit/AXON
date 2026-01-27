import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { AccountService } from '@gitroom/nestjs-libraries/database/firestore/collections/accounts/account.service';
import { Organization } from '@prisma/client';
import {
  Platform,
  AccountStatus,
  CreateAccountDto,
  UpdateAccountDto,
  AccountResponseDto,
  BulkImportAccountDto,
  UpdateAccountStatusDto,
  AssignAccountProxyDto,
} from '@gitroom/nestjs-libraries/dtos/axon';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('AccountsController', () => {
  let controller: AccountsController;
  let accountService: jest.Mocked<AccountService>;

  const mockOrganization: Partial<Organization> = {
    id: 'org-123',
    name: 'Test Org',
  };

  const mockAccountResponse: AccountResponseDto = {
    id: 'acc-1',
    organizationId: 'org-123',
    soulId: 'soul-1',
    platform: Platform.TWITTER,
    handle: 'testuser',
    displayName: 'Test User',
    status: AccountStatus.ACTIVE,
    tags: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const mockAccountService = {
      create: jest.fn(),
      bulkImport: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findBySoulId: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      assignProxy: jest.fn(),
      delete: jest.fn(),
      getAllCounts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        { provide: AccountService, useValue: mockAccountService },
      ],
    }).compile();

    controller = module.get<AccountsController>(AccountsController);
    accountService = module.get(AccountService);
  });

  describe('create', () => {
    const createDto: CreateAccountDto = {
      soulId: 'soul-1',
      platform: Platform.TWITTER,
      handle: 'newuser',
      displayName: 'New User',
    };

    it('should create account successfully', async () => {
      accountService.create.mockResolvedValue(mockAccountResponse);

      const result = await controller.create(
        mockOrganization as Organization,
        createDto
      );

      expect(result).toEqual(mockAccountResponse);
      expect(accountService.create).toHaveBeenCalledWith('org-123', createDto);
    });

    it('should pass organization ID to service', async () => {
      accountService.create.mockResolvedValue(mockAccountResponse);

      await controller.create(mockOrganization as Organization, createDto);

      expect(accountService.create).toHaveBeenCalledWith('org-123', createDto);
    });

    it('should return 404 when soul not found', async () => {
      accountService.create.mockRejectedValue(new NotFoundException('Soul not found'));

      await expect(
        controller.create(mockOrganization as Organization, createDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should return 404 when proxy not found', async () => {
      const dtoWithProxy = { ...createDto, proxyId: 'nonexistent' };
      accountService.create.mockRejectedValue(new NotFoundException('Proxy not found'));

      await expect(
        controller.create(mockOrganization as Organization, dtoWithProxy)
      ).rejects.toThrow(NotFoundException);
    });

    it('should return 409 when handle already exists', async () => {
      accountService.create.mockRejectedValue(
        new ConflictException('Account with handle already exists')
      );

      await expect(
        controller.create(mockOrganization as Organization, createDto)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('bulkImport', () => {
    const bulkImportDto: BulkImportAccountDto = {
      soulId: 'soul-1',
      platform: Platform.TWITTER,
      csvData: 'handle,displayName\nuser1,User One\nuser2,User Two',
    };

    it('should bulk import accounts successfully', async () => {
      const mockResult = {
        total: 2,
        success: 2,
        failed: 0,
        errors: [] as Array<{ row: number; error: string }>,
        createdIds: ['acc-1', 'acc-2'],
      };
      accountService.bulkImport.mockResolvedValue(mockResult);

      const result = await controller.bulkImport(
        mockOrganization as Organization,
        bulkImportDto
      );

      expect(result).toEqual(mockResult);
      expect(accountService.bulkImport).toHaveBeenCalledWith('org-123', bulkImportDto);
    });

    it('should return 404 when soul not found', async () => {
      accountService.bulkImport.mockRejectedValue(new NotFoundException('Soul not found'));

      await expect(
        controller.bulkImport(mockOrganization as Organization, bulkImportDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should return 400 when CSV format is invalid', async () => {
      accountService.bulkImport.mockRejectedValue(
        new BadRequestException('CSV must have at least a header row and one data row')
      );

      await expect(
        controller.bulkImport(mockOrganization as Organization, bulkImportDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle partial import with errors', async () => {
      const mockResult = {
        total: 2,
        success: 1,
        failed: 1,
        errors: [{ row: 2, error: 'Account with handle already exists' }],
        createdIds: ['acc-1'],
      };
      accountService.bulkImport.mockResolvedValue(mockResult);

      const result = await controller.bulkImport(
        mockOrganization as Organization,
        bulkImportDto
      );

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of accounts', async () => {
      const mockResult = {
        data: [mockAccountResponse],
        hasMore: false,
      };
      accountService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(
        mockOrganization as Organization,
        {}
      );

      expect(result).toEqual(mockResult);
      expect(accountService.findAll).toHaveBeenCalledWith('org-123', {});
    });

    it('should pass filters to service', async () => {
      accountService.findAll.mockResolvedValue({ data: [], hasMore: false });

      await controller.findAll(mockOrganization as Organization, {
        platform: Platform.TWITTER,
        status: AccountStatus.ACTIVE,
        soulId: 'soul-1',
        limit: 10,
      });

      expect(accountService.findAll).toHaveBeenCalledWith('org-123', {
        platform: Platform.TWITTER,
        status: AccountStatus.ACTIVE,
        soulId: 'soul-1',
        limit: 10,
      });
    });

    it('should handle pagination cursor', async () => {
      accountService.findAll.mockResolvedValue({ data: [], hasMore: false });

      await controller.findAll(mockOrganization as Organization, {
        cursor: 'acc-cursor',
        limit: 20,
      });

      expect(accountService.findAll).toHaveBeenCalledWith('org-123', {
        cursor: 'acc-cursor',
        limit: 20,
      });
    });
  });

  describe('getCount', () => {
    it('should return account counts', async () => {
      const mockCounts = {
        total: 100,
        byStatus: {
          [AccountStatus.ACTIVE]: 80,
          [AccountStatus.WARMING]: 0,
          [AccountStatus.SUSPENDED]: 15,
          [AccountStatus.BANNED]: 0,
          [AccountStatus.NEEDS_VERIFICATION]: 0,
          [AccountStatus.INACTIVE]: 5,
        } as Record<AccountStatus, number>,
        byPlatform: {
          [Platform.TWITTER]: 40,
          [Platform.INSTAGRAM]: 30,
          [Platform.FACEBOOK]: 0,
          [Platform.LINKEDIN]: 30,
          [Platform.TIKTOK]: 0,
          [Platform.YOUTUBE]: 0,
          [Platform.REDDIT]: 0,
          [Platform.PINTEREST]: 0,
          [Platform.THREADS]: 0,
          [Platform.BLUESKY]: 0,
          [Platform.MASTODON]: 0,
        } as Record<Platform, number>,
      };
      accountService.getAllCounts.mockResolvedValue(mockCounts);

      const result = await controller.getCount(mockOrganization as Organization);

      expect(result.count).toBe(100);
      expect(result.byStatus).toEqual(mockCounts.byStatus);
      expect(result.byPlatform).toEqual(mockCounts.byPlatform);
    });
  });

  describe('findBySoulId', () => {
    it('should return accounts for a soul', async () => {
      const accounts = [mockAccountResponse];
      accountService.findBySoulId.mockResolvedValue(accounts);

      const result = await controller.findBySoulId(
        mockOrganization as Organization,
        'soul-1'
      );

      expect(result).toEqual(accounts);
      expect(accountService.findBySoulId).toHaveBeenCalledWith('org-123', 'soul-1');
    });

    it('should return empty array when soul has no accounts', async () => {
      accountService.findBySoulId.mockResolvedValue([]);

      const result = await controller.findBySoulId(
        mockOrganization as Organization,
        'soul-no-accounts'
      );

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return account by ID', async () => {
      accountService.findById.mockResolvedValue(mockAccountResponse);

      const result = await controller.findById(
        mockOrganization as Organization,
        'acc-1'
      );

      expect(result).toEqual(mockAccountResponse);
      expect(accountService.findById).toHaveBeenCalledWith('org-123', 'acc-1');
    });

    it('should return 404 when account not found', async () => {
      accountService.findById.mockRejectedValue(new NotFoundException('Account not found'));

      await expect(
        controller.findById(mockOrganization as Organization, 'nonexistent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateAccountDto = {
      displayName: 'Updated Name',
    };

    it('should update account successfully', async () => {
      const updatedAccount = { ...mockAccountResponse, displayName: 'Updated Name' };
      accountService.update.mockResolvedValue(updatedAccount);

      const result = await controller.update(
        mockOrganization as Organization,
        'acc-1',
        updateDto
      );

      expect(result.displayName).toBe('Updated Name');
      expect(accountService.update).toHaveBeenCalledWith('org-123', 'acc-1', updateDto);
    });

    it('should return 404 when account not found', async () => {
      accountService.update.mockRejectedValue(new NotFoundException('Account not found'));

      await expect(
        controller.update(mockOrganization as Organization, 'nonexistent', updateDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should return 404 when proxy not found', async () => {
      accountService.update.mockRejectedValue(new NotFoundException('Proxy not found'));

      await expect(
        controller.update(mockOrganization as Organization, 'acc-1', { proxyId: 'nonexistent' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should return 409 when updating to existing handle', async () => {
      accountService.update.mockRejectedValue(
        new ConflictException('Account with handle already exists')
      );

      await expect(
        controller.update(mockOrganization as Organization, 'acc-1', { handle: 'existing' })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateStatus', () => {
    it('should update account status', async () => {
      const updatedAccount = { ...mockAccountResponse, status: AccountStatus.SUSPENDED };
      accountService.updateStatus.mockResolvedValue(updatedAccount);

      const result = await controller.updateStatus(
        mockOrganization as Organization,
        'acc-1',
        { status: AccountStatus.SUSPENDED }
      );

      expect(result.status).toBe(AccountStatus.SUSPENDED);
      expect(accountService.updateStatus).toHaveBeenCalledWith(
        'org-123',
        'acc-1',
        AccountStatus.SUSPENDED
      );
    });

    it('should return 404 when account not found', async () => {
      accountService.updateStatus.mockRejectedValue(new NotFoundException('Account not found'));

      await expect(
        controller.updateStatus(mockOrganization as Organization, 'nonexistent', {
          status: AccountStatus.ACTIVE,
        })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignProxy', () => {
    it('should assign proxy to account', async () => {
      const accountWithProxy = { ...mockAccountResponse, proxyId: 'proxy-1' };
      accountService.assignProxy.mockResolvedValue(accountWithProxy);

      const result = await controller.assignProxy(
        mockOrganization as Organization,
        'acc-1',
        { proxyId: 'proxy-1' }
      );

      expect(result.proxyId).toBe('proxy-1');
      expect(accountService.assignProxy).toHaveBeenCalledWith('org-123', 'acc-1', 'proxy-1');
    });

    it('should unassign proxy when proxyId is null', async () => {
      accountService.assignProxy.mockResolvedValue(mockAccountResponse);

      await controller.assignProxy(
        mockOrganization as Organization,
        'acc-1',
        { proxyId: null }
      );

      expect(accountService.assignProxy).toHaveBeenCalledWith('org-123', 'acc-1', null);
    });

    it('should unassign proxy when proxyId is undefined', async () => {
      accountService.assignProxy.mockResolvedValue(mockAccountResponse);

      await controller.assignProxy(
        mockOrganization as Organization,
        'acc-1',
        {}
      );

      expect(accountService.assignProxy).toHaveBeenCalledWith('org-123', 'acc-1', null);
    });

    it('should return 404 when account not found', async () => {
      accountService.assignProxy.mockRejectedValue(new NotFoundException('Account not found'));

      await expect(
        controller.assignProxy(mockOrganization as Organization, 'nonexistent', { proxyId: 'proxy-1' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should return 404 when proxy not found', async () => {
      accountService.assignProxy.mockRejectedValue(new NotFoundException('Proxy not found'));

      await expect(
        controller.assignProxy(mockOrganization as Organization, 'acc-1', { proxyId: 'nonexistent' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete account successfully', async () => {
      accountService.delete.mockResolvedValue(undefined);

      await controller.delete(mockOrganization as Organization, 'acc-1');

      expect(accountService.delete).toHaveBeenCalledWith('org-123', 'acc-1');
    });

    it('should return 404 when account not found', async () => {
      accountService.delete.mockRejectedValue(new NotFoundException('Account not found'));

      await expect(
        controller.delete(mockOrganization as Organization, 'nonexistent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Authorization', () => {
    it('should use organization from request context', async () => {
      accountService.findById.mockResolvedValue(mockAccountResponse);

      // Different org ID
      const differentOrg: Partial<Organization> = { id: 'different-org', name: 'Different' };
      await controller.findById(differentOrg as Organization, 'acc-1');

      expect(accountService.findById).toHaveBeenCalledWith('different-org', 'acc-1');
    });
  });
});
