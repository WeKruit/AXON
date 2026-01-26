import type { Soul, Platform } from '../types';

// Re-export Platform for convenience
export type { Platform };

/**
 * Integration represents a connected social media channel
 * This mirrors the backend integration model used in the launches system
 */
export interface Integration {
  id: string;
  identifier: string;
  name: string;
  picture?: string;
  type: Platform;
  providerIdentifier: string;
  inBetweenSteps?: boolean;
  disabled?: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Soul-Integration Mapping represents the relationship between a Soul
 * and an Integration (social media channel)
 */
export interface SoulIntegrationMapping {
  id: string;
  soulId: string;
  integrationId: string;
  organizationId: string;
  isPrimary: boolean;
  priority: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * MatrixCell represents a single cell in the Soul-Channel matrix grid
 * Combines soul and integration context with mapping state
 */
export interface MatrixCell {
  soulId: string;
  integrationId: string;
  mapping: SoulIntegrationMapping | null;
  isConnected: boolean;
  isPrimary: boolean;
}

/**
 * MatrixData contains all data needed to render the Soul-Channel matrix
 */
export interface MatrixData {
  souls: Soul[];
  integrations: Integration[];
  mappings: SoulIntegrationMapping[];
}

/**
 * Filter options for the matrix view
 */
export interface MatrixFilters {
  soulId?: string;
  integrationId?: string;
  platform?: Platform;
  showOnlyConnected?: boolean;
  showOnlyPrimary?: boolean;
}

/**
 * Input for creating a new soul-integration mapping
 */
export interface CreateMappingInput {
  soulId: string;
  integrationId: string;
  isPrimary?: boolean;
  priority?: number;
  notes?: string;
}

/**
 * Input for toggling a mapping connection
 */
export interface ToggleMappingInput {
  soulId: string;
  integrationId: string;
}

/**
 * Input for setting primary status on a mapping
 */
export interface SetPrimaryInput {
  soulId: string;
  integrationId: string;
  isPrimary: boolean;
}

/**
 * Bulk operation types for matrix management (matches backend enum)
 */
export type BulkOperationType = 'create' | 'delete';

/**
 * Item for bulk mapping operation
 */
export interface BulkMappingItem {
  soulId: string;
  integrationId: string;
}

/**
 * Input for bulk operations on the matrix (matches backend DTO)
 */
export interface BulkOperationInput {
  operation: BulkOperationType;
  mappings: BulkMappingItem[];
}

/**
 * Statistics for the matrix view
 */
export interface MatrixStats {
  totalSouls: number;
  totalIntegrations: number;
  totalMappings: number;
  connectedPercentage: number;
  primaryMappings: number;
  mappingsBySoul: Record<string, number>;
  mappingsByIntegration: Record<string, number>;
}

/**
 * Cell state for UI rendering
 */
export type CellState = 'disconnected' | 'connected' | 'primary';

/**
 * Helper to determine cell state from mapping
 */
export function getCellState(mapping: SoulIntegrationMapping | null): CellState {
  if (!mapping) return 'disconnected';
  return mapping.isPrimary ? 'primary' : 'connected';
}

/**
 * Helper to build a cell lookup map for efficient rendering
 */
export function buildCellMap(
  mappings: SoulIntegrationMapping[]
): Map<string, SoulIntegrationMapping> {
  const map = new Map<string, SoulIntegrationMapping>();
  for (const mapping of mappings) {
    const key = `${mapping.soulId}-${mapping.integrationId}`;
    map.set(key, mapping);
  }
  return map;
}

/**
 * Helper to get cell key for lookup
 */
export function getCellKey(soulId: string, integrationId: string): string {
  return `${soulId}-${integrationId}`;
}
