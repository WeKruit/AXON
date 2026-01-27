'use client';

import React, { FC, memo, useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';
import { MatrixCell, MatrixHeaderCell, MatrixCellSkeleton } from './matrix-cell.component';
import { CheckIcon, GridIcon, StarFilledIcon, LinkIcon, UnlinkIcon } from '../ui/icons';
import type { Soul } from '../types';
import type {
  Integration,
  SoulIntegrationMapping,
  MatrixData,
  MatrixFilters,
} from './types';

export interface MatrixGridProps {
  data: MatrixData | null;
  isLoading?: boolean;
  filters?: MatrixFilters;
  onToggleMapping: (soulId: string, integrationId: string) => Promise<void>;
  onSetPrimary: (soulId: string, integrationId: string) => Promise<void>;
  onBulkConnect?: (soulIds: string[], integrationIds: string[]) => Promise<void>;
  onBulkDisconnect?: (soulIds: string[], integrationIds: string[]) => Promise<void>;
}

/**
 * Configuration for virtualization
 * - ROW_HEIGHT: Fixed height for each row (cell height + gap)
 * - HEADER_HEIGHT: Fixed height for the header row
 * - OVERSCAN: Number of rows to render beyond visible area for smoother scrolling
 */
const ROW_HEIGHT = 56; // 48px cell + 8px gap
const HEADER_HEIGHT = 96;
const OVERSCAN = 5;

function buildCellMapFn(
  mappings: SoulIntegrationMapping[]
): Map<string, SoulIntegrationMapping> {
  const map = new Map<string, SoulIntegrationMapping>();
  for (const mapping of mappings) {
    const key = `${mapping.soulId}-${mapping.integrationId}`;
    map.set(key, mapping);
  }
  return map;
}

function getCellKeyFn(soulId: string, integrationId: string): string {
  return `${soulId}-${integrationId}`;
}

/**
 * Individual matrix row component for virtualized rendering
 * Memoized to prevent unnecessary re-renders when other rows change
 */
interface MatrixRowProps {
  soul: Soul;
  integrations: Integration[];
  cellMap: Map<string, SoulIntegrationMapping>;
  bulkMode: boolean;
  selectedCells: Set<string>;
  onToggleMapping: (soulId: string, integrationId: string) => Promise<void>;
  onSetPrimary: (soulId: string, integrationId: string) => Promise<void>;
  onCellSelect: (soulId: string, integrationId: string) => void;
  style?: React.CSSProperties;
}

const MatrixRow: FC<MatrixRowProps> = memo(({
  soul,
  integrations,
  cellMap,
  bulkMode,
  selectedCells,
  onToggleMapping,
  onSetPrimary,
  onCellSelect,
  style,
}) => (
  <div
    className="grid gap-2 items-center"
    style={{
      ...style,
      gridTemplateColumns: `minmax(160px, 200px) repeat(${integrations.length}, 48px)`,
    }}
  >
    {/* Soul header (row label) */}
    <MatrixHeaderCell
      label={soul.name}
      subtitle={soul.persona?.name}
      type="soul"
    />

    {/* Matrix cells */}
    {integrations.map((integration) => {
      const cellKey = getCellKeyFn(soul.id, integration.id);
      const mapping = cellMap.get(cellKey) ?? null;
      return (
        <MatrixCell
          key={cellKey}
          soulId={soul.id}
          integrationId={integration.id}
          mapping={mapping}
          bulkMode={bulkMode}
          isSelected={selectedCells.has(cellKey)}
          onToggle={onToggleMapping}
          onSetPrimary={onSetPrimary}
          onSelect={onCellSelect}
        />
      );
    })}
  </div>
));

MatrixRow.displayName = 'MatrixRow';

/**
 * MatrixGrid Component (WEC-191)
 *
 * Implements TanStack Virtual for efficient rendering of large datasets.
 * Can handle 10,000+ rows at 60fps by only rendering visible rows.
 *
 * Key features:
 * - Virtual scrolling: Only renders ~20-30 visible rows
 * - Preserves scroll position across re-renders
 * - Supports bulk selection mode for multi-cell operations
 * - Memoized row components to prevent unnecessary re-renders
 */
export const MatrixGrid: FC<MatrixGridProps> = memo(({
  data,
  isLoading = false,
  filters,
  onToggleMapping,
  onSetPrimary,
  onBulkConnect,
  onBulkDisconnect,
}) => {
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

  // Ref for the scrollable container
  const parentRef = useRef<HTMLDivElement>(null);

  // Build cell lookup map
  const cellMap = useMemo(() => {
    if (!data?.mappings) return new Map<string, SoulIntegrationMapping>();
    return buildCellMapFn(data.mappings);
  }, [data?.mappings]);

  // Apply filters
  const filteredData = useMemo(() => {
    if (!data) return null;

    let souls = data.souls;
    let integrations = data.integrations;

    if (filters?.soulId) {
      souls = souls.filter((s) => s.id === filters.soulId);
    }

    if (filters?.integrationId) {
      integrations = integrations.filter((i) => i.id === filters.integrationId);
    }

    if (filters?.platform) {
      integrations = integrations.filter((i) => i.type === filters.platform);
    }

    if (filters?.showOnlyConnected) {
      const connectedSoulIds = new Set(data.mappings.map((m) => m.soulId));
      const connectedIntegrationIds = new Set(data.mappings.map((m) => m.integrationId));
      souls = souls.filter((s) => connectedSoulIds.has(s.id));
      integrations = integrations.filter((i) => connectedIntegrationIds.has(i.id));
    }

    if (filters?.showOnlyPrimary) {
      const primaryMappings = data.mappings.filter((m) => m.isPrimary);
      const primarySoulIds = new Set(primaryMappings.map((m) => m.soulId));
      const primaryIntegrationIds = new Set(primaryMappings.map((m) => m.integrationId));
      souls = souls.filter((s) => primarySoulIds.has(s.id));
      integrations = integrations.filter((i) => primaryIntegrationIds.has(i.id));
    }

    return { souls, integrations, mappings: data.mappings };
  }, [data, filters]);

  // TanStack Virtual row virtualizer
  const rowVirtualizer = useVirtualizer({
    count: filteredData?.souls.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  const handleCellSelect = useCallback((soulId: string, integrationId: string) => {
    const key = getCellKeyFn(soulId, integrationId);
    setSelectedCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleBulkConnect = useCallback(async () => {
    if (!onBulkConnect || selectedCells.size === 0) return;
    const soulIds = new Set<string>();
    const integrationIds = new Set<string>();
    selectedCells.forEach((key) => {
      const [soulId, integrationId] = key.split('-');
      soulIds.add(soulId);
      integrationIds.add(integrationId);
    });
    await onBulkConnect(Array.from(soulIds), Array.from(integrationIds));
    setSelectedCells(new Set());
    setBulkMode(false);
  }, [onBulkConnect, selectedCells]);

  const handleBulkDisconnect = useCallback(async () => {
    if (!onBulkDisconnect || selectedCells.size === 0) return;
    const soulIds = new Set<string>();
    const integrationIds = new Set<string>();
    selectedCells.forEach((key) => {
      const [soulId, integrationId] = key.split('-');
      soulIds.add(soulId);
      integrationIds.add(integrationId);
    });
    await onBulkDisconnect(Array.from(soulIds), Array.from(integrationIds));
    setSelectedCells(new Set());
    setBulkMode(false);
  }, [onBulkDisconnect, selectedCells]);

  const handleSelectAll = useCallback(() => {
    if (!filteredData) return;
    const allKeys = new Set<string>();
    filteredData.souls.forEach((soul) => {
      filteredData.integrations.forEach((integration) => {
        allKeys.add(getCellKeyFn(soul.id, integration.id));
      });
    });
    setSelectedCells(allKeys);
  }, [filteredData]);

  const handleClearSelection = useCallback(() => {
    setSelectedCells(new Set());
  }, []);

  if (isLoading) {
    return <MatrixGridSkeleton />;
  }

  if (!filteredData || filteredData.souls.length === 0 || filteredData.integrations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-newBgLineColor flex items-center justify-center mb-4">
          <GridIcon size={32} className="text-textItemBlur" />
        </div>
        <h3 className="text-lg font-medium mb-2">No Data to Display</h3>
        <p className="text-sm text-textItemBlur max-w-md">
          {!data?.souls.length
            ? 'Create some Souls first to build your matrix.'
            : !data?.integrations.length
            ? 'Connect some social channels first to build your matrix.'
            : 'No items match your current filters.'}
        </p>
      </div>
    );
  }

  const { souls, integrations } = filteredData;
  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();

  return (
    <div className="space-y-4">
      {/* Bulk mode controls */}
      {(onBulkConnect || onBulkDisconnect) && (
        <div className="flex items-center justify-between bg-newBgLineColor rounded-lg p-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bulkMode}
                onChange={(e) => {
                  setBulkMode(e.target.checked);
                  if (!e.target.checked) {
                    setSelectedCells(new Set());
                  }
                }}
                className="w-4 h-4 rounded border-newBgLineColor"
              />
              <span className="text-sm">Bulk Mode</span>
            </label>
            {bulkMode && (
              <>
                <span className="text-sm text-textItemBlur">
                  {selectedCells.size} cells selected
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-btnPrimary hover:underline"
                >
                  Select All
                </button>
                <button
                  onClick={handleClearSelection}
                  className="text-sm text-textItemBlur hover:underline"
                >
                  Clear
                </button>
              </>
            )}
          </div>
          {bulkMode && selectedCells.size > 0 && (
            <div className="flex items-center gap-2">
              {onBulkConnect && (
                <button
                  onClick={handleBulkConnect}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                >
                  <LinkIcon size="sm" />
                  Connect
                </button>
              )}
              {onBulkDisconnect && (
                <button
                  onClick={handleBulkDisconnect}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                >
                  <UnlinkIcon size="sm" />
                  Disconnect
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-newBgLineColor bg-newBgColor" />
          <span className="text-textItemBlur">Not Connected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-blue-500/50 bg-blue-500/10 flex items-center justify-center">
            <CheckIcon size={10} className="text-blue-500" />
          </div>
          <span className="text-textItemBlur">Connected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-yellow-500/50 bg-yellow-500/10 flex items-center justify-center">
            <StarFilledIcon size={10} className="text-yellow-500" />
          </div>
          <span className="text-textItemBlur">Primary</span>
        </div>
      </div>

      {/* Virtualized Matrix Grid */}
      <div className="overflow-x-auto pb-4">
        <div className="inline-block min-w-full">
          {/* Fixed header row - not virtualized */}
          <div
            className="grid gap-2 sticky top-0 bg-newBgLineColor z-10"
            style={{
              gridTemplateColumns: `minmax(160px, 200px) repeat(${integrations.length}, 48px)`,
            }}
          >
            {/* Empty corner cell */}
            <div className="h-24" />

            {/* Integration headers (columns) */}
            {integrations.map((integration) => (
              <div key={integration.id} className="h-24 flex flex-col justify-end">
                <MatrixHeaderCell
                  label={integration.name}
                  type="integration"
                  imageUrl={integration.picture}
                  platformIdentifier={integration.identifier}
                />
              </div>
            ))}
          </div>

          {/* Virtualized rows container */}
          <div
            ref={parentRef}
            className="overflow-auto"
            style={{
              height: Math.min(totalHeight, 600), // Max height of 600px, scroll after that
              contain: 'strict',
            }}
          >
            {/* Inner container with total height for scrollbar */}
            <div
              style={{
                height: `${totalHeight}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {/* Render only visible rows */}
              {virtualRows.map((virtualRow) => {
                const soul = souls[virtualRow.index];
                return (
                  <MatrixRow
                    key={soul.id}
                    soul={soul}
                    integrations={integrations}
                    cellMap={cellMap}
                    bulkMode={bulkMode}
                    selectedCells={selectedCells}
                    onToggleMapping={onToggleMapping}
                    onSetPrimary={onSetPrimary}
                    onCellSelect={handleCellSelect}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

MatrixGrid.displayName = 'MatrixGrid';

/**
 * Skeleton for loading state
 */
const MatrixGridSkeleton: FC = () => (
  <div className="space-y-4">
    {/* Legend skeleton */}
    <div className="flex items-center gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-newBgLineColor animate-pulse" />
          <div className="w-16 h-4 rounded bg-newBgLineColor animate-pulse" />
        </div>
      ))}
    </div>

    {/* Grid skeleton */}
    <div className="overflow-x-auto pb-4">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `200px repeat(6, 48px)`,
        }}
      >
        {/* Header row */}
        <div className="h-24" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 flex flex-col justify-end pb-2">
            <div className="w-6 h-6 rounded-full bg-newBgLineColor animate-pulse mx-auto" />
            <div className="w-8 h-3 rounded bg-newBgLineColor animate-pulse mx-auto mt-1" />
          </div>
        ))}

        {/* Data rows */}
        {[...Array(4)].map((_, rowIndex) => (
          <React.Fragment key={`row-${rowIndex}`}>
            <div className="flex items-center gap-2 h-10">
              <div className="w-8 h-8 rounded-full bg-newBgLineColor animate-pulse" />
              <div className="flex-1">
                <div className="w-20 h-4 rounded bg-newBgLineColor animate-pulse" />
              </div>
            </div>
            {[...Array(6)].map((_, colIndex) => (
              <MatrixCellSkeleton key={`cell-${rowIndex}-${colIndex}`} />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  </div>
);
