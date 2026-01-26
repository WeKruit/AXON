'use client';

import { FC, useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSouls } from '../hooks/use-axon-api';
import { useSoulContextOptional } from '../context/soul-context';
import { ChevronDownIcon, SoulIcon, CheckIcon } from './icons';
import type { Soul } from '../types';

/**
 * GlobalSoulSwitcher - Compact soul selector for the global header
 * Similar to light/dark mode toggle, allows quick switching between souls
 * Only fetches souls data when dropdown is opened or on AXON pages
 */
export const GlobalSoulSwitcher: FC = () => {
  const pathname = usePathname();
  const isAxonPage = pathname?.startsWith('/axon');
  const [hasOpened, setHasOpened] = useState(false);

  // Only fetch souls when on AXON pages OR when dropdown has been opened
  const shouldFetch = isAxonPage || hasOpened;
  const { data: souls, isLoading } = useSouls(shouldFetch ? undefined : { revalidateOnMount: false });
  const soulContext = useSoulContextOptional();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // If no soul context (not in AXON area), don't render
  // But we now have global context, so this should always be available
  const { selectedSoul, selectedSoulId, selectSoul, isAllSoulsView } = soulContext || {
    selectedSoul: null,
    selectedSoulId: null,
    selectSoul: () => {},
    isAllSoulsView: true,
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Update selectedSoul when souls data is loaded and we have a selectedSoulId
  useEffect(() => {
    if (selectedSoulId && souls && !selectedSoul && soulContext) {
      const soul = souls.find((s) => s.id === selectedSoulId);
      if (soul) {
        selectSoul(soul);
      }
    }
  }, [selectedSoulId, souls, selectedSoul, selectSoul, soulContext]);

  const handleSelect = (soul: Soul | null) => {
    selectSoul(soul);
    setIsOpen(false);
  };

  // Don't render if context is not available
  if (!soulContext) {
    return null;
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!hasOpened) setHasOpened(true);
        }}
        className="flex items-center gap-2 hover:text-newTextColor transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Soul focus: ${isAllSoulsView ? 'All Souls' : selectedSoul?.name || 'Select Soul'}`}
        title={`Soul Focus: ${isAllSoulsView ? 'All Souls' : selectedSoul?.name || 'Select Soul'}`}
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-[10px] font-medium">
          {isAllSoulsView ? (
            <SoulIcon size={12} />
          ) : (
            selectedSoul?.name?.charAt(0).toUpperCase() || '?'
          )}
        </div>
        <ChevronDownIcon
          size="sm"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-[220px] bg-newBgColor border border-newBgLineColor rounded-lg shadow-lg z-50 overflow-hidden"
          role="listbox"
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-newBgLineColor">
            <p className="text-xs font-medium text-textItemBlur uppercase tracking-wide">Soul Focus</p>
          </div>

          {/* All Souls option */}
          <button
            onClick={() => handleSelect(null)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-newBgLineColor transition-colors ${
              isAllSoulsView ? 'bg-newBgLineColor/50' : ''
            }`}
            role="option"
            aria-selected={isAllSoulsView}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white">
              <SoulIcon size={12} />
            </div>
            <span className="flex-1 text-left">All Souls</span>
            {isAllSoulsView && <CheckIcon size="sm" className="text-btnPrimary" />}
          </button>

          {/* Divider */}
          <div className="border-t border-newBgLineColor" />

          {/* Soul list */}
          <div className="max-h-[280px] overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-4 text-sm text-textItemBlur text-center">
                Loading...
              </div>
            ) : souls && souls.length > 0 ? (
              souls.map((soul) => (
                <button
                  key={soul.id}
                  onClick={() => handleSelect(soul)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-newBgLineColor transition-colors ${
                    selectedSoulId === soul.id ? 'bg-newBgLineColor/50' : ''
                  }`}
                  role="option"
                  aria-selected={selectedSoulId === soul.id}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-[10px] font-medium">
                    {soul.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="block truncate">{soul.name}</span>
                    {soul.status && (
                      <span className="text-[10px] text-textItemBlur capitalize">{soul.status}</span>
                    )}
                  </div>
                  {selectedSoulId === soul.id && (
                    <CheckIcon size="sm" className="text-btnPrimary" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-textItemBlur text-center">
                No souls yet
              </div>
            )}
          </div>

          {/* Create soul link */}
          {souls && souls.length > 0 && (
            <>
              <div className="border-t border-newBgLineColor" />
              <a
                href="/axon/souls"
                className="block px-3 py-2 text-xs text-btnPrimary hover:underline text-center"
              >
                Manage Souls
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
};
