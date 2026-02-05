# M4: Soul-Channel-Account Management - Task Overview

## Overview

This document provides an overview of all tasks for the Soul-Channel-Account Management System.

**Epic**: [WEC-164](https://linear.app/wecrew-axon/issue/WEC-164)

---

## Phase 2 Task Documents

| Document | Description | Assignee |
|----------|-------------|----------|
| [m4-phase2-backend.md](./m4-phase2-backend.md) | Backend implementation tasks | Blake |
| [m4-phase2-frontend.md](./m4-phase2-frontend.md) | Frontend implementation tasks | Casey |
| [m4-phase2-tests.md](./m4-phase2-tests.md) | Test implementation tasks | All |

---

## Features

1. Many-to-many relationships between Souls and Integrations (Matrix)
2. Account-to-Integration linking
3. Credentials and proxy management
4. Future: Proxy-based posting and browser automation

---

## Phase Status Summary

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Soul-Channel Matrix | ✅ Complete |
| Phase 2 | Account-Integration Linking | 🔄 Ready to Start |
| Phase 3 | Proxy-Based Operations | 🔜 Future |
| Phase 4 | Browser Automation | 🔜 Future |

---

## Phase 1: Soul-Channel Matrix ✅ COMPLETE

### Backend Tasks (Blake) - All Complete

| Ticket | Title | Status |
|--------|-------|--------|
| WEC-165 | Create SoulIntegrationMapping Prisma Schema | ✅ Done |
| WEC-166 | Create Matrix DTOs | ✅ Done |
| WEC-167 | Create Matrix Repository | ✅ Done |
| WEC-168 | Create Matrix Service | ✅ Done |
| WEC-169 | Create Matrix Controller | ✅ Done |
| WEC-177 | Register Matrix Module in App | ✅ Done |
| WEC-178 | Matrix Backend Unit Tests | ✅ Done |

### Frontend Tasks (Casey) - All Complete

| Ticket | Title | Status |
|--------|-------|--------|
| WEC-170 | Create Matrix TypeScript Types | ✅ Done |
| WEC-171 | Create Matrix API Hooks | ✅ Done |
| WEC-173 | Create Matrix Cell Component | ✅ Done |
| WEC-172 | Create Matrix Grid Component | ✅ Done |
| WEC-175 | Add Matrix Navigation to AXON Sidebar | ✅ Done |
| WEC-174 | Create Matrix Page | ✅ Done |

---

## Phase 2: Account-Integration Linking 🔄

### Task Dependency Graph

```
                    ┌─────────────────────────────────────────┐
                    │      Phase 2: Account-Integration       │
                    │              Linking                    │
                    └─────────────────────────────────────────┘
                                        │
          ┌─────────────────────────────┼─────────────────────────────┐
          │                             │                             │
          ▼                             │                             ▼
┌─────────────────┐                     │               ┌─────────────────┐
│  WEC-201        │                     │               │  WEC-206        │
│  Prisma Schema  │                     │               │  FE Types       │
│  Update         │                     │               │  Update         │
│  (Blake)        │                     │               │  (Casey)        │
└────────┬────────┘                     │               └────────┬────────┘
         │                              │                        │
         ▼                              │                        │
┌─────────────────┐                     │                        │
│  WEC-202        │                     │                        │
│  Account DTO    │                     │                        │
│  Update         │                     │                        │
│  (Blake)        │                     │                        │
└────────┬────────┘                     │                        │
         │                              │                        │
         ▼                              │                        │
┌─────────────────┐                     │                        │
│  WEC-203        │                     │                        │
│  Account Repo   │                     │                        │
│  Link Methods   │                     │                        │
│  (Blake)        │                     │                        │
└────────┬────────┘                     │                        │
         │                              │                        │
         ▼                              │                        │
┌─────────────────┐                     │                        │
│  WEC-204        │                     │                        │
│  Account Service│                     │                        │
│  Link Logic     │                     │                        │
│  (Blake)        │                     │                        │
└────────┬────────┘                     │                        │
         │                              │                        │
         ▼                              │                        │
┌─────────────────┐                     │               ┌─────────────────┐
│  WEC-205        │                     │               │  WEC-207        │
│  Controller     │◄────────────────────┼───────────────│  Integration    │
│  Endpoint       │                     │               │  Link Component │
│  (Blake)        │                     │               │  (Casey)        │
└────────┬────────┘                     │               └────────┬────────┘
         │                              │                        │
         ▼                              │                        │
┌─────────────────┐                     │                        │
│  WEC-208        │                     │                        │
│  Matrix Service │                     │                        │
│  Auto-Link      │                     │                        │
│  (Blake)        │                     │                        │
└────────┬────────┘                     │                        │
         │                              │                        │
         └──────────────────────────────┼────────────────────────┤
                                        │                        │
                                        ▼                        ▼
                              ┌─────────────────┐      ┌─────────────────┐
                              │  WEC-209        │      │  WEC-210        │
                              │  Backend Tests  │      │  Frontend Tests │
                              │  (Blake)        │      │  (Casey)        │
                              └─────────────────┘      └─────────────────┘
```

### Backend Tasks (Blake)

| Ticket | Title | Priority | Status | Blocked By |
|--------|-------|----------|--------|------------|
| WEC-201 | Add accountId to SoulIntegrationMapping schema | High | Backlog | - |
| WEC-202 | Add integrationId to Account DTO | High | Backlog | - |
| WEC-203 | Add Account Repository link methods | High | Backlog | WEC-202 |
| WEC-204 | Add Account Service link logic | High | Backlog | WEC-203 |
| WEC-205 | Add Account Controller link endpoint | High | Backlog | WEC-204 |
| WEC-208 | Update Matrix Service auto-link | Medium | Backlog | WEC-201, WEC-204 |
| WEC-209 | Phase 2 Backend Tests | Medium | Backlog | WEC-208 |

### Frontend Tasks (Casey)

| Ticket | Title | Priority | Status | Blocked By |
|--------|-------|----------|--------|------------|
| WEC-206 | Update Account types with integrationId | High | Backlog | - |
| WEC-207 | Create AccountIntegrationLink component | High | Backlog | WEC-206, WEC-205 |
| WEC-210 | Phase 2 Frontend Tests | Medium | Backlog | WEC-207 |

### Task Details

#### WEC-201: Add accountId to SoulIntegrationMapping schema

**File:** `libraries/nestjs-libraries/src/database/prisma/schema.prisma`

**Changes:**
```prisma
model SoulIntegrationMapping {
  // ... existing fields ...
  accountId      String?      // NEW: Firestore Account ID
  @@index([accountId])        // NEW: Index for lookups
}
```

**Acceptance Criteria:**
- [ ] accountId field added to schema
- [ ] Index created for accountId
- [ ] Migration runs successfully
- [ ] Existing mappings unaffected (null accountId)

---

#### WEC-202: Add integrationId to Account DTO

**File:** `libraries/nestjs-libraries/src/dtos/axon/account.dto.ts`

**Changes:**
- Add `integrationId?: string` to Account interface
- Add to CreateAccountDto
- Add to UpdateAccountDto
- Add to AccountResponseDto

**Acceptance Criteria:**
- [ ] integrationId field in all relevant DTOs
- [ ] Optional field (not required)
- [ ] Validation decorators added

---

#### WEC-203: Add Account Repository link methods

**File:** `libraries/nestjs-libraries/src/database/firestore/collections/accounts/account.repository.ts`

**New Methods:**
```typescript
linkIntegration(orgId, accountId, integrationId)
unlinkIntegration(orgId, accountId)
findByIntegrationId(orgId, integrationId)
```

**Acceptance Criteria:**
- [ ] linkIntegration method implemented
- [ ] unlinkIntegration method implemented
- [ ] findByIntegrationId method implemented
- [ ] Proper error handling

---

#### WEC-204: Add Account Service link logic

**File:** `libraries/nestjs-libraries/src/database/firestore/collections/accounts/account.service.ts`

**New Methods:**
```typescript
linkToIntegration(orgId, accountId, integrationId)
unlinkFromIntegration(orgId, accountId)
autoLinkByHandle(orgId, integrationId, platform, handle)
```

**Acceptance Criteria:**
- [ ] Platform validation (account.platform === integration.providerIdentifier)
- [ ] Proper error messages
- [ ] autoLinkByHandle finds and links matching account

---

#### WEC-205: Add Account Controller link endpoint

**File:** `apps/backend/src/api/routes/accounts.controller.ts`

**New Endpoint:**
```typescript
PATCH /axon/accounts/:id/integration
Body: { integrationId: string | null }
```

**Acceptance Criteria:**
- [ ] Endpoint created with proper guards
- [ ] Swagger documentation
- [ ] Returns updated account

---

#### WEC-206: Update Account types with integrationId

**File:** `apps/frontend/src/components/axon/types.ts`

**Changes:**
```typescript
interface Account {
  // ... existing ...
  integrationId?: string;
  integration?: {
    id: string;
    name: string;
    platform: string;
    picture?: string;
  };
}
```

**Acceptance Criteria:**
- [ ] integrationId in Account type
- [ ] Optional integration object for display

---

#### WEC-207: Create AccountIntegrationLink component

**File:** `apps/frontend/src/components/axon/accounts/account-integration-link.tsx`

**Component:**
- Dropdown showing compatible integrations (same platform)
- Link/unlink functionality
- Loading states
- Toast notifications

**Acceptance Criteria:**
- [ ] Shows only compatible integrations
- [ ] Can link to integration
- [ ] Can unlink from integration
- [ ] Loading state during operation
- [ ] Success/error toasts

---

#### WEC-208: Update Matrix Service auto-link

**File:** `libraries/nestjs-libraries/src/database/prisma/matrix/matrix.service.ts`

**Changes:**
- When creating mapping, auto-populate accountId by finding matching account (same soul + same platform as integration)

**Acceptance Criteria:**
- [ ] createMapping auto-finds accountId
- [ ] Works when account exists
- [ ] Works when no account (accountId = null)

---

### Developer Assignments (Phase 2)

#### Blake (Backend & Infrastructure)
- **Branch prefix**: `feature/blake/`
- **Tickets**: WEC-201, WEC-202, WEC-203, WEC-204, WEC-205, WEC-208, WEC-209
- **Total**: 7 tickets

#### Casey (Frontend)
- **Branch prefix**: `feature/casey/`
- **Tickets**: WEC-206, WEC-207, WEC-210
- **Total**: 3 tickets

---

## Phase 3: Proxy-Based Operations 🔜

### Overview

Enable using proxies for API calls when posting.

### Tasks (To Be Created)

| Ticket | Title | Assignee |
|--------|-------|----------|
| WEC-301 | Create ProxyHttpClient with proxy support | Blake |
| WEC-302 | Update Integration providers to accept proxy | Blake |
| WEC-303 | Update post workflow to fetch proxy | Blake |
| WEC-304 | Add proxy health check endpoint | Blake |
| WEC-305 | Add proxy status to Matrix UI | Casey |

### Dependencies

- Phase 2 must be complete (need account → integration → proxy chain)

---

## Phase 4: Browser Automation 🔜

### Overview

Use Puppeteer/Playwright for actions not available via API.

### Tasks (To Be Created)

| Ticket | Title | Assignee |
|--------|-------|----------|
| WEC-401 | Set up Playwright infrastructure | Blake |
| WEC-402 | Create browser worker pool | Blake |
| WEC-403 | Implement login with credentials | Blake |
| WEC-404 | Implement proxy configuration for browsers | Blake |
| WEC-405 | Create account verification flow | Blake |
| WEC-406 | Create browser action queue UI | Casey |

### Dependencies

- Phase 2 must be complete
- Phase 3 recommended (proxy support)

---

## Files Changed Summary

### Phase 1 (Complete)

```
✅ libraries/nestjs-libraries/src/database/prisma/schema.prisma
✅ libraries/nestjs-libraries/src/database/prisma/matrix/
✅ libraries/nestjs-libraries/src/dtos/matrix/
✅ apps/backend/src/api/routes/matrix.controller.ts
✅ apps/frontend/src/components/axon/matrix/
✅ apps/frontend/src/app/(app)/(site)/axon/matrix/
```

### Phase 2 (To Do)

```
📝 libraries/nestjs-libraries/src/database/prisma/schema.prisma (add accountId)
📝 libraries/nestjs-libraries/src/dtos/axon/account.dto.ts (add integrationId)
📝 libraries/nestjs-libraries/src/database/firestore/collections/accounts/account.repository.ts
📝 libraries/nestjs-libraries/src/database/firestore/collections/accounts/account.service.ts
📝 apps/backend/src/api/routes/accounts.controller.ts
📝 libraries/nestjs-libraries/src/database/prisma/matrix/matrix.service.ts
📝 apps/frontend/src/components/axon/types.ts
🆕 apps/frontend/src/components/axon/accounts/account-integration-link.tsx
```

---

## Success Criteria

### Phase 1 ✅
- [x] Users can connect any Soul to any Integration
- [x] Matrix UI displays all relationships at a glance
- [x] Bulk operations work for 50+ mappings
- [x] API response times < 200ms for matrix operations

### Phase 2
- [ ] Users can link Account to Integration
- [ ] Matrix shows which mappings have linked accounts
- [ ] Auto-linking works when creating mappings
- [ ] Platform validation prevents mismatched links

### Phase 3
- [ ] Posts can be made through configured proxies
- [ ] Proxy health is monitored
- [ ] Failed proxy falls back gracefully

### Phase 4
- [ ] Accounts can be logged in via browser
- [ ] Actions not available via API can be performed
- [ ] Sessions are managed securely

---

## Related Documents

- **PRD**: `/docs/prd/M4-Soul-Channel-Matrix.md`
- **Implementation Plan**: `/docs/implementation-plans/m4-matrix-implementation.md`
- **Linear Epic**: [WEC-164](https://linear.app/wecrew-axon/issue/WEC-164)
