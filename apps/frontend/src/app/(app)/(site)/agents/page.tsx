'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/agents/new');
  }, [router]);

  return (
    <div className="flex flex-1 bg-newBgColorInner">
      <LoadingComponent />
    </div>
  );
}
