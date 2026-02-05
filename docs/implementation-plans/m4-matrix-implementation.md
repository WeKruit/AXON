# M4: Soul-Channel-Account Management - Implementation Plan

**Date:** 2026-01-26
**Status:** Phase 1 Complete, Phase 2 Ready
**Version:** 2.0

---

## 1. Implementation Overview

### 1.1 Phase Summary

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** | Soul-Channel Matrix (many-to-many mapping) | ✅ Complete |
| **Phase 2** | Account-Integration Linking | 🔄 Ready |
| **Phase 3** | Proxy-based Operations | 🔜 Future |
| **Phase 4** | Browser Automation | 🔜 Future |

### 1.2 Current Architecture (Phase 1 Complete)

```
┌─────────────────┐         ┌─────────────────┐
│     Soul        │ M:N     │   Integration   │
│   (Firestore)   │◄───────►│  (PostgreSQL)   │
└─────────────────┘         └─────────────────┘
        │                          │
        │ 1:N                      │
        ▼                          │
┌─────────────────┐                │
│    Account      │                │
│   (Firestore)   │────────────────┘ (no link yet)
└─────────────────┘
        │
        │ N:1
        ▼
┌─────────────────┐
│     Proxy       │
│   (Firestore)   │
└─────────────────┘
```

### 1.3 Target Architecture (Phase 2)

```
┌─────────────────┐         ┌─────────────────┐
│     Soul        │ M:N     │   Integration   │
│   (Firestore)   │◄───────►│  (PostgreSQL)   │
└─────────────────┘    │    └─────────────────┘
        │              │           ▲
        │ 1:N          │ includes  │ 1:1
        ▼              │ accountId │
┌─────────────────┐    │           │
│    Account      │◄───┴───────────┘
│   (Firestore)   │  integrationId
└─────────────────┘
        │
        │ N:1
        ▼
┌─────────────────┐
│     Proxy       │
│   (Firestore)   │
└─────────────────┘
```

---

## 2. Phase 1: Soul-Channel Matrix (COMPLETE) ✅

### 2.1 Completed Components

#### Backend (All Complete)
- ✅ `SoulIntegrationMapping` Prisma schema
- ✅ Matrix DTOs (`matrix.dto.ts`)
- ✅ Matrix Repository (`matrix.repository.ts`)
- ✅ Matrix Service (`matrix.service.ts`)
- ✅ Matrix Controller (`matrix.controller.ts`)
- ✅ Module registration

#### Frontend (All Complete)
- ✅ Matrix types (`types.ts`)
- ✅ Matrix hooks (`use-matrix.ts`)
- ✅ Matrix grid component (`matrix-grid.component.tsx`)
- ✅ Matrix cell component (`matrix-cell.component.tsx`)
- ✅ Matrix list component (`matrix-list.component.tsx`)
- ✅ Matrix page (`/axon/matrix`)
- ✅ AXON navigation with Matrix link

### 2.2 API Endpoints (Complete)

| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/axon/matrix` | ✅ |
| GET | `/axon/matrix/souls/:soulId/integrations` | ✅ |
| GET | `/axon/matrix/integrations/:integrationId/souls` | ✅ |
| POST | `/axon/matrix/mappings` | ✅ |
| POST | `/axon/matrix/mappings/toggle` | ✅ |
| POST | `/axon/matrix/mappings/bulk` | ✅ |
| PATCH | `/axon/matrix/mappings/:id` | ✅ |
| DELETE | `/axon/matrix/mappings/:id` | ✅ |
| POST | `/axon/matrix/mappings/:id/primary` | ✅ |

---

## 3. Phase 2: Account-Integration Linking

### 3.1 Overview

Link Firestore Accounts to PostgreSQL Integrations to enable:
- Know which credentials belong to which OAuth channel
- Track which Account is used for which channel
- Enable future proxy-based posting

### 3.2 Schema Changes

#### 3.2.1 Add `accountId` to SoulIntegrationMapping

**File:** `libraries/nestjs-libraries/src/database/prisma/schema.prisma`

```prisma
model SoulIntegrationMapping {
  id             String       @id @default(cuid())
  soulId         String
  integrationId  String
  organizationId String
  
  // NEW: Link to specific Account
  accountId      String?      // Firestore Account ID
  
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

#### 3.2.2 Add `integrationId` to Account (Firestore)

**File:** `libraries/nestjs-libraries/src/dtos/axon/account.dto.ts`

```typescript
// Add to Account interface
export interface Account extends FirestoreDocument {
  // ... existing fields ...
  
  integrationId?: string;  // NEW: Link to PostgreSQL Integration
}

// Add to CreateAccountDto
export class CreateAccountDto {
  // ... existing fields ...
  
  @ApiPropertyOptional({ description: 'Linked Integration ID' })
  @IsString()
  @IsOptional()
  integrationId?: string;
}

// Add to UpdateAccountDto
export class UpdateAccountDto {
  // ... existing fields ...
  
  @ApiPropertyOptional({ description: 'Linked Integration ID' })
  @IsString()
  @IsOptional()
  integrationId?: string;
}

// Add to AccountResponseDto
export class AccountResponseDto {
  // ... existing fields ...
  
  @ApiPropertyOptional({ description: 'Linked Integration ID' })
  integrationId?: string;
}
```

### 3.3 Backend Implementation

#### 3.3.1 Update Account Repository

**File:** `libraries/nestjs-libraries/src/database/firestore/collections/accounts/account.repository.ts`

Add methods:

```typescript
async linkIntegration(organizationId: string, accountId: string, integrationId: string): Promise<void> {
  const account = await this.findById(organizationId, accountId);
  if (!account) {
    throw new NotFoundException('Account not found');
  }
  await this.firestore.update<Account>(COLLECTION, accountId, { integrationId });
}

async unlinkIntegration(organizationId: string, accountId: string): Promise<void> {
  const account = await this.findById(organizationId, accountId);
  if (!account) {
    throw new NotFoundException('Account not found');
  }
  await this.firestore.update<Account>(COLLECTION, accountId, { integrationId: null });
}

async findByIntegrationId(organizationId: string, integrationId: string): Promise<Account | null> {
  const results = await this.firestore.query<Account>(COLLECTION, [
    { field: 'organizationId', operator: '==', value: organizationId },
    { field: 'integrationId', operator: '==', value: integrationId },
  ], 1);
  return results[0] || null;
}
```

#### 3.3.2 Update Account Service

**File:** `libraries/nestjs-libraries/src/database/firestore/collections/accounts/account.service.ts`

Add methods:

```typescript
async linkToIntegration(
  organizationId: string, 
  accountId: string, 
  integrationId: string
): Promise<AccountResponseDto> {
  // Validate integration exists and belongs to org
  const integration = await this.integrationService.findById(integrationId);
  if (!integration || integration.organizationId !== organizationId) {
    throw new NotFoundException('Integration not found');
  }
  
  // Check platform match
  const account = await this.findById(organizationId, accountId);
  if (account.platform !== integration.providerIdentifier) {
    throw new BadRequestException('Platform mismatch between account and integration');
  }
  
  await this.accountRepository.linkIntegration(organizationId, accountId, integrationId);
  return this.findById(organizationId, accountId);
}

async unlinkFromIntegration(
  organizationId: string, 
  accountId: string
): Promise<AccountResponseDto> {
  await this.accountRepository.unlinkIntegration(organizationId, accountId);
  return this.findById(organizationId, accountId);
}

async autoLinkByHandle(
  organizationId: string, 
  integrationId: string,
  platform: string,
  handle: string
): Promise<AccountResponseDto | null> {
  // Find account by platform + handle
  const account = await this.accountRepository.findByHandle(organizationId, platform, handle);
  if (!account) {
    return null;
  }
  
  // Link if not already linked
  if (!account.integrationId) {
    await this.accountRepository.linkIntegration(organizationId, account.id, integrationId);
  }
  
  return this.findById(organizationId, account.id);
}
```

#### 3.3.3 Update Accounts Controller

**File:** `apps/backend/src/api/routes/accounts.controller.ts`

Add endpoints:

```typescript
@Patch(':id/integration')
@ApiOperation({ summary: 'Link account to integration' })
async linkIntegration(
  @GetOrgFromRequest() org: Organization,
  @Param('id') id: string,
  @Body() dto: { integrationId: string | null }
) {
  if (dto.integrationId) {
    return this.accountService.linkToIntegration(org.id, id, dto.integrationId);
  } else {
    return this.accountService.unlinkFromIntegration(org.id, id);
  }
}
```

#### 3.3.4 Update Matrix Service

**File:** `libraries/nestjs-libraries/src/database/prisma/matrix/matrix.service.ts`

Update to include accountId in mappings:

```typescript
async createMapping(data: CreateMappingDto, organizationId: string, userId?: string) {
  // ... existing validation ...
  
  // Auto-find account for this soul + integration's platform
  let accountId: string | undefined;
  const integration = await this.integrationService.findById(data.integrationId);
  if (integration) {
    const accounts = await this.accountService.findBySoulId(organizationId, data.soulId);
    const matchingAccount = accounts.find(a => 
      a.platform === integration.providerIdentifier
    );
    accountId = matchingAccount?.id;
  }
  
  return this.matrixRepository.createMapping({
    ...data,
    accountId,
    organizationId,
    createdBy: userId,
  });
}
```

### 3.4 Frontend Implementation

#### 3.4.1 Update Types

**File:** `apps/frontend/src/components/axon/types.ts`

```typescript
export interface Account {
  // ... existing fields ...
  integrationId?: string;
  integration?: {
    id: string;
    name: string;
    platform: string;
    picture?: string;
  };
}

export interface MatrixMapping {
  // ... existing fields ...
  accountId?: string;
  account?: {
    id: string;
    handle: string;
    platform: string;
  };
}
```

#### 3.4.2 Add Integration Link UI

**File:** `apps/frontend/src/components/axon/accounts/account-integration-link.tsx`

```typescript
'use client';

import { FC, useState } from 'react';
import { useIntegrations } from '@/hooks/use-integrations';
import { useToaster } from '@gitroom/react/toaster/toaster';

interface AccountIntegrationLinkProps {
  accountId: string;
  platform: string;
  currentIntegrationId?: string;
  onLink: (integrationId: string | null) => Promise<void>;
}

export const AccountIntegrationLink: FC<AccountIntegrationLinkProps> = ({
  accountId,
  platform,
  currentIntegrationId,
  onLink,
}) => {
  const { data: integrations } = useIntegrations();
  const [isLoading, setIsLoading] = useState(false);
  const toaster = useToaster();
  
  // Filter integrations by platform
  const compatibleIntegrations = integrations?.filter(
    (i) => i.providerIdentifier === platform
  ) || [];
  
  const handleLink = async (integrationId: string | null) => {
    setIsLoading(true);
    try {
      await onLink(integrationId);
      toaster.show(
        integrationId ? 'Account linked to channel' : 'Account unlinked',
        'success'
      );
    } catch (error) {
      toaster.show('Failed to link account', 'warning');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-2">
      <label className="text-sm text-textItemBlur">Linked Channel</label>
      <select
        value={currentIntegrationId || ''}
        onChange={(e) => handleLink(e.target.value || null)}
        disabled={isLoading}
        className="w-full p-2 bg-newBgColor border border-newTableBorder rounded-[8px]"
      >
        <option value="">-- Not Linked --</option>
        {compatibleIntegrations.map((integration) => (
          <option key={integration.id} value={integration.id}>
            {integration.name} ({integration.providerIdentifier})
          </option>
        ))}
      </select>
      {compatibleIntegrations.length === 0 && (
        <p className="text-xs text-textItemBlur">
          No {platform} channels connected. Connect one first.
        </p>
      )}
    </div>
  );
};
```

### 3.5 Migration Steps

1. **Database Migration:**
   ```bash
   # Add accountId column to soul_integration_mapping
   pnpm run prisma-db-push
   ```

2. **Backend Deployment:**
   - Deploy updated Account service with integration linking
   - Deploy updated Matrix service with accountId support

3. **Frontend Deployment:**
   - Deploy updated Account management UI
   - Deploy updated Matrix view with account info

4. **Data Migration (Optional):**
   - Run script to auto-link existing accounts to integrations by matching platform + handle

---

## 4. Phase 3: Proxy-Based Operations (Future)

### 4.1 Overview

Use assigned proxies when making API calls or browser automation.

### 4.2 Implementation Areas

#### 4.2.1 HTTP Client with Proxy Support

```typescript
// Example: Proxy-aware HTTP client
import { HttpsProxyAgent } from 'https-proxy-agent';

class ProxyHttpClient {
  async request(url: string, options: RequestOptions, proxy?: Proxy) {
    if (proxy) {
      const proxyUrl = `http://${proxy.credentials.username}:${proxy.credentials.password}@${proxy.host}:${proxy.port}`;
      const agent = new HttpsProxyAgent(proxyUrl);
      options.agent = agent;
    }
    return fetch(url, options);
  }
}
```

#### 4.2.2 Integration Provider with Proxy

```typescript
// Example: X Provider with proxy support
class XProviderWithProxy extends XProvider {
  async post(
    id: string,
    accessToken: string,
    postDetails: PostDetails[],
    integration: Integration,
    proxy?: Proxy  // NEW: Optional proxy
  ): Promise<PostResponse[]> {
    const client = new TwitterApi(accessToken, {
      httpAgent: proxy ? this.createProxyAgent(proxy) : undefined,
    });
    // ... rest of posting logic
  }
}
```

### 4.3 Posting Flow with Proxy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PROXY-BASED POSTING FLOW (Future)                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Post Scheduled                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Post.integrationId → Integration                                │    │
│  │  Mapping.accountId → Account                                     │    │
│  │  Account.proxyId → Proxy                                         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                               │                                          │
│                               ▼                                          │
│  2. Temporal Workflow                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  - Fetch Integration (OAuth token)                               │    │
│  │  - Fetch Account (via mapping.accountId)                         │    │
│  │  - Fetch Proxy (via account.proxyId)                             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                               │                                          │
│                               ▼                                          │
│  3. Post via API with Proxy                                             │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  XProvider.post(token, postDetails, integration, proxy)          │    │
│  │    └── API call routed through proxy                             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Phase 4: Browser Automation (Future)

### 5.1 Overview

Use Puppeteer/Playwright for actions not supported by API:
- Login with credentials
- Actions requiring browser (some DMs, Stories, etc.)
- Account verification steps

### 5.2 Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      BROWSER AUTOMATION (Future)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                    Browser Worker Pool                          │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │     │
│  │  │ Worker 1 │  │ Worker 2 │  │ Worker 3 │  │ Worker N │       │     │
│  │  │ (Chrome) │  │ (Chrome) │  │ (Chrome) │  │ (Chrome) │       │     │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │     │
│  │       │             │             │             │              │     │
│  │       ▼             ▼             ▼             ▼              │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │     │
│  │  │ Proxy 1  │  │ Proxy 2  │  │ Proxy 3  │  │ Proxy N  │       │     │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  Actions supported:                                                     │
│  - Login with username/password/2FA                                     │
│  - Actions not available via API                                        │
│  - Account verification flows                                           │
│  - Session management                                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Service Structure

```typescript
// Future: Browser automation service
interface BrowserAutomationService {
  // Login to platform using stored credentials
  login(accountId: string): Promise<SessionInfo>;
  
  // Perform action requiring browser
  performAction(accountId: string, action: BrowserAction): Promise<ActionResult>;
  
  // Verify account (email/phone verification)
  verify(accountId: string, verificationData: VerificationData): Promise<void>;
}

interface BrowserAction {
  type: 'dm' | 'story' | 'follow' | 'like' | 'comment';
  payload: Record<string, unknown>;
}
```

---

## 6. Task Breakdown (Phase 2)

### 6.1 Backend Tasks

| Task | Description | Effort |
|------|-------------|--------|
| Update Prisma schema | Add `accountId` to SoulIntegrationMapping | Small |
| Update Account DTO | Add `integrationId` field | Small |
| Update Account Repository | Add link/unlink methods | Small |
| Update Account Service | Add integration linking logic | Medium |
| Update Accounts Controller | Add PATCH endpoint | Small |
| Update Matrix Service | Auto-populate accountId | Medium |
| Write tests | Unit tests for new functionality | Medium |

### 6.2 Frontend Tasks

| Task | Description | Effort |
|------|-------------|--------|
| Update Account types | Add integrationId | Small |
| Create AccountIntegrationLink component | Dropdown for linking | Medium |
| Update Account form | Include integration link UI | Small |
| Update Matrix cell | Show account status | Small |
| Update Account list | Show linked status | Small |

### 6.3 Total Effort Estimate

| Phase | Effort |
|-------|--------|
| Phase 2 (Account-Integration Link) | ~2-3 days |
| Phase 3 (Proxy-based posting) | ~1 week |
| Phase 4 (Browser automation) | ~2-3 weeks |

---

## 7. File Changes Summary

### 7.1 Files to Modify

```
libraries/nestjs-libraries/src/
├── database/prisma/
│   └── schema.prisma                          # Add accountId to mapping
├── database/prisma/matrix/
│   ├── matrix.repository.ts                   # Update create with accountId
│   └── matrix.service.ts                      # Auto-populate accountId
├── database/firestore/collections/accounts/
│   ├── account.repository.ts                  # Add integration link methods
│   └── account.service.ts                     # Add integration linking logic
└── dtos/axon/
    └── account.dto.ts                         # Add integrationId field

apps/backend/src/api/routes/
└── accounts.controller.ts                     # Add link endpoint

apps/frontend/src/components/axon/
├── types.ts                                   # Add integrationId to Account
├── accounts/
│   ├── account-form.tsx                       # Add integration selector
│   └── accounts-list.component.tsx            # Show linked status
└── matrix/
    └── matrix-cell.component.tsx              # Show account info
```

### 7.2 New Files

```
apps/frontend/src/components/axon/accounts/
└── account-integration-link.tsx               # NEW: Integration linking component
```

---

## 8. Related Documents

- **PRD**: `/docs/prd/M4-Soul-Channel-Matrix.md`
- **Tasks**: `/docs/tasks/m4-matrix-tasks.md`
- **Linear Epic**: [WEC-164](https://linear.app/wecrew-axon/issue/WEC-164)
