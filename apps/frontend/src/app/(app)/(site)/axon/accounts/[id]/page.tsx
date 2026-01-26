'use client';

import { useParams } from 'next/navigation';
import { AccountDetailComponent } from '@gitroom/frontend/components/axon/accounts/account-detail.component';
import { AxonErrorBoundary, ErrorState } from '@gitroom/frontend/components/axon/ui/error-boundary';

export default function AccountDetailPage() {
  const params = useParams();
  const accountId = params.id;

  if (!accountId || typeof accountId !== 'string') {
    return (
      <div className="flex-1 bg-newBgColorInner p-6">
        <ErrorState
          title="Invalid Account ID"
          message="The account ID provided is not valid. Please go back and try again."
        />
      </div>
    );
  }

  return (
    <AxonErrorBoundary>
      <AccountDetailComponent accountId={accountId} />
    </AxonErrorBoundary>
  );
}
