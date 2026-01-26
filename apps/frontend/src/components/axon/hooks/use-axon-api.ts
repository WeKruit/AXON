'use client';

import { useCallback, useMemo } from 'react';
import useSWR, { SWRConfiguration, preload } from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { defaultSwrConfig, AXON_CACHE_KEYS } from '@/lib/swr-config';
import type {
  Soul,
  SoulWithStats,
  Account,
  AccountWithStats,
  Persona,
  Proxy,
  CreateSoulDto,
  UpdateSoulDto,
  CreateAccountDto,
  UpdateAccountDto,
  CreatePersonaDto,
  UpdatePersonaDto,
  GeneratePersonaDto,
  CreateProxyDto,
  UpdateProxyDto,
  AxonAnalytics,
} from '../types';

export function useSouls(config?: SWRConfiguration) {
  const fetch = useFetch();

  const fetcher = useCallback(async () => {
    const response = await fetch('/axon/souls');
    if (!response.ok) throw new Error('Failed to fetch souls');
    const result = await response.json();
    // Backend returns { data: Soul[], hasMore: boolean }
    return (result?.data ?? result ?? []) as Soul[];
  }, [fetch]);

  return useSWR<Soul[]>('/axon/souls', fetcher, { ...defaultSwrConfig, ...config });
}

export function useSoul(id: string | undefined, config?: SWRConfiguration) {
  const fetch = useFetch();

  const fetcher = useCallback(async () => {
    if (!id) return null;
    const response = await fetch(`/axon/souls/${id}`);
    if (!response.ok) throw new Error('Failed to fetch soul');
    return response.json() as Promise<SoulWithStats>;
  }, [fetch, id]);

  return useSWR<SoulWithStats | null>(
    id ? `/axon/souls/${id}` : null,
    fetcher,
    { ...defaultSwrConfig, ...config }
  );
}

export function useSoulMutations() {
  const fetch = useFetch();

  const createSoul = useCallback(async (data: CreateSoulDto): Promise<Soul> => {
    const response = await fetch('/axon/souls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create soul');
    return response.json();
  }, [fetch]);

  const updateSoul = useCallback(async (id: string, data: UpdateSoulDto): Promise<Soul> => {
    const response = await fetch(`/axon/souls/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update soul');
    return response.json();
  }, [fetch]);

  const deleteSoul = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`/axon/souls/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete soul');
  }, [fetch]);

  return { createSoul, updateSoul, deleteSoul };
}

export function useAccounts(soulId?: string, config?: SWRConfiguration) {
  const fetch = useFetch();

  const fetcher = useCallback(async () => {
    const url = soulId ? `/axon/accounts?soulId=${soulId}` : '/axon/accounts';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch accounts');
    const result = await response.json();
    // Backend returns { data: Account[], hasMore: boolean }
    return (result?.data ?? result ?? []) as Account[];
  }, [fetch, soulId]);

  const key = soulId ? `/axon/accounts?soulId=${soulId}` : '/axon/accounts';
  return useSWR<Account[]>(key, fetcher, { ...defaultSwrConfig, ...config });
}

export function useAccount(id: string | undefined, config?: SWRConfiguration) {
  const fetch = useFetch();

  const fetcher = useCallback(async () => {
    if (!id) return null;
    const response = await fetch(`/axon/accounts/${id}`);
    if (!response.ok) throw new Error('Failed to fetch account');
    return response.json() as Promise<AccountWithStats>;
  }, [fetch, id]);

  return useSWR<AccountWithStats | null>(
    id ? `/axon/accounts/${id}` : null,
    fetcher,
    { ...defaultSwrConfig, ...config }
  );
}

export function useAccountMutations() {
  const fetch = useFetch();

  const createAccount = useCallback(async (data: CreateAccountDto): Promise<Account> => {
    const response = await fetch('/axon/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create account');
    return response.json();
  }, [fetch]);

  const updateAccount = useCallback(async (id: string, data: UpdateAccountDto): Promise<Account> => {
    const response = await fetch(`/axon/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update account');
    return response.json();
  }, [fetch]);

  const deleteAccount = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`/axon/accounts/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete account');
  }, [fetch]);

  return { createAccount, updateAccount, deleteAccount };
}

export function usePersonas(config?: SWRConfiguration) {
  const fetch = useFetch();

  const fetcher = useCallback(async () => {
    const response = await fetch('/axon/personas');
    if (!response.ok) throw new Error('Failed to fetch personas');
    const result = await response.json();
    // Backend returns { data: Persona[], hasMore: boolean }
    return (result?.data ?? result ?? []) as Persona[];
  }, [fetch]);

  return useSWR<Persona[]>('/axon/personas', fetcher, { ...defaultSwrConfig, ...config });
}

export function usePersona(id: string | undefined, config?: SWRConfiguration) {
  const fetch = useFetch();

  const fetcher = useCallback(async () => {
    if (!id) return null;
    const response = await fetch(`/axon/personas/${id}`);
    if (!response.ok) throw new Error('Failed to fetch persona');
    return response.json() as Promise<Persona>;
  }, [fetch, id]);

  return useSWR<Persona | null>(
    id ? `/axon/personas/${id}` : null,
    fetcher,
    { ...defaultSwrConfig, ...config }
  );
}

export function usePersonaMutations() {
  const fetch = useFetch();

  const createPersona = useCallback(async (data: CreatePersonaDto): Promise<Persona> => {
    const response = await fetch('/axon/personas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create persona');
    return response.json();
  }, [fetch]);

  const updatePersona = useCallback(async (id: string, data: UpdatePersonaDto): Promise<Persona> => {
    const response = await fetch(`/axon/personas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update persona');
    return response.json();
  }, [fetch]);

  const deletePersona = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`/axon/personas/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete persona');
  }, [fetch]);

  const generatePersona = useCallback(async (data: GeneratePersonaDto): Promise<Persona> => {
    const response = await fetch('/axon/personas/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to generate persona');
    return response.json();
  }, [fetch]);

  return { createPersona, updatePersona, deletePersona, generatePersona };
}

export function useProxies(config?: SWRConfiguration) {
  const fetch = useFetch();

  const fetcher = useCallback(async () => {
    const response = await fetch('/axon/proxies');
    if (!response.ok) throw new Error('Failed to fetch proxies');
    const result = await response.json();
    // Backend returns { data: Proxy[], hasMore: boolean }
    return (result?.data ?? result ?? []) as Proxy[];
  }, [fetch]);

  return useSWR<Proxy[]>('/axon/proxies', fetcher, { ...defaultSwrConfig, ...config });
}

export function useProxy(id: string | undefined, config?: SWRConfiguration) {
  const fetch = useFetch();

  const fetcher = useCallback(async () => {
    if (!id) return null;
    const response = await fetch(`/axon/proxies/${id}`);
    if (!response.ok) throw new Error('Failed to fetch proxy');
    return response.json() as Promise<Proxy>;
  }, [fetch, id]);

  return useSWR<Proxy | null>(
    id ? `/axon/proxies/${id}` : null,
    fetcher,
    { ...defaultSwrConfig, ...config }
  );
}

export function useProxyMutations() {
  const fetch = useFetch();

  const createProxy = useCallback(async (data: CreateProxyDto): Promise<Proxy> => {
    const response = await fetch('/axon/proxies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create proxy');
    return response.json();
  }, [fetch]);

  const updateProxy = useCallback(async (id: string, data: UpdateProxyDto): Promise<Proxy> => {
    const response = await fetch(`/axon/proxies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update proxy');
    return response.json();
  }, [fetch]);

  const deleteProxy = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`/axon/proxies/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete proxy');
  }, [fetch]);

  const testProxy = useCallback(async (id: string): Promise<{ success: boolean; latency?: number; error?: string }> => {
    const response = await fetch(`/axon/proxies/${id}/test`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to test proxy');
    return response.json();
  }, [fetch]);

  const rotateProxy = useCallback(async (id: string): Promise<Proxy> => {
    const response = await fetch(`/axon/proxies/${id}/rotate`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to rotate proxy');
    return response.json();
  }, [fetch]);

  return { createProxy, updateProxy, deleteProxy, testProxy, rotateProxy };
}

export function useAxonAnalytics(config?: SWRConfiguration) {
  const fetch = useFetch();

  const fetcher = useCallback(async () => {
    const response = await fetch('/axon/analytics');
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json() as Promise<AxonAnalytics>;
  }, [fetch]);

  return useSWR<AxonAnalytics>('/axon/analytics', fetcher, { ...defaultSwrConfig, ...config });
}

/**
 * Combined hook for Soul Dashboard - fetches soul and accounts in parallel
 * Eliminates waterfall requests per async-parallel best practice
 */
export interface SoulDashboardData {
  soul: SoulWithStats | null;
  accounts: Account[];
}

export function useSoulDashboard(soulId: string | undefined, config?: SWRConfiguration) {
  const fetch = useFetch();

  const fetcher = useCallback(async (): Promise<SoulDashboardData> => {
    if (!soulId) return { soul: null, accounts: [] };

    // Fetch soul and accounts in parallel - eliminates waterfall
    const [soulResponse, accountsResponse] = await Promise.all([
      fetch(`/axon/souls/${soulId}`),
      fetch(`/axon/accounts?soulId=${soulId}`),
    ]);

    if (!soulResponse.ok) throw new Error('Failed to fetch soul');
    if (!accountsResponse.ok) throw new Error('Failed to fetch accounts');

    const [soul, accountsResult] = await Promise.all([
      soulResponse.json() as Promise<SoulWithStats>,
      accountsResponse.json(),
    ]);

    return {
      soul,
      accounts: (accountsResult?.data ?? accountsResult ?? []) as Account[],
    };
  }, [fetch, soulId]);

  const result = useSWR<SoulDashboardData>(
    soulId ? AXON_CACHE_KEYS.soul(soulId) + ':dashboard' : null,
    fetcher,
    { ...defaultSwrConfig, ...config }
  );

  // Provide individual mutate functions for granular updates
  const mutateSoul = useCallback(async () => {
    await result.mutate();
  }, [result]);

  const mutateAccounts = useCallback(async () => {
    await result.mutate();
  }, [result]);

  return {
    data: result.data,
    soul: result.data?.soul ?? null,
    accounts: result.data?.accounts ?? [],
    isLoading: result.isLoading,
    error: result.error,
    mutate: result.mutate,
    mutateSoul,
    mutateAccounts,
  };
}

/**
 * Preload functions for tab prefetching
 * Call these on hover/focus to warm the cache
 */
export function usePreloadFunctions() {
  const fetch = useFetch();

  const preloadSouls = useCallback(() => {
    const fetcher = async () => {
      const response = await fetch(AXON_CACHE_KEYS.souls);
      if (!response.ok) throw new Error('Failed to fetch souls');
      const result = await response.json();
      return (result?.data ?? result ?? []) as Soul[];
    };
    preload(AXON_CACHE_KEYS.souls, fetcher);
  }, [fetch]);

  const preloadAccounts = useCallback(() => {
    const fetcher = async () => {
      const response = await fetch(AXON_CACHE_KEYS.accounts());
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const result = await response.json();
      return (result?.data ?? result ?? []) as Account[];
    };
    preload(AXON_CACHE_KEYS.accounts(), fetcher);
  }, [fetch]);

  const preloadPersonas = useCallback(() => {
    const fetcher = async () => {
      const response = await fetch(AXON_CACHE_KEYS.personas);
      if (!response.ok) throw new Error('Failed to fetch personas');
      const result = await response.json();
      return (result?.data ?? result ?? []) as Persona[];
    };
    preload(AXON_CACHE_KEYS.personas, fetcher);
  }, [fetch]);

  const preloadProxies = useCallback(() => {
    const fetcher = async () => {
      const response = await fetch(AXON_CACHE_KEYS.proxies);
      if (!response.ok) throw new Error('Failed to fetch proxies');
      const result = await response.json();
      return (result?.data ?? result ?? []) as Proxy[];
    };
    preload(AXON_CACHE_KEYS.proxies, fetcher);
  }, [fetch]);

  return {
    preloadSouls,
    preloadAccounts,
    preloadPersonas,
    preloadProxies,
  };
}
