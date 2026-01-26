'use client';

import { useCallback } from 'react';
import useSWR, { SWRConfiguration } from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import type {
  MatrixData,
  MatrixFilters,
  BulkOperation,
  BulkMappingResponse,
  CreateMappingDto,
  UpdateMappingDto,
  ToggleMappingResponse,
  IntegrationForSoul,
  SoulForIntegration,
  SoulIntegrationMapping,
} from './types';

const defaultSwrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
};

/**
 * Hook to fetch the full matrix data
 */
export function useMatrix(filters?: MatrixFilters, config?: SWRConfiguration) {
  const fetch = useFetch();

  const queryParams = new URLSearchParams();
  if (filters?.platform) queryParams.set('platform', filters.platform);
  if (filters?.search) queryParams.set('search', filters.search);
  if (filters?.soulId) queryParams.set('soulId', filters.soulId);

  const queryString = queryParams.toString();
  const url = `/matrix${queryString ? `?${queryString}` : ''}`;

  const fetcher = useCallback(async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch matrix data');
    return response.json() as Promise<MatrixData>;
  }, [fetch, url]);

  return useSWR<MatrixData>(url, fetcher, { ...defaultSwrConfig, ...config });
}

/**
 * Hook for matrix mutation operations
 */
export function useMatrixMutations() {
  const fetch = useFetch();

  /**
   * Toggle a mapping (create if not exists, delete if exists)
   */
  const toggleMapping = useCallback(
    async (soulId: string, integrationId: string): Promise<ToggleMappingResponse> => {
      const response = await fetch('/matrix/mappings/toggle', {
        method: 'POST',
        body: JSON.stringify({ soulId, integrationId }),
      });
      if (!response.ok) throw new Error('Failed to toggle mapping');
      return response.json();
    },
    [fetch]
  );

  /**
   * Create a new mapping
   */
  const createMapping = useCallback(
    async (data: CreateMappingDto): Promise<SoulIntegrationMapping> => {
      const response = await fetch('/matrix/mappings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create mapping');
      return response.json();
    },
    [fetch]
  );

  /**
   * Update an existing mapping
   */
  const updateMapping = useCallback(
    async (mappingId: string, data: UpdateMappingDto): Promise<SoulIntegrationMapping> => {
      const response = await fetch(`/matrix/mappings/${mappingId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update mapping');
      return response.json();
    },
    [fetch]
  );

  /**
   * Delete a mapping
   */
  const deleteMapping = useCallback(
    async (mappingId: string): Promise<void> => {
      const response = await fetch(`/matrix/mappings/${mappingId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete mapping');
    },
    [fetch]
  );

  /**
   * Set a mapping as primary for a soul
   */
  const setPrimary = useCallback(
    async (mappingId: string): Promise<SoulIntegrationMapping> => {
      return updateMapping(mappingId, { isPrimary: true });
    },
    [updateMapping]
  );

  /**
   * Perform bulk operations
   */
  const bulkOperations = useCallback(
    async (operations: BulkOperation[]): Promise<BulkMappingResponse> => {
      const response = await fetch('/matrix/mappings/bulk', {
        method: 'POST',
        body: JSON.stringify({ operations }),
      });
      if (!response.ok) throw new Error('Bulk operation failed');
      return response.json();
    },
    [fetch]
  );

  return {
    toggleMapping,
    createMapping,
    updateMapping,
    deleteMapping,
    setPrimary,
    bulkOperations,
  };
}

/**
 * Hook to fetch integrations for a specific soul
 */
export function useSoulIntegrations(soulId: string | null, config?: SWRConfiguration) {
  const fetch = useFetch();

  const fetcher = useCallback(async () => {
    if (!soulId) return null;
    const response = await fetch(`/matrix/souls/${soulId}/integrations`);
    if (!response.ok) throw new Error('Failed to fetch soul integrations');
    return response.json() as Promise<IntegrationForSoul[]>;
  }, [fetch, soulId]);

  return useSWR<IntegrationForSoul[] | null>(
    soulId ? `/matrix/souls/${soulId}/integrations` : null,
    fetcher,
    { ...defaultSwrConfig, ...config }
  );
}

/**
 * Hook to fetch souls for a specific integration
 */
export function useIntegrationSouls(integrationId: string | null, config?: SWRConfiguration) {
  const fetch = useFetch();

  const fetcher = useCallback(async () => {
    if (!integrationId) return null;
    const response = await fetch(`/matrix/integrations/${integrationId}/souls`);
    if (!response.ok) throw new Error('Failed to fetch integration souls');
    return response.json() as Promise<SoulForIntegration[]>;
  }, [fetch, integrationId]);

  return useSWR<SoulForIntegration[] | null>(
    integrationId ? `/matrix/integrations/${integrationId}/souls` : null,
    fetcher,
    { ...defaultSwrConfig, ...config }
  );
}
