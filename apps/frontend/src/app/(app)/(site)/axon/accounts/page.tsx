import { Metadata } from 'next';
import { AccountsListComponent } from '@gitroom/frontend/components/axon/accounts/accounts-list.component';

export const metadata: Metadata = {
  title: 'Postiz - AXON Accounts',
  description: 'Manage your AXON Accounts - platform accounts linked to Souls',
};

export default function AccountsPage() {
  return <AccountsListComponent />;
}
