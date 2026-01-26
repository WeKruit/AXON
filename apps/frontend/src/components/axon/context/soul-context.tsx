'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import type { Soul } from '../types';

interface SoulContextValue {
  // Currently selected soul (null = "All Souls" view)
  selectedSoul: Soul | null;
  selectedSoulId: string | null;

  // Actions
  selectSoul: (soul: Soul | null) => void;
  selectSoulById: (soulId: string | null) => void;
  clearSelection: () => void;

  // View mode
  isAllSoulsView: boolean;
}

const SoulContext = createContext<SoulContextValue | null>(null);

export function useSoulContext(): SoulContextValue {
  const context = useContext(SoulContext);
  if (!context) {
    throw new Error('useSoulContext must be used within a SoulContextProvider');
  }
  return context;
}

// Optional hook that returns null if not in context (for conditional usage)
export function useSoulContextOptional(): SoulContextValue | null {
  return useContext(SoulContext);
}

interface SoulContextProviderProps {
  children: ReactNode;
  // Optional initial selection
  initialSoulId?: string | null;
}

export function SoulContextProvider({ children, initialSoulId }: SoulContextProviderProps) {
  const [selectedSoul, setSelectedSoul] = useState<Soul | null>(null);
  const [selectedSoulId, setSelectedSoulId] = useState<string | null>(initialSoulId || null);

  const selectSoul = useCallback((soul: Soul | null) => {
    setSelectedSoul(soul);
    setSelectedSoulId(soul?.id || null);
    // Persist to localStorage for session persistence
    if (soul) {
      localStorage.setItem('axon-selected-soul-id', soul.id);
    } else {
      localStorage.removeItem('axon-selected-soul-id');
    }
  }, []);

  const selectSoulById = useCallback((soulId: string | null) => {
    setSelectedSoulId(soulId);
    setSelectedSoul(null); // Will be populated when soul data is fetched
    if (soulId) {
      localStorage.setItem('axon-selected-soul-id', soulId);
    } else {
      localStorage.removeItem('axon-selected-soul-id');
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSoul(null);
    setSelectedSoulId(null);
    localStorage.removeItem('axon-selected-soul-id');
  }, []);

  const isAllSoulsView = selectedSoulId === null;

  const value = useMemo<SoulContextValue>(() => ({
    selectedSoul,
    selectedSoulId,
    selectSoul,
    selectSoulById,
    clearSelection,
    isAllSoulsView,
  }), [selectedSoul, selectedSoulId, selectSoul, selectSoulById, clearSelection, isAllSoulsView]);

  return (
    <SoulContext.Provider value={value}>
      {children}
    </SoulContext.Provider>
  );
}
