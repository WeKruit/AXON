# M4 Phase 2: Backend Tasks

**Feature:** Account-Integration Linking
**Assignee:** Blake (Backend Developer)
**Branch Prefix:** `feature/blake/`
**Status:** Ready to Start

---

## Overview

Enable linking between Firestore Accounts and PostgreSQL Integrations to:
- Know which credentials belong to which OAuth channel
- Track which Account is used for which channel
- Enable future proxy-based posting

---

## Task 1: Update Prisma Schema

**Ticket:** WEC-201
**Priority:** High
**Effort:** Small (30 min)

### File to Modify
`libraries/nestjs-libraries/src/database/prisma/schema.prisma`

### Changes

Add `accountId` field to `SoulIntegrationMapping`:

```prisma
model SoulIntegrationMapping {
  id             String       @id @default(cuid())
  soulId         String
  integrationId  String
  organizationId String
  
  // NEW: Link to specific Account (Firestore ID)
  accountId      String?
  
  isPrimary      Boolean      @default(false)
  priority       Int          @default(0)
  notes          String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  createdBy      String?

  integration    Integration  @relation(fields: [integrationId], references: [id], onDelete: Cascade)
  organization   Organization @relation(fields: [organizationId], references: [id])

  @@unique([soulId, integrationId])
  @@index([soulId])
  @@index([integrationId])
  @@index([organizationId])
  @@index([accountId])          // NEW
  @@map("soul_integration_mapping")
}
```

### Commands to Run

```bash
# Push schema changes
pnpm run prisma-db-push

# Generate Prisma client
pnpm run prisma-generate
```

### Acceptance Criteria
- [ ] `accountId` field added to schema
- [ ] Index created for `accountId`
- [ ] Migration runs successfully
- [ ] Existing mappings unaffected (null accountId)

---

## Task 2: Update Account DTO

**Ticket:** WEC-202
**Priority:** High
**Effort:** Small (30 min)

### File to Modify
`libraries/nestjs-libraries/src/dtos/axon/account.dto.ts`

### Changes

**Add to Account interface:**
```typescript
export interface Account extends FirestoreDocument {
  // ... existing fields ...
  
  integrationId?: string;  // NEW: Link to PostgreSQL Integration
}
```

**Add to CreateAccountDto:**
```typescript
export class CreateAccountDto {
  // ... existing fields ...
  
  @ApiPropertyOptional({ description: 'Linked Integration ID (PostgreSQL)' })
  @IsString()
  @IsOptional()
  integrationId?: string;
}
```

**Add to UpdateAccountDto:**
```typescript
export class UpdateAccountDto {
  // ... existing fields ...
  
  @ApiPropertyOptional({ description: 'Linked Integration ID (PostgreSQL)' })
  @IsString()
  @IsOptional()
  integrationId?: string;
}
```

**Add to AccountResponseDto:**
```typescript
export class AccountResponseDto {
  // ... existing fields ...
  
  @ApiPropertyOptional({ description: 'Linked Integration ID' })
  integrationId?: string;
}
```

### Acceptance Criteria
- [ ] `integrationId` field in Account interface
- [ ] `integrationId` field in CreateAccountDto
- [ ] `integrationId` field in UpdateAccountDto
- [ ] `integrationId` field in AccountResponseDto
- [ ] Proper validation decorators

---

## Task 3: Update Account Repository

**Ticket:** WEC-203
**Priority:** High
**Effort:** Medium (1 hour)
**Blocked By:** WEC-202

### File to Modify
`libraries/nestjs-libraries/src/database/firestore/collections/accounts/account.repository.ts`

### New Methods to Add

```typescript
/**
 * Link an account to an integration
 */
async linkIntegration(
  organizationId: string, 
  accountId: string, 
  integrationId: string
): Promise<void> {
  const account = await this.findById(organizationId, accountId);
  if (!account) {
    throw new NotFoundException('Account not found');
  }
  await this.firestore.update<Account>(COLLECTION, accountId, { 
    integrationId,
    updatedAt: new Date(),
  });
}

/**
 * Unlink an account from its integration
 */
async unlinkIntegration(
  organizationId: string, 
  accountId: string
): Promise<void> {
  const account = await this.findById(organizationId, accountId);
  if (!account) {
    throw new NotFoundException('Account not found');
  }
  await this.firestore.update<Account>(COLLECTION, accountId, { 
    integrationId: null,
    updatedAt: new Date(),
  });
}

/**
 * Find account by its linked integration ID
 */
async findByIntegrationId(
  organizationId: string, 
  integrationId: string
): Promise<Account | null> {
  const results = await this.firestore.query<Account>(COLLECTION, [
    { field: 'organizationId', operator: '==', value: organizationId },
    { field: 'integrationId', operator: '==', value: integrationId },
  ], 1);
  return results[0] || null;
}
```

### Acceptance Criteria
- [ ] `linkIntegration` method implemented
- [ ] `unlinkIntegration` method implemented
- [ ] `findByIntegrationId` method implemented
- [ ] Proper error handling for not found
- [ ] Updates `updatedAt` timestamp

---

## Task 4: Update Account Service

**Ticket:** WEC-204
**Priority:** High
**Effort:** Medium (1.5 hours)
**Blocked By:** WEC-203

### File to Modify
`libraries/nestjs-libraries/src/database/firestore/collections/accounts/account.service.ts`

### Dependencies to Inject

```typescript
constructor(
  private readonly accountRepository: AccountRepository,
  private readonly soulRepository: SoulRepository,
  private readonly proxyRepository: ProxyRepository,
  private readonly integrationService: IntegrationService, // NEW: Add this
) {}
```

### New Methods to Add

```typescript
/**
 * Link an account to an OAuth integration
 * Validates platform match before linking
 */
async linkToIntegration(
  organizationId: string, 
  accountId: string, 
  integrationId: string
): Promise<AccountResponseDto> {
  // Get the account
  const account = await this.accountRepository.findById(organizationId, accountId);
  if (!account) {
    throw new NotFoundException('Account not found');
  }
  
  // Get the integration and validate it exists
  const integration = await this.integrationService.getIntegrationById(integrationId);
  if (!integration || integration.organizationId !== organizationId) {
    throw new NotFoundException('Integration not found');
  }
  
  // Validate platform match
  if (account.platform !== integration.providerIdentifier) {
    throw new BadRequestException(
      `Platform mismatch: Account is ${account.platform}, Integration is ${integration.providerIdentifier}`
    );
  }
  
  // Check if another account is already linked to this integration
  const existingLink = await this.accountRepository.findByIntegrationId(
    organizationId, 
    integrationId
  );
  if (existingLink && existingLink.id !== accountId) {
    throw new ConflictException(
      `Integration already linked to account: ${existingLink.handle}`
    );
  }
  
  // Perform the link
  await this.accountRepository.linkIntegration(organizationId, accountId, integrationId);
  
  return this.findById(organizationId, accountId);
}

/**
 * Unlink an account from its integration
 */
async unlinkFromIntegration(
  organizationId: string, 
  accountId: string
): Promise<AccountResponseDto> {
  const account = await this.accountRepository.findById(organizationId, accountId);
  if (!account) {
    throw new NotFoundException('Account not found');
  }
  
  await this.accountRepository.unlinkIntegration(organizationId, accountId);
  
  return this.findById(organizationId, accountId);
}

/**
 * Auto-link account to integration by matching platform and handle
 * Called after OAuth connection to auto-link if matching account exists
 */
async autoLinkByHandle(
  organizationId: string, 
  integrationId: string,
  platform: string,
  handle: string
): Promise<AccountResponseDto | null> {
  // Find account by platform + handle
  const account = await this.accountRepository.findByHandle(
    organizationId, 
    platform, 
    handle
  );
  
  if (!account) {
    return null;
  }
  
  // Only link if not already linked to something else
  if (account.integrationId && account.integrationId !== integrationId) {
    return null;
  }
  
  // Link if not already linked
  if (!account.integrationId) {
    await this.accountRepository.linkIntegration(
      organizationId, 
      account.id, 
      integrationId
    );
  }
  
  return this.findById(organizationId, account.id);
}
```

### Update toResponseDto Method

```typescript
private toResponseDto(account: Account): AccountResponseDto {
  return {
    // ... existing fields ...
    integrationId: account.integrationId,  // NEW
  };
}
```

### Acceptance Criteria
- [ ] `linkToIntegration` validates platform match
- [ ] `linkToIntegration` prevents duplicate links
- [ ] `unlinkFromIntegration` works correctly
- [ ] `autoLinkByHandle` finds and links matching accounts
- [ ] All methods return proper response DTOs
- [ ] Proper error messages for all failure cases

---

## Task 5: Update Accounts Controller

**Ticket:** WEC-205
**Priority:** High
**Effort:** Small (30 min)
**Blocked By:** WEC-204

### File to Modify
`apps/backend/src/api/routes/accounts.controller.ts`

### New DTO for Request

```typescript
// Add at top of file or in separate DTO file
export class LinkIntegrationDto {
  @ApiPropertyOptional({ description: 'Integration ID to link (null to unlink)' })
  @IsString()
  @IsOptional()
  integrationId?: string | null;
}
```

### New Endpoint to Add

```typescript
@Patch(':id/integration')
@ApiOperation({ summary: 'Link or unlink account to integration' })
@ApiResponse({ status: 200, description: 'Account updated', type: AccountResponseDto })
@ApiResponse({ status: 400, description: 'Platform mismatch' })
@ApiResponse({ status: 404, description: 'Account or Integration not found' })
@ApiResponse({ status: 409, description: 'Integration already linked to another account' })
async linkIntegration(
  @GetOrgFromRequest() org: Organization,
  @Param('id') id: string,
  @Body() dto: LinkIntegrationDto,
): Promise<AccountResponseDto> {
  if (dto.integrationId) {
    return this.accountService.linkToIntegration(org.id, id, dto.integrationId);
  } else {
    return this.accountService.unlinkFromIntegration(org.id, id);
  }
}
```

### Acceptance Criteria
- [ ] `PATCH /axon/accounts/:id/integration` endpoint created
- [ ] Proper guards (AuthGuard, OrgGuard)
- [ ] Swagger documentation complete
- [ ] Returns AccountResponseDto
- [ ] Handles both link and unlink

---

## Task 6: Update Matrix Service

**Ticket:** WEC-208
**Priority:** Medium
**Effort:** Medium (1 hour)
**Blocked By:** WEC-201, WEC-204

### File to Modify
`libraries/nestjs-libraries/src/database/prisma/matrix/matrix.service.ts`

### Changes to createMapping Method

```typescript
async createMapping(data: CreateMappingDto, organizationId: string, userId?: string) {
  // Verify soul exists and belongs to org
  const soul = await this.soulRepository.findById(organizationId, data.soulId);
  if (!soul) {
    throw new NotFoundException('Soul not found');
  }

  // Check if mapping already exists
  const existing = await this.matrixRepository.findMapping(data.soulId, data.integrationId);
  if (existing) {
    throw new BadRequestException('Mapping already exists');
  }

  // NEW: Auto-find matching account for this soul + integration's platform
  let accountId: string | undefined;
  
  try {
    // Get integration to know the platform
    const integrations = await this.matrixRepository.getIntegrationsForOrg(organizationId);
    const integration = integrations.find(i => i.id === data.integrationId);
    
    if (integration) {
      // Get accounts for this soul
      const accounts = await this.accountService.findBySoulId(organizationId, data.soulId);
      
      // Find account matching the integration's platform
      const matchingAccount = accounts.find(
        a => a.platform === integration.providerIdentifier
      );
      
      if (matchingAccount) {
        accountId = matchingAccount.id;
      }
    }
  } catch (error) {
    // Non-fatal: continue without accountId if lookup fails
    console.warn('Failed to auto-link account:', error);
  }

  return this.matrixRepository.createMapping({
    ...data,
    accountId,  // NEW: Include accountId
    organizationId,
    createdBy: userId,
  });
}
```

### Update Matrix Repository

**File:** `libraries/nestjs-libraries/src/database/prisma/matrix/matrix.repository.ts`

Update `createMapping` to accept `accountId`:

```typescript
async createMapping(data: CreateMappingDto & { 
  organizationId: string; 
  createdBy?: string;
  accountId?: string;  // NEW
}) {
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
      accountId: data.accountId,  // NEW
      isPrimary: data.isPrimary ?? false,
      priority: data.priority ?? 0,
      createdBy: data.createdBy,
    },
    include: {
      integration: true,
    },
  });
}
```

### Update Matrix DTOs

**File:** `libraries/nestjs-libraries/src/dtos/matrix/matrix.dto.ts`

Add `accountId` to response DTOs:

```typescript
export class MappingDto {
  id: string;
  soulId: string;
  integrationId: string;
  accountId?: string;  // NEW
  isPrimary: boolean;
  priority: number;
  createdAt: Date;
}
```

### Acceptance Criteria
- [ ] `createMapping` auto-finds matching account
- [ ] `accountId` included in mapping creation
- [ ] Repository accepts `accountId` parameter
- [ ] DTOs include `accountId` field
- [ ] Works when no matching account exists (accountId = null)

---

## Task Summary

| # | Ticket | Title | Effort | Blocked By |
|---|--------|-------|--------|------------|
| 1 | WEC-201 | Update Prisma Schema | Small | - |
| 2 | WEC-202 | Update Account DTO | Small | - |
| 3 | WEC-203 | Update Account Repository | Medium | WEC-202 |
| 4 | WEC-204 | Update Account Service | Medium | WEC-203 |
| 5 | WEC-205 | Update Accounts Controller | Small | WEC-204 |
| 6 | WEC-208 | Update Matrix Service | Medium | WEC-201, WEC-204 |

**Total Effort:** ~5-6 hours

---

## Execution Order

```
Day 1:
├── WEC-201 (Schema) - 30 min
├── WEC-202 (DTO) - 30 min
└── WEC-203 (Repository) - 1 hour

Day 2:
├── WEC-204 (Service) - 1.5 hours
├── WEC-205 (Controller) - 30 min
└── WEC-208 (Matrix Service) - 1 hour
```

---

## Related Documents

- **PRD:** `/docs/prd/M4-Soul-Channel-Matrix.md`
- **Implementation Plan:** `/docs/implementation-plans/m4-matrix-implementation.md`
- **Frontend Tasks:** `/docs/tasks/m4-phase2-frontend.md`
- **Test Tasks:** `/docs/tasks/m4-phase2-tests.md`
