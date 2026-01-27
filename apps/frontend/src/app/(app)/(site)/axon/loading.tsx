'use client';

import { FC } from 'react';
import { AxonNav } from '@gitroom/frontend/components/axon/ui/axon-nav';

/**
 * AXON Loading Component (WEC-192)
 *
 * This loading.tsx file is rendered during Next.js route transitions within the AXON section.
 * By including AxonNav, the navigation stays visible during transitions, preventing
 * the jarring flash of an empty page.
 */
const AxonLoading: FC = () => {
  return (
    <div className="flex flex-col flex-1">
      <AxonNav />
      <AxonContentSkeleton />
    </div>
  );
};

/**
 * Content skeleton that matches the general layout of AXON pages
 */
const AxonContentSkeleton: FC = () => (
  <div className="flex-1 bg-newBgColorInner p-6" aria-busy="true" aria-label="Loading AXON content">
    {/* Header skeleton */}
    <div className="flex items-center justify-between mb-6">
      <div>
        <div className="h-8 w-48 bg-newBgLineColor rounded animate-pulse mb-2" />
        <div className="h-4 w-72 bg-newBgLineColor rounded animate-pulse" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-10 w-24 bg-newBgLineColor rounded-lg animate-pulse" />
        <div className="h-10 w-32 bg-newBgLineColor rounded-lg animate-pulse" />
      </div>
    </div>

    {/* Stats row skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-newBgLineColor rounded-lg p-4 animate-pulse">
          <div className="h-6 w-16 bg-newBgColorInner rounded mb-2" />
          <div className="h-4 w-24 bg-newBgColorInner rounded" />
        </div>
      ))}
    </div>

    {/* Content grid skeleton */}
    <div className="bg-newBgLineColor rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <ContentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

/**
 * Individual card skeleton
 */
const ContentCardSkeleton: FC = () => (
  <div className="bg-newBgColorInner rounded-lg p-4 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-newBgLineColor" />
        <div>
          <div className="h-5 w-24 bg-newBgLineColor rounded mb-1" />
          <div className="h-3 w-20 bg-newBgLineColor rounded" />
        </div>
      </div>
      <div className="h-5 w-14 bg-newBgLineColor rounded" />
    </div>
    <div className="h-4 w-full bg-newBgLineColor rounded mb-2" />
    <div className="h-4 w-3/4 bg-newBgLineColor rounded mb-3" />
    <div className="flex items-center justify-between pt-2 border-t border-newBgLineColor">
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 bg-newBgLineColor rounded" />
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-5 h-5 rounded bg-newBgLineColor" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default AxonLoading;
