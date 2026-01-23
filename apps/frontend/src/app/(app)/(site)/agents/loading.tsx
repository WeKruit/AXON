'use client';

import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';

export default function Loading() {
  return (
    <div className="flex flex-1 bg-newBgColorInner">
      <LoadingComponent />
    </div>
  );
}
