import { Metadata } from 'next';
import { ProxiesListComponent } from '@gitroom/frontend/components/axon/proxies/proxies-list.component';

export const metadata: Metadata = {
  title: 'Postiz - AXON Proxies',
  description: 'Manage your AXON Proxy Pool - residential, datacenter, and mobile proxies',
};

export default function ProxiesPage() {
  return <ProxiesListComponent />;
}
