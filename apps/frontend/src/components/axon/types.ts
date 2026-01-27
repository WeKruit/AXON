export type SoulStatus = 'active' | 'inactive' | 'warming' | 'suspended';
export type AccountStatus = 'active' | 'inactive' | 'warming' | 'suspended' | 'needs_verification';
export type AccountPurpose = 'content' | 'engagement' | 'amplification' | 'monitoring';
export type ProxyType = 'residential' | 'datacenter' | 'mobile' | 'isp';
export type ProxyStatus = 'active' | 'inactive' | 'rotating' | 'flagged';
export type Platform = 'twitter' | 'instagram' | 'linkedin' | 'facebook' | 'tiktok' | 'threads' | 'bluesky' | 'mastodon';

export interface Soul {
  id: string;
  name: string;
  description?: string;
  status: SoulStatus;
  organizationId: string;
  personaId?: string;
  persona?: Persona;
  accounts: Account[];
  proxyId?: string;
  proxy?: Proxy;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Integration summary for displaying linked integration info on accounts
 */
export interface AccountIntegration {
  id: string;
  name: string;
  platform: Platform;
  picture?: string;
}

export interface Account {
  id: string;
  soulId: string;
  soul?: Soul;
  platform: Platform;
  username: string;
  displayName?: string;
  profileUrl?: string;
  avatarUrl?: string;
  purpose: AccountPurpose;
  status: AccountStatus;
  proxyId?: string;
  proxy?: Proxy;
  integrationId?: string;
  integration?: AccountIntegration;
  warmupProgress?: number;
  lastActivityAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Persona {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  tone: string;
  style: string;
  topics: string[];
  demographics?: {
    age?: string;
    gender?: string;
    location?: string;
    occupation?: string;
    interests?: string[];
  };
  writingGuidelines?: string;
  examplePosts?: string[];
  avoidTopics?: string[];
  isAiGenerated: boolean;
  souls?: Soul[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Proxy {
  id: string;
  name: string;
  organizationId: string;
  type: ProxyType;
  host: string;
  port: number;
  username?: string;
  password?: string;
  country?: string;
  city?: string;
  isp?: string;
  status: ProxyStatus;
  rotationInterval?: number;
  lastRotatedAt?: string;
  latency?: number;
  successRate?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SoulWithStats extends Soul {
  stats: {
    totalAccounts: number;
    activeAccounts: number;
    totalPosts: number;
    totalEngagement: number;
    avgEngagementRate: number;
  };
}

export interface AccountWithStats extends Account {
  stats: {
    followers: number;
    following: number;
    posts: number;
    engagement: number;
    engagementRate: number;
  };
}

export interface ProxyPool {
  id: string;
  name: string;
  organizationId: string;
  proxies: Proxy[];
  purposeMapping: Record<AccountPurpose, ProxyType[]>;
  createdAt: string;
  updatedAt: string;
}

export interface ProxyPurposeMatrix {
  content: ProxyType[];
  engagement: ProxyType[];
  amplification: ProxyType[];
  monitoring: ProxyType[];
}

export const DEFAULT_PROXY_PURPOSE_MATRIX: ProxyPurposeMatrix = {
  content: ['residential', 'isp'],
  engagement: ['residential', 'mobile'],
  amplification: ['datacenter', 'residential'],
  monitoring: ['datacenter'],
};

export interface CreateSoulDto {
  name: string;
  description?: string;
  personaId?: string;
  proxyId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateSoulDto {
  name?: string;
  description?: string;
  status?: SoulStatus;
  personaId?: string;
  proxyId?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateAccountDto {
  soulId: string;
  platform: Platform;
  username: string;
  displayName?: string;
  purpose: AccountPurpose;
  proxyId?: string;
  integrationId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateAccountDto {
  displayName?: string;
  purpose?: AccountPurpose;
  status?: AccountStatus;
  proxyId?: string;
  integrationId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CreatePersonaDto {
  name: string;
  description?: string;
  tone: string;
  style: string;
  topics: string[];
  demographics?: Persona['demographics'];
  writingGuidelines?: string;
  examplePosts?: string[];
  avoidTopics?: string[];
}

export interface UpdatePersonaDto {
  name?: string;
  description?: string;
  tone?: string;
  style?: string;
  topics?: string[];
  demographics?: Persona['demographics'];
  writingGuidelines?: string;
  examplePosts?: string[];
  avoidTopics?: string[];
}

export interface GeneratePersonaDto {
  prompt: string;
  targetAudience?: string;
  industry?: string;
  tone?: string;
}

export interface CreateProxyDto {
  name: string;
  type: ProxyType;
  host: string;
  port: number;
  username?: string;
  password?: string;
  country?: string;
  city?: string;
  isp?: string;
  rotationInterval?: number;
}

export interface UpdateProxyDto {
  name?: string;
  status?: ProxyStatus;
  rotationInterval?: number;
  metadata?: Record<string, unknown>;
}

export interface AxonAnalytics {
  totalSouls: number;
  activeSouls: number;
  totalAccounts: number;
  activeAccounts: number;
  accountsByPlatform: Record<Platform, number>;
  accountsByPurpose: Record<AccountPurpose, number>;
  totalProxies: number;
  activeProxies: number;
  proxiesByType: Record<ProxyType, number>;
  totalPersonas: number;
}
