#!/usr/bin/env npx ts-node

/**
 * AXON Seed Script
 *
 * Seeds Firestore with sample data for testing.
 *
 * Usage:
 *   npx dotenv -e .env -- npx ts-node scripts/axon-seed.ts
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require('firebase-admin');

// Initialize Firebase
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('Missing Firebase credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

const db = admin.firestore();

interface SeedData {
  personas: Array<{ id?: string; [key: string]: unknown }>;
  proxies: Array<{ id?: string; [key: string]: unknown }>;
  souls: Array<{ id?: string; persona_id?: string; [key: string]: unknown }>;
  accounts: Array<{ id?: string; soul_id?: string; persona_id?: string; proxy_id?: string; [key: string]: unknown }>;
}

async function seed() {
  console.log('Starting AXON seed...');
  console.log(`Firebase project: ${projectId}`);

  const orgId = 'demo-org-001';
  const now = admin.firestore.Timestamp.now();

  const data: SeedData = {
    personas: [],
    proxies: [],
    souls: [],
    accounts: [],
  };

  // 1. Create Personas
  console.log('\nCreating personas...');
  const personasData = [
    {
      name: 'Fashion Maven',
      bio: 'Style enthusiast sharing the latest trends and timeless fashion tips.',
      tone: 'enthusiastic',
      writing_style: 'casual',
      interests: ['fashion', 'style', 'beauty', 'sustainability'],
      personality_traits: ['creative', 'trendy', 'authentic'],
      hashtags: ['#fashion', '#style', '#ootd'],
      is_ai_generated: false,
      is_archived: false,
      tags: ['fashion', 'lifestyle'],
    },
    {
      name: 'Tech Innovator',
      bio: 'Exploring the cutting edge of technology. From AI to Web3.',
      tone: 'professional',
      writing_style: 'informative',
      interests: ['technology', 'AI', 'startups', 'Web3'],
      personality_traits: ['analytical', 'curious', 'forward-thinking'],
      hashtags: ['#tech', '#AI', '#innovation'],
      is_ai_generated: true,
      is_archived: false,
      tags: ['tech', 'business'],
    },
    {
      name: 'Wellness Guide',
      bio: 'Holistic health advocate sharing mindful living tips.',
      tone: 'warm',
      writing_style: 'supportive',
      interests: ['wellness', 'fitness', 'nutrition', 'mindfulness'],
      personality_traits: ['caring', 'motivating', 'calm'],
      hashtags: ['#wellness', '#selfcare', '#healthylifestyle'],
      is_ai_generated: false,
      is_archived: false,
      tags: ['health', 'lifestyle'],
    },
  ];

  for (const persona of personasData) {
    const docRef = db.collection('personas').doc();
    await docRef.set({
      ...persona,
      organization_id: orgId,
      assigned_accounts_count: 0,
      createdAt: now,
      updatedAt: now,
    });
    data.personas.push({ id: docRef.id, ...persona });
    console.log(`  Created persona: ${persona.name} (${docRef.id})`);
  }

  // 2. Create Proxies
  console.log('\nCreating proxies...');
  const proxiesData = [
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

  for (const proxy of proxiesData) {
    const docRef = db.collection('proxies').doc();
    await docRef.set({
      ...proxy,
      organization_id: orgId,
      assigned_accounts: [],
      health_check_results: [],
      last_health_check: null,
      createdAt: now,
      updatedAt: now,
    });
    data.proxies.push({ id: docRef.id, ...proxy });
    console.log(`  Created proxy: ${proxy.name} (${docRef.id})`);
  }

  // 3. Create Souls
  console.log('\nCreating souls...');
  const soulsData = [
    {
      name: 'Brand Alpha - Urban Fashion',
      type: 'brand',
      status: 'active',
      description: 'Urban streetwear brand targeting Gen-Z audience.',
      email: 'contact@brandalpha.example',
      personaIndex: 0,
      tags: ['fashion', 'brand', 'urban'],
    },
    {
      name: 'Brand Beta - Eco Luxe',
      type: 'brand',
      status: 'active',
      description: 'Luxury sustainable fashion brand.',
      email: 'hello@brandbeta.example',
      personaIndex: 0,
      tags: ['fashion', 'brand', 'luxury'],
    },
    {
      name: 'Personal - Sarah Chen',
      type: 'personal',
      status: 'active',
      description: 'Tech content creator and startup founder.',
      email: 'sarah@example.com',
      personaIndex: 1,
      tags: ['personal', 'tech'],
    },
    {
      name: 'Agency - HealthFirst',
      type: 'agency',
      status: 'active',
      description: 'Health and wellness marketing agency.',
      email: 'team@healthfirst.example',
      personaIndex: 2,
      tags: ['agency', 'health'],
    },
  ];

  for (const soul of soulsData) {
    const { personaIndex, ...soulData } = soul;
    const docRef = db.collection('souls').doc();
    await docRef.set({
      ...soulData,
      organization_id: orgId,
      persona_id: data.personas[personaIndex]?.id || null,
      account_ids: [],
      createdAt: now,
      updatedAt: now,
    });
    data.souls.push({ id: docRef.id, ...soulData, persona_id: data.personas[personaIndex]?.id });
    console.log(`  Created soul: ${soulData.name} (${docRef.id})`);
  }

  // 4. Create Accounts
  console.log('\nCreating accounts...');
  const accountsData = [
    { soulIndex: 0, platform: 'instagram', username: 'brandalpha_official', status: 'active', personaIndex: 0, proxyIndex: 0 },
    { soulIndex: 0, platform: 'tiktok', username: 'brandalpha', status: 'active', personaIndex: 0, proxyIndex: 0 },
    { soulIndex: 1, platform: 'instagram', username: 'brandbeta_eco', status: 'active', personaIndex: 0, proxyIndex: 1 },
    { soulIndex: 1, platform: 'twitter', username: 'BrandBetaEco', status: 'active', personaIndex: 0, proxyIndex: 1 },
    { soulIndex: 2, platform: 'twitter', username: 'sarahchentech', status: 'active', personaIndex: 1, proxyIndex: 2 },
    { soulIndex: 2, platform: 'linkedin', username: 'sarah-chen-tech', status: 'active', personaIndex: 1 },
    { soulIndex: 3, platform: 'instagram', username: 'healthfirst_agency', status: 'active', personaIndex: 2, proxyIndex: 0 },
    { soulIndex: 3, platform: 'facebook', username: 'HealthFirstAgency', status: 'inactive', personaIndex: 2 },
  ];

  const soulAccountMap: Map<string, string[]> = new Map();

  for (const acc of accountsData) {
    const { soulIndex, personaIndex, proxyIndex, ...accountData } = acc;
    const soul = data.souls[soulIndex];
    const persona = personaIndex !== undefined ? data.personas[personaIndex] : undefined;
    const proxy = proxyIndex !== undefined ? data.proxies[proxyIndex] : undefined;

    const docRef = db.collection('accounts').doc();
    await docRef.set({
      ...accountData,
      soul_id: soul.id,
      persona_id: persona?.id || null,
      proxy_id: proxy?.id || null,
      organization_id: orgId,
      tags: [],
      metadata: { created_via: 'seed' },
      createdAt: now,
      updatedAt: now,
    });
    data.accounts.push({ id: docRef.id, ...accountData });
    console.log(`  Created account: ${accountData.platform}/${accountData.username} (${docRef.id})`);

    // Track accounts per soul
    const currentAccounts = soulAccountMap.get(soul.id!) || [];
    currentAccounts.push(docRef.id);
    soulAccountMap.set(soul.id!, currentAccounts);
  }

  // Update souls with account IDs
  console.log('\nUpdating souls with account references...');
  for (const [soulId, accountIds] of soulAccountMap.entries()) {
    await db.doc(`souls/${soulId}`).update({
      account_ids: accountIds,
      updatedAt: now,
    });
  }

  console.log('\n========================================');
  console.log('AXON Seed completed successfully!');
  console.log('========================================');
  console.log(`
Summary:
  - ${data.personas.length} Personas
  - ${data.proxies.length} Proxies
  - ${data.souls.length} Souls
  - ${data.accounts.length} Accounts

Organization ID: ${orgId}
  `);

  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
