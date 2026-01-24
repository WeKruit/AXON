'use client';

import { useParams } from 'next/navigation';
import { SoulDashboardComponent } from '@gitroom/frontend/components/axon/souls/soul-dashboard.component';

export default function SoulDetailPage() {
  const params = useParams();
  const soulId = params.id as string;

  return <SoulDashboardComponent soulId={soulId} />;
}
