import { Command } from 'nestjs-command';
import { Injectable, Logger } from '@nestjs/common';
import { FirestoreService } from '@gitroom/nestjs-libraries/database/firestore/firestore.service';
import * as admin from 'firebase-admin';

interface SeedSoul {
  name: string;
  type: 'influencer' | 'brand' | 'agency' | 'personal';
  status: 'active' | 'inactive' | 'suspended';
  description?: string;
  email?: string;
  phone?: string;
  persona_id?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface SeedAccount {
  soul_id: string;
  platform: string;
  username: string;
  status: 'active' | 'inactive' | 'error' | 'suspended';
  persona_id?: string;
  proxy_id?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface SeedPersona {
  name: string;
  bio: string;
  tone: string;
  writing_style: string;
  interests: string[];
  personality_traits: string[];
  hashtags: string[];
  is_ai_generated: boolean;
  is_archived: boolean;
  tags?: string[];
}

interface SeedProxy {
  name: string;
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
  provider: 'iproyal' | 'custom' | 'other';
  status: 'active' | 'inactive' | 'error' | 'expired';
  country?: string;
  city?: string;
  purpose: 'general' | 'auth' | 'scraping' | 'warming';
  tags?: string[];
}

@Injectable()
export class AxonSeedTask {
  private readonly logger = new Logger(AxonSeedTask.name);

  constructor(private readonly firestore: FirestoreService) {}

  @Command({
    command: 'axon:seed',
    describe: 'Seeds AXON Firestore collections with sample data',
  })
  async seed() {
    this.logger.log('Starting AXON seed...');

    // Use a demo organization ID (you can change this to a real org ID)
    const orgId = 'demo-org-001';
    const now = admin.firestore.Timestamp.now();

    try {
      // Create Personas first (as they're referenced by Souls and Accounts)
      const personas = await this.seedPersonas(orgId, now);
      this.logger.log(`Created ${personas.length} personas`);

      // Create Proxies
      const proxies = await this.seedProxies(orgId, now);
      this.logger.log(`Created ${proxies.length} proxies`);

      // Create Souls with persona references
      const souls = await this.seedSouls(orgId, personas, now);
      this.logger.log(`Created ${souls.length} souls`);

      // Create Accounts linked to Souls
      const accounts = await this.seedAccounts(orgId, souls, personas, proxies, now);
      this.logger.log(`Created ${accounts.length} accounts`);

      this.logger.log('AXON seed completed successfully!');
      this.logger.log(`
Summary:
- ${personas.length} Personas
- ${proxies.length} Proxies
- ${souls.length} Souls
- ${accounts.length} Accounts

Organization ID: ${orgId}
      `);
    } catch (error) {
      this.logger.error('Failed to seed AXON data:', error);
      throw error;
    }

    return true;
  }

  @Command({
    command: 'axon:clear',
    describe: 'Clears all AXON Firestore collections (use with caution!)',
  })
  async clear() {
    this.logger.warn('Clearing all AXON data...');

    const collections = ['souls', 'accounts', 'personas', 'proxies'];

    for (const collectionName of collections) {
      try {
        const snapshot = await this.firestore.collection(collectionName).get();
        const batch = this.firestore.batch();

        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        if (snapshot.docs.length > 0) {
          await batch.commit();
          this.logger.log(`Deleted ${snapshot.docs.length} documents from ${collectionName}`);
        } else {
          this.logger.log(`No documents in ${collectionName}`);
        }
      } catch (error: any) {
        if (error?.code === 5) {
          this.logger.log(`Collection ${collectionName} does not exist`);
        } else {
          throw error;
        }
      }
    }

    this.logger.log('AXON data cleared.');
    return true;
  }

  private async seedPersonas(
    orgId: string,
    now: admin.firestore.Timestamp
  ): Promise<Array<{ id: string; name: string }>> {
    const personasData: SeedPersona[] = [
      {
        name: 'Fashion Maven',
        bio: 'Style enthusiast sharing the latest trends and timeless fashion tips. Living for elegant aesthetics and sustainable fashion choices.',
        tone: 'enthusiastic',
        writing_style: 'casual',
        interests: ['fashion', 'style', 'beauty', 'sustainability', 'art'],
        personality_traits: ['creative', 'trendy', 'authentic', 'passionate'],
        hashtags: ['#fashion', '#style', '#ootd', '#sustainablefashion', '#trends'],
        is_ai_generated: false,
        is_archived: false,
        tags: ['fashion', 'lifestyle'],
      },
      {
        name: 'Tech Innovator',
        bio: 'Exploring the cutting edge of technology. From AI to Web3, I break down complex tech for everyone.',
        tone: 'professional',
        writing_style: 'informative',
        interests: ['technology', 'AI', 'startups', 'Web3', 'innovation'],
        personality_traits: ['analytical', 'curious', 'forward-thinking', 'articulate'],
        hashtags: ['#tech', '#AI', '#innovation', '#startup', '#future'],
        is_ai_generated: true,
        is_archived: false,
        tags: ['tech', 'business'],
      },
      {
        name: 'Wellness Guide',
        bio: 'Holistic health advocate. Sharing mindful living tips, healthy recipes, and self-care routines for a balanced life.',
        tone: 'warm',
        writing_style: 'supportive',
        interests: ['wellness', 'fitness', 'nutrition', 'mindfulness', 'yoga'],
        personality_traits: ['caring', 'motivating', 'calm', 'knowledgeable'],
        hashtags: ['#wellness', '#selfcare', '#healthylifestyle', '#mindfulness', '#fitness'],
        is_ai_generated: false,
        is_archived: false,
        tags: ['health', 'lifestyle'],
      },
    ];

    const createdPersonas: Array<{ id: string; name: string }> = [];

    for (const persona of personasData) {
      const docRef = this.firestore.collection('personas').doc();
      await docRef.set({
        ...persona,
        organization_id: orgId,
        assigned_accounts_count: 0,
        createdAt: now,
        updatedAt: now,
      });
      createdPersonas.push({ id: docRef.id, name: persona.name });
    }

    return createdPersonas;
  }

  private async seedProxies(
    orgId: string,
    now: admin.firestore.Timestamp
  ): Promise<Array<{ id: string; name: string }>> {
    const proxiesData: SeedProxy[] = [
      {
        name: 'US Residential 1',
        host: '192.168.1.100',
        port: 8080,
        protocol: 'http',
        provider: 'iproyal',
        status: 'active',
        country: 'US',
        city: 'Los Angeles',
        purpose: 'general',
        tags: ['residential', 'us'],
      },
      {
        name: 'UK Residential 1',
        host: '192.168.1.101',
        port: 8080,
        protocol: 'http',
        provider: 'iproyal',
        status: 'active',
        country: 'UK',
        city: 'London',
        purpose: 'auth',
        tags: ['residential', 'uk'],
      },
      {
        name: 'EU Datacenter 1',
        host: '192.168.1.102',
        port: 3128,
        protocol: 'https',
        provider: 'custom',
        status: 'active',
        country: 'DE',
        city: 'Frankfurt',
        purpose: 'scraping',
        tags: ['datacenter', 'eu'],
      },
    ];

    const createdProxies: Array<{ id: string; name: string }> = [];

    for (const proxy of proxiesData) {
      const docRef = this.firestore.collection('proxies').doc();
      await docRef.set({
        ...proxy,
        organization_id: orgId,
        assigned_accounts: [],
        health_check_results: [],
        last_health_check: null,
        createdAt: now,
        updatedAt: now,
      });
      createdProxies.push({ id: docRef.id, name: proxy.name });
    }

    return createdProxies;
  }

  private async seedSouls(
    orgId: string,
    personas: Array<{ id: string; name: string }>,
    now: admin.firestore.Timestamp
  ): Promise<Array<{ id: string; name: string }>> {
    const soulsData: SeedSoul[] = [
      {
        name: 'Brand Alpha - Urban Fashion',
        type: 'brand',
        status: 'active',
        description: 'Urban streetwear brand targeting Gen-Z audience with sustainable fashion.',
        email: 'contact@brandalpha.example',
        persona_id: personas[0]?.id,
        tags: ['fashion', 'brand', 'urban'],
        metadata: {
          industry: 'fashion',
          target_audience: 'Gen-Z',
        },
      },
      {
        name: 'Brand Beta - Eco Luxe',
        type: 'brand',
        status: 'active',
        description: 'Luxury sustainable fashion brand for environmentally conscious millennials.',
        email: 'hello@brandbeta.example',
        persona_id: personas[0]?.id,
        tags: ['fashion', 'brand', 'luxury', 'sustainable'],
        metadata: {
          industry: 'fashion',
          target_audience: 'millennials',
        },
      },
      {
        name: 'Personal - Sarah Chen',
        type: 'personal',
        status: 'active',
        description: 'Tech content creator and startup founder.',
        email: 'sarah@example.com',
        persona_id: personas[1]?.id,
        tags: ['personal', 'tech', 'creator'],
      },
      {
        name: 'Agency - HealthFirst',
        type: 'agency',
        status: 'active',
        description: 'Health and wellness marketing agency managing multiple client accounts.',
        email: 'team@healthfirst.example',
        persona_id: personas[2]?.id,
        tags: ['agency', 'health', 'wellness'],
      },
    ];

    const createdSouls: Array<{ id: string; name: string }> = [];

    for (const soul of soulsData) {
      const docRef = this.firestore.collection('souls').doc();
      await docRef.set({
        ...soul,
        organization_id: orgId,
        account_ids: [],
        createdAt: now,
        updatedAt: now,
      });
      createdSouls.push({ id: docRef.id, name: soul.name });
    }

    return createdSouls;
  }

  private async seedAccounts(
    orgId: string,
    souls: Array<{ id: string; name: string }>,
    personas: Array<{ id: string; name: string }>,
    proxies: Array<{ id: string; name: string }>,
    now: admin.firestore.Timestamp
  ): Promise<Array<{ id: string; platform: string }>> {
    const accountsData: Array<Omit<SeedAccount, 'soul_id' | 'persona_id' | 'proxy_id'> & {
      soulIndex: number;
      personaIndex?: number;
      proxyIndex?: number;
    }> = [
      // Brand Alpha accounts
      {
        soulIndex: 0,
        platform: 'instagram',
        username: 'brandalpha_official',
        status: 'active',
        personaIndex: 0,
        proxyIndex: 0,
        tags: ['main', 'official'],
      },
      {
        soulIndex: 0,
        platform: 'tiktok',
        username: 'brandalpha',
        status: 'active',
        personaIndex: 0,
        proxyIndex: 0,
        tags: ['main'],
      },
      // Brand Beta accounts
      {
        soulIndex: 1,
        platform: 'instagram',
        username: 'brandbeta_eco',
        status: 'active',
        personaIndex: 0,
        proxyIndex: 1,
        tags: ['main', 'official'],
      },
      {
        soulIndex: 1,
        platform: 'twitter',
        username: 'BrandBetaEco',
        status: 'active',
        personaIndex: 0,
        proxyIndex: 1,
        tags: ['main'],
      },
      // Sarah Chen accounts
      {
        soulIndex: 2,
        platform: 'twitter',
        username: 'sarahchentech',
        status: 'active',
        personaIndex: 1,
        proxyIndex: 2,
        tags: ['personal', 'tech'],
      },
      {
        soulIndex: 2,
        platform: 'linkedin',
        username: 'sarah-chen-tech',
        status: 'active',
        personaIndex: 1,
        tags: ['professional'],
      },
      // HealthFirst agency accounts
      {
        soulIndex: 3,
        platform: 'instagram',
        username: 'healthfirst_agency',
        status: 'active',
        personaIndex: 2,
        proxyIndex: 0,
        tags: ['agency', 'main'],
      },
      {
        soulIndex: 3,
        platform: 'facebook',
        username: 'HealthFirstAgency',
        status: 'inactive',
        personaIndex: 2,
        tags: ['agency'],
      },
    ];

    const createdAccounts: Array<{ id: string; platform: string }> = [];
    const soulAccountMap: Map<string, string[]> = new Map();

    for (const accountData of accountsData) {
      const { soulIndex, personaIndex, proxyIndex, ...rest } = accountData;
      const soul = souls[soulIndex];
      const persona = personaIndex !== undefined ? personas[personaIndex] : undefined;
      const proxy = proxyIndex !== undefined ? proxies[proxyIndex] : undefined;

      const docRef = this.firestore.collection('accounts').doc();
      await docRef.set({
        ...rest,
        soul_id: soul.id,
        persona_id: persona?.id || null,
        proxy_id: proxy?.id || null,
        organization_id: orgId,
        metadata: {
          created_via: 'seed',
        },
        createdAt: now,
        updatedAt: now,
      });

      createdAccounts.push({ id: docRef.id, platform: rest.platform });

      // Track accounts per soul for updating
      const currentAccounts = soulAccountMap.get(soul.id) || [];
      currentAccounts.push(docRef.id);
      soulAccountMap.set(soul.id, currentAccounts);
    }

    // Update souls with their account IDs
    for (const [soulId, accountIds] of soulAccountMap.entries()) {
      await this.firestore.doc(`souls/${soulId}`).update({
        account_ids: accountIds,
        updatedAt: now,
      });
    }

    return createdAccounts;
  }
}
