'use client';

import { FC, memo, ReactNode } from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import type { MatrixSoul } from './types';
import { StatusBadge } from '../ui/status-badge';
import type { SoulStatus } from '../types';

interface MatrixRowProps {
  soul: MatrixSoul;
  isLast?: boolean;
  children: ReactNode;
}

/**
 * Row component for matrix displaying Soul info and cells
 */
export const MatrixRow: FC<MatrixRowProps> = memo(({ soul, isLast, children }) => {
  return (
    <tr
      className={clsx(
        'border-b border-newTableBorder hover:bg-newBgLineColor/30 transition-colors',
        isLast && 'border-b-0'
      )}
    >
      {/* Soul info column */}
      <td className={clsx('p-3', isLast && 'rounded-bl-lg')}>
        <Link
          href={`/axon/souls/${soul.id}`}
          className="group flex items-center gap-3 min-w-[180px]"
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
            aria-hidden="true"
          >
            {soul.name.charAt(0).toUpperCase()}
          </div>

          {/* Name and persona */}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-newTextColor group-hover:text-btnPrimary transition-colors truncate">
              {soul.name}
            </span>
            {soul.persona ? (
              <span className="text-xs text-textItemBlur truncate">
                {soul.persona.name}
              </span>
            ) : (
              <span className="text-xs text-textItemBlur/50 italic">No persona</span>
            )}
          </div>

          {/* Status badge */}
          <StatusBadge status={soul.status as SoulStatus} size="sm" />
        </Link>
      </td>

      {/* Matrix cells */}
      {children}
    </tr>
  );
});

MatrixRow.displayName = 'MatrixRow';

/**
 * Row info component showing connection summary
 */
export const MatrixRowInfo: FC<{ soul: MatrixSoul }> = memo(({ soul }) => {
  const connectedCount = soul.integrationIds.length;
  const primaryMapping = soul.mappings.find((m) => m.isPrimary);

  return (
    <div className="flex items-center gap-2 text-xs text-textItemBlur">
      <span>{connectedCount} channel{connectedCount !== 1 ? 's' : ''}</span>
      {primaryMapping && (
        <>
          <span className="text-newTableBorder">|</span>
          <span className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-yellow-500"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Primary set
          </span>
        </>
      )}
    </div>
  );
});

MatrixRowInfo.displayName = 'MatrixRowInfo';

/**
 * Skeleton row for loading state
 */
export const MatrixRowSkeleton: FC<{ columnCount: number }> = ({ columnCount }) => (
  <tr className="border-b border-newTableBorder">
    <td className="p-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-newBgLineColor animate-pulse" />
        <div className="flex flex-col gap-1">
          <div className="w-24 h-4 bg-newBgLineColor rounded animate-pulse" />
          <div className="w-16 h-3 bg-newBgLineColor rounded animate-pulse" />
        </div>
      </div>
    </td>
    {[...Array(columnCount)].map((_, i) => (
      <td key={i} className="p-1">
        <div className="w-10 h-10 rounded-lg bg-newBgLineColor animate-pulse" />
      </td>
    ))}
  </tr>
);
