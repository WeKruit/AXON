'use client';

import { FC, useState, useCallback } from 'react';
import Link from 'next/link';
import { MatrixGridComponent } from './matrix-grid.component';
import { useMatrix } from './use-matrix';

/**
 * Main Matrix View component
 *
 * Provides the full page layout for the Soul-Channel Matrix including:
 * - Header with title and actions
 * - Statistics summary
 * - Matrix grid
 */
export const MatrixViewComponent: FC = () => {
  const [bulkMode, setBulkMode] = useState(false);
  const { data } = useMatrix();

  const handleToggleBulkMode = useCallback(() => {
    setBulkMode(!bulkMode);
  }, [bulkMode]);

  return (
    <div className="flex-1 bg-newBgColorInner p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-newTextColor">
            Soul-Channel Matrix
          </h1>
          <p className="text-sm text-textItemBlur mt-1">
            Connect your brand identities to social media channels
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Stats */}
          {data && (
            <div className="flex items-center gap-4 mr-4 text-sm text-textItemBlur">
              <span>
                {data.stats.totalSouls} soul{data.stats.totalSouls !== 1 ? 's' : ''}
              </span>
              <span className="text-newTableBorder">|</span>
              <span>
                {data.stats.totalIntegrations} channel{data.stats.totalIntegrations !== 1 ? 's' : ''}
              </span>
              <span className="text-newTableBorder">|</span>
              <span className="text-btnPrimary">
                {data.stats.totalMappings} link{data.stats.totalMappings !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Bulk Edit Button */}
          <button
            onClick={handleToggleBulkMode}
            className={`px-4 py-2 rounded-[8px] text-sm transition-colors ${
              bulkMode
                ? 'bg-btnPrimary text-white'
                : 'bg-newBgLineColor text-newTextColor hover:bg-newBgLineColor/80'
            }`}
          >
            {bulkMode ? 'Exit Bulk Mode' : 'Bulk Edit'}
          </button>

          {/* Quick Links */}
          <Link
            href="/axon/souls"
            className="px-4 py-2 bg-newBgLineColor text-newTextColor rounded-[8px] text-sm hover:bg-newBgLineColor/80 transition-colors"
          >
            Manage Souls
          </Link>
          <Link
            href="/integrations"
            className="px-4 py-2 bg-btnPrimary text-white rounded-[8px] text-sm hover:bg-btnPrimary/90 transition-colors"
          >
            Connect Channels
          </Link>
        </div>
      </div>

      {/* Matrix Grid */}
      <MatrixGridComponent />
    </div>
  );
};

MatrixViewComponent.displayName = 'MatrixViewComponent';
