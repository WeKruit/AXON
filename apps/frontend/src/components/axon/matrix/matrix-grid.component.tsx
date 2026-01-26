'use client';

import { FC, useState, useCallback, useMemo, memo } from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { useMatrix, useMatrixMutations } from './use-matrix';
import { MatrixCell, MatrixCellSkeleton } from './matrix-cell.component';
import { MatrixHeader, MatrixHeaderSkeleton } from './matrix-header.component';
import { MatrixRow, MatrixRowSkeleton } from './matrix-row.component';
import { MatrixFiltersComponent } from './matrix-filters.component';
import { ErrorState } from '../ui/error-boundary';
import { useToaster } from '@gitroom/react/toaster/toaster';
import type { MatrixFilters, MatrixMapping, BulkOperation } from './types';

interface MatrixGridProps {
  initialFilters?: MatrixFilters;
}

/**
 * Main Matrix Grid component
 *
 * Displays a grid of Souls (rows) x Integrations (columns)
 * with cells showing connection status.
 */
export const MatrixGridComponent: FC<MatrixGridProps> = memo(({ initialFilters }) => {
  const [filters, setFilters] = useState<MatrixFilters>(initialFilters || {});
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

  const { data, isLoading, error, mutate } = useMatrix(filters);
  const { toggleMapping, setPrimary, bulkOperations } = useMatrixMutations();
  const toaster = useToaster();

  // Get mapping for a specific cell
  const getMapping = useCallback(
    (soulId: string, integrationId: string): MatrixMapping | null => {
      if (!data) return null;
      return (
        data.mappings.find(
          (m) => m.soulId === soulId && m.integrationId === integrationId
        ) || null
      );
    },
    [data]
  );

  // Check if a cell is mapped
  const isMapped = useCallback(
    (soulId: string, integrationId: string): boolean => {
      return getMapping(soulId, integrationId) !== null;
    },
    [getMapping]
  );

  // Handle cell click
  const handleCellClick = useCallback(
    async (soulId: string, integrationId: string) => {
      const cellKey = `${soulId}:${integrationId}`;

      if (bulkMode) {
        setSelectedCells((prev) => {
          const next = new Set(prev);
          if (next.has(cellKey)) {
            next.delete(cellKey);
          } else {
            next.add(cellKey);
          }
          return next;
        });
        return;
      }

      try {
        const result = await toggleMapping(soulId, integrationId);
        await mutate();
        toaster.show(
          result.action === 'created'
            ? 'Channel linked to Soul'
            : 'Channel unlinked from Soul',
          'success'
        );
      } catch (err) {
        console.error('Failed to toggle mapping:', err);
        toaster.show('Failed to update connection', 'warning');
      }
    },
    [bulkMode, toggleMapping, mutate, toaster]
  );

  // Handle set primary
  const handleSetPrimary = useCallback(
    async (soulId: string, integrationId: string) => {
      const mapping = getMapping(soulId, integrationId);
      if (!mapping) return;

      try {
        await setPrimary(mapping.id);
        await mutate();
        toaster.show('Primary channel updated', 'success');
      } catch (err) {
        console.error('Failed to set primary:', err);
        toaster.show('Failed to set primary channel', 'warning');
      }
    },
    [getMapping, setPrimary, mutate, toaster]
  );

  // Handle bulk actions
  const handleBulkAction = useCallback(
    async (action: 'create' | 'delete') => {
      if (selectedCells.size === 0) return;

      const operations: BulkOperation[] = Array.from(selectedCells).map((key) => {
        const [soulId, integrationId] = key.split(':');
        return { action, soulId, integrationId };
      });

      try {
        const result = await bulkOperations(operations);
        await mutate();
        setSelectedCells(new Set());
        setBulkMode(false);

        if (result.errors.length > 0) {
          toaster.show(
            `Completed with ${result.errors.length} error(s): ${result.created} created, ${result.deleted} deleted`,
            'warning'
          );
        } else {
          toaster.show(
            `${result.created} linked, ${result.deleted} unlinked`,
            'success'
          );
        }
      } catch (err) {
        console.error('Bulk operation failed:', err);
        toaster.show('Bulk operation failed', 'warning');
      }
    },
    [selectedCells, bulkOperations, mutate, toaster]
  );

  // Toggle bulk mode
  const handleToggleBulkMode = useCallback(() => {
    setBulkMode(!bulkMode);
    setSelectedCells(new Set());
  }, [bulkMode]);

  // Select all cells
  const handleSelectAll = useCallback(() => {
    if (!data) return;
    const allCells = new Set<string>();
    data.souls.forEach((soul) => {
      data.integrations.forEach((integration) => {
        allCells.add(`${soul.id}:${integration.id}`);
      });
    });
    setSelectedCells(allCells);
  }, [data]);

  // Get unique platforms from integrations
  const availablePlatforms = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.integrations.map((i) => i.platform.toLowerCase()))];
  }, [data]);

  // Error state
  if (error) {
    return (
      <ErrorState
        title="Failed to load matrix"
        message="There was an error loading the Soul-Channel matrix. Please try again."
        onRetry={() => mutate()}
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading matrix">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-40 bg-newBgLineColor rounded animate-pulse" />
          <div className="h-10 w-48 bg-newBgLineColor rounded animate-pulse" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 bg-newBgLineColor rounded-tl-lg">
                  <div className="h-4 w-16 bg-newBgColorInner rounded animate-pulse" />
                </th>
                {[...Array(5)].map((_, i) => (
                  <MatrixHeaderSkeleton key={i} />
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(4)].map((_, i) => (
                <MatrixRowSkeleton key={i} columnCount={5} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || (data.souls.length === 0 && data.integrations.length === 0)) {
    return (
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
            className="text-textItemBlur"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-newTextColor mb-2">
          Matrix Not Ready
        </h3>
        <p className="text-sm text-textItemBlur mb-4 max-w-md">
          To use the Soul-Channel Matrix, you need both Souls and connected social
          media channels.
        </p>
        <div className="flex items-center gap-3">
          {data?.souls.length === 0 && (
            <Link
              href="/axon/souls"
              className="px-4 py-2 bg-btnPrimary text-white rounded-lg hover:bg-btnPrimary/90 transition-colors"
            >
              Create a Soul
            </Link>
          )}
          {data?.integrations.length === 0 && (
            <Link
              href="/integrations"
              className="px-4 py-2 bg-newBgLineColor text-newTextColor rounded-lg hover:bg-newBgLineColor/80 transition-colors"
            >
              Connect Channels
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Partial empty states
  if (data.souls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h3 className="text-lg font-medium text-newTextColor mb-2">No Souls Created</h3>
        <p className="text-sm text-textItemBlur mb-4 max-w-md">
          Create a Soul first to start building your matrix.
        </p>
        <Link
          href="/axon/souls"
          className="px-4 py-2 bg-btnPrimary text-white rounded-lg hover:bg-btnPrimary/90 transition-colors"
        >
          Create a Soul
        </Link>
      </div>
    );
  }

  if (data.integrations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h3 className="text-lg font-medium text-newTextColor mb-2">No Channels Connected</h3>
        <p className="text-sm text-textItemBlur mb-4 max-w-md">
          Connect social media channels to start building your matrix.
        </p>
        <Link
          href="/integrations"
          className="px-4 py-2 bg-btnPrimary text-white rounded-lg hover:bg-btnPrimary/90 transition-colors"
        >
          Connect Channels
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <MatrixFiltersComponent
        filters={filters}
        onChange={setFilters}
        availablePlatforms={availablePlatforms}
      />

      {/* Bulk Mode Actions Bar */}
      {bulkMode && (
        <div className="flex items-center gap-3 p-3 bg-btnPrimary/10 rounded-lg mb-4">
          <span className="text-sm text-newTextColor">
            {selectedCells.size} cell{selectedCells.size !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={() => handleBulkAction('create')}
            disabled={selectedCells.size === 0}
            className={clsx(
              'px-3 py-1.5 rounded-[8px] text-sm transition-colors',
              selectedCells.size > 0
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-green-500/50 text-white/50 cursor-not-allowed'
            )}
          >
            Link All
          </button>
          <button
            onClick={() => handleBulkAction('delete')}
            disabled={selectedCells.size === 0}
            className={clsx(
              'px-3 py-1.5 rounded-[8px] text-sm transition-colors',
              selectedCells.size > 0
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-red-500/50 text-white/50 cursor-not-allowed'
            )}
          >
            Unlink All
          </button>
          <button
            onClick={handleSelectAll}
            className="px-3 py-1.5 bg-newBgLineColor text-newTextColor rounded-[8px] text-sm hover:bg-newBgLineColor/80 transition-colors"
          >
            Select All
          </button>
          <button
            onClick={() => setSelectedCells(new Set())}
            className="px-3 py-1.5 bg-newBgLineColor text-newTextColor rounded-[8px] text-sm hover:bg-newBgLineColor/80 transition-colors"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Matrix Grid */}
      <div className="overflow-x-auto rounded-lg border border-newTableBorder">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-left bg-newBgLineColor rounded-tl-lg sticky left-0 z-10">
                <span className="text-sm font-medium text-textItemBlur">Souls</span>
              </th>
              {data.integrations.map((integration, idx) => (
                <MatrixHeader
                  key={integration.id}
                  integration={integration}
                  isLast={idx === data.integrations.length - 1}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {data.souls.map((soul, rowIdx) => {
              const isLastRow = rowIdx === data.souls.length - 1;

              return (
                <MatrixRow key={soul.id} soul={soul} isLast={isLastRow}>
                  {data.integrations.map((integration) => {
                    const mapping = getMapping(soul.id, integration.id);
                    const cellKey = `${soul.id}:${integration.id}`;
                    const isSelected = selectedCells.has(cellKey);

                    return (
                      <MatrixCell
                        key={cellKey}
                        soulId={soul.id}
                        integrationId={integration.id}
                        isMapped={!!mapping}
                        isPrimary={mapping?.isPrimary || false}
                        isSelected={isSelected}
                        bulkMode={bulkMode}
                        platform={integration.platform}
                        onClick={handleCellClick}
                        onSetPrimary={handleSetPrimary}
                      />
                    );
                  })}
                </MatrixRow>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 text-sm text-textItemBlur">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-btnPrimary" aria-hidden="true" />
          <span>Linked</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border border-newTableBorder"
            aria-hidden="true"
          />
          <span>Not Linked</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-500">★</span>
          <span>Primary Channel</span>
        </div>
        <div className="flex items-center gap-2 ml-auto text-xs">
          <span>Tip: Double-click a linked cell to set it as primary</span>
        </div>
      </div>
    </div>
  );
});

MatrixGridComponent.displayName = 'MatrixGridComponent';
