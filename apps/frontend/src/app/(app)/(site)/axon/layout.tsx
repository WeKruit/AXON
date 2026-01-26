'use client';

import { ReactNode } from 'react';
import { AxonNav } from '@gitroom/frontend/components/axon/ui/axon-nav';

export default function AxonLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col flex-1">
      <AxonNav />
      {children}
    </div>
  );
}
