import { Test, TestingModule } from '@nestjs/testing';
import { CredentialResolverService } from './credential-resolver.service';
import { SoulCredentialsService } from '@gitroom/nestjs-libraries/database/firestore/collections/soul-credentials/soul-credentials.service';
import { Organization } from '@prisma/client';

describe('CredentialResolverService', () => {
  let service: CredentialResolverService;
  let credentialsService: jest.Mocked<SoulCredentialsService>;

  const mockSoulOrg: Partial<Organization> = {
    id: 'soul-org-1',
    name: 'Soul: Test',
    isSoulOrg: true,
    soulId: 'soul-1',
    parentOrgId: 'org-1',
  };

  const mockRegularOrg: Partial<Organization> = {
    id: 'org-1',
    name: 'Regular Org',
    isSoulOrg: false,
    soulId: null,
    parentOrgId: null,
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
      providers: [
        CredentialResolverService,
        { provide: SoulCredentialsService, useValue: mockCredentialsService },
      ],
    }).compile();

    service = module.get<CredentialResolverService>(CredentialResolverService);
    credentialsService = module.get(SoulCredentialsService);
  });

  describe('resolveCredentials', () => {
    it('should return undefined for regular (non-soul) org', async () => {
      const result = await service.resolveCredentials(mockRegularOrg as Organization, 'twitter');

      expect(result).toBeUndefined();
      expect(credentialsService.getCredentials).not.toHaveBeenCalled();
    });

    it('should return undefined for soul-org without soulId', async () => {
      const orgNoSoulId = { ...mockSoulOrg, soulId: null as string | null };

      const result = await service.resolveCredentials(orgNoSoulId as Organization, 'twitter');

      expect(result).toBeUndefined();
    });

    it('should return ClientInformation when soul credentials exist', async () => {
      credentialsService.getCredentials.mockResolvedValue({
        clientId: 'soul-client-id',
        clientSecret: 'soul-client-secret',
      });

      const result = await service.resolveCredentials(mockSoulOrg as Organization, 'twitter');

      expect(result).toEqual({
        client_id: 'soul-client-id',
        client_secret: 'soul-client-secret',
        instanceUrl: '',
      });
      expect(credentialsService.getCredentials).toHaveBeenCalledWith('soul-1', 'twitter');
    });

    it('should return undefined when soul has no credentials for platform', async () => {
      credentialsService.getCredentials.mockResolvedValue(null);

      const result = await service.resolveCredentials(mockSoulOrg as Organization, 'linkedin');

      expect(result).toBeUndefined();
    });
  });
});
