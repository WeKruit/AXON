import { Test, TestingModule } from '@nestjs/testing';
import { SoulCredentialsController } from './soul-credentials.controller';
import { SoulCredentialsService } from '@gitroom/nestjs-libraries/database/firestore/collections/soul-credentials/soul-credentials.service';
import { Organization } from '@prisma/client';

describe('SoulCredentialsController', () => {
  let controller: SoulCredentialsController;
  let credentialsService: jest.Mocked<SoulCredentialsService>;

  const mockOrganization: Partial<Organization> = {
    id: 'org-1',
    name: 'Test Org',
  };

  beforeEach(async () => {
    const mockCredentialsService = {
      getCredentials: jest.fn(),
      listCredentials: jest.fn(),
      upsertCredentials: jest.fn(),
      deleteCredentials: jest.fn(),
      deleteAllForSoul: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SoulCredentialsController],
      providers: [
        { provide: SoulCredentialsService, useValue: mockCredentialsService },
      ],
    }).compile();

    controller = module.get<SoulCredentialsController>(SoulCredentialsController);
    credentialsService = module.get(SoulCredentialsService);
  });

  describe('listCredentials', () => {
    it('should return all credentials for a soul', async () => {
      const mockCreds = [
        { platform: 'twitter', clientId: 'id-1', clientSecretMasked: '****cret' },
        { platform: 'linkedin', clientId: 'id-2', clientSecretMasked: '****cret' },
      ];
      credentialsService.listCredentials.mockResolvedValue(mockCreds);

      const result = await controller.listCredentials(
        mockOrganization as Organization,
        'soul-1',
      );

      expect(result).toEqual(mockCreds);
      expect(credentialsService.listCredentials).toHaveBeenCalledWith('soul-1');
    });

    it('should return empty array when no credentials exist', async () => {
      credentialsService.listCredentials.mockResolvedValue([]);

      const result = await controller.listCredentials(
        mockOrganization as Organization,
        'soul-1',
      );

      expect(result).toEqual([]);
    });
  });

  describe('upsertCredentials', () => {
    it('should save credentials and return masked response', async () => {
      const mockResponse = {
        platform: 'twitter',
        clientId: 'my-client-id',
        clientSecretMasked: '****cret',
      };
      credentialsService.upsertCredentials.mockResolvedValue(mockResponse);

      const result = await controller.upsertCredentials(
        mockOrganization as Organization,
        'soul-1',
        'twitter',
        { clientId: 'my-client-id', clientSecret: 'my-secret' },
      );

      expect(result).toEqual(mockResponse);
      expect(credentialsService.upsertCredentials).toHaveBeenCalledWith(
        'soul-1', 'org-1', 'twitter', 'my-client-id', 'my-secret', undefined,
      );
    });

    it('should pass additionalConfig when provided', async () => {
      credentialsService.upsertCredentials.mockResolvedValue({
        platform: 'twitter',
        clientId: 'id',
        clientSecretMasked: '****',
      });

      await controller.upsertCredentials(
        mockOrganization as Organization,
        'soul-1',
        'twitter',
        {
          clientId: 'id',
          clientSecret: 'secret',
          additionalConfig: { scope: 'read' },
        },
      );

      expect(credentialsService.upsertCredentials).toHaveBeenCalledWith(
        'soul-1', 'org-1', 'twitter', 'id', 'secret', { scope: 'read' },
      );
    });
  });

  describe('deleteCredentials', () => {
    it('should delete credentials for a platform', async () => {
      credentialsService.deleteCredentials.mockResolvedValue(undefined);

      await controller.deleteCredentials(
        mockOrganization as Organization,
        'soul-1',
        'twitter',
      );

      expect(credentialsService.deleteCredentials).toHaveBeenCalledWith('soul-1', 'twitter');
    });
  });
});
