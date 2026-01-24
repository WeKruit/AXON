'use client';

import { useParams } from 'next/navigation';
import { AccountDetailComponent } from '@gitroom/frontend/components/axon/accounts/account-detail.component';

export default function AccountDetailPage() {
  const params = useParams();
  const accountId = params.id as string;

  return <AccountDetailComponent accountId={accountId} />;
}
