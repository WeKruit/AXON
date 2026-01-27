import { Injectable, NotFoundException } from '@nestjs/common';
import { SoulCredentialsRepository, SoulPlatformCredentials } from './soul-credentials.repository';
import { AuthService } from '@gitroom/helpers/auth/auth.service';

export interface CredentialResponse {
  platform: string;
  clientId: string;
  clientSecretMasked: string;
  additionalConfig?: Record<string, string>;
}

export interface DecryptedCredentials {
  clientId: string;
  clientSecret: string;
  additionalConfig?: Record<string, string>;
}

@Injectable()
export class SoulCredentialsService {
  constructor(private readonly credentialsRepository: SoulCredentialsRepository) {}

  async getCredentials(soulId: string, platform: string): Promise<DecryptedCredentials | null> {
    const cred = await this.credentialsRepository.getCredentials(soulId, platform);
    if (!cred) return null;

    return {
      clientId: this.decrypt(cred.clientId),
      clientSecret: this.decrypt(cred.clientSecret),
      additionalConfig: cred.additionalConfig,
    };
  }

  async listCredentials(soulId: string): Promise<CredentialResponse[]> {
    const creds = await this.credentialsRepository.listCredentials(soulId);
    return creds.map((c) => ({
      platform: c.platform,
      clientId: this.decrypt(c.clientId),
      clientSecretMasked: this.maskSecret(this.decrypt(c.clientSecret)),
      additionalConfig: c.additionalConfig,
    }));
  }

  async upsertCredentials(
    soulId: string,
    organizationId: string,
    platform: string,
    clientId: string,
    clientSecret: string,
    additionalConfig?: Record<string, string>,
  ): Promise<CredentialResponse> {
    const encryptedId = this.encrypt(clientId);
    const encryptedSecret = this.encrypt(clientSecret);

    await this.credentialsRepository.upsertCredentials(
      soulId,
      organizationId,
      platform,
      encryptedId,
      encryptedSecret,
      additionalConfig,
    );

    return {
      platform,
      clientId,
      clientSecretMasked: this.maskSecret(clientSecret),
      additionalConfig,
    };
  }

  async deleteCredentials(soulId: string, platform: string): Promise<void> {
    await this.credentialsRepository.deleteCredentials(soulId, platform);
  }

  async deleteAllForSoul(soulId: string): Promise<void> {
    await this.credentialsRepository.deleteAllForSoul(soulId);
  }

  private encrypt(value: string): string {
    return AuthService.fixedEncryption(value);
  }

  private decrypt(value: string): string {
    return AuthService.fixedDecryption(value);
  }

  private maskSecret(secret: string): string {
    if (secret.length <= 4) return '****';
    return '*'.repeat(secret.length - 4) + secret.slice(-4);
  }
}
