import { Test, TestingModule } from '@nestjs/testing';
import { SoulsController } from './souls.controller';
import { SoulService } from '@gitroom/nestjs-libraries/database/firestore/collections/souls/soul.service';
import { Organization, User } from '@prisma/client';
import { SoulStatus } from '@gitroom/nestjs-libraries/dtos/axon';

describe('SoulsController', () => {
  let controller: SoulsController;
  let soulService: jest.Mocked<SoulService>;

  const mockOrganization: Partial<Organization> = {
    id: 'org-1',
    name: 'Test Org',
  };

  const mockUser: Partial<User> = {
    id: 'user-1',
    email: 'test@example.com',
  };

  const mockSoulResponse = {
    id: 'soul-1',
    organizationId: 'org-1',
    name: 'Test Soul',
    status: SoulStatus.ACTIVE,
    accountIds: [] as string[],
    accountCount: 0,
    soulOrgId: 'soul-org-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockSoulService = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getCount: jest.fn(),
      addAccount: jest.fn(),
      removeAccount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SoulsController],
      providers: [
        { provide: SoulService, useValue: mockSoulService },
      ],
    }).compile();

    controller = module.get<SoulsController>(SoulsController);
    soulService = module.get(SoulService);
  });

  describe('create', () => {
    it('should pass userId to service for soul-org creation', async () => {
      soulService.create.mockResolvedValue(mockSoulResponse as any);

      const result = await controller.create(
        mockOrganization as Organization,
        mockUser as User,
        { name: 'Test Soul' },
      );

      expect(soulService.create).toHaveBeenCalledWith('org-1', { name: 'Test Soul' }, 'user-1');
      expect(result.soulOrgId).toBe('soul-org-1');
    });
  });

  describe('findAll', () => {
    it('should return paginated souls', async () => {
      soulService.findAll.mockResolvedValue({
        data: [mockSoulResponse as any],
        hasMore: false,
      });

      const result = await controller.findAll(
        mockOrganization as Organization,
        { limit: 20 },
      );

      expect(result.data).toHaveLength(1);
      expect(soulService.findAll).toHaveBeenCalledWith('org-1', { limit: 20 });
    });
  });

  describe('findById', () => {
    it('should return soul by ID', async () => {
      soulService.findById.mockResolvedValue(mockSoulResponse as any);

      const result = await controller.findById(
        mockOrganization as Organization,
        'soul-1',
      );

      expect(result.id).toBe('soul-1');
      expect(result.soulOrgId).toBe('soul-org-1');
    });
  });

  describe('delete', () => {
    it('should delete soul', async () => {
      soulService.delete.mockResolvedValue(undefined);

      await controller.delete(
        mockOrganization as Organization,
        'soul-1',
      );

      expect(soulService.delete).toHaveBeenCalledWith('org-1', 'soul-1');
    });
  });

  describe('getCount', () => {
    it('should return count', async () => {
      soulService.getCount.mockResolvedValue(42);

      const result = await controller.getCount(mockOrganization as Organization);

      expect(result).toEqual({ count: 42 });
    });
  });
});
