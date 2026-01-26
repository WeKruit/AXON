// AXON Domain Types and Enums

export enum Platform {
  TWITTER = 'twitter',
  INSTAGRAM = 'instagram',
  FACEBOOK = 'facebook',
  LINKEDIN = 'linkedin',
  TIKTOK = 'tiktok',
  YOUTUBE = 'youtube',
  REDDIT = 'reddit',
  PINTEREST = 'pinterest',
  THREADS = 'threads',
  BLUESKY = 'bluesky',
  MASTODON = 'mastodon',
}

export enum AccountStatus {
  ACTIVE = 'active',
  WARMING = 'warming',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  NEEDS_VERIFICATION = 'needs_verification',
  INACTIVE = 'inactive',
}

export enum ProxyType {
  RESIDENTIAL = 'residential',
  MOBILE = 'mobile',
  DATACENTER = 'datacenter',
  ISP = 'isp',
}

export enum ProxyPurpose {
  SCRAPING = 'scraping',
  ACCOUNT_MANAGEMENT = 'account_management',
  WARMING = 'warming',
  CONTENT_POSTING = 'content_posting',
  VERIFICATION = 'verification',
}

export enum ProxyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  RATE_LIMITED = 'rate_limited',
  BANNED = 'banned',
  EXPIRED = 'expired',
}

export enum ProxyProvider {
  IPROYAL = 'iproyal',
  BRIGHT_DATA = 'bright_data',
  OXYLABS = 'oxylabs',
  SMARTPROXY = 'smartproxy',
  CUSTOM = 'custom',
}

export enum SoulType {
  EMAIL = 'email',
  PHONE = 'phone',
  BOTH = 'both',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non_binary',
  UNSPECIFIED = 'unspecified',
}

// Proxy-Purpose Matrix: Defines which proxy types are suitable for which purposes
export const PROXY_PURPOSE_MATRIX: Record<ProxyPurpose, ProxyType[]> = {
  [ProxyPurpose.SCRAPING]: [ProxyType.DATACENTER, ProxyType.RESIDENTIAL],
  [ProxyPurpose.ACCOUNT_MANAGEMENT]: [ProxyType.RESIDENTIAL, ProxyType.MOBILE, ProxyType.ISP],
  [ProxyPurpose.WARMING]: [ProxyType.RESIDENTIAL, ProxyType.MOBILE],
  [ProxyPurpose.CONTENT_POSTING]: [ProxyType.RESIDENTIAL, ProxyType.MOBILE, ProxyType.ISP],
  [ProxyPurpose.VERIFICATION]: [ProxyType.MOBILE, ProxyType.RESIDENTIAL],
};

// Firestore timestamp type for serialization
export interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

// Base interface for Firestore documents
export interface FirestoreDocument {
  id: string;
  createdAt: FirestoreTimestamp | Date;
  updatedAt: FirestoreTimestamp | Date;
  deletedAt?: FirestoreTimestamp | Date | null;
}
