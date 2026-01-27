import { Test, TestingModule } from '@nestjs/testing';
import { SoulCredentialsService } from './soul-credentials.service';
import { SoulCredentialsRepository } from './soul-credentials.repository';
import { AuthService } from '@gitroom/helpers/auth/auth.service';

// Mock AuthService static methods
jest.mock('@gitroom/helpers/auth/auth.service', () => ({
  AuthService: {
    fixedEncryption: jest.fn((val: string) => `enc_${val}`),
    fixedDecryption: jest.fn((val: string) => val.replace('enc_', '')),
  },
}));

describe('SoulCredentialsService', () => {
  let service: SoulCredentialsService;
  let repository: jest.Mocked<SoulCredentialsRepository>;

  const mockStoredCredential = {
    id: 'cred-1',
    soulId: 'soul-1',
    organizationId: 'org-1',
    platform: 'twitter',
    clientId: 'enc_my-client-id',
    clientSecret: 'enc_my-secret-key',
    additionalConfig: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      getCredentials: jest.fn(),
      listCredentials: jest.fn(),
      upsertCredentials: jest.fn(),
      deleteCredentials: jest.fn(),
      deleteAllForSoul: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SoulCredentialsService,
        { provide: SoulCredentialsRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<SoulCredentialsService>(SoulCredentialsService);
    repository = module.get(SoulCredentialsRepository);
  });

  describe('getCredentials', () => {
    it('should return decrypted credentials when found', async () => {
      repository.getCredentials.mockResolvedValue(mockStoredCredential);

      const result = await service.getCredentials('soul-1', 'twitter');

      expect(result).toEqual({
        clientId: 'my-client-id',
        clientSecret: 'my-secret-key',
        additionalConfig: {},
      });
    });

    it('should return null when no credentials found', async () => {
      repository.getCredentials.mockResolvedValue(null);

      const result = await service.getCredentials('soul-1', 'linkedin');

      expect(result).toBeNull();
    });
  });

  describe('listCredentials', () => {
    it('should return credentials with masked secrets', async () => {
      repository.listCredentials.mockResolvedValue([mockStoredCredential]);

      const result = await service.listCredentials('soul-1');

      expect(result).toHaveLength(1);
      expect(result[0].platform).toBe('twitter');
      expect(result[0].clientId).toBe('my-client-id');
      // Secret should be masked - only last 4 chars visible
      expect(result[0].clientSecretMasked).toMatch(/\*+.{4}$/);
      expect(result[0].clientSecretMasked).not.toContain('my-secret');
    });

    it('should return empty array when no credentials exist', async () => {
      repository.listCredentials.mockResolvedValue([]);

      const result = await service.listCredentials('soul-1');

      expect(result).toEqual([]);
    });
  });

  describe('upsertCredentials', () => {
    it('should encrypt and store credentials', async () => {
      repository.upsertCredentials.mockResolvedValue(mockStoredCredential);

      const result = await service.upsertCredentials(
        'soul-1', 'org-1', 'twitter', 'my-client-id', 'my-secret-key',
      );

      expect(repository.upsertCredentials).toHaveBeenCalledWith(
        'soul-1', 'org-1', 'twitter',
        'enc_my-client-id',
        'enc_my-secret-key',
        undefined,
      );
      expect(AuthService.fixedEncryption).toHaveBeenCalledWith('my-client-id');
      expect(AuthService.fixedEncryption).toHaveBeenCalledWith('my-secret-key');
      expect(result.platform).toBe('twitter');
      expect(result.clientId).toBe('my-client-id');
      expect(result.clientSecretMasked).toMatch(/\*+/);
    });

    it('should pass additionalConfig when provided', async () => {
      repository.upsertCredentials.mockResolvedValue(mockStoredCredential);

      await service.upsertCredentials(
        'soul-1', 'org-1', 'twitter', 'id', 'secret', { callback_url: 'https://example.com' },
      );

      expect(repository.upsertCredentials).toHaveBeenCalledWith(
        'soul-1', 'org-1', 'twitter',
        expect.any(String), expect.any(String),
        { callback_url: 'https://example.com' },
      );
    });
  });

  describe('deleteCredentials', () => {
    it('should delegate to repository', async () => {
      await service.deleteCredentials('soul-1', 'twitter');

      expect(repository.deleteCredentials).toHaveBeenCalledWith('soul-1', 'twitter');
    });
  });

  describe('deleteAllForSoul', () => {
    it('should delegate to repository', async () => {
      await service.deleteAllForSoul('soul-1');

      expect(repository.deleteAllForSoul).toHaveBeenCalledWith('soul-1');
    });
  });
});
