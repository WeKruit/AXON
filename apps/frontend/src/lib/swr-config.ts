import { SWRConfiguration } from 'swr';

/**
 * Global SWR configuration for optimal caching and performance
 * Apply this via SWRConfig provider at the app root
 */
export const globalSwrConfig: SWRConfiguration = {
  // Disable automatic revalidation on window focus (too aggressive)
  revalidateOnFocus: false,

  // Disable automatic revalidation on reconnect
  revalidateOnReconnect: false,

  // Don't revalidate stale data automatically
  revalidateIfStale: false,

  // Deduplicate identical requests within 5 seconds
  dedupingInterval: 5000,

  // Limit retry attempts on error
  errorRetryCount: 2,

  // Throttle focus events to once per minute
  focusThrottleInterval: 60000,

  // Don't retry on errors automatically
  shouldRetryOnError: false,

  // Keep previous data while fetching new data (prevents flash)
  keepPreviousData: true,
};

/**
 * Extended config for data that changes infrequently (e.g., user settings)
 */
export const stableDataSwrConfig: SWRConfiguration = {
  ...globalSwrConfig,
  dedupingInterval: 60000, // 1 minute
};

/**
 * Config for real-time data that should refresh more often
 */
export const realtimeSwrConfig: SWRConfiguration = {
  ...globalSwrConfig,
  dedupingInterval: 2000, // 2 seconds
  revalidateIfStale: true,
};
