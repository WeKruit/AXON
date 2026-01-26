# M4: Soul-Channel Matrix - Implementation Plan

**Date:** 2026-01-26
**Status:** Ready for Implementation

---

## 1. Implementation Overview

### 1.1 Scope Summary

| Component | New Files | Modified Files | Effort |
|-----------|-----------|----------------|--------|
| Database | 1 migration | 1 schema file | Small |
| Backend | 6 files | 2 files | Medium |
| Frontend | 12 files | 3 files | Large |
| Tests | 8 files | 0 files | Medium |

### 1.2 Team Assignments

| Developer | Role | Tasks |
|-----------|------|-------|
| **Blake** | Backend | Prisma schema, Matrix service, API endpoints |
| **Casey** | Frontend | Matrix UI, hooks, content creation integration |
| **Alex** | AI Integration | Persona-aware content suggestions (Phase 2) |

---

## 2. Backend Requirements

### 2.1 Database Schema Changes

**File:** `libraries/nestjs-libraries/src/database/prisma/schema.prisma`

```prisma
// Add after Integration model

model SoulIntegrationMapping {
  id              String      @id @default(cuid())
  soulId          String      // Firestore Soul document ID
  integrationId   String
  organizationId  String

  // Mapping properties
  isPrimary       Boolean     @default(false)
  priority        Int         @default(0)
  notes           String?

  // Metadata
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  createdBy       String?

  // Relations
  integration     Integration  @relation(fields: [integrationId], references: [id], onDelete: Cascade)
  organization    Organization @relation(fields: [organizationId], references: [id])

  @@unique([soulId, integrationId])
  @@index([soulId])
  @@index([integrationId])
  @@index([organizationId])
  @@map("soul_integration_mapping")
}

// Update Integration model to add relation
model Integration {
  // ... existing fields ...

  // Add this relation
  soulMappings    SoulIntegrationMapping[]
}

// Update Organization model to add relation
model Organization {
  // ... existing fields ...

  // Add this relation
  soulMappings    SoulIntegrationMapping[]
}
```

### 2.2 DTOs

**File:** `libraries/nestjs-libraries/src/dtos/matrix/matrix.dto.ts`

```typescript
import { IsString, IsBoolean, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

// Response DTOs
export class MappingDto {
  id: string;
  soulId: string;
  integrationId: string;
  isPrimary: boolean;
  priority: number;
  createdAt: Date;
}

export class SoulWithMappingsDto {
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
  mappings: MappingDto[];
}

export class IntegrationWithMappingsDto {
  id: string;
  name: string;
  platform: string;
  picture?: string;
  disabled: boolean;
  soulIds: string[];
}

export class MatrixResponseDto {
  souls: SoulWithMappingsDto[];
  integrations: IntegrationWithMappingsDto[];
  mappings: MappingDto[];
  stats: {
    totalSouls: number;
    totalIntegrations: number;
    totalMappings: number;
  };
}

// Request DTOs
export class CreateMappingDto {
  @IsString()
  soulId: string;

  @IsString()
  integrationId: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsNumber()
  @IsOptional()
  priority?: number;
}

export class UpdateMappingDto {
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsNumber()
  @IsOptional()
  priority?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export enum BulkActionType {
  CREATE = 'create',
  DELETE = 'delete',
}

export class BulkMappingOperationDto {
  @IsEnum(BulkActionType)
  action: BulkActionType;

  @IsString()
  soulId: string;

  @IsString()
  integrationId: string;
}

export class BulkMappingRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkMappingOperationDto)
  operations: BulkMappingOperationDto[];
}

export class BulkMappingResponseDto {
  success: boolean;
  created: number;
  deleted: number;
  errors: Array<{
    operation: BulkMappingOperationDto;
    error: string;
  }>;
}

// Query DTOs
export class MatrixQueryDto {
  @IsString()
  @IsOptional()
  platform?: string;

  @IsString()
  @IsOptional()
  soulId?: string;

  @IsString()
  @IsOptional()
  search?: string;
}
```

### 2.3 Repository

**File:** `libraries/nestjs-libraries/src/database/prisma/matrix/matrix.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateMappingDto, UpdateMappingDto, BulkMappingOperationDto, BulkActionType } from '@gitroom/nestjs-libraries/dtos/matrix/matrix.dto';

@Injectable()
export class MatrixRepository {
  constructor(private prisma: PrismaService) {}

  async findAllMappings(organizationId: string) {
    return this.prisma.soulIntegrationMapping.findMany({
      where: { organizationId },
      include: {
        integration: true,
      },
      orderBy: [
        { soulId: 'asc' },
        { priority: 'asc' },
      ],
    });
  }

  async findMappingsBySoul(soulId: string, organizationId: string) {
    return this.prisma.soulIntegrationMapping.findMany({
      where: { soulId, organizationId },
      include: {
        integration: true,
      },
      orderBy: { priority: 'asc' },
    });
  }

  async findMappingsByIntegration(integrationId: string, organizationId: string) {
    return this.prisma.soulIntegrationMapping.findMany({
      where: { integrationId, organizationId },
      orderBy: { priority: 'asc' },
    });
  }

  async findMapping(soulId: string, integrationId: string) {
    return this.prisma.soulIntegrationMapping.findUnique({
      where: {
        soulId_integrationId: { soulId, integrationId },
      },
    });
  }

  async createMapping(data: CreateMappingDto & { organizationId: string; createdBy?: string }) {
    // If setting as primary, unset other primaries for this soul
    if (data.isPrimary) {
      await this.prisma.soulIntegrationMapping.updateMany({
        where: { soulId: data.soulId, organizationId: data.organizationId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.soulIntegrationMapping.create({
      data: {
        soulId: data.soulId,
        integrationId: data.integrationId,
        organizationId: data.organizationId,
        isPrimary: data.isPrimary ?? false,
        priority: data.priority ?? 0,
        createdBy: data.createdBy,
      },
      include: {
        integration: true,
      },
    });
  }

  async updateMapping(id: string, data: UpdateMappingDto, organizationId: string) {
    const existing = await this.prisma.soulIntegrationMapping.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Mapping not found');
    }

    // If setting as primary, unset other primaries for this soul
    if (data.isPrimary) {
      await this.prisma.soulIntegrationMapping.updateMany({
        where: {
          soulId: existing.soulId,
          organizationId,
          id: { not: id },
        },
        data: { isPrimary: false },
      });
    }

    return this.prisma.soulIntegrationMapping.update({
      where: { id },
      data,
    });
  }

  async deleteMapping(id: string) {
    return this.prisma.soulIntegrationMapping.delete({
      where: { id },
    });
  }

  async deleteMappingBySoulAndIntegration(soulId: string, integrationId: string) {
    return this.prisma.soulIntegrationMapping.delete({
      where: {
        soulId_integrationId: { soulId, integrationId },
      },
    });
  }

  async bulkOperations(operations: BulkMappingOperationDto[], organizationId: string, createdBy?: string) {
    const results = {
      created: 0,
      deleted: 0,
      errors: [] as Array<{ operation: BulkMappingOperationDto; error: string }>,
    };

    for (const op of operations) {
      try {
        if (op.action === BulkActionType.CREATE) {
          await this.createMapping({
            soulId: op.soulId,
            integrationId: op.integrationId,
            organizationId,
            createdBy,
          });
          results.created++;
        } else if (op.action === BulkActionType.DELETE) {
          await this.deleteMappingBySoulAndIntegration(op.soulId, op.integrationId);
          results.deleted++;
        }
      } catch (error) {
        results.errors.push({
          operation: op,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  async deleteMappingsBySoul(soulId: string, organizationId: string) {
    return this.prisma.soulIntegrationMapping.deleteMany({
      where: { soulId, organizationId },
    });
  }

  async getIntegrationsForOrg(organizationId: string) {
    return this.prisma.integration.findMany({
      where: {
        organizationId,
        disabled: false,
      },
      select: {
        id: true,
        name: true,
        providerIdentifier: true,
        picture: true,
        disabled: true,
        soulMappings: {
          select: {
            soulId: true,
          },
        },
      },
    });
  }
}
```

### 2.4 Service

**File:** `libraries/nestjs-libraries/src/database/prisma/matrix/matrix.service.ts`

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MatrixRepository } from './matrix.repository';
import { SoulService } from '../../firestore/collections/souls/soul.service';
import { PersonaService } from '../../firestore/collections/personas/persona.service';
import {
  MatrixResponseDto,
  CreateMappingDto,
  UpdateMappingDto,
  BulkMappingRequestDto,
  BulkMappingResponseDto,
  MatrixQueryDto,
} from '@gitroom/nestjs-libraries/dtos/matrix/matrix.dto';

@Injectable()
export class MatrixService {
  constructor(
    private readonly matrixRepository: MatrixRepository,
    private readonly soulService: SoulService,
    private readonly personaService: PersonaService,
  ) {}

  async getMatrix(organizationId: string, query?: MatrixQueryDto): Promise<MatrixResponseDto> {
    // Fetch all data in parallel
    const [mappings, integrations, souls] = await Promise.all([
      this.matrixRepository.findAllMappings(organizationId),
      this.matrixRepository.getIntegrationsForOrg(organizationId),
      this.soulService.findAll(organizationId),
    ]);

    // Filter integrations by platform if specified
    let filteredIntegrations = integrations;
    if (query?.platform) {
      filteredIntegrations = integrations.filter(
        (i) => i.providerIdentifier === query.platform
      );
    }

    // Filter souls by search if specified
    let filteredSouls = souls;
    if (query?.search) {
      const searchLower = query.search.toLowerCase();
      filteredSouls = souls.filter(
        (s) => s.name.toLowerCase().includes(searchLower)
      );
    }

    // Build soul mappings
    const soulsWithMappings = await Promise.all(
      filteredSouls.map(async (soul) => {
        const soulMappings = mappings.filter((m) => m.soulId === soul.id);
        const persona = soul.personaId
          ? await this.personaService.findById(soul.personaId)
          : null;

        return {
          id: soul.id,
          name: soul.name,
          description: soul.description,
          status: soul.status,
          persona: persona ? {
            id: persona.id,
            name: persona.name,
            tone: persona.tone,
            style: persona.style,
          } : undefined,
          integrationIds: soulMappings.map((m) => m.integrationId),
          mappings: soulMappings.map((m) => ({
            id: m.id,
            soulId: m.soulId,
            integrationId: m.integrationId,
            isPrimary: m.isPrimary,
            priority: m.priority,
            createdAt: m.createdAt,
          })),
        };
      })
    );

    // Build integration mappings
    const integrationsWithMappings = filteredIntegrations.map((integration) => ({
      id: integration.id,
      name: integration.name,
      platform: integration.providerIdentifier,
      picture: integration.picture,
      disabled: integration.disabled,
      soulIds: integration.soulMappings.map((m) => m.soulId),
    }));

    return {
      souls: soulsWithMappings,
      integrations: integrationsWithMappings,
      mappings: mappings.map((m) => ({
        id: m.id,
        soulId: m.soulId,
        integrationId: m.integrationId,
        isPrimary: m.isPrimary,
        priority: m.priority,
        createdAt: m.createdAt,
      })),
      stats: {
        totalSouls: soulsWithMappings.length,
        totalIntegrations: integrationsWithMappings.length,
        totalMappings: mappings.length,
      },
    };
  }

  async getIntegrationsForSoul(soulId: string, organizationId: string) {
    // Verify soul exists
    const soul = await this.soulService.findById(soulId);
    if (!soul || soul.organizationId !== organizationId) {
      throw new NotFoundException('Soul not found');
    }

    const mappings = await this.matrixRepository.findMappingsBySoul(soulId, organizationId);

    return mappings.map((m) => ({
      id: m.integration.id,
      name: m.integration.name,
      platform: m.integration.providerIdentifier,
      picture: m.integration.picture,
      isPrimary: m.isPrimary,
      priority: m.priority,
    }));
  }

  async getSoulsForIntegration(integrationId: string, organizationId: string) {
    const mappings = await this.matrixRepository.findMappingsByIntegration(
      integrationId,
      organizationId
    );

    const souls = await Promise.all(
      mappings.map(async (m) => {
        const soul = await this.soulService.findById(m.soulId);
        return soul ? {
          id: soul.id,
          name: soul.name,
          status: soul.status,
          isPrimary: m.isPrimary,
        } : null;
      })
    );

    return souls.filter(Boolean);
  }

  async createMapping(data: CreateMappingDto, organizationId: string, userId?: string) {
    // Verify soul exists and belongs to org
    const soul = await this.soulService.findById(data.soulId);
    if (!soul || soul.organizationId !== organizationId) {
      throw new NotFoundException('Soul not found');
    }

    // Check if mapping already exists
    const existing = await this.matrixRepository.findMapping(data.soulId, data.integrationId);
    if (existing) {
      throw new BadRequestException('Mapping already exists');
    }

    return this.matrixRepository.createMapping({
      ...data,
      organizationId,
      createdBy: userId,
    });
  }

  async updateMapping(id: string, data: UpdateMappingDto, organizationId: string) {
    return this.matrixRepository.updateMapping(id, data, organizationId);
  }

  async deleteMapping(id: string) {
    return this.matrixRepository.deleteMapping(id);
  }

  async toggleMapping(soulId: string, integrationId: string, organizationId: string, userId?: string) {
    const existing = await this.matrixRepository.findMapping(soulId, integrationId);

    if (existing) {
      await this.matrixRepository.deleteMapping(existing.id);
      return { action: 'deleted', mapping: null };
    } else {
      const mapping = await this.createMapping(
        { soulId, integrationId },
        organizationId,
        userId
      );
      return { action: 'created', mapping };
    }
  }

  async bulkOperations(
    data: BulkMappingRequestDto,
    organizationId: string,
    userId?: string
  ): Promise<BulkMappingResponseDto> {
    const results = await this.matrixRepository.bulkOperations(
      data.operations,
      organizationId,
      userId
    );

    return {
      success: results.errors.length === 0,
      created: results.created,
      deleted: results.deleted,
      errors: results.errors,
    };
  }

  // Called when a Soul is deleted - cleanup mappings
  async onSoulDeleted(soulId: string, organizationId: string) {
    await this.matrixRepository.deleteMappingsBySoul(soulId, organizationId);
  }
}
```

### 2.5 Controller

**File:** `apps/backend/src/api/routes/matrix.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MatrixService } from '@gitroom/nestjs-libraries/database/prisma/matrix/matrix.service';
import {
  CreateMappingDto,
  UpdateMappingDto,
  BulkMappingRequestDto,
  MatrixQueryDto,
} from '@gitroom/nestjs-libraries/dtos/matrix/matrix.dto';
import { AuthGuard } from '@gitroom/backend/guards/auth.guard';
import { GetOrgFromRequest } from '@gitroom/backend/decorators/org.decorator';
import { GetUserFromRequest } from '@gitroom/backend/decorators/user.decorator';
import { Organization, User } from '@prisma/client';

@Controller('matrix')
@UseGuards(AuthGuard)
export class MatrixController {
  constructor(private readonly matrixService: MatrixService) {}

  @Get()
  async getMatrix(
    @GetOrgFromRequest() org: Organization,
    @Query() query: MatrixQueryDto,
  ) {
    return this.matrixService.getMatrix(org.id, query);
  }

  @Get('souls/:soulId/integrations')
  async getIntegrationsForSoul(
    @GetOrgFromRequest() org: Organization,
    @Param('soulId') soulId: string,
  ) {
    return this.matrixService.getIntegrationsForSoul(soulId, org.id);
  }

  @Get('integrations/:integrationId/souls')
  async getSoulsForIntegration(
    @GetOrgFromRequest() org: Organization,
    @Param('integrationId') integrationId: string,
  ) {
    return this.matrixService.getSoulsForIntegration(integrationId, org.id);
  }

  @Post('mappings')
  async createMapping(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Body() data: CreateMappingDto,
  ) {
    return this.matrixService.createMapping(data, org.id, user.id);
  }

  @Post('mappings/toggle')
  async toggleMapping(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Body() data: CreateMappingDto,
  ) {
    return this.matrixService.toggleMapping(
      data.soulId,
      data.integrationId,
      org.id,
      user.id,
    );
  }

  @Post('mappings/bulk')
  async bulkMappings(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Body() data: BulkMappingRequestDto,
  ) {
    return this.matrixService.bulkOperations(data, org.id, user.id);
  }

  @Patch('mappings/:id')
  async updateMapping(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() data: UpdateMappingDto,
  ) {
    return this.matrixService.updateMapping(id, data, org.id);
  }

  @Delete('mappings/:id')
  async deleteMapping(@Param('id') id: string) {
    return this.matrixService.deleteMapping(id);
  }
}
```

### 2.6 Module Registration

**File:** `libraries/nestjs-libraries/src/database/prisma/matrix/matrix.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { MatrixRepository } from './matrix.repository';
import { PrismaModule } from '../prisma.module';
import { FirestoreModule } from '../../firestore/firestore.module';

@Module({
  imports: [PrismaModule, FirestoreModule],
  providers: [MatrixService, MatrixRepository],
  exports: [MatrixService],
})
export class MatrixModule {}
```

---

## 3. Frontend Requirements

### 3.1 Types

**File:** `apps/frontend/src/components/axon/matrix/types.ts`

```typescript
export interface MatrixMapping {
  id: string;
  soulId: string;
  integrationId: string;
  isPrimary: boolean;
  priority: number;
  createdAt: string;
}

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

export interface MatrixIntegration {
  id: string;
  name: string;
  platform: string;
  picture?: string;
  disabled: boolean;
  soulIds: string[];
}

export interface MatrixData {
  souls: MatrixSoul[];
  integrations: MatrixIntegration[];
  mappings: MatrixMapping[];
  stats: {
    totalSouls: number;
    totalIntegrations: number;
    totalMappings: number;
  };
}

export interface MatrixFilters {
  platform?: string;
  search?: string;
  soulId?: string;
}

export type BulkAction = 'create' | 'delete';

export interface BulkOperation {
  action: BulkAction;
  soulId: string;
  integrationId: string;
}
```

### 3.2 Hooks

**File:** `apps/frontend/src/components/axon/matrix/use-matrix.ts`

```typescript
import useSWR from 'swr';
import { useCallback } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import type { MatrixData, MatrixFilters, BulkOperation } from './types';

export function useMatrix(filters?: MatrixFilters) {
  const fetch = useFetch();

  const queryParams = new URLSearchParams();
  if (filters?.platform) queryParams.set('platform', filters.platform);
  if (filters?.search) queryParams.set('search', filters.search);
  if (filters?.soulId) queryParams.set('soulId', filters.soulId);

  const queryString = queryParams.toString();
  const url = `/matrix${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<MatrixData>(
    url,
    () => fetch(url),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

export function useMatrixMutations() {
  const fetch = useFetch();

  const toggleMapping = useCallback(
    async (soulId: string, integrationId: string) => {
      return fetch('/matrix/mappings/toggle', {
        method: 'POST',
        body: JSON.stringify({ soulId, integrationId }),
      });
    },
    [fetch]
  );

  const createMapping = useCallback(
    async (soulId: string, integrationId: string, isPrimary?: boolean) => {
      return fetch('/matrix/mappings', {
        method: 'POST',
        body: JSON.stringify({ soulId, integrationId, isPrimary }),
      });
    },
    [fetch]
  );

  const deleteMapping = useCallback(
    async (mappingId: string) => {
      return fetch(`/matrix/mappings/${mappingId}`, {
        method: 'DELETE',
      });
    },
    [fetch]
  );

  const updateMapping = useCallback(
    async (mappingId: string, data: { isPrimary?: boolean; priority?: number }) => {
      return fetch(`/matrix/mappings/${mappingId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    [fetch]
  );

  const bulkOperations = useCallback(
    async (operations: BulkOperation[]) => {
      return fetch('/matrix/mappings/bulk', {
        method: 'POST',
        body: JSON.stringify({ operations }),
      });
    },
    [fetch]
  );

  return {
    toggleMapping,
    createMapping,
    deleteMapping,
    updateMapping,
    bulkOperations,
  };
}

export function useSoulIntegrations(soulId: string | null) {
  const fetch = useFetch();

  const { data, error, isLoading, mutate } = useSWR(
    soulId ? `/matrix/souls/${soulId}/integrations` : null,
    () => fetch(`/matrix/souls/${soulId}/integrations`),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}
```

### 3.3 Matrix Components

**File:** `apps/frontend/src/components/axon/matrix/matrix-view.tsx`

```typescript
'use client';

import { FC, useState, useCallback, useMemo } from 'react';
import { useMatrix, useMatrixMutations } from './use-matrix';
import { MatrixCell } from './matrix-cell';
import { MatrixHeader } from './matrix-header';
import { MatrixRow } from './matrix-row';
import { MatrixFilters } from './matrix-filters';
import { BulkEditModal } from './bulk-edit-modal';
import { useToaster } from '@gitroom/react/toaster/toaster';
import type { MatrixFilters as Filters, BulkOperation } from './types';

export const MatrixView: FC = () => {
  const [filters, setFilters] = useState<Filters>({});
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);

  const { data, isLoading, mutate } = useMatrix(filters);
  const { toggleMapping, bulkOperations } = useMatrixMutations();
  const toaster = useToaster();

  const handleCellClick = useCallback(
    async (soulId: string, integrationId: string) => {
      if (bulkMode) {
        const key = `${soulId}:${integrationId}`;
        setSelectedCells((prev) => {
          const next = new Set(prev);
          if (next.has(key)) {
            next.delete(key);
          } else {
            next.add(key);
          }
          return next;
        });
        return;
      }

      try {
        const result = await toggleMapping(soulId, integrationId);
        await mutate();
        toaster.show(
          result.action === 'created' ? 'Channel linked to Soul' : 'Channel unlinked from Soul',
          'success'
        );
      } catch (error) {
        toaster.show('Failed to update mapping', 'warning');
      }
    },
    [bulkMode, toggleMapping, mutate, toaster]
  );

  const handleBulkAction = useCallback(
    async (action: 'create' | 'delete') => {
      const operations: BulkOperation[] = Array.from(selectedCells).map((key) => {
        const [soulId, integrationId] = key.split(':');
        return { action, soulId, integrationId };
      });

      try {
        const result = await bulkOperations(operations);
        await mutate();
        setSelectedCells(new Set());
        setBulkMode(false);
        toaster.show(
          `${result.created} created, ${result.deleted} deleted`,
          'success'
        );
      } catch (error) {
        toaster.show('Bulk operation failed', 'warning');
      }
    },
    [selectedCells, bulkOperations, mutate, toaster]
  );

  const isMapped = useCallback(
    (soulId: string, integrationId: string) => {
      if (!data) return false;
      return data.mappings.some(
        (m) => m.soulId === soulId && m.integrationId === integrationId
      );
    },
    [data]
  );

  const getMapping = useCallback(
    (soulId: string, integrationId: string) => {
      if (!data) return null;
      return data.mappings.find(
        (m) => m.soulId === soulId && m.integrationId === integrationId
      );
    },
    [data]
  );

  if (isLoading) {
    return (
      <div className="flex-1 bg-newBgColorInner p-6">
        <div className="h-8 w-64 bg-newBgLineColor rounded animate-pulse mb-6" />
        <div className="h-96 bg-newBgLineColor rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 bg-newBgColorInner p-6">
        <p className="text-textItemBlur">Failed to load matrix data</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-newBgColorInner p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-newTextColor">Soul-Channel Matrix</h1>
          <p className="text-sm text-textItemBlur mt-1">
            Connect your brand identities to social channels
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-textItemBlur">
            {data.stats.totalMappings} active mappings
          </span>
          <button
            onClick={() => {
              setBulkMode(!bulkMode);
              setSelectedCells(new Set());
            }}
            className={`px-4 py-2 rounded-[8px] text-sm transition-colors ${
              bulkMode
                ? 'bg-btnPrimary text-white'
                : 'bg-newBgLineColor text-newTextColor hover:bg-newBgLineColor/80'
            }`}
          >
            {bulkMode ? 'Exit Bulk Mode' : 'Bulk Edit'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <MatrixFilters filters={filters} onChange={setFilters} />

      {/* Bulk Actions Bar */}
      {bulkMode && selectedCells.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-btnPrimary/10 rounded-lg mb-4">
          <span className="text-sm text-newTextColor">
            {selectedCells.size} cells selected
          </span>
          <button
            onClick={() => handleBulkAction('create')}
            className="px-3 py-1.5 bg-green-500 text-white rounded-[8px] text-sm"
          >
            Link All
          </button>
          <button
            onClick={() => handleBulkAction('delete')}
            className="px-3 py-1.5 bg-red-500 text-white rounded-[8px] text-sm"
          >
            Unlink All
          </button>
          <button
            onClick={() => setSelectedCells(new Set())}
            className="px-3 py-1.5 bg-newBgLineColor text-newTextColor rounded-[8px] text-sm"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Matrix Grid */}
      {data.souls.length === 0 || data.integrations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-newBgLineColor flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-textItemBlur"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-newTextColor mb-2">
            {data.souls.length === 0 ? 'No Souls Created' : 'No Channels Connected'}
          </h3>
          <p className="text-sm text-textItemBlur mb-4 max-w-md">
            {data.souls.length === 0
              ? 'Create a Soul first to start building your matrix.'
              : 'Connect social media channels to start building your matrix.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 text-left bg-newBgLineColor rounded-tl-lg">
                  <span className="text-sm font-medium text-textItemBlur">Souls</span>
                </th>
                {data.integrations.map((integration, idx) => (
                  <MatrixHeader
                    key={integration.id}
                    integration={integration}
                    isLast={idx === data.integrations.length - 1}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {data.souls.map((soul, rowIdx) => (
                <MatrixRow
                  key={soul.id}
                  soul={soul}
                  isLast={rowIdx === data.souls.length - 1}
                >
                  {data.integrations.map((integration) => {
                    const mapping = getMapping(soul.id, integration.id);
                    const isSelected = selectedCells.has(`${soul.id}:${integration.id}`);

                    return (
                      <MatrixCell
                        key={`${soul.id}-${integration.id}`}
                        soulId={soul.id}
                        integrationId={integration.id}
                        isMapped={!!mapping}
                        isPrimary={mapping?.isPrimary || false}
                        isSelected={isSelected}
                        bulkMode={bulkMode}
                        onClick={handleCellClick}
                        onSetPrimary={async () => {
                          // Handle set primary
                        }}
                      />
                    );
                  })}
                </MatrixRow>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 mt-6 text-sm text-textItemBlur">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-btnPrimary" />
          <span>Mapped</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-newTableBorder" />
          <span>Not Mapped</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-500">★</span>
          <span>Primary Channel</span>
        </div>
      </div>
    </div>
  );
};
```

### 3.4 Additional Components

I'll provide the remaining components in the task assignments. The key components are:

- `matrix-cell.tsx` - Individual cell with toggle/primary badge
- `matrix-header.tsx` - Column header with platform icon
- `matrix-row.tsx` - Row with Soul info
- `matrix-filters.tsx` - Platform filter, search
- `bulk-edit-modal.tsx` - Modal for bulk operations

### 3.5 Navigation Update

**File:** `apps/frontend/src/components/axon/ui/axon-nav.tsx`

Add Matrix to navigation:

```typescript
const navItems: NavItem[] = [
  { label: 'Souls', href: '/axon/souls', description: 'Identity containers' },
  { label: 'Accounts', href: '/axon/accounts', description: 'Social accounts' },
  { label: 'Personas', href: '/axon/personas', description: 'AI personalities' },
  { label: 'Proxies', href: '/axon/proxies', description: 'IP management' },
  { label: 'Matrix', href: '/axon/matrix', description: 'Soul-Channel mapping' }, // NEW
];
```

### 3.6 Content Creation Integration

Modify `apps/frontend/src/components/launches/add.edit.modal.tsx` to add Soul selector that filters available integrations.

---

## 4. Testing Requirements

### 4.1 Backend Tests

| Test File | Coverage |
|-----------|----------|
| `matrix.service.spec.ts` | Service logic, Soul/Integration validation |
| `matrix.repository.spec.ts` | Database operations, bulk ops |
| `matrix.controller.spec.ts` | API endpoints, auth guards |

### 4.2 Frontend Tests

| Test File | Coverage |
|-----------|----------|
| `matrix-view.spec.tsx` | Main component rendering, interactions |
| `use-matrix.spec.ts` | Hook data fetching, mutations |
| `matrix-cell.spec.tsx` | Cell toggle, primary badge |

---

## 5. Migration Steps

### 5.1 Database Migration

```bash
# Generate migration
pnpm run prisma-db-push

# Or create migration file
npx prisma migrate dev --name add_soul_integration_mapping
```

### 5.2 Deployment Order

1. Deploy database migration
2. Deploy backend with new endpoints
3. Deploy frontend with Matrix UI
4. Enable feature flag

---

## 6. Task Breakdown

See Linear tickets and task assignments in the next section.
