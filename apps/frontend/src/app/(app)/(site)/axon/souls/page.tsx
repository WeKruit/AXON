'use client';

import { SoulsListComponent } from '@gitroom/frontend/components/axon/souls/souls-list.component';
import { AxonErrorBoundary } from '@gitroom/frontend/components/axon/ui/error-boundary';

export default function SoulsPage() {
  return (
    <AxonErrorBoundary>
      <SoulsListComponent />
    </AxonErrorBoundary>
  );
}
