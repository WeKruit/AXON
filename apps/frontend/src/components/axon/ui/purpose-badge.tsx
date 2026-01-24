'use client';

import clsx from 'clsx';
import type { AccountPurpose, ProxyType } from '../types';

interface PurposeBadgeProps {
  purpose: AccountPurpose;
  size?: 'sm' | 'md' | 'lg';
}

const purposeStyles: Record<AccountPurpose, { bg: string; text: string; icon: string }> = {
  content: { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: '📝' },
  engagement: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: '💬' },
  amplification: { bg: 'bg-green-500/10', text: 'text-green-400', icon: '📢' },
  monitoring: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: '👁️' },
};

const purposeDescriptions: Record<AccountPurpose, string> = {
  content: 'Creates and publishes original content',
  engagement: 'Interacts with other users and content',
  amplification: 'Amplifies and spreads existing content',
  monitoring: 'Monitors trends and competitor activity',
};

const sizeStyles = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export function PurposeBadge({ purpose, size = 'md' }: PurposeBadgeProps) {
  const styles = purposeStyles[purpose];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium capitalize',
        styles.bg,
        styles.text,
        sizeStyles[size]
      )}
      title={purposeDescriptions[purpose]}
    >
      <span>{styles.icon}</span>
      {purpose}
    </span>
  );
}

interface ProxyTypeBadgeProps {
  type: ProxyType;
  size?: 'sm' | 'md' | 'lg';
}

const proxyTypeStyles: Record<ProxyType, { bg: string; text: string; icon: string }> = {
  residential: { bg: 'bg-green-500/10', text: 'text-green-400', icon: '🏠' },
  datacenter: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: '🏢' },
  mobile: { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: '📱' },
  isp: { bg: 'bg-orange-500/10', text: 'text-orange-400', icon: '🌐' },
};

const proxyTypeDescriptions: Record<ProxyType, string> = {
  residential: 'Real residential IP addresses',
  datacenter: 'High-speed datacenter IPs',
  mobile: 'Mobile carrier IPs',
  isp: 'ISP-level static IPs',
};

export function ProxyTypeBadge({ type, size = 'md' }: ProxyTypeBadgeProps) {
  const styles = proxyTypeStyles[type];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium capitalize',
        styles.bg,
        styles.text,
        sizeStyles[size]
      )}
      title={proxyTypeDescriptions[type]}
    >
      <span>{styles.icon}</span>
      {type}
    </span>
  );
}
