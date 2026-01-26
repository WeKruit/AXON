'use client';

import { FC, useCallback, useState, useEffect } from 'react';
import clsx from 'clsx';
import type { MatrixFilters } from './types';
import { SearchIcon, FilterIcon } from '../ui/icons';
import { useDebounce } from '../hooks/use-debounce';

interface MatrixFiltersProps {
  filters: MatrixFilters;
  onChange: (filters: MatrixFilters) => void;
  availablePlatforms?: string[];
}

const DEFAULT_PLATFORMS = [
  { value: '', label: 'All Platforms' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'threads', label: 'Threads' },
  { value: 'bluesky', label: 'Bluesky' },
  { value: 'mastodon', label: 'Mastodon' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'pinterest', label: 'Pinterest' },
];

/**
 * Filter controls for the matrix view
 */
export const MatrixFiltersComponent: FC<MatrixFiltersProps> = ({
  filters,
  onChange,
  availablePlatforms,
}) => {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchInput, 300);

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onChange({ ...filters, search: debouncedSearch || undefined });
    }
  }, [debouncedSearch, filters, onChange]);

  const handlePlatformChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const platform = e.target.value || undefined;
      onChange({ ...filters, platform });
    },
    [filters, onChange]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInput(e.target.value);
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setSearchInput('');
    onChange({});
  }, [onChange]);

  const hasActiveFilters = filters.platform || filters.search;

  // Filter platforms to only show available ones if provided
  const platformOptions = availablePlatforms
    ? DEFAULT_PLATFORMS.filter(
        (p) => p.value === '' || availablePlatforms.includes(p.value)
      )
    : DEFAULT_PLATFORMS;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {/* Platform filter */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <FilterIcon size="sm" className="text-textItemBlur" />
        </div>
        <select
          value={filters.platform || ''}
          onChange={handlePlatformChange}
          className={clsx(
            'pl-9 pr-8 py-2 rounded-lg bg-newBgLineColor border border-newTableBorder',
            'text-sm text-newTextColor appearance-none cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-btnPrimary focus:border-transparent',
            'hover:bg-newBgLineColor/80 transition-colors'
          )}
          aria-label="Filter by platform"
        >
          {platformOptions.map((platform) => (
            <option key={platform.value} value={platform.value}>
              {platform.label}
            </option>
          ))}
        </select>
        {/* Custom dropdown arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-textItemBlur"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Search input */}
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <SearchIcon size="sm" className="text-textItemBlur" />
        </div>
        <input
          type="text"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search souls..."
          className={clsx(
            'w-full pl-9 pr-4 py-2 rounded-lg bg-newBgLineColor border border-newTableBorder',
            'text-sm text-newTextColor placeholder:text-textItemBlur',
            'focus:outline-none focus:ring-2 focus:ring-btnPrimary focus:border-transparent',
            'transition-colors'
          )}
          aria-label="Search souls by name"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-textItemBlur hover:text-newTextColor"
            aria-label="Clear search"
          >
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
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <button
          onClick={handleClearFilters}
          className={clsx(
            'px-3 py-2 rounded-lg text-sm',
            'text-textItemBlur hover:text-newTextColor',
            'bg-transparent hover:bg-newBgLineColor',
            'transition-colors'
          )}
          aria-label="Clear all filters"
        >
          Clear filters
        </button>
      )}
    </div>
  );
};

MatrixFiltersComponent.displayName = 'MatrixFiltersComponent';
