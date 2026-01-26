'use client';

import { FC, memo } from 'react';
import clsx from 'clsx';
import type { MatrixIntegration } from './types';
import { PlatformIcon } from '../ui/platform-icon';
import type { Platform } from '../types';

interface MatrixHeaderProps {
  integration: MatrixIntegration;
  isLast?: boolean;
}

/**
 * Column header for matrix showing integration/channel info
 */
export const MatrixHeader: FC<MatrixHeaderProps> = memo(({ integration, isLast }) => {
  const isPlatformSupported = [
    'twitter',
    'instagram',
    'linkedin',
    'facebook',
    'tiktok',
    'threads',
    'bluesky',
    'mastodon',
  ].includes(integration.platform.toLowerCase());

  return (
    <th
      className={clsx(
        'p-3 bg-newBgLineColor text-center min-w-[80px]',
        isLast && 'rounded-tr-lg'
      )}
    >
      <div className="flex flex-col items-center gap-2">
        {/* Platform icon or generic icon */}
        {isPlatformSupported ? (
          <PlatformIcon
            platform={integration.platform.toLowerCase() as Platform}
            size="md"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-newBgColorInner flex items-center justify-center">
            <span className="text-xs font-medium text-textItemBlur">
              {integration.platform.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Integration name */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-medium text-newTextColor truncate max-w-[70px]">
            {integration.name}
          </span>
          {!isPlatformSupported && (
            <span className="text-[10px] text-textItemBlur capitalize">
              {integration.platform}
            </span>
          )}
        </div>

        {/* Connection count */}
        <span className="text-[10px] text-textItemBlur">
          {integration.soulIds.length} soul{integration.soulIds.length !== 1 ? 's' : ''}
        </span>

        {/* Disabled indicator */}
        {integration.disabled && (
          <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded">
            Disabled
          </span>
        )}
      </div>
    </th>
  );
});

MatrixHeader.displayName = 'MatrixHeader';

/**
 * Skeleton header for loading state
 */
export const MatrixHeaderSkeleton: FC = () => (
  <th className="p-3 bg-newBgLineColor text-center min-w-[80px]">
    <div className="flex flex-col items-center gap-2">
      <div className="w-5 h-5 rounded-full bg-newBgColorInner animate-pulse" />
      <div className="w-12 h-3 bg-newBgColorInner rounded animate-pulse" />
      <div className="w-8 h-2 bg-newBgColorInner rounded animate-pulse" />
    </div>
  </th>
);
