import { Injectable } from '@nestjs/common';
import { Organization } from '@prisma/client';
import { SoulCredentialsService } from '@gitroom/nestjs-libraries/database/firestore/collections/soul-credentials/soul-credentials.service';
import { ClientInformation } from './social/social.integrations.interface';

@Injectable()
export class CredentialResolverService {
  constructor(private readonly soulCredentialsService: SoulCredentialsService) {}

  async resolveCredentials(
    org: Organization,
    platform: string,
  ): Promise<ClientInformation | undefined> {
    if (!org.isSoulOrg || !org.soulId) {
      return undefined;
    }

    const creds = await this.soulCredentialsService.getCredentials(org.soulId, platform);
    if (!creds) {
      return undefined;
    }

    return {
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      instanceUrl: '',
    };
  }
}
