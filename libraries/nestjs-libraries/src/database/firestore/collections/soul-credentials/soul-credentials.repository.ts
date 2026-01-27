import { Injectable } from '@nestjs/common';
import { FirestoreService } from '../../firestore.service';

const COLLECTION = 'soul-credentials';

export interface SoulPlatformCredentials {
  id: string;
  soulId: string;
  organizationId: string;
  platform: string;
  clientId: string;
  clientSecret: string;
  additionalConfig?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SoulCredentialsRepository {
  constructor(private readonly firestore: FirestoreService) {}

  async getCredentials(soulId: string, platform: string): Promise<SoulPlatformCredentials | null> {
    const results = await this.firestore.query<SoulPlatformCredentials>(COLLECTION, {
      where: [
        { field: 'soulId', operator: '==', value: soulId },
        { field: 'platform', operator: '==', value: platform },
      ],
      limit: 1,
    });
    return results[0] || null;
  }

  async listCredentials(soulId: string): Promise<SoulPlatformCredentials[]> {
    return this.firestore.query<SoulPlatformCredentials>(COLLECTION, {
      where: [
        { field: 'soulId', operator: '==', value: soulId },
      ],
    });
  }

  async upsertCredentials(
    soulId: string,
    organizationId: string,
    platform: string,
    clientId: string,
    clientSecret: string,
    additionalConfig?: Record<string, string>,
  ): Promise<SoulPlatformCredentials> {
    const existing = await this.getCredentials(soulId, platform);

    if (existing) {
      await this.firestore.update<SoulPlatformCredentials>(COLLECTION, existing.id, {
        clientId,
        clientSecret,
        ...(additionalConfig !== undefined ? { additionalConfig } : {}),
      });
      return { ...existing, clientId, clientSecret, ...(additionalConfig !== undefined ? { additionalConfig } : {}) };
    }

    return this.firestore.create<SoulPlatformCredentials>(COLLECTION, {
      soulId,
      organizationId,
      platform,
      clientId,
      clientSecret,
      additionalConfig: additionalConfig || {},
    } as any);
  }

  async deleteCredentials(soulId: string, platform: string): Promise<void> {
    const existing = await this.getCredentials(soulId, platform);
    if (existing) {
      await this.firestore.delete(COLLECTION, existing.id);
    }
  }

  async deleteAllForSoul(soulId: string): Promise<void> {
    const creds = await this.listCredentials(soulId);
    for (const cred of creds) {
      await this.firestore.delete(COLLECTION, cred.id);
    }
  }
}
