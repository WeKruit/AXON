'use client';

import { AccountsListComponent } from '@gitroom/frontend/components/axon/accounts/accounts-list.component';
import { AxonErrorBoundary } from '@gitroom/frontend/components/axon/ui/error-boundary';

export default function AccountsPage() {
  return (
    <AxonErrorBoundary>
      <AccountsListComponent />
    </AxonErrorBoundary>
  );
}
