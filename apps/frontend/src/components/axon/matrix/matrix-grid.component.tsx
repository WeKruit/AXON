'use client';

import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import { MatrixCell, MatrixHeaderCell, MatrixCellSkeleton } from './matrix-cell.component';
import { CheckIcon, GridIcon, StarFilledIcon, LinkIcon, UnlinkIcon } from '../ui/icons';
import type { Soul, Account } from '../types';
import type {
  Integration,
  SoulIntegrationMapping,
  MatrixData,
  MatrixFilters,
  LinkedAccountInfo,
} from './types';

export interface MatrixGridProps {
  data: MatrixData | null;
  accounts?: Account[];
  isLoading?: boolean;
  filters?: MatrixFilters;
  onToggleMapping: (soulId: string, integrationId: string) => Promise<void>;
  onSetPrimary: (soulId: string, integrationId: string) => Promise<void>;
  onBulkConnect?: (soulIds: string[], integrationIds: string[]) => Promise<void>;
  onBulkDisconnect?: (soulIds: string[], integrationIds: string[]) => Promise<void>;
}

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
 * Styles for content-visibility optimization (WEC-184)
 * Defers rendering of off-screen rows for better performance with 500+ souls
 * Based on rendering-content-visibility best practice
 */
const matrixRowStyles: React.CSSProperties = {
  contentVisibility: 'auto',
  containIntrinsicSize: '0 48px', // Estimated row height (48px = 40px cell + 8px gap)
};

/**
 * Individual matrix row component with content-visibility optimization
 * Memoized to prevent unnecessary re-renders when other rows change
 */
/**
 * Build a map of soulId-integrationId -> LinkedAccountInfo for accounts linked to integrations
 */
function buildAccountLinkMap(accounts: Account[]): Map<string, LinkedAccountInfo> {
  const map = new Map<string, LinkedAccountInfo>();
  for (const account of accounts) {
    if (account.integrationId) {
      const key = `${account.soulId}-${account.integrationId}`;
      // Store the account info
      map.set(key, {
        id: account.id,
        username: account.username,
        platform: account.platform,
      });
    }
  }
  return map;
}

interface MatrixRowProps {
  soul: Soul;
  integrations: Integration[];
  cellMap: Map<string, SoulIntegrationMapping>;
  accountLinkMap: Map<string, LinkedAccountInfo>;
  bulkMode: boolean;
  selectedCells: Set<string>;
  onToggleMapping: (soulId: string, integrationId: string) => Promise<void>;
  onSetPrimary: (soulId: string, integrationId: string) => Promise<void>;
  onCellSelect: (soulId: string, integrationId: string) => void;
}

const MatrixRow: FC<MatrixRowProps> = memo(({
  soul,
  integrations,
  cellMap,
  accountLinkMap,
  bulkMode,
  selectedCells,
  onToggleMapping,
  onSetPrimary,
  onCellSelect,
}) => (
  <React.Fragment>
    {/* Soul header (row label) - using CSS grid subgrid for alignment */}
    <div style={matrixRowStyles}>
      <MatrixHeaderCell
        label={soul.name}
        subtitle={soul.persona?.name}
        type="soul"
      />
    </div>

    {/* Matrix cells */}
    {integrations.map((integration) => {
      const cellKey = getCellKeyFn(soul.id, integration.id);
      const mapping = cellMap.get(cellKey) ?? null;
      const linkedAccount = accountLinkMap.get(cellKey);
      return (
        <div key={cellKey} style={matrixRowStyles}>
          <MatrixCell
            soulId={soul.id}
            integrationId={integration.id}
            mapping={mapping}
            linkedAccount={linkedAccount}
            bulkMode={bulkMode}
            isSelected={selectedCells.has(cellKey)}
            onToggle={onToggleMapping}
            onSetPrimary={onSetPrimary}
            onSelect={onCellSelect}
          />
        </div>
      );
    })}
  </React.Fragment>
));

MatrixRow.displayName = 'MatrixRow';

export const MatrixGrid: FC<MatrixGridProps> = memo(({
  data,
  accounts = [],
  isLoading = false,
  filters,
  onToggleMapping,
  onSetPrimary,
  onBulkConnect,
  onBulkDisconnect,
}) => {
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

  // Build cell lookup map
  const cellMap = useMemo(() => {
    if (!data?.mappings) return new Map<string, SoulIntegrationMapping>();
    return buildCellMapFn(data.mappings);
  }, [data?.mappings]);

  // Build account link map for showing which accounts are linked to integrations
  const accountLinkMap = useMemo(() => {
    return buildAccountLinkMap(accounts);
  }, [accounts]);

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
      <div className="flex items-center gap-6 text-sm flex-wrap">
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
        <div className="flex items-center gap-2">
          <div className="relative w-4 h-4 rounded border-2 border-newBgLineColor bg-newBgColor">
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border border-newBgColor" />
          </div>
          <span className="text-textItemBlur">Account Linked</span>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="overflow-x-auto pb-4">
        <div className="inline-block min-w-full">
          <div
            className="grid gap-2"
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

            {/* Soul rows - using content-visibility for performance with large datasets (WEC-184) */}
            {souls.map((soul) => (
              <MatrixRow
                key={soul.id}
                soul={soul}
                integrations={integrations}
                cellMap={cellMap}
                accountLinkMap={accountLinkMap}
                bulkMode={bulkMode}
                selectedCells={selectedCells}
                onToggleMapping={onToggleMapping}
                onSetPrimary={onSetPrimary}
                onCellSelect={handleCellSelect}
              />
            ))}
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
