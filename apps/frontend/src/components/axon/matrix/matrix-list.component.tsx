'use client';

import { FC, useCallback, useMemo, useEffect, useRef } from 'react';
import { MatrixGrid } from './matrix-grid.component';
import { useMatrixMutations, useMatrixStats } from './use-matrix';
import { useAxonData, useAxonScrollPreservation } from '../context/axon-data-provider';
import { ErrorState } from '../ui/error-boundary';
import { FilterIcon, GridIcon, RefreshIcon } from '../ui/icons';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useSoulContextOptional } from '../context/soul-context';
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

/**
 * MatrixListComponent (WEC-190, WEC-193)
 *
 * Updated to use AxonDataProvider for:
 * 1. Pre-fetched data from layout level (no loading flash on tab switch)
 * 2. Persisted filter state across tab navigation
 * 3. Preserved scroll position when returning to this tab
 */
export const MatrixListComponent: FC = () => {
  // Get data and filter state from AxonDataProvider context
  const {
    matrixData: data,
    souls,
    isLoadingMatrix: isLoading,
    matrixError: error,
    mutateMatrix: mutate,
    filters: contextFilters,
    setMatrixFilters,
  } = useAxonData();

  const { toggleMapping, setPrimary, bulkOperation } = useMatrixMutations();
  const stats = useMatrixStats(data);
  const toaster = useToaster();
  const soulContext = useSoulContextOptional();

  // Use filter state from context instead of local useState
  const filters = contextFilters.matrix;
  const showFilters = Object.values(filters).some((v) => v !== undefined && v !== false);

  // Scroll preservation hook
  const { containerRef, handleScroll } = useAxonScrollPreservation('matrix');

  // Sync Soul context with filters - when user selects a Soul in the header,
  // automatically filter the matrix to that Soul
  useEffect(() => {
    if (soulContext) {
      setMatrixFilters({
        ...filters,
        soulId: soulContext.selectedSoulId || undefined,
      });
    }
  }, [soulContext?.selectedSoulId]);

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
        // Find the mapping by soulId and integrationId
        const mapping = data?.mappings.find(
          (m) => m.soulId === soulId && m.integrationId === integrationId
        );

        if (!mapping) {
          toaster.show('Connection must exist before setting as primary', 'warning');
          return;
        }

        await setPrimary(mapping.id);
        await mutate();
        toaster.show('Set as primary', 'success');
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
        // Build mappings array from cartesian product of soulIds and integrationIds
        const mappings = soulIds.flatMap((soulId) =>
          integrationIds.map((integrationId) => ({ soulId, integrationId }))
        );
        await bulkOperation({
          operation: 'create',
          mappings,
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
        // Build mappings array from cartesian product of soulIds and integrationIds
        const mappings = soulIds.flatMap((soulId) =>
          integrationIds.map((integrationId) => ({ soulId, integrationId }))
        );
        await bulkOperation({
          operation: 'delete',
          mappings,
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
      setMatrixFilters({
        ...filters,
        [key]: value === '' ? undefined : value,
      });
    },
    [filters, setMatrixFilters]
  );

  const clearFilters = useCallback(() => {
    setMatrixFilters({});
  }, [setMatrixFilters]);

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
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 bg-newBgColorInner p-6 overflow-auto"
    >
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
            onClick={() => {
              if (hasActiveFilters) {
                clearFilters();
              } else {
                // Toggle filter panel visibility by setting a dummy filter
                setMatrixFilters({ ...filters, showOnlyConnected: false });
              }
            }}
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
      {(showFilters || hasActiveFilters) && (
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

const StatCard: FC<StatCardProps> = ({ label, value }) => (
  <div className="bg-newBgLineColor rounded-lg p-4">
    <p className="text-xs text-textItemBlur mb-1">{label}</p>
    <p className="text-2xl font-semibold">{value}</p>
  </div>
);
