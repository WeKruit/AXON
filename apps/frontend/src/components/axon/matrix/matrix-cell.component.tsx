'use client';

import { FC, useCallback, useState, memo } from 'react';
import clsx from 'clsx';

interface MatrixCellProps {
  soulId: string;
  integrationId: string;
  isMapped: boolean;
  isPrimary: boolean;
  isSelected: boolean;
  bulkMode: boolean;
  platform?: string;
  onClick: (soulId: string, integrationId: string) => void;
  onSetPrimary: (soulId: string, integrationId: string) => void;
}

/**
 * Individual cell in the matrix grid representing a Soul-Integration connection
 *
 * States:
 * - Disconnected: Gray/empty appearance
 * - Connected: Colored with platform indicator
 * - Primary: Connected + star badge
 *
 * Interactions:
 * - Single click: Toggle connection
 * - Double click: Set as primary (when connected)
 */
export const MatrixCell: FC<MatrixCellProps> = memo(
  ({
    soulId,
    integrationId,
    isMapped,
    isPrimary,
    isSelected,
    bulkMode,
    platform,
    onClick,
    onSetPrimary,
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = useCallback(
      async (e: React.MouseEvent) => {
        e.preventDefault();
        if (isLoading) return;

        setIsLoading(true);
        try {
          await onClick(soulId, integrationId);
        } finally {
          setIsLoading(false);
        }
      },
      [soulId, integrationId, onClick, isLoading]
    );

    const handleDoubleClick = useCallback(
      async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isMapped || isLoading) return;

        setIsLoading(true);
        try {
          await onSetPrimary(soulId, integrationId);
        } finally {
          setIsLoading(false);
        }
      },
      [soulId, integrationId, isMapped, onSetPrimary, isLoading]
    );

    return (
      <td className="p-1">
        <button
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          disabled={isLoading}
          className={clsx(
            'w-10 h-10 rounded-lg transition-all duration-150 flex items-center justify-center relative',
            'focus:outline-none focus:ring-2 focus:ring-btnPrimary focus:ring-offset-2 focus:ring-offset-newBgColorInner',
            // Base states
            isMapped
              ? 'bg-btnPrimary hover:bg-btnPrimary/80'
              : 'bg-newBgLineColor hover:bg-newBgLineColor/80 border border-newTableBorder',
            // Bulk mode selection
            bulkMode && isSelected && 'ring-2 ring-yellow-400 ring-offset-1',
            // Loading state
            isLoading && 'opacity-50 cursor-wait',
            // Hover effects
            !isLoading && isHovered && !isMapped && 'border-btnPrimary border-dashed'
          )}
          aria-label={
            isMapped
              ? isPrimary
                ? 'Primary channel - click to unlink, double-click to change primary'
                : 'Connected - click to unlink, double-click to set as primary'
              : 'Not connected - click to link'
          }
          aria-pressed={isMapped}
          title={
            isMapped
              ? isPrimary
                ? 'Primary channel (double-click to change)'
                : 'Connected (double-click to set as primary)'
              : 'Click to connect'
          }
        >
          {/* Checkmark for connected state */}
          {isMapped && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}

          {/* Plus icon for disconnected hover state */}
          {!isMapped && isHovered && !isLoading && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-textItemBlur"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}

          {/* Loading spinner */}
          {isLoading && (
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}

          {/* Primary star badge */}
          {isPrimary && !isLoading && (
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-yellow-400 rounded-full"
              aria-label="Primary channel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-yellow-900"
                aria-hidden="true"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </span>
          )}

          {/* Bulk selection indicator */}
          {bulkMode && isSelected && (
            <span
              className="absolute -bottom-1 -left-1 flex items-center justify-center w-4 h-4 bg-yellow-400 rounded-full"
              aria-label="Selected for bulk operation"
            >
              <span className="text-[10px] font-bold text-yellow-900">B</span>
            </span>
          )}
        </button>
      </td>
    );
  }
);

MatrixCell.displayName = 'MatrixCell';

/**
 * Empty cell placeholder for loading states
 */
export const MatrixCellSkeleton: FC = () => (
  <td className="p-1">
    <div className="w-10 h-10 rounded-lg bg-newBgLineColor animate-pulse" />
  </td>
);
