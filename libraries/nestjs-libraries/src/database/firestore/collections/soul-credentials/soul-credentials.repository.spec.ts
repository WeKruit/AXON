import { Test, TestingModule } from '@nestjs/testing';
import { SoulCredentialsRepository, SoulPlatformCredentials } from './soul-credentials.repository';
import { FirestoreService } from '../../firestore.service';

describe('SoulCredentialsRepository', () => {
  let repository: SoulCredentialsRepository;
  let firestoreService: jest.Mocked<FirestoreService>;

  const mockCredential: SoulPlatformCredentials = {
    id: 'cred-1',
    soulId: 'soul-1',
    organizationId: 'org-1',
    platform: 'twitter',
    clientId: 'encrypted-client-id',
    clientSecret: 'encrypted-client-secret',
    additionalConfig: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockFirestoreService = {
      create: jest.fn(),
      getById: jest.fn(),
      query: jest.fn(),
      queryPaginated: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SoulCredentialsRepository,
        { provide: FirestoreService, useValue: mockFirestoreService },
      ],
    }).compile();

    repository = module.get<SoulCredentialsRepository>(SoulCredentialsRepository);
    firestoreService = module.get(FirestoreService);
  });

  describe('getCredentials', () => {
    it('should return credentials for soul+platform pair', async () => {
      firestoreService.query.mockResolvedValue([mockCredential]);

      const result = await repository.getCredentials('soul-1', 'twitter');

      expect(result).toEqual(mockCredential);
      expect(firestoreService.query).toHaveBeenCalledWith('soul-credentials', {
        where: [
          { field: 'soulId', operator: '==', value: 'soul-1' },
          { field: 'platform', operator: '==', value: 'twitter' },
        ],
        limit: 1,
      });
    });

    it('should return null when no credentials found', async () => {
      firestoreService.query.mockResolvedValue([]);

      const result = await repository.getCredentials('soul-1', 'linkedin');

      expect(result).toBeNull();
    });
  });

  describe('listCredentials', () => {
    it('should return all credentials for a soul', async () => {
      const twitterCred = mockCredential;
      const linkedinCred = { ...mockCredential, id: 'cred-2', platform: 'linkedin' };
      firestoreService.query.mockResolvedValue([twitterCred, linkedinCred]);

      const result = await repository.listCredentials('soul-1');

      expect(result).toHaveLength(2);
      expect(firestoreService.query).toHaveBeenCalledWith('soul-credentials', {
        where: [
          { field: 'soulId', operator: '==', value: 'soul-1' },
        ],
      });
    });

    it('should return empty array when no credentials exist', async () => {
      firestoreService.query.mockResolvedValue([]);

      const result = await repository.listCredentials('soul-1');

      expect(result).toEqual([]);
    });
  });

  describe('upsertCredentials', () => {
    it('should create new credentials when none exist', async () => {
      firestoreService.query.mockResolvedValue([]); // getCredentials returns null
      firestoreService.create.mockResolvedValue(mockCredential);

      const result = await repository.upsertCredentials(
        'soul-1', 'org-1', 'twitter', 'new-client-id', 'new-secret',
      );

      expect(firestoreService.create).toHaveBeenCalledWith('soul-credentials', expect.objectContaining({
        soulId: 'soul-1',
        organizationId: 'org-1',
        platform: 'twitter',
        clientId: 'new-client-id',
        clientSecret: 'new-secret',
      }));
      expect(result).toEqual(mockCredential);
    });

    it('should update existing credentials', async () => {
      firestoreService.query.mockResolvedValue([mockCredential]); // getCredentials returns existing

      const result = await repository.upsertCredentials(
        'soul-1', 'org-1', 'twitter', 'updated-id', 'updated-secret',
      );

      expect(firestoreService.update).toHaveBeenCalledWith('soul-credentials', 'cred-1', {
        clientId: 'updated-id',
        clientSecret: 'updated-secret',
      });
      expect(result.clientId).toBe('updated-id');
    });
  });

  describe('deleteCredentials', () => {
    it('should delete existing credentials', async () => {
      firestoreService.query.mockResolvedValue([mockCredential]);

      await repository.deleteCredentials('soul-1', 'twitter');

      expect(firestoreService.delete).toHaveBeenCalledWith('soul-credentials', 'cred-1');
    });

    it('should do nothing when credentials do not exist', async () => {
      firestoreService.query.mockResolvedValue([]);

      await repository.deleteCredentials('soul-1', 'twitter');

      expect(firestoreService.delete).not.toHaveBeenCalled();
    });
  });

  describe('deleteAllForSoul', () => {
    it('should delete all credentials for a soul', async () => {
      const cred1 = mockCredential;
      const cred2 = { ...mockCredential, id: 'cred-2', platform: 'linkedin' };
      firestoreService.query.mockResolvedValue([cred1, cred2]);

      await repository.deleteAllForSoul('soul-1');

      expect(firestoreService.delete).toHaveBeenCalledTimes(2);
      expect(firestoreService.delete).toHaveBeenCalledWith('soul-credentials', 'cred-1');
      expect(firestoreService.delete).toHaveBeenCalledWith('soul-credentials', 'cred-2');
    });
  });
});
