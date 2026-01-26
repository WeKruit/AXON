'use client';

import { PersonasListComponent } from '@gitroom/frontend/components/axon/personas/personas-list.component';
import { AxonErrorBoundary } from '@gitroom/frontend/components/axon/ui/error-boundary';

export default function PersonasPage() {
  return (
    <AxonErrorBoundary>
      <PersonasListComponent />
    </AxonErrorBoundary>
  );
}
