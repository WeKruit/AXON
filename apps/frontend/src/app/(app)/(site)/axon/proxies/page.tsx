'use client';

import { ProxiesListComponent } from '@gitroom/frontend/components/axon/proxies/proxies-list.component';
import { AxonErrorBoundary } from '@gitroom/frontend/components/axon/ui/error-boundary';

export default function ProxiesPage() {
  return (
    <AxonErrorBoundary>
      <ProxiesListComponent />
    </AxonErrorBoundary>
  );
}
