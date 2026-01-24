'use client';

import { useParams } from 'next/navigation';
import { PersonaDetailComponent } from '@gitroom/frontend/components/axon/personas/persona-detail.component';

export default function PersonaDetailPage() {
  const params = useParams();
  const personaId = params.id as string;

  return <PersonaDetailComponent personaId={personaId} />;
}
