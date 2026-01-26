/**
 * Soul-Channel Matrix Types
 *
 * Type definitions for the Matrix feature that connects Souls to Integrations
 * (social media channels) in a many-to-many relationship.
 */

import type { Soul, Persona, Platform } from '../types';

// ============================================================================
// Core Types
// ============================================================================

/**
 * Represents a mapping between a Soul and an Integration (channel)
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
  createdBy?: string;
}

/**
 * Integration data as returned from the Matrix API
 */
export interface MatrixIntegration {
  id: string;
  name: string;
  platform: string;
  picture?: string;
  disabled: boolean;
  soulIds: string[];
}

/**
 * Soul data with mappings as returned from the Matrix API
 */
export interface MatrixSoul {
  id: string;
  name: string;
  description?: string;
  status: string;
  persona?: {
    id: string;
    name: string;
    tone: string;
    style: string;
  };
  integrationIds: string[];
  mappings: MatrixMapping[];
}

/**
 * Simplified mapping data for matrix display
 */
export interface MatrixMapping {
  id: string;
  soulId: string;
  integrationId: string;
  isPrimary: boolean;
  priority: number;
  createdAt: string;
}

/**
 * Represents a single cell in the matrix grid
 */
export interface MatrixCell {
  soulId: string;
  integrationId: string;
  mapping: MatrixMapping | null;
  isConnected: boolean;
  isPrimary: boolean;
}

/**
 * Full matrix data response from API
 */
export interface MatrixData {
  souls: MatrixSoul[];
  integrations: MatrixIntegration[];
  mappings: MatrixMapping[];
  stats: MatrixStats;
}

/**
 * Statistics about the matrix
 */
export interface MatrixStats {
  totalSouls: number;
  totalIntegrations: number;
  totalMappings: number;
}

// ============================================================================
// Filter Types
// ============================================================================

/**
 * Filters for querying matrix data
 */
export interface MatrixFilters {
  platform?: string;
  search?: string;
  soulId?: string;
}

// ============================================================================
// Bulk Operation Types
// ============================================================================

/**
 * Action type for bulk operations
 */
export type BulkAction = 'create' | 'delete';

/**
 * Single bulk operation
 */
export interface BulkOperation {
  action: BulkAction;
  soulId: string;
  integrationId: string;
}

/**
 * Request body for bulk operations
 */
export interface BulkMappingRequest {
  operations: BulkOperation[];
}

/**
 * Response from bulk operations
 */
export interface BulkMappingResponse {
  success: boolean;
  created: number;
  deleted: number;
  errors: Array<{
    operation: BulkOperation;
    error: string;
  }>;
}

// ============================================================================
// DTO Types
// ============================================================================

/**
 * Request body for creating a mapping
 */
export interface CreateMappingDto {
  soulId: string;
  integrationId: string;
  isPrimary?: boolean;
  priority?: number;
}

/**
 * Request body for updating a mapping
 */
export interface UpdateMappingDto {
  isPrimary?: boolean;
  priority?: number;
  notes?: string;
}

/**
 * Response from toggle mapping operation
 */
export interface ToggleMappingResponse {
  action: 'created' | 'deleted';
  mapping: SoulIntegrationMapping | null;
}

// ============================================================================
// Integration Types (from Postiz)
// ============================================================================

/**
 * Integration with soul mapping info for content creation
 */
export interface IntegrationForSoul {
  id: string;
  name: string;
  platform: string;
  picture?: string;
  isPrimary: boolean;
  priority: number;
}

/**
 * Soul info for an integration
 */
export interface SoulForIntegration {
  id: string;
  name: string;
  status: string;
  isPrimary: boolean;
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Selection state for bulk editing
 */
export interface MatrixSelection {
  cells: Set<string>; // Format: "soulId:integrationId"
  mode: 'single' | 'bulk';
}

/**
 * Cell interaction state
 */
export interface CellState {
  isHovered: boolean;
  isSelected: boolean;
  isLoading: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Platform colors for matrix cell styling
 */
export const PLATFORM_COLORS: Record<string, string> = {
  twitter: '#1DA1F2',
  instagram: '#E4405F',
  linkedin: '#0A66C2',
  facebook: '#1877F2',
  tiktok: '#000000',
  threads: '#000000',
  bluesky: '#0085FF',
  mastodon: '#6364FF',
  youtube: '#FF0000',
  pinterest: '#BD081C',
  reddit: '#FF4500',
  discord: '#5865F2',
  slack: '#4A154B',
  dribbble: '#EA4C89',
} as const;

/**
 * Get color for a platform
 */
export function getPlatformColor(platform: string): string {
  return PLATFORM_COLORS[platform.toLowerCase()] || '#6B7280';
}

/**
 * Generate cell key from soul and integration IDs
 */
export function getCellKey(soulId: string, integrationId: string): string {
  return `${soulId}:${integrationId}`;
}

/**
 * Parse cell key back to IDs
 */
export function parseCellKey(key: string): { soulId: string; integrationId: string } {
  const [soulId, integrationId] = key.split(':');
  return { soulId, integrationId };
}
