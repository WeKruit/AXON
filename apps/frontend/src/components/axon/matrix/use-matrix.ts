'use client';

import { useCallback, useMemo } from 'react';
import useSWR, { SWRConfiguration, mutate as globalMutate } from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useSouls } from '../hooks/use-axon-api';
import type {
  Integration,
  SoulIntegrationMapping,
  MatrixData,
  MatrixStats,
  CreateMappingInput,
  ToggleMappingInput,
  SetPrimaryInput,
  BulkOperationInput,
  buildCellMap,
  getCellKey,
} from './types';

const defaultSwrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
  dedupingInterval: 5000, // Dedupe identical requests within 5 seconds
};

/**
 * Hook to fetch all integrations (channels) for the organization
 */
export function useIntegrations(config?: SWRConfiguration) {
  const fetch = useFetch();

  const fetcher = useCallback(async () => {
    const response = await fetch('/integrations/list');
    if (!response.ok) throw new Error('Failed to fetch integrations');
    const result = await response.json();
    return (result?.integrations ?? result ?? []) as Integration[];
  }, [fetch]);

  return useSWR<Integration[]>('/integrations/list', fetcher, { ...defaultSwrConfig, ...config });
}

/**
 * Hook to fetch soul-integration mappings from the full matrix endpoint
 */
export function useSoulIntegrationMappings(config?: SWRConfiguration) {
  const fetch = useFetch();

  const fetcher = useCallback(async () => {
    const response = await fetch('/axon/matrix');
    if (!response.ok) throw new Error('Failed to fetch mappings');
    const result = await response.json();
    // The matrix endpoint returns { souls, integrations, mappings, stats }
    return (result?.mappings ?? []) as SoulIntegrationMapping[];
  }, [fetch]);

  return useSWR<SoulIntegrationMapping[]>('/axon/matrix/mappings-data', fetcher, { ...defaultSwrConfig, ...config });
}

/**
 * Full matrix response from backend
 */
interface MatrixApiResponse {
  souls: Array<{
    id: string;
    name: string;
    email?: string;
    integrationIds: string[];
  }>;
  integrations: Array<{
    id: string;
    name: string;
    platform: string;
    picture?: string;
    disabled: boolean;
  }>;
  mappings: SoulIntegrationMapping[];
  stats: {
    totalSouls: number;
    totalIntegrations: number;
    totalMappings: number;
  };
}

/**
 * Main hook for the matrix view - fetches all data in ONE API call for better performance
 */
export function useMatrix(config?: SWRConfiguration) {
  const fetch = useFetch();

  const fetcher = useCallback(async (): Promise<MatrixData | null> => {
    const response = await fetch('/axon/matrix');
    if (!response.ok) throw new Error('Failed to fetch matrix');
    const result: MatrixApiResponse = await response.json();

    // Transform the backend response to our frontend types
    const souls = result.souls.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      organizationId: '', // Will be set by context
    })) as any[];

    const integrations = result.integrations.map((i) => ({
      id: i.id,
      identifier: i.name,
      name: i.name,
      picture: i.picture,
      type: i.platform,
      providerIdentifier: i.platform,
      disabled: i.disabled,
      organizationId: '',
      createdAt: '',
      updatedAt: '',
    })) as Integration[];

    return {
      souls,
      integrations,
      mappings: result.mappings,
    };
  }, [fetch]);

  const { data, isLoading, error, mutate } = useSWR<MatrixData | null>(
    '/axon/matrix-full',
    fetcher,
    { ...defaultSwrConfig, ...config }
  );

  return {
    data,
    souls: data?.souls ?? [],
    integrations: data?.integrations ?? [],
    mappings: data?.mappings ?? [],
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook for matrix statistics
 */
export function useMatrixStats(matrixData: MatrixData | null): MatrixStats | null {
  return useMemo(() => {
    if (!matrixData) return null;

    const { souls, integrations, mappings } = matrixData;
    const totalCells = souls.length * integrations.length;
    const totalMappings = mappings.length;
    const primaryMappings = mappings.filter((m) => m.isPrimary).length;

    const mappingsBySoul: Record<string, number> = {};
    const mappingsByIntegration: Record<string, number> = {};

    for (const mapping of mappings) {
      mappingsBySoul[mapping.soulId] = (mappingsBySoul[mapping.soulId] || 0) + 1;
      mappingsByIntegration[mapping.integrationId] = (mappingsByIntegration[mapping.integrationId] || 0) + 1;
    }

    return {
      totalSouls: souls.length,
      totalIntegrations: integrations.length,
      totalMappings,
      connectedPercentage: totalCells > 0 ? Math.round((totalMappings / totalCells) * 100) : 0,
      primaryMappings,
      mappingsBySoul,
      mappingsByIntegration,
    };
  }, [matrixData]);
}

/**
 * Hook for matrix mutations (create, toggle, set primary, bulk operations)
 */
export function useMatrixMutations() {
  const fetch = useFetch();

  const createMapping = useCallback(async (data: CreateMappingInput): Promise<SoulIntegrationMapping> => {
    const response = await fetch('/axon/matrix/mappings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create mapping');
    return response.json();
  }, [fetch]);

  const deleteMapping = useCallback(async (mappingId: string): Promise<void> => {
    const response = await fetch(`/axon/matrix/mappings/${mappingId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete mapping');
  }, [fetch]);

  const toggleMapping = useCallback(async (input: ToggleMappingInput): Promise<SoulIntegrationMapping | null> => {
    const response = await fetch('/axon/matrix/mappings/toggle', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error('Failed to toggle mapping');
    const result = await response.json();
    // Returns the mapping if created, or null if deleted
    return result.mapping ?? null;
  }, [fetch]);

  const setPrimary = useCallback(async (mappingId: string): Promise<SoulIntegrationMapping> => {
    const response = await fetch(`/axon/matrix/mappings/${mappingId}/primary`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to set primary');
    return response.json();
  }, [fetch]);

  const bulkOperation = useCallback(async (input: BulkOperationInput): Promise<{ affected: number }> => {
    const response = await fetch('/axon/matrix/mappings/bulk', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error('Failed to perform bulk operation');
    return response.json();
  }, [fetch]);

  return { createMapping, deleteMapping, toggleMapping, setPrimary, bulkOperation };
}

/**
 * Hook to get integrations connected to a specific soul
 */
export function useSoulIntegrations(soulId: string | undefined, config?: SWRConfiguration) {
  const fetch = useFetch();

  const fetcher = useCallback(async () => {
    if (!soulId) return [];
    const response = await fetch(`/axon/matrix/souls/${soulId}/integrations`);
    if (!response.ok) throw new Error('Failed to fetch soul integrations');
    const result = await response.json();
    return (result?.mappings ?? result?.data ?? result ?? []) as Integration[];
  }, [fetch, soulId]);

  return useSWR<Integration[]>(
    soulId ? `/axon/matrix/souls/${soulId}/integrations` : null,
    fetcher,
    { ...defaultSwrConfig, ...config }
  );
}

/**
 * Hook to get souls connected to a specific integration
 */
export function useIntegrationSouls(integrationId: string | undefined, config?: SWRConfiguration) {
  const fetch = useFetch();

  const fetcher = useCallback(async () => {
    if (!integrationId) return [];
    const response = await fetch(`/axon/matrix/integrations/${integrationId}/souls`);
    if (!response.ok) throw new Error('Failed to fetch integration souls');
    const result = await response.json();
    return result?.mappings ?? result?.data ?? result ?? [];
  }, [fetch, integrationId]);

  return useSWR(
    integrationId ? `/axon/matrix/integrations/${integrationId}/souls` : null,
    fetcher,
    { ...defaultSwrConfig, ...config }
  );
}
