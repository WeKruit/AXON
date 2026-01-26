'use client';

import { MatrixViewComponent } from '@gitroom/frontend/components/axon/matrix/matrix-view.component';
import { AxonErrorBoundary } from '@gitroom/frontend/components/axon/ui/error-boundary';

export default function MatrixPage() {
  return (
    <AxonErrorBoundary>
      <MatrixViewComponent />
    </AxonErrorBoundary>
  );
}
