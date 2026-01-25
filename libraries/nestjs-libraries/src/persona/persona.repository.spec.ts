/**
 * Persona Repository Tests - WEC-146
 *
 * Unit tests for PersonaRepository covering all Firestore operations.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PersonaRepository } from './persona.repository';
import { FirebaseService } from '../firebase/firebase.service';
import { CreatePersonaInput, UpdatePersonaInput, PersonaFilter } from './persona.interface';

describe('PersonaRepository', () => {
  let repository: PersonaRepository;
  let firebaseService: jest.Mocked<FirebaseService>;
  let mockCollection: jest.Mocked<FirebaseFirestore.CollectionReference>;
  let mockDocRef: jest.Mocked<FirebaseFirestore.DocumentReference>;
  let mockDocSnapshot: jest.Mocked<FirebaseFirestore.DocumentSnapshot>;
  let mockQuery: jest.Mocked<FirebaseFirestore.Query>;
  let mockQuerySnapshot: jest.Mocked<FirebaseFirestore.QuerySnapshot>;

  const mockPersonaData = {
    organizationId: 'org-456',
    userId: 'user-789',
    name: 'Tech Enthusiast',
    bio: 'Passionate about technology',
    personality: 'Curious and analytical',
    writingStyle: 'Conversational',
    tone: 'Friendly',
    interests: ['AI', 'programming'],
    hashtags: ['#tech', '#AI'],
    samplePosts: ['Hello world!'],
    keywords: { industry: 'Technology' },
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    // Create mock document snapshot
    mockDocSnapshot = {
      exists: true,
      id: 'persona-123',
      data: jest.fn().mockReturnValue(mockPersonaData),
    } as unknown as jest.Mocked<FirebaseFirestore.DocumentSnapshot>;

    // Create mock query snapshot
    mockQuerySnapshot = {
      docs: [mockDocSnapshot],
    } as unknown as jest.Mocked<FirebaseFirestore.QuerySnapshot>;

    // Create mock query
    mockQuery = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue(mockQuerySnapshot),
    } as unknown as jest.Mocked<FirebaseFirestore.Query>;

    // Create mock document reference
    mockDocRef = {
      id: 'persona-123',
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(mockDocSnapshot),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<FirebaseFirestore.DocumentReference>;

    // Create mock collection
    mockCollection = {
      doc: jest.fn().mockReturnValue(mockDocRef),
      where: jest.fn().mockReturnValue(mockQuery),
      orderBy: jest.fn().mockReturnValue(mockQuery),
    } as unknown as jest.Mocked<FirebaseFirestore.CollectionReference>;

    // Create mock Firestore
    const mockFirestore = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };

    // Create mock Firebase service
    const mockFirebaseService = {
      getFirestore: jest.fn().mockReturnValue(mockFirestore),
      isAvailable: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonaRepository,
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    }).compile();

    repository = module.get<PersonaRepository>(PersonaRepository);
    firebaseService = module.get(FirebaseService);
  });

  describe('create', () => {
    const input: CreatePersonaInput = {
      name: 'Tech Enthusiast',
      bio: 'Passionate about technology',
      personality: 'Curious and analytical',
      writingStyle: 'Conversational',
      tone: 'Friendly',
      interests: ['AI', 'programming'],
      hashtags: ['#tech', '#AI'],
      samplePosts: ['Hello world!'],
      keywords: { industry: 'Technology' },
    };

    it('should create a new persona in Firestore', async () => {
      const result = await repository.create('org-456', 'user-789', input);

      expect(mockCollection.doc).toHaveBeenCalled();
      expect(mockDocRef.set).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'persona-123',
          organizationId: 'org-456',
          userId: 'user-789',
          name: input.name,
          bio: input.bio,
          isActive: true,
        })
      );
      expect(result.id).toBe('persona-123');
      expect(result.organizationId).toBe('org-456');
      expect(result.userId).toBe('user-789');
      expect(result.name).toBe(input.name);
      expect(result.isActive).toBe(true);
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const beforeCreate = new Date();
      const result = await repository.create('org-456', 'user-789', input);
      const afterCreate = new Date();

      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(result.updatedAt.getTime()).toEqual(result.createdAt.getTime());
    });
  });

  describe('findById', () => {
    it('should return persona when found', async () => {
      const result = await repository.findById('persona-123');

      expect(mockCollection.doc).toHaveBeenCalledWith('persona-123');
      expect(mockDocRef.get).toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result?.id).toBe('persona-123');
      expect(result?.name).toBe('Tech Enthusiast');
    });

    it('should return null when persona not found', async () => {
      mockDocSnapshot.exists = false;

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should correctly parse dates from Firestore', async () => {
      const result = await repository.findById('persona-123');

      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle missing optional fields gracefully', async () => {
      mockDocSnapshot.data = jest.fn().mockReturnValue({
        ...mockPersonaData,
        interests: undefined,
        hashtags: undefined,
        samplePosts: undefined,
        keywords: undefined,
      });

      const result = await repository.findById('persona-123');

      expect(result?.interests).toEqual([]);
      expect(result?.hashtags).toEqual([]);
      expect(result?.samplePosts).toEqual([]);
      expect(result?.keywords).toEqual({});
    });
  });

  describe('findByIdAndOrganization', () => {
    it('should return persona when found and organization matches', async () => {
      const result = await repository.findByIdAndOrganization('persona-123', 'org-456');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('persona-123');
      expect(result?.organizationId).toBe('org-456');
    });

    it('should return null when organization does not match', async () => {
      const result = await repository.findByIdAndOrganization('persona-123', 'different-org');

      expect(result).toBeNull();
    });

    it('should return null when persona not found', async () => {
      mockDocSnapshot.exists = false;

      const result = await repository.findByIdAndOrganization('nonexistent', 'org-456');

      expect(result).toBeNull();
    });
  });

  describe('findByFilter', () => {
    it('should filter by organizationId', async () => {
      const filter: PersonaFilter = { organizationId: 'org-456' };

      await repository.findByFilter(filter);

      expect(mockQuery.where).toHaveBeenCalledWith('organizationId', '==', 'org-456');
    });

    it('should filter by userId', async () => {
      const filter: PersonaFilter = { userId: 'user-789' };

      await repository.findByFilter(filter);

      expect(mockQuery.where).toHaveBeenCalledWith('userId', '==', 'user-789');
    });

    it('should filter by isActive', async () => {
      const filter: PersonaFilter = { isActive: true };

      await repository.findByFilter(filter);

      expect(mockQuery.where).toHaveBeenCalledWith('isActive', '==', true);
    });

    it('should combine multiple filters', async () => {
      const filter: PersonaFilter = {
        organizationId: 'org-456',
        userId: 'user-789',
        isActive: true,
      };

      await repository.findByFilter(filter);

      expect(mockQuery.where).toHaveBeenCalledWith('organizationId', '==', 'org-456');
      expect(mockQuery.where).toHaveBeenCalledWith('userId', '==', 'user-789');
      expect(mockQuery.where).toHaveBeenCalledWith('isActive', '==', true);
    });

    it('should order by createdAt descending', async () => {
      await repository.findByFilter({});

      expect(mockQuery.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('should return array of personas', async () => {
      const result = await repository.findByFilter({ organizationId: 'org-456' });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('persona-123');
    });
  });

  describe('findByOrganization', () => {
    it('should call findByFilter with organizationId', async () => {
      const findByFilterSpy = jest.spyOn(repository, 'findByFilter');

      await repository.findByOrganization('org-456');

      expect(findByFilterSpy).toHaveBeenCalledWith({ organizationId: 'org-456' });
    });
  });

  describe('findActiveByOrganization', () => {
    it('should call findByFilter with organizationId and isActive true', async () => {
      const findByFilterSpy = jest.spyOn(repository, 'findByFilter');

      await repository.findActiveByOrganization('org-456');

      expect(findByFilterSpy).toHaveBeenCalledWith({
        organizationId: 'org-456',
        isActive: true,
      });
    });
  });

  describe('update', () => {
    const updateInput: UpdatePersonaInput = {
      name: 'Updated Name',
      bio: 'Updated bio',
    };

    it('should update persona when found', async () => {
      // Setup for the findById call after update
      const updatedData = { ...mockPersonaData, name: 'Updated Name', bio: 'Updated bio' };
      mockDocSnapshot.data = jest.fn().mockReturnValue(updatedData);

      const result = await repository.update('persona-123', updateInput);

      expect(mockDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Name',
          bio: 'Updated bio',
          updatedAt: expect.any(String),
        })
      );
      expect(result).not.toBeNull();
    });

    it('should return null when persona not found', async () => {
      mockDocSnapshot.exists = false;

      const result = await repository.update('nonexistent', updateInput);

      expect(result).toBeNull();
      expect(mockDocRef.update).not.toHaveBeenCalled();
    });

    it('should update only provided fields', async () => {
      const partialUpdate: UpdatePersonaInput = { name: 'New Name' };

      await repository.update('persona-123', partialUpdate);

      expect(mockDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Name',
        })
      );
      expect(mockDocRef.update).toHaveBeenCalledWith(
        expect.not.objectContaining({
          bio: expect.anything(),
        })
      );
    });
  });

  describe('delete', () => {
    it('should delete persona when found', async () => {
      const result = await repository.delete('persona-123');

      expect(mockDocRef.delete).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when persona not found', async () => {
      mockDocSnapshot.exists = false;

      const result = await repository.delete('nonexistent');

      expect(result).toBe(false);
      expect(mockDocRef.delete).not.toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('should set isActive to false', async () => {
      const updateSpy = jest.spyOn(repository, 'update');

      await repository.deactivate('persona-123');

      expect(updateSpy).toHaveBeenCalledWith('persona-123', { isActive: false });
    });
  });

  describe('activate', () => {
    it('should set isActive to true', async () => {
      const updateSpy = jest.spyOn(repository, 'update');

      await repository.activate('persona-123');

      expect(updateSpy).toHaveBeenCalledWith('persona-123', { isActive: true });
    });
  });

  describe('error handling', () => {
    it('should propagate Firestore errors in create', async () => {
      mockDocRef.set.mockRejectedValue(new Error('Firestore error'));

      await expect(
        repository.create('org-456', 'user-789', {
          name: 'Test',
          bio: 'Test',
          personality: 'Test',
          writingStyle: 'Test',
          tone: 'Test',
          interests: [],
          hashtags: [],
          samplePosts: [],
          keywords: {},
        })
      ).rejects.toThrow('Firestore error');
    });

    it('should propagate Firestore errors in findById', async () => {
      mockDocRef.get.mockRejectedValue(new Error('Firestore error'));

      await expect(repository.findById('persona-123')).rejects.toThrow('Firestore error');
    });

    it('should propagate Firestore errors in update', async () => {
      mockDocRef.update.mockRejectedValue(new Error('Firestore error'));

      await expect(
        repository.update('persona-123', { name: 'New Name' })
      ).rejects.toThrow('Firestore error');
    });

    it('should propagate Firestore errors in delete', async () => {
      mockDocRef.delete.mockRejectedValue(new Error('Firestore error'));

      await expect(repository.delete('persona-123')).rejects.toThrow('Firestore error');
    });
  });
});
