'use client';

import { FC, memo, useCallback, useState } from 'react';
import clsx from 'clsx';
import { CheckIcon, StarFilledIcon, LinkIcon } from '../ui/icons';
import type { AccountLinkInfo } from '../types';
import type { SoulIntegrationMapping, CellState } from './types';

export interface MatrixCellProps {
  soulId: string;
  integrationId: string;
  mapping: SoulIntegrationMapping | null;
  /** Optional: accounts within this soul that are linked to this integration */
  linkedAccounts?: AccountLinkInfo[];
  isLoading?: boolean;
  disabled?: boolean;
  bulkMode?: boolean;
  isSelected?: boolean;
  onToggle: (soulId: string, integrationId: string) => Promise<void>;
  onSetPrimary: (soulId: string, integrationId: string) => Promise<void>;
  onSelect?: (soulId: string, integrationId: string) => void;
}

function getCellState(mapping: SoulIntegrationMapping | null): CellState {
  if (!mapping) return 'disconnected';
  return mapping.isPrimary ? 'primary' : 'connected';
}

const cellStyles: Record<CellState, string> = {
  disconnected: 'bg-newBgColor border-newBgLineColor hover:border-textItemBlur',
  connected: 'bg-blue-500/10 border-blue-500/50 hover:border-blue-500',
  primary: 'bg-yellow-500/10 border-yellow-500/50 hover:border-yellow-500',
};

const iconStyles: Record<CellState, string> = {
  disconnected: 'text-textItemBlur opacity-0 group-hover:opacity-30',
  connected: 'text-blue-500',
  primary: 'text-yellow-500',
};

export const MatrixCell: FC<MatrixCellProps> = memo(({
  soulId,
  integrationId,
  mapping,
  linkedAccounts,
  isLoading = false,
  disabled = false,
  bulkMode = false,
  isSelected = false,
  onToggle,
  onSetPrimary,
  onSelect,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const state = getCellState(mapping);
  const isConnected = state !== 'disconnected';
  const isPrimary = state === 'primary';

  // Calculate account link status
  const linkedCount = linkedAccounts?.filter((a) => a.isLinked).length ?? 0;
  const hasLinkedAccounts = linkedCount > 0;

  const handleClick = useCallback(async () => {
    if (disabled || isProcessing) return;

    if (bulkMode && onSelect) {
      onSelect(soulId, integrationId);
      return;
    }

    setIsProcessing(true);
    try {
      await onToggle(soulId, integrationId);
    } finally {
      setIsProcessing(false);
    }
  }, [soulId, integrationId, disabled, isProcessing, bulkMode, onSelect, onToggle]);

  const handleDoubleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || isProcessing || bulkMode) return;
    if (!isConnected) return; // Can only set primary on connected cells

    setIsProcessing(true);
    try {
      await onSetPrimary(soulId, integrationId);
    } finally {
      setIsProcessing(false);
    }
  }, [soulId, integrationId, disabled, isProcessing, bulkMode, isConnected, onSetPrimary]);

  const showLoading = isLoading || isProcessing;

  return (
    <button
      type="button"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      disabled={disabled || showLoading}
      className={clsx(
        'group relative w-10 h-10 rounded-lg border-2 transition-all duration-200',
        'flex items-center justify-center',
        'focus:outline-none focus:ring-2 focus:ring-btnPrimary focus:ring-offset-2 focus:ring-offset-newBgColorInner',
        cellStyles[state],
        showLoading && 'animate-pulse',
        disabled && 'opacity-50 cursor-not-allowed',
        bulkMode && isSelected && 'ring-2 ring-btnPrimary',
      )}
      aria-label={`${isConnected ? 'Connected' : 'Disconnected'}${isPrimary ? ', Primary' : ''}. Click to toggle, double-click to set primary.`}
      aria-pressed={isConnected}
      data-soul-id={soulId}
      data-integration-id={integrationId}
    >
      {showLoading ? (
        <div className="w-4 h-4 border-2 border-textItemBlur border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {isPrimary ? (
            <StarFilledIcon size="sm" className={iconStyles[state]} />
          ) : (
            <CheckIcon size="sm" className={iconStyles[state]} />
          )}
        </>
      )}

      {/* Account link indicator - small badge in corner */}
      {hasLinkedAccounts && (
        <div
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"
          title={`${linkedCount} account(s) linked to this integration`}
        >
          <LinkIcon size={10} className="text-white" />
        </div>
      )}

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-newBgColor rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-newBgLineColor shadow-lg">
        <div className="font-medium">
          {isConnected ? (isPrimary ? 'Primary' : 'Connected') : 'Not connected'}
        </div>
        {hasLinkedAccounts && (
          <div className="text-green-500 flex items-center gap-1 mt-0.5">
            <LinkIcon size={10} />
            {linkedCount} account{linkedCount !== 1 ? 's' : ''} linked
          </div>
        )}
        {linkedAccounts && linkedAccounts.length > 0 && hasLinkedAccounts && (
          <div className="text-textItemBlur mt-1 max-w-[150px]">
            {linkedAccounts
              .filter((a) => a.isLinked)
              .slice(0, 3)
              .map((a) => a.username)
              .join(', ')}
            {linkedCount > 3 && ` +${linkedCount - 3} more`}
          </div>
        )}
        <div className="text-textItemBlur mt-1">
          {isConnected ? 'Double-click to toggle primary' : 'Click to connect'}
        </div>
      </div>
    </button>
  );
});

MatrixCell.displayName = 'MatrixCell';

/**
 * Skeleton cell for loading state
 */
export const MatrixCellSkeleton: FC = () => (
  <div className="w-10 h-10 rounded-lg bg-newBgLineColor animate-pulse" />
);

/**
 * Header cell for row/column labels
 */
export interface MatrixHeaderCellProps {
  label: string;
  subtitle?: string;
  type: 'soul' | 'integration';
  imageUrl?: string;
  platformIdentifier?: string;
}

export const MatrixHeaderCell: FC<MatrixHeaderCellProps> = memo(({
  label,
  subtitle,
  type,
  imageUrl,
  platformIdentifier,
}) => {
  const isIntegration = type === 'integration';

  return (
    <div
      className={clsx(
        'flex items-center gap-2',
        isIntegration ? 'flex-col justify-end pb-2 w-10' : 'justify-start pr-4 h-10'
      )}
    >
      {imageUrl && (
        <div className="relative flex-shrink-0">
          <img
            src={imageUrl}
            alt={label}
            className={clsx(
              'rounded-full object-cover',
              isIntegration ? 'w-6 h-6' : 'w-8 h-8'
            )}
          />
          {platformIdentifier && (
            <img
              src={`/icons/platforms/${platformIdentifier}.png`}
              alt={platformIdentifier}
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-newBgColor"
            />
          )}
        </div>
      )}
      {!imageUrl && type === 'soul' && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {label.charAt(0).toUpperCase()}
        </div>
      )}
      <div className={clsx('overflow-hidden', isIntegration ? 'text-center' : '')}>
        <p
          className={clsx(
            'font-medium truncate',
            isIntegration ? 'text-xs writing-mode-vertical max-h-20' : 'text-sm'
          )}
          title={label}
        >
          {isIntegration ? label.slice(0, 8) + (label.length > 8 ? '...' : '') : label}
        </p>
        {subtitle && !isIntegration && (
          <p className="text-xs text-textItemBlur truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
});

MatrixHeaderCell.displayName = 'MatrixHeaderCell';
