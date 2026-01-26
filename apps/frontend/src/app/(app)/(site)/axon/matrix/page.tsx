'use client';

import { MatrixListComponent } from '@gitroom/frontend/components/axon/matrix/matrix-list.component';
import { AxonErrorBoundary } from '@gitroom/frontend/components/axon/ui/error-boundary';

export default function MatrixPage() {
  return (
    <AxonErrorBoundary>
      <MatrixListComponent />
    </AxonErrorBoundary>
  );
}
