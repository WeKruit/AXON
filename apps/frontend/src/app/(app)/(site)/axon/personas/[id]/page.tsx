'use client';

import { useParams } from 'next/navigation';
import { PersonaDetailComponent } from '@gitroom/frontend/components/axon/personas/persona-detail.component';
import { AxonErrorBoundary, ErrorState } from '@gitroom/frontend/components/axon/ui/error-boundary';

export default function PersonaDetailPage() {
  const params = useParams();
  const personaId = params.id;

  if (!personaId || typeof personaId !== 'string') {
    return (
      <div className="flex-1 bg-newBgColorInner p-6">
        <ErrorState
          title="Invalid Persona ID"
          message="The persona ID provided is not valid. Please go back and try again."
        />
      </div>
    );
  }

  return (
    <AxonErrorBoundary>
      <PersonaDetailComponent personaId={personaId} />
    </AxonErrorBoundary>
  );
}
