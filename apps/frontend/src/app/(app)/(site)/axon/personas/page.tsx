import { Metadata } from 'next';
import { PersonasListComponent } from '@gitroom/frontend/components/axon/personas/personas-list.component';

export const metadata: Metadata = {
  title: 'Postiz - AXON Personas',
  description: 'Manage your AXON Personas - AI-generated content personalities',
};

export default function PersonasPage() {
  return <PersonasListComponent />;
}
