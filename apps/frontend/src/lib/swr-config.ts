'use client';

import type { SWRConfiguration } from 'swr';
import { preload } from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

/**
 * Default SWR configuration for AXON
 * - Optimized for dashboard-style data that doesn't need frequent updates
 * - Prevents unnecessary refetches on focus/reconnect
 * - keepPreviousData prevents content flash during refetch
 */
export const defaultSwrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
  dedupingInterval: 2000, // Dedupe requests within 2s window
  keepPreviousData: true, // Prevents content flash during refetch
};

/**
 * SWR configuration for immutable/static data
 * - Data that rarely changes (e.g., platform types, config)
 */
export const immutableSwrConfig: SWRConfiguration = {
  ...defaultSwrConfig,
  revalidateIfStale: false,
  revalidateOnMount: false,
};

/**
 * SWR configuration for frequently updated data
 * - Data that may change often (e.g., real-time stats)
 */
export const realtimeSwrConfig: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 1000,
};

/**
 * Create a fetcher function for API endpoints
 */
export function createFetcher(customFetch: ReturnType<typeof useFetch>) {
  return async (url: string) => {
    const response = await customFetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    const result = await response.json();
    // Handle paginated responses from backend
    return result?.data ?? result;
  };
}

/**
 * Preload data for a route before navigation
 * Usage: Call on hover/focus for instant tab switching
 */
export function preloadRoute(key: string, fetcher: () => Promise<unknown>) {
  preload(key, fetcher);
}

/**
 * Keys for AXON API endpoints
 */
export const AXON_CACHE_KEYS = {
  souls: '/axon/souls',
  soul: (id: string) => `/axon/souls/${id}`,
  accounts: (soulId?: string) =>
    soulId ? `/axon/accounts?soulId=${soulId}` : '/axon/accounts',
  account: (id: string) => `/axon/accounts/${id}`,
  personas: '/axon/personas',
  persona: (id: string) => `/axon/personas/${id}`,
  proxies: '/axon/proxies',
  proxy: (id: string) => `/axon/proxies/${id}`,
  integrations: '/integrations/list',
  matrixMappings: '/axon/matrix/mappings',
  analytics: '/axon/analytics',
} as const;
