# M4 Phase 2: Test Tasks

**Feature:** Account-Integration Linking
**Status:** Ready After Implementation

---

## Overview

Test coverage for the Account-Integration Linking feature:
- Backend unit tests
- Backend integration tests
- Frontend component tests
- E2E tests

---

## Test 1: Account Service Unit Tests

**Ticket:** WEC-209
**Priority:** High
**Effort:** Medium (2 hours)
**Blocked By:** WEC-204

### File to Create/Modify
`libraries/nestjs-libraries/src/database/firestore/collections/accounts/account.service.spec.ts`

### Test Cases

```typescript
describe('AccountService - Integration Linking', () => {
  describe('linkToIntegration', () => {
    it('should link account to integration successfully', async () => {
      // Arrange
      const account = createMockAccount({ platform: 'twitter' });
      const integration = createMockIntegration({ providerIdentifier: 'twitter' });
      
      accountRepository.findById.mockResolvedValue(account);
      integrationService.getIntegrationById.mockResolvedValue(integration);
      accountRepository.findByIntegrationId.mockResolvedValue(null);
      
      // Act
      const result = await service.linkToIntegration('org-1', account.id, integration.id);
      
      // Assert
      expect(accountRepository.linkIntegration).toHaveBeenCalledWith(
        'org-1', account.id, integration.id
      );
      expect(result.integrationId).toBe(integration.id);
    });

    it('should throw error when account not found', async () => {
      accountRepository.findById.mockResolvedValue(null);
      
      await expect(
        service.linkToIntegration('org-1', 'invalid-id', 'int-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error when integration not found', async () => {
      const account = createMockAccount();
      accountRepository.findById.mockResolvedValue(account);
      integrationService.getIntegrationById.mockResolvedValue(null);
      
      await expect(
        service.linkToIntegration('org-1', account.id, 'invalid-int')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on platform mismatch', async () => {
      const account = createMockAccount({ platform: 'twitter' });
      const integration = createMockIntegration({ providerIdentifier: 'instagram' });
      
      accountRepository.findById.mockResolvedValue(account);
      integrationService.getIntegrationById.mockResolvedValue(integration);
      
      await expect(
        service.linkToIntegration('org-1', account.id, integration.id)
      ).rejects.toThrow(BadRequestException);
      expect(accountRepository.linkIntegration).not.toHaveBeenCalled();
    });

    it('should throw error when integration already linked to another account', async () => {
      const account1 = createMockAccount({ id: 'acc-1', platform: 'twitter' });
      const account2 = createMockAccount({ id: 'acc-2', platform: 'twitter' });
      const integration = createMockIntegration({ providerIdentifier: 'twitter' });
      
      accountRepository.findById.mockResolvedValue(account1);
      integrationService.getIntegrationById.mockResolvedValue(integration);
      accountRepository.findByIntegrationId.mockResolvedValue(account2);
      
      await expect(
        service.linkToIntegration('org-1', account1.id, integration.id)
      ).rejects.toThrow(ConflictException);
    });

    it('should allow re-linking same account to same integration', async () => {
      const account = createMockAccount({ 
        id: 'acc-1', 
        platform: 'twitter',
        integrationId: 'int-1' 
      });
      const integration = createMockIntegration({ 
        id: 'int-1',
        providerIdentifier: 'twitter' 
      });
      
      accountRepository.findById.mockResolvedValue(account);
      integrationService.getIntegrationById.mockResolvedValue(integration);
      accountRepository.findByIntegrationId.mockResolvedValue(account);
      
      // Should not throw
      await service.linkToIntegration('org-1', account.id, integration.id);
    });
  });

  describe('unlinkFromIntegration', () => {
    it('should unlink account from integration successfully', async () => {
      const account = createMockAccount({ integrationId: 'int-1' });
      accountRepository.findById.mockResolvedValue(account);
      
      await service.unlinkFromIntegration('org-1', account.id);
      
      expect(accountRepository.unlinkIntegration).toHaveBeenCalledWith(
        'org-1', account.id
      );
    });

    it('should throw error when account not found', async () => {
      accountRepository.findById.mockResolvedValue(null);
      
      await expect(
        service.unlinkFromIntegration('org-1', 'invalid-id')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('autoLinkByHandle', () => {
    it('should auto-link account when matching handle found', async () => {
      const account = createMockAccount({ 
        handle: '@techbrand', 
        platform: 'twitter',
        integrationId: undefined 
      });
      
      accountRepository.findByHandle.mockResolvedValue(account);
      
      const result = await service.autoLinkByHandle(
        'org-1', 'int-1', 'twitter', '@techbrand'
      );
      
      expect(accountRepository.linkIntegration).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should return null when no matching account found', async () => {
      accountRepository.findByHandle.mockResolvedValue(null);
      
      const result = await service.autoLinkByHandle(
        'org-1', 'int-1', 'twitter', '@unknown'
      );
      
      expect(result).toBeNull();
      expect(accountRepository.linkIntegration).not.toHaveBeenCalled();
    });

    it('should not re-link if account already linked to different integration', async () => {
      const account = createMockAccount({ 
        handle: '@techbrand', 
        platform: 'twitter',
        integrationId: 'other-int' 
      });
      
      accountRepository.findByHandle.mockResolvedValue(account);
      
      const result = await service.autoLinkByHandle(
        'org-1', 'int-1', 'twitter', '@techbrand'
      );
      
      expect(result).toBeNull();
      expect(accountRepository.linkIntegration).not.toHaveBeenCalled();
    });
  });
});
```

### Acceptance Criteria
- [ ] All test cases pass
- [ ] Edge cases covered
- [ ] Mocks properly set up
- [ ] >90% coverage on new methods

---

## Test 2: Account Repository Unit Tests

**Ticket:** WEC-215
**Priority:** Medium
**Effort:** Small (1 hour)
**Blocked By:** WEC-203

### File to Create/Modify
`libraries/nestjs-libraries/src/database/firestore/collections/accounts/account.repository.spec.ts`

### Test Cases

```typescript
describe('AccountRepository - Integration Linking', () => {
  describe('linkIntegration', () => {
    it('should update account with integrationId', async () => {
      const mockAccount = createMockAccount();
      firestoreService.findById.mockResolvedValue(mockAccount);
      
      await repository.linkIntegration('org-1', 'acc-1', 'int-1');
      
      expect(firestoreService.update).toHaveBeenCalledWith(
        'accounts',
        'acc-1',
        expect.objectContaining({ integrationId: 'int-1' })
      );
    });

    it('should throw NotFoundException when account not found', async () => {
      firestoreService.findById.mockResolvedValue(null);
      
      await expect(
        repository.linkIntegration('org-1', 'invalid', 'int-1')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('unlinkIntegration', () => {
    it('should set integrationId to null', async () => {
      const mockAccount = createMockAccount({ integrationId: 'int-1' });
      firestoreService.findById.mockResolvedValue(mockAccount);
      
      await repository.unlinkIntegration('org-1', 'acc-1');
      
      expect(firestoreService.update).toHaveBeenCalledWith(
        'accounts',
        'acc-1',
        expect.objectContaining({ integrationId: null })
      );
    });
  });

  describe('findByIntegrationId', () => {
    it('should return account when found', async () => {
      const mockAccount = createMockAccount({ integrationId: 'int-1' });
      firestoreService.query.mockResolvedValue([mockAccount]);
      
      const result = await repository.findByIntegrationId('org-1', 'int-1');
      
      expect(result).toEqual(mockAccount);
    });

    it('should return null when not found', async () => {
      firestoreService.query.mockResolvedValue([]);
      
      const result = await repository.findByIntegrationId('org-1', 'int-1');
      
      expect(result).toBeNull();
    });
  });
});
```

### Acceptance Criteria
- [ ] All test cases pass
- [ ] Firestore interactions properly tested
- [ ] Error cases covered

---

## Test 3: Accounts Controller Tests

**Ticket:** WEC-216
**Priority:** Medium
**Effort:** Small (1 hour)
**Blocked By:** WEC-205

### File to Create/Modify
`apps/backend/src/api/routes/accounts.controller.spec.ts`

### Test Cases

```typescript
describe('AccountsController - Integration Linking', () => {
  describe('PATCH /axon/accounts/:id/integration', () => {
    it('should link account to integration', async () => {
      const mockAccount = createMockAccount({ integrationId: 'int-1' });
      accountService.linkToIntegration.mockResolvedValue(mockAccount);
      
      const result = await controller.linkIntegration(
        mockOrg,
        'acc-1',
        { integrationId: 'int-1' }
      );
      
      expect(accountService.linkToIntegration).toHaveBeenCalledWith(
        mockOrg.id, 'acc-1', 'int-1'
      );
      expect(result.integrationId).toBe('int-1');
    });

    it('should unlink account from integration', async () => {
      const mockAccount = createMockAccount({ integrationId: undefined });
      accountService.unlinkFromIntegration.mockResolvedValue(mockAccount);
      
      const result = await controller.linkIntegration(
        mockOrg,
        'acc-1',
        { integrationId: null }
      );
      
      expect(accountService.unlinkFromIntegration).toHaveBeenCalledWith(
        mockOrg.id, 'acc-1'
      );
    });

    it('should return 404 when account not found', async () => {
      accountService.linkToIntegration.mockRejectedValue(
        new NotFoundException('Account not found')
      );
      
      await expect(
        controller.linkIntegration(mockOrg, 'invalid', { integrationId: 'int-1' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should return 400 on platform mismatch', async () => {
      accountService.linkToIntegration.mockRejectedValue(
        new BadRequestException('Platform mismatch')
      );
      
      await expect(
        controller.linkIntegration(mockOrg, 'acc-1', { integrationId: 'int-1' })
      ).rejects.toThrow(BadRequestException);
    });
  });
});
```

### Acceptance Criteria
- [ ] All test cases pass
- [ ] HTTP status codes properly tested
- [ ] Guards tested

---

## Test 4: Matrix Service Tests (Update)

**Ticket:** WEC-217
**Priority:** Medium
**Effort:** Small (1 hour)
**Blocked By:** WEC-208

### File to Modify
`libraries/nestjs-libraries/src/database/prisma/matrix/matrix.service.spec.ts`

### New Test Cases

```typescript
describe('MatrixService - Account Linking', () => {
  describe('createMapping with auto-link', () => {
    it('should auto-populate accountId when matching account exists', async () => {
      const soul = createMockSoul();
      const integration = createMockIntegration({ providerIdentifier: 'twitter' });
      const account = createMockAccount({ 
        soulId: soul.id, 
        platform: 'twitter' 
      });
      
      soulRepository.findById.mockResolvedValue(soul);
      matrixRepository.findMapping.mockResolvedValue(null);
      matrixRepository.getIntegrationsForOrg.mockResolvedValue([integration]);
      accountService.findBySoulId.mockResolvedValue([account]);
      
      await service.createMapping(
        { soulId: soul.id, integrationId: integration.id },
        'org-1',
        'user-1'
      );
      
      expect(matrixRepository.createMapping).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: account.id,
        })
      );
    });

    it('should create mapping with null accountId when no matching account', async () => {
      const soul = createMockSoul();
      const integration = createMockIntegration({ providerIdentifier: 'twitter' });
      
      soulRepository.findById.mockResolvedValue(soul);
      matrixRepository.findMapping.mockResolvedValue(null);
      matrixRepository.getIntegrationsForOrg.mockResolvedValue([integration]);
      accountService.findBySoulId.mockResolvedValue([]); // No accounts
      
      await service.createMapping(
        { soulId: soul.id, integrationId: integration.id },
        'org-1',
        'user-1'
      );
      
      expect(matrixRepository.createMapping).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: undefined,
        })
      );
    });

    it('should create mapping even if account lookup fails', async () => {
      const soul = createMockSoul();
      
      soulRepository.findById.mockResolvedValue(soul);
      matrixRepository.findMapping.mockResolvedValue(null);
      matrixRepository.getIntegrationsForOrg.mockRejectedValue(new Error('DB error'));
      
      // Should not throw, just proceed without accountId
      await service.createMapping(
        { soulId: soul.id, integrationId: 'int-1' },
        'org-1',
        'user-1'
      );
      
      expect(matrixRepository.createMapping).toHaveBeenCalled();
    });
  });
});
```

### Acceptance Criteria
- [ ] Auto-link logic tested
- [ ] Edge cases covered
- [ ] Non-fatal error handling tested

---

## Test 5: Frontend Component Tests

**Ticket:** WEC-210
**Priority:** Medium
**Effort:** Medium (2 hours)
**Blocked By:** WEC-207

### File to Create
`apps/frontend/src/components/axon/accounts/__tests__/account-integration-link.spec.tsx`

### Test Cases

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountIntegrationLink } from '../account-integration-link';

// Mock fetch
const mockFetch = jest.fn();
jest.mock('@gitroom/helpers/utils/custom.fetch', () => ({
  useFetch: () => mockFetch,
}));

// Mock SWR
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('AccountIntegrationLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dropdown with compatible integrations', () => {
    const mockIntegrations = [
      { id: 'int-1', name: '@brand', providerIdentifier: 'twitter', disabled: false },
      { id: 'int-2', name: '@other', providerIdentifier: 'instagram', disabled: false },
    ];
    
    require('swr').default.mockReturnValue({ data: mockIntegrations });
    
    render(
      <AccountIntegrationLink
        accountId="acc-1"
        platform="twitter"
        currentIntegrationId={undefined}
      />
    );
    
    // Should only show twitter integration
    expect(screen.getByText('@brand')).toBeInTheDocument();
    expect(screen.queryByText('@other')).not.toBeInTheDocument();
  });

  it('should show "Not Linked" option', () => {
    require('swr').default.mockReturnValue({ data: [] });
    
    render(
      <AccountIntegrationLink
        accountId="acc-1"
        platform="twitter"
        currentIntegrationId={undefined}
      />
    );
    
    expect(screen.getByText('-- Not Linked --')).toBeInTheDocument();
  });

  it('should call API when selection changes', async () => {
    const mockIntegrations = [
      { id: 'int-1', name: '@brand', providerIdentifier: 'twitter', disabled: false },
    ];
    
    require('swr').default.mockReturnValue({ data: mockIntegrations });
    mockFetch.mockResolvedValue({});
    
    render(
      <AccountIntegrationLink
        accountId="acc-1"
        platform="twitter"
        currentIntegrationId={undefined}
      />
    );
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'int-1' } });
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/axon/accounts/acc-1/integration',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ integrationId: 'int-1' }),
        })
      );
    });
  });

  it('should show loading state during operation', async () => {
    require('swr').default.mockReturnValue({ data: [] });
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(
      <AccountIntegrationLink
        accountId="acc-1"
        platform="twitter"
        currentIntegrationId="int-1"
      />
    );
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '' } });
    
    await waitFor(() => {
      expect(screen.getByText('Updating...')).toBeInTheDocument();
    });
  });

  it('should show message when no compatible integrations', () => {
    require('swr').default.mockReturnValue({ data: [] });
    
    render(
      <AccountIntegrationLink
        accountId="acc-1"
        platform="twitter"
        currentIntegrationId={undefined}
      />
    );
    
    expect(screen.getByText(/No twitter channels connected/)).toBeInTheDocument();
  });

  it('should call onUpdate callback after successful link', async () => {
    const mockIntegrations = [
      { id: 'int-1', name: '@brand', providerIdentifier: 'twitter', disabled: false },
    ];
    
    require('swr').default.mockReturnValue({ data: mockIntegrations });
    mockFetch.mockResolvedValue({});
    
    const onUpdate = jest.fn();
    
    render(
      <AccountIntegrationLink
        accountId="acc-1"
        platform="twitter"
        currentIntegrationId={undefined}
        onUpdate={onUpdate}
      />
    );
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'int-1' } });
    
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled();
    });
  });
});
```

### Acceptance Criteria
- [ ] All test cases pass
- [ ] Loading states tested
- [ ] Error handling tested
- [ ] Callback invocation tested

---

## Test 6: E2E Tests

**Ticket:** WEC-218
**Priority:** Low
**Effort:** Medium (2 hours)
**Blocked By:** All other tests

### File to Create
`e2e/account-integration-link.spec.ts`

### Test Cases

```typescript
import { test, expect } from '@playwright/test';

test.describe('Account-Integration Linking', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to accounts page
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/');
    
    await page.goto('/axon/accounts');
  });

  test('should link account to integration', async ({ page }) => {
    // Click on an account to open details
    await page.click('[data-testid="account-card"]:first-child');
    
    // Find integration dropdown
    const dropdown = page.locator('[data-testid="integration-link-dropdown"]');
    await expect(dropdown).toBeVisible();
    
    // Select an integration
    await dropdown.selectOption({ label: '@testbrand' });
    
    // Wait for success toast
    await expect(page.locator('.toast-success')).toContainText('Account linked');
    
    // Verify link indicator shows
    await expect(page.locator('[data-testid="integration-linked-badge"]')).toBeVisible();
  });

  test('should unlink account from integration', async ({ page }) => {
    // Navigate to a linked account
    await page.click('[data-testid="account-card"][data-linked="true"]:first-child');
    
    // Find integration dropdown
    const dropdown = page.locator('[data-testid="integration-link-dropdown"]');
    
    // Select "Not Linked" option
    await dropdown.selectOption({ value: '' });
    
    // Wait for success toast
    await expect(page.locator('.toast-success')).toContainText('Account unlinked');
  });

  test('should show link status in accounts list', async ({ page }) => {
    // Check for linked indicator on account cards
    const linkedAccounts = page.locator('[data-testid="account-card"][data-linked="true"]');
    
    for (const card of await linkedAccounts.all()) {
      await expect(card.locator('[data-testid="linked-badge"]')).toBeVisible();
    }
  });

  test('should show account info in matrix', async ({ page }) => {
    await page.goto('/axon/matrix');
    
    // Find a mapped cell with account
    const cellWithAccount = page.locator('[data-testid="matrix-cell"][data-mapped="true"][data-has-account="true"]');
    
    if (await cellWithAccount.count() > 0) {
      // Should show account handle
      await expect(cellWithAccount.first().locator('.account-handle')).toBeVisible();
    }
  });
});
```

### Acceptance Criteria
- [ ] All E2E tests pass
- [ ] Tests run in CI pipeline
- [ ] Proper test data setup

---

## Test Summary

| # | Ticket | Title | Type | Effort |
|---|--------|-------|------|--------|
| 1 | WEC-209 | Account Service Unit Tests | Unit | Medium |
| 2 | WEC-215 | Account Repository Unit Tests | Unit | Small |
| 3 | WEC-216 | Accounts Controller Tests | Unit | Small |
| 4 | WEC-217 | Matrix Service Tests (Update) | Unit | Small |
| 5 | WEC-210 | Frontend Component Tests | Component | Medium |
| 6 | WEC-218 | E2E Tests | E2E | Medium |

**Total Effort:** ~8-9 hours

---

## Coverage Requirements

| Area | Target Coverage |
|------|-----------------|
| Account Service (new methods) | >90% |
| Account Repository (new methods) | >90% |
| Accounts Controller (new endpoint) | >80% |
| Matrix Service (auto-link) | >80% |
| AccountIntegrationLink component | >80% |

---

## Test Commands

```bash
# Run backend tests
pnpm run test

# Run specific test file
pnpm run test -- account.service.spec.ts

# Run frontend tests
cd apps/frontend && pnpm run test

# Run E2E tests
pnpm run test:e2e

# Run with coverage
pnpm run test -- --coverage
```

---

## Related Documents

- **PRD:** `/docs/prd/M4-Soul-Channel-Matrix.md`
- **Implementation Plan:** `/docs/implementation-plans/m4-matrix-implementation.md`
- **Backend Tasks:** `/docs/tasks/m4-phase2-backend.md`
- **Frontend Tasks:** `/docs/tasks/m4-phase2-frontend.md`
