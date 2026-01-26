import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { SoulService } from './soul.service';
import { SoulRepository } from './soul.repository';
import {
  SoulType,
  Soul,
  CreateSoulDto,
  UpdateSoulDto,
} from '@gitroom/nestjs-libraries/dtos/axon';

describe('SoulService', () => {
  let service: SoulService;
  let repository: jest.Mocked<SoulRepository>;

  const mockSoul: Soul = {
    id: 'soul-1',
    organizationId: 'org-1',
    type: SoulType.EMAIL,
    email: 'test@example.com',
    displayName: 'Test Soul',
    firstName: 'Test',
    lastName: 'Soul',
    accountIds: [],
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SoulService,
        {
          provide: SoulRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SoulService>(SoulService);
    repository = module.get(SoulRepository);
  });

  describe('create', () => {
    const createDto: CreateSoulDto = {
      type: SoulType.EMAIL,
      email: 'new@example.com',
      displayName: 'New Soul',
      firstName: 'New',
      lastName: 'Soul',
    };

    it('should create soul when valid data provided', async () => {
      repository.findByEmail.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockSoul);

      const result = await service.create('org-1', createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('soul-1');
      expect(repository.create).toHaveBeenCalledWith('org-1', createDto);
    });

    it('should throw ConflictException when email already exists', async () => {
      repository.findByEmail.mockResolvedValue(mockSoul);

      await expect(service.create('org-1', createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when phone already exists', async () => {
      const phoneDto: CreateSoulDto = {
        type: SoulType.PHONE,
        phone: '+1234567890',
        displayName: 'Phone Soul',
      };
      repository.findByPhone.mockResolvedValue(mockSoul);

      await expect(service.create('org-1', phoneDto)).rejects.toThrow(ConflictException);
    });

    it('should allow creating soul without email when type is PHONE', async () => {
      const phoneDto: CreateSoulDto = {
        type: SoulType.PHONE,
        phone: '+1234567890',
        displayName: 'Phone Soul',
      };
      repository.findByPhone.mockResolvedValue(null);
      repository.create.mockResolvedValue({ ...mockSoul, type: SoulType.PHONE, phone: '+1234567890', email: undefined });

      const result = await service.create('org-1', phoneDto);

      expect(result).toBeDefined();
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
      const paginatedResult = {
        data: [mockSoul],
        hasMore: false,
      };
      repository.findAll.mockResolvedValue(paginatedResult);

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

      await service.delete('org-1', 'soul-1');

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

  describe('getCountByPersona', () => {
    it('should return count by persona', async () => {
      repository.countByPersona.mockResolvedValue(25);

      const result = await service.getCountByPersona('org-1', 'persona-1');

      expect(result).toBe(25);
      expect(repository.countByPersona).toHaveBeenCalledWith('org-1', 'persona-1');
    });
  });
});
