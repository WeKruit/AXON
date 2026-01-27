'use client';

import { FC, useCallback, useState, memo } from 'react';
import Link from 'next/link';
import { useSoulMutations } from '../hooks/use-axon-api';
import { useAxonData, useAxonScrollPreservation } from '../context/axon-data-provider';
import { StatusBadge } from '../ui/status-badge';
import { PlatformIcon } from '../ui/platform-icon';
import { ErrorState } from '../ui/error-boundary';
import { PlusIcon, TrashIcon, SoulIcon } from '../ui/icons';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import { useSoulContextOptional } from '../context/soul-context';
import type { Soul, CreateSoulDto } from '../types';
import { CreateSoulModal } from './create-soul-modal';

/**
 * SoulsListComponent (WEC-190, WEC-193)
 *
 * Updated to use AxonDataProvider for:
 * 1. Pre-fetched data from layout level (no loading flash on tab switch)
 * 2. Preserved scroll position when returning to this tab
 */
export const SoulsListComponent: FC = () => {
  // Get data from AxonDataProvider context
  const {
    souls: data,
    isLoadingSouls: isLoading,
    soulsError: error,
    mutateSouls: mutate,
  } = useAxonData();

  const { createSoul, deleteSoul } = useSoulMutations();
  const toaster = useToaster();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Scroll preservation hook
  const { containerRef, handleScroll } = useAxonScrollPreservation('souls');

  const handleCreateSoul = useCallback(
    async (data: CreateSoulDto) => {
      try {
        await createSoul(data);
        await mutate();
        setIsCreateModalOpen(false);
        toaster.show('Soul created successfully', 'success');
      } catch (err) {
        console.error('Failed to create soul:', err);
        toaster.show('Failed to create soul', 'warning');
      }
    },
    [createSoul, mutate, toaster]
  );

  const handleDeleteSoul = useCallback(
    async (soul: Soul) => {
      const confirmed = await deleteDialog(
        `Are you sure you want to delete "${soul.name}"? This will also remove all associated accounts.`,
        'Delete Soul'
      );
      if (!confirmed) return;

      try {
        await deleteSoul(soul.id);
        await mutate();
        toaster.show('Soul deleted successfully', 'success');
      } catch (err) {
        console.error('Failed to delete soul:', err);
        toaster.show('Failed to delete soul', 'warning');
      }
    },
    [deleteSoul, mutate, toaster]
  );

  if (error) {
    return (
      <div className="flex-1 bg-newBgColorInner p-6">
        <ErrorState
          title="Failed to load souls"
          message="There was an error loading your souls. Please try again."
          onRetry={() => mutate()}
        />
      </div>
    );
  }

  if (isLoading) {
    return <SoulsListSkeleton />;
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 bg-newBgColorInner p-6 overflow-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Souls</h1>
          <p className="text-sm text-textItemBlur mt-1">
            Manage your identity containers and their linked accounts
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-btnPrimary text-white rounded-lg hover:bg-btnPrimary/90 transition-colors"
          aria-label="Create new soul"
        >
          <PlusIcon size="md" />
          Create Soul
        </button>
      </div>

      {!data || data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-newBgLineColor flex items-center justify-center mb-4">
            <SoulIcon size={32} className="text-textItemBlur" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Souls Yet</h3>
          <p className="text-sm text-textItemBlur mb-4 max-w-md">
            Souls are identity containers that group related accounts together.
            Create your first Soul to start managing multiple identities.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-btnPrimary text-white rounded-lg hover:bg-btnPrimary/90 transition-colors"
            aria-label="Create your first soul"
          >
            Create Your First Soul
          </button>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          role="list"
          aria-label="Souls list"
        >
          {data.map((soul) => (
            <SoulCard key={soul.id} soul={soul} onDelete={() => handleDeleteSoul(soul)} />
          ))}
        </div>
      )}

      {isCreateModalOpen && (
        <CreateSoulModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSoul}
        />
      )}
    </div>
  );
};

interface SoulCardProps {
  soul: Soul;
  onDelete: () => void;
}

const SoulCard: FC<SoulCardProps> = memo(({ soul, onDelete }) => {
  const uniquePlatforms = [...new Set(soul.accounts?.map((a) => a.platform) || [])];

  return (
    <Link
      href={`/axon/souls/${soul.id}`}
      className="group block bg-newBgLineColor rounded-lg p-4 hover:bg-newBgLineColor/80 transition-colors"
      role="listitem"
      aria-label={`Soul: ${soul.name}, Status: ${soul.status}, ${soul.accounts?.length || 0} accounts`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold"
            aria-hidden="true"
          >
            {soul.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-medium group-hover:text-btnPrimary transition-colors">
              {soul.name}
            </h3>
            {soul.persona && (
              <p className="text-xs text-textItemBlur">Persona: {soul.persona.name}</p>
            )}
          </div>
        </div>
        <StatusBadge status={soul.status} size="sm" />
      </div>

      {soul.description && (
        <p className="text-sm text-textItemBlur mb-3 line-clamp-2">{soul.description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-textItemBlur">
            {soul.accounts?.length || 0} account{(soul.accounts?.length || 0) !== 1 ? 's' : ''}
          </span>
          {uniquePlatforms.length > 0 && (
            <div className="flex items-center gap-1" aria-label={`Platforms: ${uniquePlatforms.join(', ')}`}>
              {uniquePlatforms.slice(0, 4).map((platform) => (
                <PlatformIcon key={platform} platform={platform} size="sm" />
              ))}
              {uniquePlatforms.length > 4 && (
                <span className="text-xs text-textItemBlur">+{uniquePlatforms.length - 4}</span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 text-textItemBlur hover:text-red-500 transition-all"
          aria-label={`Delete soul: ${soul.name}`}
        >
          <TrashIcon size="sm" />
        </button>
      </div>
    </Link>
  );
});

SoulCard.displayName = 'SoulCard';

/**
 * Skeleton loader for Souls List
 * Exported for use with Suspense boundaries
 */
export const SoulsListSkeleton: FC = () => (
  <div className="flex-1 bg-newBgColorInner p-6" aria-busy="true" aria-label="Loading souls">
    <div className="flex items-center justify-between mb-6">
      <div>
        <div className="h-8 w-32 bg-newBgLineColor rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-newBgLineColor rounded animate-pulse" />
      </div>
      <div className="h-10 w-32 bg-newBgLineColor rounded animate-pulse" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <SoulCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

/**
 * Skeleton for individual soul card
 */
const SoulCardSkeleton: FC = () => (
  <div className="bg-newBgLineColor rounded-lg p-4 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-newBgColorInner" />
        <div>
          <div className="h-5 w-24 bg-newBgColorInner rounded mb-1" />
          <div className="h-3 w-20 bg-newBgColorInner rounded" />
        </div>
      </div>
      <div className="h-5 w-14 bg-newBgColorInner rounded" />
    </div>
    <div className="h-4 w-full bg-newBgColorInner rounded mb-2" />
    <div className="h-4 w-3/4 bg-newBgColorInner rounded mb-3" />
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 bg-newBgColorInner rounded" />
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-5 h-5 rounded bg-newBgColorInner" />
          ))}
        </div>
      </div>
    </div>
  </div>
);
