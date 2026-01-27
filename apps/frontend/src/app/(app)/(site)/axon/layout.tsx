'use client';

import { ReactNode } from 'react';
import { AxonNav } from '@gitroom/frontend/components/axon/ui/axon-nav';
import { AxonDataProvider } from '@gitroom/frontend/components/axon/context/axon-data-provider';

/**
 * AXON Layout (WEC-190, WEC-193)
 *
 * Wraps all AXON pages with:
 * 1. AxonDataProvider - Pre-fetches shared data and preserves filter/scroll state
 * 2. AxonNav - Navigation that stays visible during route transitions
 *
 * This enables instant tab switches by keeping data loaded and state preserved.
 */
export default function AxonLayout({ children }: { children: ReactNode }) {
  return (
    <AxonDataProvider>
      <div className="flex flex-col flex-1">
        <AxonNav />
        {children}
      </div>
    </AxonDataProvider>
  );
}
