'use client';

import { FC, useCallback, useMemo, useState, memo } from 'react';
import { MatrixGrid } from './matrix-grid.component';
import { useMatrix, useMatrixMutations, useMatrixStats } from './use-matrix';
import { ErrorState } from '../ui/error-boundary';
import { FilterIcon, GridIcon, RefreshIcon } from '../ui/icons';
import { useToaster } from '@gitroom/react/toaster/toaster';
import type { MatrixFilters, Platform } from './types';

const PLATFORM_OPTIONS: { value: Platform | ''; label: string }[] = [
  { value: '', label: 'All Platforms' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'threads', label: 'Threads' },
  { value: 'bluesky', label: 'Bluesky' },
  { value: 'mastodon', label: 'Mastodon' },
];

export const MatrixListComponent: FC = () => {
  const { data, souls, integrations, isLoading, error, mutate } = useMatrix();
  const { toggleMapping, setPrimary, bulkOperation } = useMatrixMutations();
  const stats = useMatrixStats(data);
  const toaster = useToaster();

  const [filters, setFilters] = useState<MatrixFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleToggleMapping = useCallback(
    async (soulId: string, integrationId: string) => {
      try {
        await toggleMapping({ soulId, integrationId });
        await mutate();
      } catch (err) {
        console.error('Failed to toggle mapping:', err);
        toaster.show('Failed to update connection', 'warning');
      }
    },
    [toggleMapping, mutate, toaster]
  );

  const handleSetPrimary = useCallback(
    async (soulId: string, integrationId: string) => {
      try {
        const mapping = data?.mappings.find(
          (m) => m.soulId === soulId && m.integrationId === integrationId
        );
        await setPrimary({
          soulId,
          integrationId,
          isPrimary: !mapping?.isPrimary,
        });
        await mutate();
        toaster.show(
          mapping?.isPrimary ? 'Primary status removed' : 'Set as primary',
          'success'
        );
      } catch (err) {
        console.error('Failed to set primary:', err);
        toaster.show('Failed to update primary status', 'warning');
      }
    },
    [data?.mappings, setPrimary, mutate, toaster]
  );

  const handleBulkConnect = useCallback(
    async (soulIds: string[], integrationIds: string[]) => {
      try {
        await bulkOperation({
          operation: 'connect',
          soulIds,
          integrationIds,
        });
        await mutate();
        toaster.show('Connections created successfully', 'success');
      } catch (err) {
        console.error('Failed to bulk connect:', err);
        toaster.show('Failed to create connections', 'warning');
      }
    },
    [bulkOperation, mutate, toaster]
  );

  const handleBulkDisconnect = useCallback(
    async (soulIds: string[], integrationIds: string[]) => {
      try {
        await bulkOperation({
          operation: 'disconnect',
          soulIds,
          integrationIds,
        });
        await mutate();
        toaster.show('Connections removed successfully', 'success');
      } catch (err) {
        console.error('Failed to bulk disconnect:', err);
        toaster.show('Failed to remove connections', 'warning');
      }
    },
    [bulkOperation, mutate, toaster]
  );

  const handleFilterChange = useCallback(
    (key: keyof MatrixFilters, value: string | boolean) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value === '' ? undefined : value,
      }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((v) => v !== undefined && v !== false);
  }, [filters]);

  if (error) {
    return (
      <div className="flex-1 bg-newBgColorInner p-6">
        <ErrorState
          title="Failed to load matrix"
          message="There was an error loading the Soul-Channel matrix. Please try again."
          onRetry={() => mutate()}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-newBgColorInner p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Soul-Channel Matrix</h1>
          <p className="text-sm text-textItemBlur mt-1">
            Map Souls to social channels to control which identities post where
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-btnPrimary text-white'
                : 'bg-newBgLineColor text-newTextColor hover:bg-newBgLineColor/80'
            }`}
          >
            <FilterIcon size="sm" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-white" />
            )}
          </button>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-2 px-3 py-2 bg-newBgLineColor rounded-lg hover:bg-newBgLineColor/80 transition-colors"
            title="Refresh data"
          >
            <RefreshIcon size="sm" />
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard label="Total Souls" value={stats.totalSouls} />
          <StatCard label="Total Channels" value={stats.totalIntegrations} />
          <StatCard label="Connections" value={stats.totalMappings} />
          <StatCard label="Coverage" value={`${stats.connectedPercentage}%`} />
          <StatCard label="Primary Mappings" value={stats.primaryMappings} />
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-newBgLineColor rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Filter Matrix</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-btnPrimary hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Soul Filter */}
            <div>
              <label className="block text-xs text-textItemBlur mb-1">Soul</label>
              <select
                value={filters.soulId || ''}
                onChange={(e) => handleFilterChange('soulId', e.target.value)}
                className="w-full px-3 py-2 bg-newBgColor border border-newBgLineColor rounded-lg text-sm focus:outline-none focus:border-btnPrimary"
              >
                <option value="">All Souls</option>
                {souls?.map((soul) => (
                  <option key={soul.id} value={soul.id}>
                    {soul.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Platform Filter */}
            <div>
              <label className="block text-xs text-textItemBlur mb-1">Platform</label>
              <select
                value={filters.platform || ''}
                onChange={(e) => handleFilterChange('platform', e.target.value)}
                className="w-full px-3 py-2 bg-newBgColor border border-newBgLineColor rounded-lg text-sm focus:outline-none focus:border-btnPrimary"
              >
                {PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggles */}
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showOnlyConnected || false}
                  onChange={(e) =>
                    handleFilterChange('showOnlyConnected', e.target.checked)
                  }
                  className="w-4 h-4 rounded border-newBgLineColor"
                />
                <span className="text-sm">Connected only</span>
              </label>
            </div>

            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showOnlyPrimary || false}
                  onChange={(e) =>
                    handleFilterChange('showOnlyPrimary', e.target.checked)
                  }
                  className="w-4 h-4 rounded border-newBgLineColor"
                />
                <span className="text-sm">Primary only</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Matrix Grid */}
      <div className="bg-newBgLineColor rounded-lg p-4">
        <MatrixGrid
          data={data}
          isLoading={isLoading}
          filters={filters}
          onToggleMapping={handleToggleMapping}
          onSetPrimary={handleSetPrimary}
          onBulkConnect={handleBulkConnect}
          onBulkDisconnect={handleBulkDisconnect}
        />
      </div>

      {/* Help text */}
      <div className="mt-4 text-sm text-textItemBlur">
        <p>
          <strong>Tip:</strong> Click a cell to toggle the connection. Double-click to set/unset as primary.
          Use bulk mode to manage multiple connections at once.
        </p>
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number | string;
}

const StatCard: FC<StatCardProps> = memo(({ label, value }) => (
  <div className="bg-newBgLineColor rounded-lg p-4">
    <p className="text-xs text-textItemBlur mb-1">{label}</p>
    <p className="text-2xl font-semibold">{value}</p>
  </div>
));

StatCard.displayName = 'StatCard';

/**
 * Skeleton loader for Matrix List
 * Exported for use with Suspense boundaries
 */
export const MatrixListSkeleton: FC = () => (
  <div className="flex-1 bg-newBgColorInner p-6">
    {/* Header skeleton */}
    <div className="flex items-center justify-between mb-6">
      <div>
        <div className="h-8 w-48 bg-newBgLineColor rounded animate-pulse mb-2" />
        <div className="h-4 w-72 bg-newBgLineColor rounded animate-pulse" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-10 w-24 bg-newBgLineColor rounded animate-pulse" />
        <div className="h-10 w-10 bg-newBgLineColor rounded animate-pulse" />
      </div>
    </div>

    {/* Stats skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-newBgLineColor rounded-lg p-4 animate-pulse">
          <div className="h-3 w-16 bg-newBgColorInner rounded mb-2" />
          <div className="h-8 w-12 bg-newBgColorInner rounded" />
        </div>
      ))}
    </div>

    {/* Grid skeleton */}
    <div className="bg-newBgLineColor rounded-lg p-4">
      <div className="flex items-center gap-6 mb-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-newBgColorInner animate-pulse" />
            <div className="w-16 h-4 rounded bg-newBgColorInner animate-pulse" />
          </div>
        ))}
      </div>
      <div className="overflow-x-auto pb-4">
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: '200px repeat(6, 48px)' }}
        >
          <div className="h-24" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 flex flex-col justify-end pb-2">
              <div className="w-6 h-6 rounded-full bg-newBgColorInner animate-pulse mx-auto" />
              <div className="w-8 h-3 rounded bg-newBgColorInner animate-pulse mx-auto mt-1" />
            </div>
          ))}
          {[...Array(4)].map((_, rowIndex) => (
            <>
              <div key={`row-label-${rowIndex}`} className="flex items-center gap-2 h-10">
                <div className="w-8 h-8 rounded-full bg-newBgColorInner animate-pulse" />
                <div className="w-20 h-4 rounded bg-newBgColorInner animate-pulse" />
              </div>
              {[...Array(6)].map((_, colIndex) => (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="w-8 h-8 rounded border-2 border-newBgColorInner bg-newBgColor animate-pulse mx-auto"
                />
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  </div>
);
