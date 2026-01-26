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
 * Hook to fetch soul-integration mappings
 */
export function useSoulIntegrationMappings(config?: SWRConfiguration) {
  const fetch = useFetch();

  const fetcher = useCallback(async () => {
    const response = await fetch('/axon/matrix/mappings');
    if (!response.ok) throw new Error('Failed to fetch mappings');
    const result = await response.json();
    return (result?.data ?? result ?? []) as SoulIntegrationMapping[];
  }, [fetch]);

  return useSWR<SoulIntegrationMapping[]>('/axon/matrix/mappings', fetcher, { ...defaultSwrConfig, ...config });
}

/**
 * Main hook for the matrix view - combines souls, integrations, and mappings
 */
export function useMatrix(config?: SWRConfiguration) {
  const { data: souls, isLoading: soulsLoading, error: soulsError, mutate: mutateSouls } = useSouls(config);
  const { data: integrations, isLoading: integrationsLoading, error: integrationsError, mutate: mutateIntegrations } = useIntegrations(config);
  const { data: mappings, isLoading: mappingsLoading, error: mappingsError, mutate: mutateMappings } = useSoulIntegrationMappings(config);

  const isLoading = soulsLoading || integrationsLoading || mappingsLoading;
  const error = soulsError || integrationsError || mappingsError;

  const matrixData: MatrixData | null = useMemo(() => {
    if (!souls || !integrations || !mappings) return null;
    return {
      souls,
      integrations,
      mappings,
    };
  }, [souls, integrations, mappings]);

  const mutate = useCallback(async () => {
    await Promise.all([mutateSouls(), mutateIntegrations(), mutateMappings()]);
  }, [mutateSouls, mutateIntegrations, mutateMappings]);

  return {
    data: matrixData,
    souls,
    integrations,
    mappings,
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

  const deleteMapping = useCallback(async (soulId: string, integrationId: string): Promise<void> => {
    const response = await fetch(`/axon/matrix/mappings/${soulId}/${integrationId}`, {
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

  const setPrimary = useCallback(async (input: SetPrimaryInput): Promise<SoulIntegrationMapping> => {
    const response = await fetch('/axon/matrix/mappings/primary', {
      method: 'POST',
      body: JSON.stringify(input),
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
    const response = await fetch(`/axon/souls/${soulId}/integrations`);
    if (!response.ok) throw new Error('Failed to fetch soul integrations');
    const result = await response.json();
    return (result?.data ?? result ?? []) as Integration[];
  }, [fetch, soulId]);

  return useSWR<Integration[]>(
    soulId ? `/axon/souls/${soulId}/integrations` : null,
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
    const response = await fetch(`/axon/integrations/${integrationId}/souls`);
    if (!response.ok) throw new Error('Failed to fetch integration souls');
    const result = await response.json();
    return result?.data ?? result ?? [];
  }, [fetch, integrationId]);

  return useSWR(
    integrationId ? `/axon/integrations/${integrationId}/souls` : null,
    fetcher,
    { ...defaultSwrConfig, ...config }
  );
}
