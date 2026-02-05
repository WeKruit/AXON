# M4 Phase 2: Frontend Tasks

**Feature:** Account-Integration Linking
**Assignee:** Casey (Frontend Developer)
**Branch Prefix:** `feature/casey/`
**Status:** Ready to Start

---

## Overview

Build UI components to:
- Display integration link status on accounts
- Allow users to link/unlink accounts to integrations
- Show account info in the matrix view

---

## Task 1: Update Account Types

**Ticket:** WEC-206
**Priority:** High
**Effort:** Small (30 min)

### File to Modify
`apps/frontend/src/components/axon/types.ts`

### Changes

**Update Account interface:**
```typescript
export interface Account {
  id: string;
  soulId: string;
  soul?: Soul;
  platform: Platform;
  username: string;
  displayName?: string;
  profileUrl?: string;
  avatarUrl?: string;
  purpose: AccountPurpose;
  status: AccountStatus;
  proxyId?: string;
  proxy?: Proxy;
  warmupProgress?: number;
  lastActivityAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  
  // NEW: Integration link
  integrationId?: string;
  integration?: {
    id: string;
    name: string;
    platform: string;
    picture?: string;
    disabled: boolean;
  };
}
```

**Update MatrixMapping interface:**
```typescript
export interface MatrixMapping {
  id: string;
  soulId: string;
  integrationId: string;
  isPrimary: boolean;
  priority: number;
  createdAt: string;
  
  // NEW: Account link
  accountId?: string;
  account?: {
    id: string;
    handle: string;
    platform: string;
    status: string;
  };
}
```

### Acceptance Criteria
- [ ] `integrationId` added to Account interface
- [ ] `integration` object added to Account interface
- [ ] `accountId` added to MatrixMapping interface
- [ ] `account` object added to MatrixMapping interface

---

## Task 2: Create Account Integration Link Component

**Ticket:** WEC-207
**Priority:** High
**Effort:** Medium (2 hours)
**Blocked By:** WEC-206, WEC-205 (Backend endpoint)

### New File
`apps/frontend/src/components/axon/accounts/account-integration-link.tsx`

### Component Code

```typescript
'use client';

import { FC, useState, useMemo } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import useSWR from 'swr';

interface Integration {
  id: string;
  name: string;
  providerIdentifier: string;
  picture?: string;
  disabled: boolean;
}

interface AccountIntegrationLinkProps {
  accountId: string;
  platform: string;
  currentIntegrationId?: string;
  onUpdate?: () => void;
}

export const AccountIntegrationLink: FC<AccountIntegrationLinkProps> = ({
  accountId,
  platform,
  currentIntegrationId,
  onUpdate,
}) => {
  const fetch = useFetch();
  const toaster = useToaster();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all integrations for the organization
  const { data: integrations } = useSWR<Integration[]>(
    '/integrations/list',
    () => fetch('/integrations/list')
  );

  // Filter to only show integrations matching this account's platform
  const compatibleIntegrations = useMemo(() => {
    if (!integrations) return [];
    return integrations.filter(
      (i) => i.providerIdentifier === platform && !i.disabled
    );
  }, [integrations, platform]);

  // Find currently linked integration
  const currentIntegration = useMemo(() => {
    if (!currentIntegrationId || !integrations) return null;
    return integrations.find((i) => i.id === currentIntegrationId);
  }, [currentIntegrationId, integrations]);

  const handleLink = async (integrationId: string | null) => {
    setIsLoading(true);
    try {
      await fetch(`/axon/accounts/${accountId}/integration`, {
        method: 'PATCH',
        body: JSON.stringify({ integrationId }),
      });
      
      toaster.show(
        integrationId ? 'Account linked to channel' : 'Account unlinked from channel',
        'success'
      );
      
      onUpdate?.();
    } catch (error: any) {
      const message = error?.message || 'Failed to update link';
      toaster.show(message, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-textItemBlur">
        Linked Channel
      </label>
      
      {compatibleIntegrations.length === 0 ? (
        <div className="p-3 bg-newBgColor border border-newTableBorder rounded-[8px]">
          <p className="text-sm text-textItemBlur">
            No {platform} channels connected.
          </p>
          <a 
            href="/launches" 
            className="text-sm text-btnPrimary hover:underline"
          >
            Connect a {platform} channel first
          </a>
        </div>
      ) : (
        <>
          <select
            value={currentIntegrationId || ''}
            onChange={(e) => handleLink(e.target.value || null)}
            disabled={isLoading}
            className="w-full p-2.5 bg-newBgColor border border-newTableBorder rounded-[8px] 
                       text-newTextColor focus:border-btnPrimary focus:ring-1 focus:ring-btnPrimary
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">-- Not Linked --</option>
            {compatibleIntegrations.map((integration) => (
              <option key={integration.id} value={integration.id}>
                {integration.name}
              </option>
            ))}
          </select>
          
          {currentIntegration && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-[8px]">
              {currentIntegration.picture && (
                <img 
                  src={currentIntegration.picture} 
                  alt="" 
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="text-sm text-green-400">
                Linked to {currentIntegration.name}
              </span>
            </div>
          )}
        </>
      )}
      
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-textItemBlur">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" cy="12" r="10" 
              stroke="currentColor" 
              strokeWidth="4"
              fill="none"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Updating...
        </div>
      )}
    </div>
  );
};

export default AccountIntegrationLink;
```

### Acceptance Criteria
- [ ] Shows dropdown with compatible integrations only
- [ ] Shows "Not Linked" option
- [ ] Can link to an integration
- [ ] Can unlink from an integration
- [ ] Shows loading state during operation
- [ ] Shows success/error toasts
- [ ] Shows message when no compatible integrations exist
- [ ] Shows current linked integration info

---

## Task 3: Update Account Form/Modal

**Ticket:** WEC-211
**Priority:** High
**Effort:** Medium (1 hour)
**Blocked By:** WEC-207

### File to Modify
`apps/frontend/src/components/axon/accounts/create-account-modal.tsx` (or equivalent)

### Changes

Add the AccountIntegrationLink component to the account form:

```typescript
import { AccountIntegrationLink } from './account-integration-link';

// Inside the form, after proxy selection:
{/* Integration Link */}
{account && (
  <div className="mt-4">
    <AccountIntegrationLink
      accountId={account.id}
      platform={account.platform}
      currentIntegrationId={account.integrationId}
      onUpdate={() => mutate()}
    />
  </div>
)}
```

### Acceptance Criteria
- [ ] Integration link section appears in account form
- [ ] Only shows for existing accounts (not create mode)
- [ ] Refreshes account data after linking

---

## Task 4: Update Accounts List

**Ticket:** WEC-212
**Priority:** Medium
**Effort:** Small (45 min)
**Blocked By:** WEC-206

### File to Modify
`apps/frontend/src/components/axon/accounts/accounts-list.component.tsx`

### Changes

Add integration link status indicator to account cards:

```typescript
// In the account card component
<div className="flex items-center gap-2 text-sm">
  {/* Existing proxy indicator */}
  {account.proxyId && (
    <span className="flex items-center gap-1 text-textItemBlur">
      <svg className="w-4 h-4" /* proxy icon */ />
      Proxy
    </span>
  )}
  
  {/* NEW: Integration link indicator */}
  {account.integrationId ? (
    <span className="flex items-center gap-1 text-green-400">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      Channel Linked
    </span>
  ) : (
    <span className="flex items-center gap-1 text-yellow-400">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
      >
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
        <line x1="12" y1="2" x2="12" y2="12" />
      </svg>
      Not Linked
    </span>
  )}
</div>
```

### Acceptance Criteria
- [ ] Shows "Channel Linked" with green icon when linked
- [ ] Shows "Not Linked" with yellow icon when not linked
- [ ] Link icon is visually clear

---

## Task 5: Update Matrix Cell Component

**Ticket:** WEC-213
**Priority:** Medium
**Effort:** Small (45 min)
**Blocked By:** WEC-206

### File to Modify
`apps/frontend/src/components/axon/matrix/matrix-cell.component.tsx`

### Changes

Show account link status in matrix cell:

```typescript
interface MatrixCellProps {
  soulId: string;
  integrationId: string;
  isMapped: boolean;
  isPrimary: boolean;
  isSelected: boolean;
  bulkMode: boolean;
  accountId?: string;      // NEW
  accountHandle?: string;  // NEW
  onClick: (soulId: string, integrationId: string) => void;
  onSetPrimary?: () => void;
}

export const MatrixCell: FC<MatrixCellProps> = ({
  soulId,
  integrationId,
  isMapped,
  isPrimary,
  isSelected,
  bulkMode,
  accountId,
  accountHandle,
  onClick,
  onSetPrimary,
}) => {
  return (
    <td 
      className={`
        p-3 text-center cursor-pointer transition-all
        ${isMapped ? 'bg-btnPrimary/20' : 'bg-transparent'}
        ${isSelected ? 'ring-2 ring-btnPrimary' : ''}
        hover:bg-btnPrimary/10
      `}
      onClick={() => onClick(soulId, integrationId)}
    >
      <div className="flex flex-col items-center gap-1">
        {/* Mapping indicator */}
        <div 
          className={`
            w-6 h-6 rounded-full flex items-center justify-center
            ${isMapped ? 'bg-btnPrimary text-white' : 'border-2 border-newTableBorder'}
          `}
        >
          {isMapped && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        
        {/* Primary indicator */}
        {isPrimary && (
          <span className="text-yellow-500 text-xs">★</span>
        )}
        
        {/* NEW: Account link indicator */}
        {isMapped && accountId && (
          <span 
            className="text-xs text-green-400 truncate max-w-[80px]"
            title={`Linked: ${accountHandle}`}
          >
            {accountHandle}
          </span>
        )}
        
        {isMapped && !accountId && (
          <span className="text-xs text-yellow-400">No account</span>
        )}
      </div>
    </td>
  );
};
```

### Update Matrix Grid to Pass Account Data

```typescript
// In matrix-grid.component.tsx or matrix-list.component.tsx
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
      accountId={mapping?.accountId}           // NEW
      accountHandle={mapping?.account?.handle} // NEW
      onClick={handleCellClick}
      onSetPrimary={async () => {
        // Handle set primary
      }}
    />
  );
})}
```

### Acceptance Criteria
- [ ] Shows account handle when mapping has linked account
- [ ] Shows "No account" when mapping exists but no account linked
- [ ] Tooltip shows full handle on hover
- [ ] Visual distinction between linked and unlinked mappings

---

## Task 6: Add Integration Hook

**Ticket:** WEC-214
**Priority:** Medium
**Effort:** Small (30 min)

### File to Modify
`apps/frontend/src/components/axon/hooks/use-axon-api.ts`

### New Hook

```typescript
/**
 * Hook to link/unlink account to integration
 */
export function useAccountIntegration(accountId: string) {
  const fetch = useFetch();
  
  const linkIntegration = useCallback(
    async (integrationId: string | null) => {
      return fetch(`/axon/accounts/${accountId}/integration`, {
        method: 'PATCH',
        body: JSON.stringify({ integrationId }),
      });
    },
    [fetch, accountId]
  );
  
  return { linkIntegration };
}

/**
 * Hook to get integrations list
 */
export function useIntegrations(config?: SWRConfiguration) {
  const fetch = useFetch();
  
  const { data, error, isLoading, mutate } = useSWR(
    '/integrations/list',
    () => fetch('/integrations/list'),
    config
  );
  
  return {
    integrations: data || [],
    error,
    isLoading,
    mutate,
  };
}
```

### Acceptance Criteria
- [ ] `useAccountIntegration` hook created
- [ ] `useIntegrations` hook created
- [ ] Proper error handling

---

## Task Summary

| # | Ticket | Title | Effort | Blocked By |
|---|--------|-------|--------|------------|
| 1 | WEC-206 | Update Account Types | Small | - |
| 2 | WEC-207 | Create AccountIntegrationLink Component | Medium | WEC-206, Backend |
| 3 | WEC-211 | Update Account Form/Modal | Medium | WEC-207 |
| 4 | WEC-212 | Update Accounts List | Small | WEC-206 |
| 5 | WEC-213 | Update Matrix Cell Component | Small | WEC-206 |
| 6 | WEC-214 | Add Integration Hooks | Small | - |

**Total Effort:** ~5-6 hours

---

## Execution Order

```
Day 1:
├── WEC-206 (Types) - 30 min
├── WEC-214 (Hooks) - 30 min
└── WEC-207 (Link Component) - 2 hours

Day 2:
├── WEC-211 (Account Form) - 1 hour
├── WEC-212 (Accounts List) - 45 min
└── WEC-213 (Matrix Cell) - 45 min
```

---

## Component Tree

```
Account Management
├── AccountsList
│   └── AccountCard
│       ├── IntegrationStatusBadge (new)  
│       └── ProxyStatusBadge (existing)
├── AccountForm/Modal
│   └── AccountIntegrationLink (new)
└── AccountDetail
    └── AccountIntegrationLink (new)

Matrix View
└── MatrixGrid
    └── MatrixCell
        └── AccountIndicator (new)
```

---

## Related Documents

- **PRD:** `/docs/prd/M4-Soul-Channel-Matrix.md`
- **Implementation Plan:** `/docs/implementation-plans/m4-matrix-implementation.md`
- **Backend Tasks:** `/docs/tasks/m4-phase2-backend.md`
- **Test Tasks:** `/docs/tasks/m4-phase2-tests.md`
