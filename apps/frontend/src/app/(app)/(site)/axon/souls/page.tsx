import { Metadata } from 'next';
import { SoulsListComponent } from '@gitroom/frontend/components/axon/souls/souls-list.component';

export const metadata: Metadata = {
  title: 'Postiz - AXON Souls',
  description: 'Manage your AXON Souls - identity containers',
};

export default function SoulsPage() {
  return <SoulsListComponent />;
}
