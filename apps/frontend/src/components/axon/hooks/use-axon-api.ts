'use client';

import { useCallback } from 'react';
import useSWR, { SWRConfiguration } from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
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

const defaultSwrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
  dedupingInterval: 5000, // Dedupe identical requests within 5 seconds
};

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
    return (result?.data ?? result?.personas ?? (Array.isArray(result) ? result : [])) as Persona[];
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
 * Soul dashboard data combining soul with its accounts
 */
export interface SoulDashboardData {
  soul: Soul;
  accounts: Account[];
}

/**
 * Hook to fetch soul and its accounts in parallel for dashboard view
 */
export function useSoulDashboard(soulId: string | undefined, config?: SWRConfiguration) {
  const fetch = useFetch();

  const fetcher = useCallback(async (): Promise<SoulDashboardData | null> => {
    if (!soulId) return null;

    // Fetch soul and accounts in parallel
    const [soulResponse, accountsResponse] = await Promise.all([
      fetch(`/axon/souls/${soulId}`),
      fetch(`/axon/accounts?soulId=${soulId}`),
    ]);

    if (!soulResponse.ok) throw new Error('Failed to fetch soul');
    if (!accountsResponse.ok) throw new Error('Failed to fetch accounts');

    const soul = await soulResponse.json();
    const accountsResult = await accountsResponse.json();
    const accounts = accountsResult?.data ?? accountsResult ?? [];

    return { soul, accounts };
  }, [fetch, soulId]);

  const { data, isLoading, error, mutate } = useSWR<SoulDashboardData | null>(
    soulId ? `/axon/soul-dashboard/${soulId}` : null,
    fetcher,
    { ...defaultSwrConfig, ...config }
  );

  return {
    data,
    soul: data?.soul ?? null,
    accounts: data?.accounts ?? [],
    isLoading,
    error,
    mutate,
  };
}

/**
 * Preload functions for optimistic data fetching
 */
export function usePreloadFunctions() {
  const fetch = useFetch();

  const preloadSoul = useCallback(async (soulId: string) => {
    const response = await fetch(`/axon/souls/${soulId}`);
    if (response.ok) {
      return response.json();
    }
    return null;
  }, [fetch]);

  const preloadAccounts = useCallback(async (soulId?: string) => {
    const url = soulId ? `/axon/accounts?soulId=${soulId}` : '/axon/accounts';
    const response = await fetch(url);
    if (response.ok) {
      const result = await response.json();
      return result?.data ?? result ?? [];
    }
    return [];
  }, [fetch]);

  return { preloadSoul, preloadAccounts };
}

/**
 * Integration type for account linking (simplified from matrix Integration)
 */
export interface AccountLinkableIntegration {
  id: string;
  name: string;
  platform: string;
  picture?: string;
  disabled?: boolean;
}

/**
 * Hook to fetch integrations filtered by platform for account linking
 */
export function useCompatibleIntegrations(platform?: string, config?: SWRConfiguration) {
  const fetch = useFetch();

  const fetcher = useCallback(async () => {
    const response = await fetch('/integrations/list');
    if (!response.ok) throw new Error('Failed to fetch integrations');
    const result = await response.json();
    const integrations = (result?.integrations ?? result ?? []) as AccountLinkableIntegration[];

    // Filter by platform if provided
    if (platform) {
      return integrations.filter(
        (i) => i.platform?.toLowerCase() === platform.toLowerCase() && !i.disabled
      );
    }
    return integrations.filter((i) => !i.disabled);
  }, [fetch, platform]);

  return useSWR<AccountLinkableIntegration[]>(
    platform ? `/integrations/list?platform=${platform}` : '/integrations/list',
    fetcher,
    { ...defaultSwrConfig, ...config }
  );
}

/**
 * Hook for account-integration linking mutations
 */
export function useAccountIntegrationMutations() {
  const fetch = useFetch();

  const linkAccountToIntegration = useCallback(
    async (accountId: string, integrationId: string): Promise<Account> => {
      const response = await fetch(`/axon/accounts/${accountId}/integration`, {
        method: 'PATCH',
        body: JSON.stringify({ integrationId }),
      });
      if (!response.ok) throw new Error('Failed to link account to integration');
      return response.json();
    },
    [fetch]
  );

  const unlinkAccountFromIntegration = useCallback(
    async (accountId: string): Promise<Account> => {
      const response = await fetch(`/axon/accounts/${accountId}/integration`, {
        method: 'PATCH',
        body: JSON.stringify({ integrationId: null }),
      });
      if (!response.ok) throw new Error('Failed to unlink account from integration');
      return response.json();
    },
    [fetch]
  );

  return { linkAccountToIntegration, unlinkAccountFromIntegration };
}
