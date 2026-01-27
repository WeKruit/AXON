import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { SoulService } from './soul.service';
import { SoulRepository } from './soul.repository';
import { OrganizationRepository } from '@gitroom/nestjs-libraries/database/prisma/organizations/organization.repository';
import {
  SoulType,
  Soul,
  CreateSoulDto,
  UpdateSoulDto,
  SoulStatus,
} from '@gitroom/nestjs-libraries/dtos/axon';

describe('SoulService', () => {
  let service: SoulService;
  let repository: jest.Mocked<SoulRepository>;
  let orgRepository: jest.Mocked<OrganizationRepository>;

  const mockSoul: Soul = {
    id: 'soul-1',
    organizationId: 'org-1',
    name: 'Test Soul',
    status: SoulStatus.ACTIVE,
    type: SoulType.EMAIL,
    email: 'test@example.com',
    displayName: 'Test Soul',
    firstName: 'Test',
    lastName: 'Soul',
    accountIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSoulOrg = {
    id: 'soul-org-1',
    name: 'Soul: Test Soul',
    isSoulOrg: true,
    soulId: 'soul-1',
    parentOrgId: 'org-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addAccountId: jest.fn(),
      removeAccountId: jest.fn(),
      count: jest.fn(),
      countByPersona: jest.fn(),
    };

    const mockOrgRepository = {
      createSoulOrg: jest.fn(),
      disableSoulOrg: jest.fn(),
      getSoulOrgBySoulId: jest.fn(),
      getOrgsByUserId: jest.fn(),
      getOrgById: jest.fn(),
      getOrgByApiKey: jest.fn(),
      createOrgAndUser: jest.fn(),
      getCount: jest.fn(),
      getUserOrg: jest.fn(),
      getImpersonateUser: jest.fn(),
      updateApiKey: jest.fn(),
      addUserToOrg: jest.fn(),
      getOrgByCustomerId: jest.fn(),
      getTeam: jest.fn(),
      getAllUsersOrgs: jest.fn(),
      deleteTeamMember: jest.fn(),
      disableOrEnableNonSuperAdminUsers: jest.fn(),
      getShortlinkPreference: jest.fn(),
      updateShortlinkPreference: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SoulService,
        { provide: SoulRepository, useValue: mockRepository },
        { provide: OrganizationRepository, useValue: mockOrgRepository },
      ],
    }).compile();

    service = module.get<SoulService>(SoulService);
    repository = module.get(SoulRepository);
    orgRepository = module.get(OrganizationRepository);
  });

  describe('create', () => {
    const createDto: CreateSoulDto = {
      name: 'New Soul',
      type: SoulType.EMAIL,
      email: 'new@example.com',
      displayName: 'New Soul',
      firstName: 'New',
      lastName: 'Soul',
    };

    it('should create soul when valid data provided', async () => {
      repository.create.mockResolvedValue(mockSoul);

      const result = await service.create('org-1', createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('soul-1');
      expect(repository.create).toHaveBeenCalled();
    });

    it('should create soul-org when userId is provided', async () => {
      repository.create.mockResolvedValue(mockSoul);
      orgRepository.createSoulOrg.mockResolvedValue(mockSoulOrg as any);
      repository.update.mockResolvedValue(undefined);

      const result = await service.create('org-1', createDto, 'user-1');

      expect(orgRepository.createSoulOrg).toHaveBeenCalledWith(
        'New Soul',
        'soul-1',
        'org-1',
        'user-1',
      );
      expect(repository.update).toHaveBeenCalledWith('org-1', 'soul-1', {
        soulOrgId: 'soul-org-1',
      });
      expect(result.soulOrgId).toBe('soul-org-1');
    });

    it('should not create soul-org when userId is not provided', async () => {
      repository.create.mockResolvedValue(mockSoul);

      await service.create('org-1', createDto);

      expect(orgRepository.createSoulOrg).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return soul when found', async () => {
      repository.findById.mockResolvedValue(mockSoul);

      const result = await service.findById('org-1', 'soul-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('soul-1');
    });

    it('should throw NotFoundException when soul not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('org-1', 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of souls', async () => {
      repository.findAll.mockResolvedValue({ data: [mockSoul], hasMore: false });

      const result = await service.findAll('org-1', { limit: 20 });

      expect(result.data.length).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('should filter by type', async () => {
      repository.findAll.mockResolvedValue({ data: [mockSoul], hasMore: false });

      await service.findAll('org-1', { type: SoulType.EMAIL });

      expect(repository.findAll).toHaveBeenCalledWith('org-1', { type: SoulType.EMAIL });
    });
  });

  describe('update', () => {
    const updateDto: UpdateSoulDto = {
      displayName: 'Updated Soul',
    };

    it('should update soul when valid data provided', async () => {
      repository.findById.mockResolvedValue(mockSoul);

      const result = await service.update('org-1', 'soul-1', updateDto);

      expect(result).toBeDefined();
      expect(repository.update).toHaveBeenCalledWith('org-1', 'soul-1', updateDto);
    });

    it('should throw NotFoundException when soul not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('org-1', 'non-existent', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when updating to existing email', async () => {
      repository.findById.mockResolvedValue(mockSoul);
      const existingSoul = { ...mockSoul, id: 'soul-2', email: 'existing@example.com' };
      repository.findByEmail.mockResolvedValue(existingSoul);

      await expect(service.update('org-1', 'soul-1', { email: 'existing@example.com' })).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should delete soul when no accounts linked', async () => {
      repository.findById.mockResolvedValue(mockSoul);
      orgRepository.getSoulOrgBySoulId.mockResolvedValue(null);

      await service.delete('org-1', 'soul-1');

      expect(repository.delete).toHaveBeenCalledWith('org-1', 'soul-1');
    });

    it('should disable soul-org when deleting a soul that has one', async () => {
      repository.findById.mockResolvedValue(mockSoul);
      orgRepository.getSoulOrgBySoulId.mockResolvedValue(mockSoulOrg as any);

      await service.delete('org-1', 'soul-1');

      expect(orgRepository.disableSoulOrg).toHaveBeenCalledWith('soul-org-1');
      expect(repository.delete).toHaveBeenCalledWith('org-1', 'soul-1');
    });

    it('should throw NotFoundException when soul not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.delete('org-1', 'non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when soul has linked accounts', async () => {
      const soulWithAccounts = { ...mockSoul, accountIds: ['acc-1', 'acc-2'] };
      repository.findById.mockResolvedValue(soulWithAccounts);

      await expect(service.delete('org-1', 'soul-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('getCount', () => {
    it('should return total count', async () => {
      repository.count.mockResolvedValue(100);

      const result = await service.getCount('org-1');

      expect(result).toBe(100);
    });
  });
});
