'use client';

import { FC, useCallback, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { useSouls, useSoulMutations } from '../hooks';
import { StatusBadge } from '../ui/status-badge';
import { PlatformIcon } from '../ui/platform-icon';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import type { Soul, CreateSoulDto } from '../types';
import { CreateSoulModal } from './create-soul-modal';

export const SoulsListComponent: FC = () => {
  const { data: souls, isLoading, mutate } = useSouls();
  const { createSoul, deleteSoul } = useSoulMutations();
  const toaster = useToaster();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateSoul = useCallback(
    async (data: CreateSoulDto) => {
      try {
        await createSoul(data);
        await mutate();
        setIsCreateModalOpen(false);
        toaster.show('Soul created successfully', 'success');
      } catch (error) {
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
      } catch (error) {
        toaster.show('Failed to delete soul', 'warning');
      }
    },
    [deleteSoul, mutate, toaster]
  );

  if (isLoading) {
    return (
      <div className="flex-1 bg-newBgColorInner p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-32 bg-newBgLineColor rounded animate-pulse" />
          <div className="h-10 w-32 bg-newBgLineColor rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-newBgLineColor rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-newBgColorInner p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Souls</h1>
          <p className="text-sm text-textItemBlur mt-1">
            Manage your identity containers and their linked accounts
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-newPrimaryColor text-white rounded-lg hover:bg-newPrimaryColor/90 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Soul
        </button>
      </div>

      {!souls || souls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-newBgLineColor flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-textItemBlur"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No Souls Yet</h3>
          <p className="text-sm text-textItemBlur mb-4 max-w-md">
            Souls are identity containers that group related accounts together.
            Create your first Soul to start managing multiple identities.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-newPrimaryColor text-white rounded-lg hover:bg-newPrimaryColor/90 transition-colors"
          >
            Create Your First Soul
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {souls.map((soul) => (
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

const SoulCard: FC<SoulCardProps> = ({ soul, onDelete }) => {
  const uniquePlatforms = [...new Set(soul.accounts?.map((a) => a.platform) || [])];

  return (
    <Link
      href={`/axon/souls/${soul.id}`}
      className="group block bg-newBgLineColor rounded-lg p-4 hover:bg-newBgLineColor/80 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
            {soul.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-medium group-hover:text-newPrimaryColor transition-colors">
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
            <div className="flex items-center gap-1">
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
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </Link>
  );
};
