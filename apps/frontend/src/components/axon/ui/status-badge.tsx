'use client';

import clsx from 'clsx';
import type { SoulStatus, AccountStatus, ProxyStatus } from '../types';

type Status = SoulStatus | AccountStatus | ProxyStatus;

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
}

const statusStyles: Record<Status, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-green-500/10', text: 'text-green-500', dot: 'bg-green-500' },
  inactive: { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-400' },
  warming: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', dot: 'bg-yellow-500' },
  suspended: { bg: 'bg-red-500/10', text: 'text-red-500', dot: 'bg-red-500' },
  needs_verification: { bg: 'bg-orange-500/10', text: 'text-orange-500', dot: 'bg-orange-500' },
  rotating: { bg: 'bg-blue-500/10', text: 'text-blue-500', dot: 'bg-blue-500' },
  flagged: { bg: 'bg-red-500/10', text: 'text-red-500', dot: 'bg-red-500' },
};

const statusLabels: Record<Status, string> = {
  active: 'Active',
  inactive: 'Inactive',
  warming: 'Warming Up',
  suspended: 'Suspended',
  needs_verification: 'Needs Verification',
  rotating: 'Rotating',
  flagged: 'Flagged',
};

const sizeStyles = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const styles = statusStyles[status];
  const label = statusLabels[status];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        styles.bg,
        styles.text,
        sizeStyles[size]
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', styles.dot)} />
      {label}
    </span>
  );
}
