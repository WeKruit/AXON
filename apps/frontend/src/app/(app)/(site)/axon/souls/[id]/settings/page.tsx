'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { SoulCredentialsManager } from '@gitroom/frontend/components/axon/ui/soul-credentials-manager';
import { AxonErrorBoundary, ErrorState } from '@gitroom/frontend/components/axon/ui/error-boundary';
import { useSoul } from '@gitroom/frontend/components/axon/hooks';

export default function SoulSettingsPage() {
  const params = useParams();
  const soulId = params.id;

  if (!soulId || typeof soulId !== 'string') {
    return (
      <div className="flex-1 bg-newBgColorInner p-6">
        <ErrorState
          title="Invalid Soul ID"
          message="The soul ID provided is not valid. Please go back and try again."
        />
      </div>
    );
  }

  return (
    <AxonErrorBoundary>
      <SoulSettingsContent soulId={soulId} />
    </AxonErrorBoundary>
  );
}

function SoulSettingsContent({ soulId }: { soulId: string }) {
  const { data: soul, isLoading } = useSoul(soulId);

  if (isLoading || !soul) {
    return <SoulSettingsSkeleton />;
  }

  return (
    <div className="flex-1 bg-newBgColorInner p-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-textItemBlur mb-4">
        <Link href="/axon/souls" className="hover:text-newTextColor transition-colors">
          Souls
        </Link>
        <span>/</span>
        <Link href={`/axon/souls/${soulId}`} className="hover:text-newTextColor transition-colors">
          {soul.name}
        </Link>
        <span>/</span>
        <span className="text-newTextColor">Settings</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{soul.name} - Settings</h1>
        <p className="text-sm text-textItemBlur mt-1">
          Configure OAuth credentials and other settings for this soul
        </p>
      </div>

      {/* Credentials Manager */}
      <div className="bg-newBgLineColor rounded-lg p-6">
        <SoulCredentialsManager soulId={soulId} />
      </div>
    </div>
  );
}

function SoulSettingsSkeleton() {
  return (
    <div className="flex-1 bg-newBgColorInner p-6">
      <div className="h-4 w-24 bg-newBgLineColor rounded animate-pulse mb-4" />
      <div className="mb-6">
        <div className="h-7 w-48 bg-newBgLineColor rounded animate-pulse mb-2" />
        <div className="h-4 w-96 bg-newBgLineColor rounded animate-pulse" />
      </div>
      <div className="bg-newBgLineColor rounded-lg p-6">
        <div className="h-6 w-48 bg-newBgColorInner rounded animate-pulse mb-4" />
        <div className="h-4 w-full bg-newBgColorInner rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-newBgColorInner rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
