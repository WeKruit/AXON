import type { SoulStatus, AccountStatus, AccountPurpose, ProxyType, ProxyStatus, Platform } from './types';

export const SOUL_STATUS = {
  ACTIVE: 'active' as SoulStatus,
  INACTIVE: 'inactive' as SoulStatus,
  WARMING: 'warming' as SoulStatus,
  SUSPENDED: 'suspended' as SoulStatus,
} as const;

export const ACCOUNT_STATUS = {
  ACTIVE: 'active' as AccountStatus,
  INACTIVE: 'inactive' as AccountStatus,
  WARMING: 'warming' as AccountStatus,
  SUSPENDED: 'suspended' as AccountStatus,
  NEEDS_VERIFICATION: 'needs_verification' as AccountStatus,
} as const;

export const ACCOUNT_PURPOSE = {
  CONTENT: 'content' as AccountPurpose,
  ENGAGEMENT: 'engagement' as AccountPurpose,
  AMPLIFICATION: 'amplification' as AccountPurpose,
  MONITORING: 'monitoring' as AccountPurpose,
} as const;

export const PROXY_TYPE = {
  RESIDENTIAL: 'residential' as ProxyType,
  DATACENTER: 'datacenter' as ProxyType,
  MOBILE: 'mobile' as ProxyType,
  ISP: 'isp' as ProxyType,
} as const;

export const PROXY_STATUS = {
  ACTIVE: 'active' as ProxyStatus,
  INACTIVE: 'inactive' as ProxyStatus,
  ROTATING: 'rotating' as ProxyStatus,
  FLAGGED: 'flagged' as ProxyStatus,
} as const;

export const PLATFORM = {
  TWITTER: 'twitter' as Platform,
  INSTAGRAM: 'instagram' as Platform,
  LINKEDIN: 'linkedin' as Platform,
  FACEBOOK: 'facebook' as Platform,
  TIKTOK: 'tiktok' as Platform,
  THREADS: 'threads' as Platform,
  BLUESKY: 'bluesky' as Platform,
  MASTODON: 'mastodon' as Platform,
} as const;

export const SOUL_STATUS_OPTIONS = [
  { value: SOUL_STATUS.ACTIVE, label: 'Active' },
  { value: SOUL_STATUS.INACTIVE, label: 'Inactive' },
  { value: SOUL_STATUS.WARMING, label: 'Warming' },
  { value: SOUL_STATUS.SUSPENDED, label: 'Suspended' },
] as const;

export const ACCOUNT_STATUS_OPTIONS = [
  { value: ACCOUNT_STATUS.ACTIVE, label: 'Active' },
  { value: ACCOUNT_STATUS.INACTIVE, label: 'Inactive' },
  { value: ACCOUNT_STATUS.WARMING, label: 'Warming' },
  { value: ACCOUNT_STATUS.SUSPENDED, label: 'Suspended' },
  { value: ACCOUNT_STATUS.NEEDS_VERIFICATION, label: 'Needs Verification' },
] as const;

export const ACCOUNT_PURPOSE_OPTIONS = [
  { value: ACCOUNT_PURPOSE.CONTENT, label: 'Content Creation', description: 'Creates and publishes original content' },
  { value: ACCOUNT_PURPOSE.ENGAGEMENT, label: 'Engagement', description: 'Interacts with other users and content' },
  { value: ACCOUNT_PURPOSE.AMPLIFICATION, label: 'Amplification', description: 'Amplifies and spreads existing content' },
  { value: ACCOUNT_PURPOSE.MONITORING, label: 'Monitoring', description: 'Monitors trends and competitor activity' },
] as const;

export const PROXY_TYPE_OPTIONS = [
  { value: PROXY_TYPE.RESIDENTIAL, label: 'Residential', description: 'Real residential IPs - best for content creation' },
  { value: PROXY_TYPE.DATACENTER, label: 'Datacenter', description: 'High-speed datacenter IPs - ideal for monitoring' },
  { value: PROXY_TYPE.MOBILE, label: 'Mobile', description: 'Mobile carrier IPs - excellent for engagement' },
  { value: PROXY_TYPE.ISP, label: 'ISP', description: 'Static ISP IPs - good for long-running sessions' },
] as const;

export const PLATFORM_OPTIONS = [
  { value: PLATFORM.TWITTER, label: 'X (Twitter)' },
  { value: PLATFORM.INSTAGRAM, label: 'Instagram' },
  { value: PLATFORM.LINKEDIN, label: 'LinkedIn' },
  { value: PLATFORM.FACEBOOK, label: 'Facebook' },
  { value: PLATFORM.TIKTOK, label: 'TikTok' },
  { value: PLATFORM.THREADS, label: 'Threads' },
  { value: PLATFORM.BLUESKY, label: 'Bluesky' },
  { value: PLATFORM.MASTODON, label: 'Mastodon' },
] as const;

export const PURPOSE_TO_PROXY_MAPPING: Record<AccountPurpose, ProxyType[]> = {
  content: [PROXY_TYPE.RESIDENTIAL, PROXY_TYPE.ISP],
  engagement: [PROXY_TYPE.RESIDENTIAL, PROXY_TYPE.MOBILE],
  amplification: [PROXY_TYPE.DATACENTER, PROXY_TYPE.RESIDENTIAL],
  monitoring: [PROXY_TYPE.DATACENTER],
};
