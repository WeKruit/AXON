'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { useSouls, usePersonas, useProxies } from '../hooks/use-axon-api';
import { useMatrix } from '../matrix/use-matrix';
import type { Soul, Persona, Proxy, Platform } from '../types';
import type { MatrixData, MatrixFilters } from '../matrix/types';

/**
 * Tab identifiers for the AXON section
 */
export type AxonTab = 'matrix' | 'souls' | 'personas' | 'proxies';

/**
 * Filter state per tab - preserved across navigation
 */
interface TabFilterState {
  matrix: MatrixFilters;
  souls: {
    status?: string;
    searchQuery?: string;
  };
  personas: {
    searchQuery?: string;
    isAiGenerated?: boolean;
  };
  proxies: {
    type?: string;
    status?: string;
  };
}

/**
 * Scroll position per tab - preserved across navigation
 */
interface TabScrollState {
  matrix: number;
  souls: number;
  personas: number;
  proxies: number;
}

/**
 * Context value provided to child components
 */
interface AxonDataContextValue {
  // Prefetched data from the layout level
  souls: Soul[];
  personas: Persona[];
  proxies: Proxy[];
  matrixData: MatrixData | null;

  // Loading states
  isLoadingSouls: boolean;
  isLoadingPersonas: boolean;
  isLoadingProxies: boolean;
  isLoadingMatrix: boolean;

  // Error states
  soulsError: Error | undefined;
  personasError: Error | undefined;
  proxiesError: Error | undefined;
  matrixError: Error | undefined;

  // Mutation triggers for revalidation
  mutateSouls: () => Promise<void>;
  mutatePersonas: () => Promise<void>;
  mutateProxies: () => Promise<void>;
  mutateMatrix: () => Promise<void>;
  mutateAll: () => Promise<void>;

  // Filter state management (persisted across tab switches)
  filters: TabFilterState;
  setMatrixFilters: (filters: MatrixFilters) => void;
  setSoulsFilters: (filters: TabFilterState['souls']) => void;
  setPersonasFilters: (filters: TabFilterState['personas']) => void;
  setProxiesFilters: (filters: TabFilterState['proxies']) => void;
  clearFilters: (tab: AxonTab) => void;
  clearAllFilters: () => void;

  // Scroll position management (persisted across tab switches)
  scrollPositions: TabScrollState;
  saveScrollPosition: (tab: AxonTab, position: number) => void;
  getScrollPosition: (tab: AxonTab) => number;
}

const AxonDataContext = createContext<AxonDataContextValue | null>(null);

/**
 * Hook to access the AxonDataProvider context
 * Throws if used outside of provider
 */
export function useAxonData(): AxonDataContextValue {
  const context = useContext(AxonDataContext);
  if (!context) {
    throw new Error('useAxonData must be used within an AxonDataProvider');
  }
  return context;
}

/**
 * Optional hook that returns null if not in context
 * For conditional usage in components that may or may not be in AXON
 */
export function useAxonDataOptional(): AxonDataContextValue | null {
  return useContext(AxonDataContext);
}

/**
 * Default filter states
 */
const DEFAULT_FILTER_STATE: TabFilterState = {
  matrix: {},
  souls: {},
  personas: {},
  proxies: {},
};

const DEFAULT_SCROLL_STATE: TabScrollState = {
  matrix: 0,
  souls: 0,
  personas: 0,
  proxies: 0,
};

interface AxonDataProviderProps {
  children: ReactNode;
}

/**
 * AxonDataProvider (WEC-193)
 *
 * Central data provider for the AXON section that:
 * 1. Pre-fetches all shared data at the layout level (souls, personas, proxies, matrix)
 * 2. Persists filter state across tab switches (so filters aren't lost)
 * 3. Preserves scroll positions per tab (so you return to where you were)
 * 4. Provides a unified interface for data access and mutations
 *
 * This enables instant tab switches by keeping data loaded and state preserved.
 */
export function AxonDataProvider({ children }: AxonDataProviderProps) {
  // ============================================================================
  // Data fetching hooks - all prefetched at layout level
  // ============================================================================
  const {
    data: souls,
    isLoading: isLoadingSouls,
    error: soulsError,
    mutate: mutateSoulsInternal,
  } = useSouls();

  const {
    data: personas,
    isLoading: isLoadingPersonas,
    error: personasError,
    mutate: mutatePersonasInternal,
  } = usePersonas();

  const {
    data: proxies,
    isLoading: isLoadingProxies,
    error: proxiesError,
    mutate: mutateProxiesInternal,
  } = useProxies();

  const {
    data: matrixData,
    isLoading: isLoadingMatrix,
    error: matrixError,
    mutate: mutateMatrixInternal,
  } = useMatrix();

  // ============================================================================
  // Filter state - preserved across tab navigation
  // ============================================================================
  const [filters, setFilters] = useState<TabFilterState>(() => {
    // Try to restore from sessionStorage on mount (client-side only)
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('axon-filters');
        if (stored) {
          return JSON.parse(stored) as TabFilterState;
        }
      } catch {
        // Ignore parse errors, use defaults
      }
    }
    return DEFAULT_FILTER_STATE;
  });

  // Persist filters to sessionStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('axon-filters', JSON.stringify(filters));
    }
  }, [filters]);

  // ============================================================================
  // Scroll position state - preserved across tab navigation
  // ============================================================================
  const scrollPositionsRef = useRef<TabScrollState>(DEFAULT_SCROLL_STATE);

  // Try to restore scroll positions from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('axon-scroll-positions');
        if (stored) {
          scrollPositionsRef.current = JSON.parse(stored) as TabScrollState;
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // ============================================================================
  // Mutation helpers with revalidation
  // ============================================================================
  const mutateSouls = useCallback(async () => {
    await mutateSoulsInternal();
  }, [mutateSoulsInternal]);

  const mutatePersonas = useCallback(async () => {
    await mutatePersonasInternal();
  }, [mutatePersonasInternal]);

  const mutateProxies = useCallback(async () => {
    await mutateProxiesInternal();
  }, [mutateProxiesInternal]);

  const mutateMatrix = useCallback(async () => {
    await mutateMatrixInternal();
  }, [mutateMatrixInternal]);

  const mutateAll = useCallback(async () => {
    await Promise.all([
      mutateSoulsInternal(),
      mutatePersonasInternal(),
      mutateProxiesInternal(),
      mutateMatrixInternal(),
    ]);
  }, [mutateSoulsInternal, mutatePersonasInternal, mutateProxiesInternal, mutateMatrixInternal]);

  // ============================================================================
  // Filter setters
  // ============================================================================
  const setMatrixFilters = useCallback((newFilters: MatrixFilters) => {
    setFilters((prev) => ({ ...prev, matrix: newFilters }));
  }, []);

  const setSoulsFilters = useCallback((newFilters: TabFilterState['souls']) => {
    setFilters((prev) => ({ ...prev, souls: newFilters }));
  }, []);

  const setPersonasFilters = useCallback((newFilters: TabFilterState['personas']) => {
    setFilters((prev) => ({ ...prev, personas: newFilters }));
  }, []);

  const setProxiesFilters = useCallback((newFilters: TabFilterState['proxies']) => {
    setFilters((prev) => ({ ...prev, proxies: newFilters }));
  }, []);

  const clearFilters = useCallback((tab: AxonTab) => {
    setFilters((prev) => ({
      ...prev,
      [tab]: DEFAULT_FILTER_STATE[tab],
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_FILTER_STATE);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('axon-filters');
    }
  }, []);

  // ============================================================================
  // Scroll position management
  // ============================================================================
  const saveScrollPosition = useCallback((tab: AxonTab, position: number) => {
    scrollPositionsRef.current[tab] = position;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('axon-scroll-positions', JSON.stringify(scrollPositionsRef.current));
    }
  }, []);

  const getScrollPosition = useCallback((tab: AxonTab): number => {
    return scrollPositionsRef.current[tab];
  }, []);

  // ============================================================================
  // Context value
  // ============================================================================
  const value = useMemo<AxonDataContextValue>(
    () => ({
      // Data
      souls: souls ?? [],
      personas: personas ?? [],
      proxies: proxies ?? [],
      matrixData: matrixData ?? null,

      // Loading states
      isLoadingSouls,
      isLoadingPersonas,
      isLoadingProxies,
      isLoadingMatrix,

      // Error states
      soulsError,
      personasError,
      proxiesError,
      matrixError,

      // Mutations
      mutateSouls,
      mutatePersonas,
      mutateProxies,
      mutateMatrix,
      mutateAll,

      // Filters
      filters,
      setMatrixFilters,
      setSoulsFilters,
      setPersonasFilters,
      setProxiesFilters,
      clearFilters,
      clearAllFilters,

      // Scroll positions
      scrollPositions: scrollPositionsRef.current,
      saveScrollPosition,
      getScrollPosition,
    }),
    [
      souls,
      personas,
      proxies,
      matrixData,
      isLoadingSouls,
      isLoadingPersonas,
      isLoadingProxies,
      isLoadingMatrix,
      soulsError,
      personasError,
      proxiesError,
      matrixError,
      mutateSouls,
      mutatePersonas,
      mutateProxies,
      mutateMatrix,
      mutateAll,
      filters,
      setMatrixFilters,
      setSoulsFilters,
      setPersonasFilters,
      setProxiesFilters,
      clearFilters,
      clearAllFilters,
      saveScrollPosition,
      getScrollPosition,
    ]
  );

  return (
    <AxonDataContext.Provider value={value}>
      {children}
    </AxonDataContext.Provider>
  );
}

/**
 * Hook to automatically save and restore scroll position for a tab
 * Use this in list components to preserve scroll position
 */
export function useAxonScrollPreservation(tab: AxonTab) {
  const { saveScrollPosition, getScrollPosition } = useAxonData();
  const containerRef = useRef<HTMLDivElement>(null);

  // Restore scroll position on mount
  useEffect(() => {
    const position = getScrollPosition(tab);
    if (containerRef.current && position > 0) {
      // Use requestAnimationFrame to ensure content is rendered before scrolling
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = position;
        }
      });
    }
  }, [tab, getScrollPosition]);

  // Save scroll position on scroll
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      saveScrollPosition(tab, containerRef.current.scrollTop);
    }
  }, [tab, saveScrollPosition]);

  return { containerRef, handleScroll };
}
