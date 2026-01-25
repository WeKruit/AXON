'use client';

import { useParams } from 'next/navigation';
import { SoulDashboardComponent } from '@gitroom/frontend/components/axon/souls/soul-dashboard.component';
import { AxonErrorBoundary, ErrorState } from '@gitroom/frontend/components/axon/ui/error-boundary';

export default function SoulDetailPage() {
  const params = useParams();
  const soulId = params.id;

  if (!soulId || typeof soulId !== 'string') {
    return (
      <div className="flex-1 bg-newBgColorInner p-6">
        <ErrorState
          title="Invalid Soul ID"
          message="The soul ID provided is not valid. Please go back and try again."
        />
      </div>
    );
  }

  return (
    <AxonErrorBoundary>
      <SoulDashboardComponent soulId={soulId} />
    </AxonErrorBoundary>
  );
}
