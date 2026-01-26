'use client';

import { FC, useState, useRef, useEffect } from 'react';
import { useSouls } from '../hooks/use-axon-api';
import { useSoulContext } from '../context/soul-context';
import { ChevronDownIcon, SoulIcon, CheckIcon } from './icons';
import type { Soul } from '../types';

interface SoulSwitcherProps {
  className?: string;
}

export const SoulSwitcher: FC<SoulSwitcherProps> = ({ className = '' }) => {
  const { data: souls, isLoading } = useSouls();
  const { selectedSoul, selectedSoulId, selectSoul, isAllSoulsView } = useSoulContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    if (selectedSoulId && souls && !selectedSoul) {
      const soul = souls.find((s) => s.id === selectedSoulId);
      if (soul) {
        selectSoul(soul);
      }
    }
  }, [selectedSoulId, souls, selectedSoul, selectSoul]);

  const handleSelect = (soul: Soul | null) => {
    selectSoul(soul);
    setIsOpen(false);
  };

  const displayName = isAllSoulsView
    ? 'All Souls'
    : selectedSoul?.name || 'Select Soul...';

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-newBgLineColor rounded-lg hover:bg-newBgLineColor/80 transition-colors min-w-[160px]"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-medium">
          {isAllSoulsView ? (
            <SoulIcon size={14} />
          ) : (
            selectedSoul?.name?.charAt(0).toUpperCase() || '?'
          )}
        </div>
        <span className="text-sm font-medium flex-1 text-left truncate">
          {displayName}
        </span>
        <ChevronDownIcon
          size="sm"
          className={`text-textItemBlur transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-newBgColor border border-newBgLineColor rounded-lg shadow-lg z-50 overflow-hidden"
          role="listbox"
        >
          {/* All Souls option */}
          <button
            onClick={() => handleSelect(null)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-newBgLineColor transition-colors ${
              isAllSoulsView ? 'bg-newBgLineColor' : ''
            }`}
            role="option"
            aria-selected={isAllSoulsView}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white">
              <SoulIcon size={14} />
            </div>
            <span className="flex-1 text-left">All Souls</span>
            {isAllSoulsView && <CheckIcon size="sm" className="text-btnPrimary" />}
          </button>

          {/* Divider */}
          <div className="border-t border-newBgLineColor" />

          {/* Soul list */}
          <div className="max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-4 text-sm text-textItemBlur text-center">
                Loading souls...
              </div>
            ) : souls && souls.length > 0 ? (
              souls.map((soul) => (
                <button
                  key={soul.id}
                  onClick={() => handleSelect(soul)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-newBgLineColor transition-colors ${
                    selectedSoulId === soul.id ? 'bg-newBgLineColor' : ''
                  }`}
                  role="option"
                  aria-selected={selectedSoulId === soul.id}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-medium">
                    {soul.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span className="flex-1 text-left truncate">{soul.name}</span>
                  {selectedSoulId === soul.id && (
                    <CheckIcon size="sm" className="text-btnPrimary" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-textItemBlur text-center">
                No souls found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
