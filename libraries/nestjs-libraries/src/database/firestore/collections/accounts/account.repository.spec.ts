import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AccountRepository } from './account.repository';
import { FirestoreService } from '../../firestore.service';
import {
  Platform,
  AccountStatus,
  Account,
  CreateAccountDto,
  UpdateAccountDto,
  AccountListQueryDto,
} from '@gitroom/nestjs-libraries/dtos/axon';

describe('AccountRepository', () => {
  let repository: AccountRepository;
  let firestoreService: jest.Mocked<FirestoreService>;

  const mockOrganizationId = 'org-123';

  const mockAccount: Account = {
    id: 'acc-1',
    organizationId: mockOrganizationId,
    soulId: 'soul-1',
    platform: Platform.TWITTER,
    handle: 'testuser',
    displayName: 'Test User',
    status: AccountStatus.ACTIVE,
    credentials: {},
    tags: [],
    deletedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const mockFirestoreService = {
      create: jest.fn(),
      batchWrite: jest.fn(),
      generateId: jest.fn(),
      getById: jest.fn(),
      query: jest.fn(),
      queryPaginated: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountRepository,
        { provide: FirestoreService, useValue: mockFirestoreService },
      ],
    }).compile();

    repository = module.get<AccountRepository>(AccountRepository);
    firestoreService = module.get(FirestoreService);
  });

  describe('create', () => {
    const createDto: CreateAccountDto = {
      soulId: 'soul-1',
      platform: Platform.TWITTER,
      handle: 'newuser',
      displayName: 'New User',
    };

    it('should create account with required fields', async () => {
      firestoreService.create.mockResolvedValue(mockAccount);

      const result = await repository.create(mockOrganizationId, createDto);

      expect(result).toEqual(mockAccount);
      expect(firestoreService.create).toHaveBeenCalledWith(
        'accounts',
        expect.objectContaining({
          organizationId: mockOrganizationId,
          soulId: 'soul-1',
          platform: Platform.TWITTER,
          handle: 'newuser',
          displayName: 'New User',
          status: AccountStatus.ACTIVE,
          credentials: {},
          tags: [],
          deletedAt: null,
        })
      );
    });

    it('should create account with all optional fields', async () => {
      const fullDto: CreateAccountDto = {
        ...createDto,
        platformUserId: 'platform-123',
        profileUrl: 'https://twitter.com/newuser',
        avatarUrl: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
        status: AccountStatus.SUSPENDED,
        credentials: { password: 'encrypted' },
        proxyId: 'proxy-1',
        warmingConfig: { enabled: true },
        notes: 'Test notes',
        tags: ['tag1', 'tag2'],
      };

      firestoreService.create.mockResolvedValue({ ...mockAccount, ...fullDto });

      await repository.create(mockOrganizationId, fullDto);

      expect(firestoreService.create).toHaveBeenCalledWith(
        'accounts',
        expect.objectContaining({
          platformUserId: 'platform-123',
          profileUrl: 'https://twitter.com/newuser',
          proxyId: 'proxy-1',
          tags: ['tag1', 'tag2'],
        })
      );
    });
  });

  describe('createBatch', () => {
    it('should batch create multiple accounts', async () => {
      const accounts: CreateAccountDto[] = [
        { soulId: 'soul-1', platform: Platform.TWITTER, handle: 'user1', displayName: 'User 1' },
        { soulId: 'soul-1', platform: Platform.TWITTER, handle: 'user2', displayName: 'User 2' },
      ];

      firestoreService.generateId
        .mockReturnValueOnce('acc-1')
        .mockReturnValueOnce('acc-2');
      firestoreService.batchWrite.mockResolvedValue(undefined);

      const result = await repository.createBatch(mockOrganizationId, accounts);

      expect(result).toEqual(['acc-1', 'acc-2']);
      expect(firestoreService.batchWrite).toHaveBeenCalledWith(
        'accounts',
        expect.arrayContaining([
          expect.objectContaining({ type: 'create', id: 'acc-1' }),
          expect.objectContaining({ type: 'create', id: 'acc-2' }),
        ])
      );
    });

    it('should return empty array for empty input', async () => {
      firestoreService.batchWrite.mockResolvedValue(undefined);

      const result = await repository.createBatch(mockOrganizationId, []);

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return account when found and belongs to org', async () => {
      firestoreService.getById.mockResolvedValue(mockAccount);

      const result = await repository.findById(mockOrganizationId, 'acc-1');

      expect(result).toEqual(mockAccount);
      expect(firestoreService.getById).toHaveBeenCalledWith('accounts', 'acc-1');
    });

    it('should return null when account not found', async () => {
      firestoreService.getById.mockResolvedValue(null);

      const result = await repository.findById(mockOrganizationId, 'nonexistent');

      expect(result).toBeNull();
    });

    it('should return null when account belongs to different org', async () => {
      firestoreService.getById.mockResolvedValue({
        ...mockAccount,
        organizationId: 'different-org',
      });

      const result = await repository.findById(mockOrganizationId, 'acc-1');

      expect(result).toBeNull();
    });

    it('should return null when account is soft deleted', async () => {
      firestoreService.getById.mockResolvedValue({
        ...mockAccount,
        deletedAt: new Date(),
      });

      const result = await repository.findById(mockOrganizationId, 'acc-1');

      expect(result).toBeNull();
    });
  });

  describe('findByHandle', () => {
    it('should find account by platform and handle', async () => {
      firestoreService.query.mockResolvedValue([mockAccount]);

      const result = await repository.findByHandle(
        mockOrganizationId,
        Platform.TWITTER,
        'testuser'
      );

      expect(result).toEqual(mockAccount);
      expect(firestoreService.query).toHaveBeenCalledWith(
        'accounts',
        expect.objectContaining({
          where: expect.arrayContaining([
            { field: 'organizationId', operator: '==', value: mockOrganizationId },
            { field: 'platform', operator: '==', value: Platform.TWITTER },
            { field: 'handle', operator: '==', value: 'testuser' },
            { field: 'deletedAt', operator: '==', value: null },
          ]),
          limit: 1,
        })
      );
    });

    it('should return null when no matching account found', async () => {
      firestoreService.query.mockResolvedValue([]);

      const result = await repository.findByHandle(
        mockOrganizationId,
        Platform.TWITTER,
        'nonexistent'
      );

      expect(result).toBeNull();
    });
  });

  describe('findBySoulId', () => {
    it('should return all accounts for a soul', async () => {
      const accounts = [mockAccount, { ...mockAccount, id: 'acc-2', handle: 'user2' }];
      firestoreService.query.mockResolvedValue(accounts);

      const result = await repository.findBySoulId(mockOrganizationId, 'soul-1');

      expect(result).toEqual(accounts);
      expect(firestoreService.query).toHaveBeenCalledWith(
        'accounts',
        expect.objectContaining({
          where: expect.arrayContaining([
            { field: 'organizationId', operator: '==', value: mockOrganizationId },
            { field: 'soulId', operator: '==', value: 'soul-1' },
            { field: 'deletedAt', operator: '==', value: null },
          ]),
        })
      );
    });

    it('should return empty array when soul has no accounts', async () => {
      firestoreService.query.mockResolvedValue([]);

      const result = await repository.findBySoulId(mockOrganizationId, 'soul-no-accounts');

      expect(result).toEqual([]);
    });
  });

  describe('findByProxyId', () => {
    it('should return all accounts using a proxy', async () => {
      const accounts = [mockAccount];
      firestoreService.query.mockResolvedValue(accounts);

      const result = await repository.findByProxyId(mockOrganizationId, 'proxy-1');

      expect(result).toEqual(accounts);
      expect(firestoreService.query).toHaveBeenCalledWith(
        'accounts',
        expect.objectContaining({
          where: expect.arrayContaining([
            { field: 'proxyId', operator: '==', value: 'proxy-1' },
          ]),
        })
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated accounts', async () => {
      const query: AccountListQueryDto = { limit: 10 };
      firestoreService.queryPaginated.mockResolvedValue({
        data: [mockAccount],
        hasMore: false,
      });

      const result = await repository.findAll(mockOrganizationId, query);

      expect(result).toEqual({ data: [mockAccount], hasMore: false });
    });

    it('should apply platform filter', async () => {
      const query: AccountListQueryDto = { platform: Platform.TWITTER };
      firestoreService.queryPaginated.mockResolvedValue({ data: [], hasMore: false });

      await repository.findAll(mockOrganizationId, query);

      expect(firestoreService.queryPaginated).toHaveBeenCalledWith(
        'accounts',
        expect.objectContaining({
          where: expect.arrayContaining([
            { field: 'platform', operator: '==', value: Platform.TWITTER },
          ]),
        })
      );
    });

    it('should apply status filter', async () => {
      const query: AccountListQueryDto = { status: AccountStatus.SUSPENDED };
      firestoreService.queryPaginated.mockResolvedValue({ data: [], hasMore: false });

      await repository.findAll(mockOrganizationId, query);

      expect(firestoreService.queryPaginated).toHaveBeenCalledWith(
        'accounts',
        expect.objectContaining({
          where: expect.arrayContaining([
            { field: 'status', operator: '==', value: AccountStatus.SUSPENDED },
          ]),
        })
      );
    });

    it('should apply soulId filter', async () => {
      const query: AccountListQueryDto = { soulId: 'soul-1' };
      firestoreService.queryPaginated.mockResolvedValue({ data: [], hasMore: false });

      await repository.findAll(mockOrganizationId, query);

      expect(firestoreService.queryPaginated).toHaveBeenCalledWith(
        'accounts',
        expect.objectContaining({
          where: expect.arrayContaining([
            { field: 'soulId', operator: '==', value: 'soul-1' },
          ]),
        })
      );
    });

    it('should apply proxyId filter', async () => {
      const query: AccountListQueryDto = { proxyId: 'proxy-1' };
      firestoreService.queryPaginated.mockResolvedValue({ data: [], hasMore: false });

      await repository.findAll(mockOrganizationId, query);

      expect(firestoreService.queryPaginated).toHaveBeenCalledWith(
        'accounts',
        expect.objectContaining({
          where: expect.arrayContaining([
            { field: 'proxyId', operator: '==', value: 'proxy-1' },
          ]),
        })
      );
    });

    it('should handle cursor pagination', async () => {
      const cursorAccount = { ...mockAccount, createdAt: new Date('2024-01-01') };
      firestoreService.getById.mockResolvedValue(cursorAccount);
      firestoreService.queryPaginated.mockResolvedValue({ data: [], hasMore: false });

      await repository.findAll(mockOrganizationId, { cursor: 'acc-cursor' });

      expect(firestoreService.getById).toHaveBeenCalledWith('accounts', 'acc-cursor');
      expect(firestoreService.queryPaginated).toHaveBeenCalledWith(
        'accounts',
        expect.objectContaining({
          startAfter: cursorAccount.createdAt,
        })
      );
    });

    it('should use default limit of 20', async () => {
      firestoreService.queryPaginated.mockResolvedValue({ data: [], hasMore: false });

      await repository.findAll(mockOrganizationId, {});

      expect(firestoreService.queryPaginated).toHaveBeenCalledWith(
        'accounts',
        expect.objectContaining({
          limit: 20,
        })
      );
    });
  });

  describe('update', () => {
    it('should update account fields', async () => {
      firestoreService.getById.mockResolvedValue(mockAccount);
      firestoreService.update.mockResolvedValue(undefined);

      const updateDto: UpdateAccountDto = { displayName: 'Updated Name' };
      await repository.update(mockOrganizationId, 'acc-1', updateDto);

      expect(firestoreService.update).toHaveBeenCalledWith(
        'accounts',
        'acc-1',
        { displayName: 'Updated Name' }
      );
    });

    it('should throw NotFoundException when account not found', async () => {
      firestoreService.getById.mockResolvedValue(null);

      await expect(
        repository.update(mockOrganizationId, 'nonexistent', { displayName: 'Test' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should only update provided fields', async () => {
      firestoreService.getById.mockResolvedValue(mockAccount);
      firestoreService.update.mockResolvedValue(undefined);

      await repository.update(mockOrganizationId, 'acc-1', {
        handle: 'newhandle',
        bio: 'new bio',
      });

      expect(firestoreService.update).toHaveBeenCalledWith(
        'accounts',
        'acc-1',
        { handle: 'newhandle', bio: 'new bio' }
      );
    });
  });

  describe('delete', () => {
    it('should soft delete account', async () => {
      firestoreService.getById.mockResolvedValue(mockAccount);
      firestoreService.softDelete.mockResolvedValue(undefined);

      await repository.delete(mockOrganizationId, 'acc-1');

      expect(firestoreService.softDelete).toHaveBeenCalledWith('accounts', 'acc-1');
    });

    it('should throw NotFoundException when account not found', async () => {
      firestoreService.getById.mockResolvedValue(null);

      await expect(
        repository.delete(mockOrganizationId, 'nonexistent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update account status', async () => {
      firestoreService.getById.mockResolvedValue(mockAccount);
      firestoreService.update.mockResolvedValue(undefined);

      await repository.updateStatus(mockOrganizationId, 'acc-1', AccountStatus.SUSPENDED);

      expect(firestoreService.update).toHaveBeenCalledWith(
        'accounts',
        'acc-1',
        { status: AccountStatus.SUSPENDED }
      );
    });

    it('should throw NotFoundException when account not found', async () => {
      firestoreService.getById.mockResolvedValue(null);

      await expect(
        repository.updateStatus(mockOrganizationId, 'nonexistent', AccountStatus.ACTIVE)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateLastActivity', () => {
    it('should update lastActivityAt timestamp', async () => {
      firestoreService.getById.mockResolvedValue(mockAccount);
      firestoreService.update.mockResolvedValue(undefined);

      await repository.updateLastActivity(mockOrganizationId, 'acc-1');

      expect(firestoreService.update).toHaveBeenCalledWith(
        'accounts',
        'acc-1',
        { lastActivityAt: expect.any(Date) }
      );
    });

    it('should throw NotFoundException when account not found', async () => {
      firestoreService.getById.mockResolvedValue(null);

      await expect(
        repository.updateLastActivity(mockOrganizationId, 'nonexistent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignProxy', () => {
    it('should assign proxy to account', async () => {
      firestoreService.getById.mockResolvedValue(mockAccount);
      firestoreService.update.mockResolvedValue(undefined);

      await repository.assignProxy(mockOrganizationId, 'acc-1', 'proxy-1');

      expect(firestoreService.update).toHaveBeenCalledWith(
        'accounts',
        'acc-1',
        { proxyId: 'proxy-1' }
      );
    });

    it('should unassign proxy when null provided', async () => {
      firestoreService.getById.mockResolvedValue(mockAccount);
      firestoreService.update.mockResolvedValue(undefined);

      await repository.assignProxy(mockOrganizationId, 'acc-1', null);

      expect(firestoreService.update).toHaveBeenCalledWith(
        'accounts',
        'acc-1',
        { proxyId: undefined }
      );
    });

    it('should throw NotFoundException when account not found', async () => {
      firestoreService.getById.mockResolvedValue(null);

      await expect(
        repository.assignProxy(mockOrganizationId, 'nonexistent', 'proxy-1')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('count', () => {
    it('should return total count of non-deleted accounts', async () => {
      firestoreService.count.mockResolvedValue(42);

      const result = await repository.count(mockOrganizationId);

      expect(result).toBe(42);
      expect(firestoreService.count).toHaveBeenCalledWith(
        'accounts',
        expect.objectContaining({
          where: expect.arrayContaining([
            { field: 'organizationId', operator: '==', value: mockOrganizationId },
            { field: 'deletedAt', operator: '==', value: null },
          ]),
        })
      );
    });
  });

  describe('countByStatus', () => {
    it('should return count of accounts by status', async () => {
      firestoreService.count.mockResolvedValue(10);

      const result = await repository.countByStatus(mockOrganizationId, AccountStatus.ACTIVE);

      expect(result).toBe(10);
      expect(firestoreService.count).toHaveBeenCalledWith(
        'accounts',
        expect.objectContaining({
          where: expect.arrayContaining([
            { field: 'status', operator: '==', value: AccountStatus.ACTIVE },
          ]),
        })
      );
    });
  });

  describe('countByPlatform', () => {
    it('should return count of accounts by platform', async () => {
      firestoreService.count.mockResolvedValue(15);

      const result = await repository.countByPlatform(mockOrganizationId, Platform.TWITTER);

      expect(result).toBe(15);
      expect(firestoreService.count).toHaveBeenCalledWith(
        'accounts',
        expect.objectContaining({
          where: expect.arrayContaining([
            { field: 'platform', operator: '==', value: Platform.TWITTER },
          ]),
        })
      );
    });
  });

  describe('countBySoulId', () => {
    it('should return count of accounts for a soul', async () => {
      firestoreService.count.mockResolvedValue(3);

      const result = await repository.countBySoulId(mockOrganizationId, 'soul-1');

      expect(result).toBe(3);
      expect(firestoreService.count).toHaveBeenCalledWith(
        'accounts',
        expect.objectContaining({
          where: expect.arrayContaining([
            { field: 'soulId', operator: '==', value: 'soul-1' },
          ]),
        })
      );
    });
  });

  describe('Database Error Handling', () => {
    it('should propagate database errors on create', async () => {
      firestoreService.create.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        repository.create(mockOrganizationId, {
          soulId: 'soul-1',
          platform: Platform.TWITTER,
          handle: 'test',
          displayName: 'Test',
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should propagate database errors on query', async () => {
      firestoreService.query.mockRejectedValue(new Error('Query timeout'));

      await expect(
        repository.findByHandle(mockOrganizationId, Platform.TWITTER, 'test')
      ).rejects.toThrow('Query timeout');
    });

    it('should propagate database errors on batch write', async () => {
      firestoreService.generateId.mockReturnValue('acc-1');
      firestoreService.batchWrite.mockRejectedValue(new Error('Batch operation failed'));

      await expect(
        repository.createBatch(mockOrganizationId, [
          { soulId: 'soul-1', platform: Platform.TWITTER, handle: 'user1', displayName: 'User 1' },
        ])
      ).rejects.toThrow('Batch operation failed');
    });
  });

  describe('Phase 2: Account-Integration Linking', () => {
    describe('linkIntegration', () => {
      it('should link integration to account', async () => {
        firestoreService.getById.mockResolvedValue(mockAccount);
        firestoreService.update.mockResolvedValue(undefined);

        await repository.linkIntegration(mockOrganizationId, 'acc-1', 'int-1');

        expect(firestoreService.update).toHaveBeenCalledWith(
          'accounts',
          'acc-1',
          { integrationId: 'int-1' }
        );
      });

      it('should throw NotFoundException when account not found', async () => {
        firestoreService.getById.mockResolvedValue(null);

        await expect(
          repository.linkIntegration(mockOrganizationId, 'nonexistent', 'int-1')
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException when account belongs to different org', async () => {
        firestoreService.getById.mockResolvedValue({
          ...mockAccount,
          organizationId: 'different-org',
        });

        await expect(
          repository.linkIntegration(mockOrganizationId, 'acc-1', 'int-1')
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('unlinkIntegration', () => {
      it('should unlink integration from account', async () => {
        const linkedAccount = { ...mockAccount, integrationId: 'int-1' };
        firestoreService.getById.mockResolvedValue(linkedAccount);
        firestoreService.update.mockResolvedValue(undefined);

        await repository.unlinkIntegration(mockOrganizationId, 'acc-1');

        expect(firestoreService.update).toHaveBeenCalledWith(
          'accounts',
          'acc-1',
          { integrationId: null }
        );
      });

      it('should throw NotFoundException when account not found', async () => {
        firestoreService.getById.mockResolvedValue(null);

        await expect(
          repository.unlinkIntegration(mockOrganizationId, 'nonexistent')
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('findByIntegrationId', () => {
      it('should return accounts linked to an integration', async () => {
        const linkedAccounts = [
          { ...mockAccount, integrationId: 'int-1' },
          { ...mockAccount, id: 'acc-2', handle: 'user2', integrationId: 'int-1' },
        ];
        firestoreService.query.mockResolvedValue(linkedAccounts);

        const result = await repository.findByIntegrationId(mockOrganizationId, 'int-1');

        expect(result).toEqual(linkedAccounts);
        expect(firestoreService.query).toHaveBeenCalledWith(
          'accounts',
          expect.objectContaining({
            where: expect.arrayContaining([
              { field: 'organizationId', operator: '==', value: mockOrganizationId },
              { field: 'integrationId', operator: '==', value: 'int-1' },
              { field: 'deletedAt', operator: '==', value: null },
            ]),
          })
        );
      });

      it('should return empty array when no accounts linked', async () => {
        firestoreService.query.mockResolvedValue([]);

        const result = await repository.findByIntegrationId(mockOrganizationId, 'int-no-accounts');

        expect(result).toEqual([]);
      });
    });

    describe('findBySoulIdAndPlatform', () => {
      it('should return accounts matching soul and platform', async () => {
        firestoreService.query.mockResolvedValue([mockAccount]);

        const result = await repository.findBySoulIdAndPlatform(
          mockOrganizationId,
          'soul-1',
          Platform.TWITTER
        );

        expect(result).toEqual([mockAccount]);
        expect(firestoreService.query).toHaveBeenCalledWith(
          'accounts',
          expect.objectContaining({
            where: expect.arrayContaining([
              { field: 'organizationId', operator: '==', value: mockOrganizationId },
              { field: 'soulId', operator: '==', value: 'soul-1' },
              { field: 'platform', operator: '==', value: Platform.TWITTER },
              { field: 'deletedAt', operator: '==', value: null },
            ]),
          })
        );
      });

      it('should return empty array when no match found', async () => {
        firestoreService.query.mockResolvedValue([]);

        const result = await repository.findBySoulIdAndPlatform(
          mockOrganizationId,
          'soul-1',
          Platform.INSTAGRAM
        );

        expect(result).toEqual([]);
      });
    });
  });
});
