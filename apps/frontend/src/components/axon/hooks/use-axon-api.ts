'use client';

import { useCallback, useRef } from 'react';
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
};

export function useSouls(config?: SWRConfiguration) {
  const fetch = useFetch();
  const fetchRef = useRef(fetch);
  fetchRef.current = fetch;

  const fetcher = useCallback(async () => {
    const response = await fetchRef.current('/axon/souls');
    if (!response.ok) throw new Error('Failed to fetch souls');
    return response.json() as Promise<Soul[]>;
  }, []);

  return useSWR<Soul[]>('/axon/souls', fetcher, { ...defaultSwrConfig, ...config });
}

export function useSoul(id: string | undefined, config?: SWRConfiguration) {
  const fetch = useFetch();
  const fetchRef = useRef(fetch);
  fetchRef.current = fetch;

  const fetcher = useCallback(async () => {
    if (!id) return null;
    const response = await fetchRef.current(`/axon/souls/${id}`);
    if (!response.ok) throw new Error('Failed to fetch soul');
    return response.json() as Promise<SoulWithStats>;
  }, [id]);

  return useSWR<SoulWithStats | null>(
    id ? `/axon/souls/${id}` : null,
    fetcher,
    { ...defaultSwrConfig, ...config }
  );
}

export function useSoulMutations() {
  const fetch = useFetch();
  const fetchRef = useRef(fetch);
  fetchRef.current = fetch;

  const createSoul = useCallback(async (data: CreateSoulDto): Promise<Soul> => {
    const response = await fetchRef.current('/axon/souls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create soul');
    return response.json();
  }, []);

  const updateSoul = useCallback(async (id: string, data: UpdateSoulDto): Promise<Soul> => {
    const response = await fetchRef.current(`/axon/souls/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update soul');
    return response.json();
  }, []);

  const deleteSoul = useCallback(async (id: string): Promise<void> => {
    const response = await fetchRef.current(`/axon/souls/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete soul');
  }, []);

  return { createSoul, updateSoul, deleteSoul };
}

export function useAccounts(soulId?: string, config?: SWRConfiguration) {
  const fetch = useFetch();
  const fetchRef = useRef(fetch);
  fetchRef.current = fetch;

  const fetcher = useCallback(async () => {
    const url = soulId ? `/axon/accounts?soulId=${soulId}` : '/axon/accounts';
    const response = await fetchRef.current(url);
    if (!response.ok) throw new Error('Failed to fetch accounts');
    return response.json() as Promise<Account[]>;
  }, [soulId]);

  const key = soulId ? `/axon/accounts?soulId=${soulId}` : '/axon/accounts';
  return useSWR<Account[]>(key, fetcher, { ...defaultSwrConfig, ...config });
}

export function useAccount(id: string | undefined, config?: SWRConfiguration) {
  const fetch = useFetch();
  const fetchRef = useRef(fetch);
  fetchRef.current = fetch;

  const fetcher = useCallback(async () => {
    if (!id) return null;
    const response = await fetchRef.current(`/axon/accounts/${id}`);
    if (!response.ok) throw new Error('Failed to fetch account');
    return response.json() as Promise<AccountWithStats>;
  }, [id]);

  return useSWR<AccountWithStats | null>(
    id ? `/axon/accounts/${id}` : null,
    fetcher,
    { ...defaultSwrConfig, ...config }
  );
}

export function useAccountMutations() {
  const fetch = useFetch();
  const fetchRef = useRef(fetch);
  fetchRef.current = fetch;

  const createAccount = useCallback(async (data: CreateAccountDto): Promise<Account> => {
    const response = await fetchRef.current('/axon/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create account');
    return response.json();
  }, []);

  const updateAccount = useCallback(async (id: string, data: UpdateAccountDto): Promise<Account> => {
    const response = await fetchRef.current(`/axon/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update account');
    return response.json();
  }, []);

  const deleteAccount = useCallback(async (id: string): Promise<void> => {
    const response = await fetchRef.current(`/axon/accounts/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete account');
  }, []);

  return { createAccount, updateAccount, deleteAccount };
}

export function usePersonas(config?: SWRConfiguration) {
  const fetch = useFetch();
  const fetchRef = useRef(fetch);
  fetchRef.current = fetch;

  const fetcher = useCallback(async () => {
    const response = await fetchRef.current('/axon/personas');
    if (!response.ok) throw new Error('Failed to fetch personas');
    return response.json() as Promise<Persona[]>;
  }, []);

  return useSWR<Persona[]>('/axon/personas', fetcher, { ...defaultSwrConfig, ...config });
}

export function usePersona(id: string | undefined, config?: SWRConfiguration) {
  const fetch = useFetch();
  const fetchRef = useRef(fetch);
  fetchRef.current = fetch;

  const fetcher = useCallback(async () => {
    if (!id) return null;
    const response = await fetchRef.current(`/axon/personas/${id}`);
    if (!response.ok) throw new Error('Failed to fetch persona');
    return response.json() as Promise<Persona>;
  }, [id]);

  return useSWR<Persona | null>(
    id ? `/axon/personas/${id}` : null,
    fetcher,
    { ...defaultSwrConfig, ...config }
  );
}

export function usePersonaMutations() {
  const fetch = useFetch();
  const fetchRef = useRef(fetch);
  fetchRef.current = fetch;

  const createPersona = useCallback(async (data: CreatePersonaDto): Promise<Persona> => {
    const response = await fetchRef.current('/axon/personas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create persona');
    return response.json();
  }, []);

  const updatePersona = useCallback(async (id: string, data: UpdatePersonaDto): Promise<Persona> => {
    const response = await fetchRef.current(`/axon/personas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update persona');
    return response.json();
  }, []);

  const deletePersona = useCallback(async (id: string): Promise<void> => {
    const response = await fetchRef.current(`/axon/personas/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete persona');
  }, []);

  const generatePersona = useCallback(async (data: GeneratePersonaDto): Promise<Persona> => {
    const response = await fetchRef.current('/axon/personas/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to generate persona');
    return response.json();
  }, []);

  return { createPersona, updatePersona, deletePersona, generatePersona };
}

export function useProxies(config?: SWRConfiguration) {
  const fetch = useFetch();
  const fetchRef = useRef(fetch);
  fetchRef.current = fetch;

  const fetcher = useCallback(async () => {
    const response = await fetchRef.current('/axon/proxies');
    if (!response.ok) throw new Error('Failed to fetch proxies');
    return response.json() as Promise<Proxy[]>;
  }, []);

  return useSWR<Proxy[]>('/axon/proxies', fetcher, { ...defaultSwrConfig, ...config });
}

export function useProxy(id: string | undefined, config?: SWRConfiguration) {
  const fetch = useFetch();
  const fetchRef = useRef(fetch);
  fetchRef.current = fetch;

  const fetcher = useCallback(async () => {
    if (!id) return null;
    const response = await fetchRef.current(`/axon/proxies/${id}`);
    if (!response.ok) throw new Error('Failed to fetch proxy');
    return response.json() as Promise<Proxy>;
  }, [id]);

  return useSWR<Proxy | null>(
    id ? `/axon/proxies/${id}` : null,
    fetcher,
    { ...defaultSwrConfig, ...config }
  );
}

export function useProxyMutations() {
  const fetch = useFetch();
  const fetchRef = useRef(fetch);
  fetchRef.current = fetch;

  const createProxy = useCallback(async (data: CreateProxyDto): Promise<Proxy> => {
    const response = await fetchRef.current('/axon/proxies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create proxy');
    return response.json();
  }, []);

  const updateProxy = useCallback(async (id: string, data: UpdateProxyDto): Promise<Proxy> => {
    const response = await fetchRef.current(`/axon/proxies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update proxy');
    return response.json();
  }, []);

  const deleteProxy = useCallback(async (id: string): Promise<void> => {
    const response = await fetchRef.current(`/axon/proxies/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete proxy');
  }, []);

  const testProxy = useCallback(async (id: string): Promise<{ success: boolean; latency?: number; error?: string }> => {
    const response = await fetchRef.current(`/axon/proxies/${id}/test`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to test proxy');
    return response.json();
  }, []);

  const rotateProxy = useCallback(async (id: string): Promise<Proxy> => {
    const response = await fetchRef.current(`/axon/proxies/${id}/rotate`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to rotate proxy');
    return response.json();
  }, []);

  return { createProxy, updateProxy, deleteProxy, testProxy, rotateProxy };
}

export function useAxonAnalytics(config?: SWRConfiguration) {
  const fetch = useFetch();
  const fetchRef = useRef(fetch);
  fetchRef.current = fetch;

  const fetcher = useCallback(async () => {
    const response = await fetchRef.current('/axon/analytics');
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json() as Promise<AxonAnalytics>;
  }, []);

  return useSWR<AxonAnalytics>('/axon/analytics', fetcher, { ...defaultSwrConfig, ...config });
}
