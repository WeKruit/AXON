# PRD: M4 - Soul-Channel-Account Management System

**Version:** 2.0
**Date:** 2026-01-26
**Status:** In Progress
**Owner:** WeCrew Team

---

## 1. Executive Summary

The Soul-Channel-Account Management System is a comprehensive identity and channel management platform that enables users to manage multiple brand identities (Souls), each with their own social media accounts (Accounts), connected channels (Integrations), proxy/IP configurations, and credentials.

### 1.1 Problem Statement

Users need to manage multiple brand identities across multiple social media platforms with:
- Multiple accounts per identity (one per platform)
- Secure credential storage for each account
- IP/Proxy management for account safety
- OAuth-connected channels for publishing
- Clear relationships between accounts and channels

### 1.2 Solution Overview

A hierarchical management system:

```
User (Organization)
  └── Soul (Identity Container)
        ├── Account (Platform Credentials)
        │     ├── Credentials (username/password/tokens)
        │     ├── Proxy Assignment (IP management)
        │     └── Integration Link (OAuth channel)
        └── Channel Mappings (via Matrix)
              └── Integration (OAuth-connected channel)
```

---

## 2. Architecture Overview

### 2.1 Data Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FIRESTORE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Soul ─────────────────────────┐                                        │
│  ├── id                        │ 1:N                                    │
│  ├── organizationId            │                                        │
│  ├── name                      ▼                                        │
│  ├── description        Account                                         │
│  ├── status             ├── id                                          │
│  ├── personaId          ├── soulId ◄───────────────┘                    │
│  ├── proxyId            ├── platform (twitter, instagram, etc.)         │
│  ├── accountIds[] ─────►├── handle (@username)                          │
│  └── metadata           ├── displayName                                 │
│                         ├── status (active/inactive/suspended)          │
│                         ├── credentials ──────────┐                     │
│  Persona                │     ├── username        │ ENCRYPTED           │
│  ├── id                 │     ├── password        │                     │
│  ├── name               │     ├── accessToken     │                     │
│  ├── tone               │     ├── refreshToken    │                     │
│  ├── style              │     ├── apiKey          │                     │
│  └── systemPrompt       │     ├── apiSecret       │                     │
│                         │     ├── twoFactorSecret │                     │
│  Proxy                  │     └── backupCodes[]   ◄────────────────────┘│
│  ├── id                 ├── proxyId ─────────────────►Proxy              │
│  ├── name               ├── integrationId ───────────────┐ (NEW)        │
│  ├── host:port          ├── metrics                      │              │
│  ├── credentials        ├── warmingConfig                │              │
│  ├── type               └── lastActivityAt               │              │
│  ├── status                                              │              │
│  └── assignedAccountIds[]                                │              │
│                                                          │              │
└──────────────────────────────────────────────────────────┼──────────────┘
                                                           │
┌──────────────────────────────────────────────────────────┼──────────────┐
│                           POSTGRESQL                      │              │
├──────────────────────────────────────────────────────────┼──────────────┤
│                                                          │              │
│  Integration (Channel)◄──────────────────────────────────┘              │
│  ├── id                                                                 │
│  ├── organizationId                                                     │
│  ├── internalId (platform user ID)                                      │
│  ├── providerIdentifier (twitter, instagram, etc.)                      │
│  ├── name                                                               │
│  ├── token (OAuth access token)                                         │
│  ├── refreshToken                                                       │
│  ├── tokenExpiration                                                    │
│  ├── disabled                                                           │
│  └── soulMappings[] ───────────────────────────────┐                    │
│                                                    │                    │
│  SoulIntegrationMapping                            │                    │
│  ├── id                                            │                    │
│  ├── soulId (Firestore reference)                  │                    │
│  ├── integrationId ◄───────────────────────────────┘                    │
│  ├── accountId (Firestore reference) ─── NEW                            │
│  ├── organizationId                                                     │
│  ├── isPrimary                                                          │
│  ├── priority                                                           │
│  ├── notes                                                              │
│  └── createdAt/updatedAt                                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Entity Relationships

| From | To | Relationship | Storage |
|------|-----|--------------|---------|
| Organization | Soul | 1:N | Firestore |
| Soul | Account | 1:N | Firestore |
| Soul | Integration | M:N | PostgreSQL (via SoulIntegrationMapping) |
| Account | Proxy | N:1 | Firestore (proxyId reference) |
| Account | Integration | 1:1 | Firestore (integrationId reference) **NEW** |
| Proxy | Account | 1:N | Firestore (assignedAccountIds[]) |

### 2.3 Entity Purposes

| Entity | Purpose | Storage | Key Fields |
|--------|---------|---------|------------|
| **Soul** | Identity container (brand/person) | Firestore | name, personaId, accountIds[] |
| **Account** | Platform credentials & profile | Firestore | platform, handle, credentials, proxyId, integrationId |
| **Persona** | AI personality for content | Firestore | tone, style, systemPrompt |
| **Proxy** | IP management for account safety | Firestore | host, port, credentials, type |
| **Integration** | OAuth-connected publishing channel | PostgreSQL | token, refreshToken, providerIdentifier |
| **SoulIntegrationMapping** | Soul ↔ Channel relationship | PostgreSQL | soulId, integrationId, accountId, isPrimary |

---

## 3. User Flows

### 3.1 Complete Setup Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SETUP FLOW                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Step 1: Create Soul (Identity)                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Name: "TechBrand"                                               │    │
│  │  Description: "Our B2B tech company identity"                    │    │
│  │  Persona: [Select or Create]                                     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                               │                                          │
│                               ▼                                          │
│  Step 2: Configure Proxy (Optional but Recommended)                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Name: "US-Residential-1"                                        │    │
│  │  Type: Residential                                               │    │
│  │  Provider: IPRoyal                                               │    │
│  │  Host: proxy.iproyal.com:12345                                   │    │
│  │  Credentials: [username:password]                                │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                               │                                          │
│                               ▼                                          │
│  Step 3: Create Account (Platform Credentials)                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Soul: TechBrand                                                 │    │
│  │  Platform: Twitter/X                                             │    │
│  │  Handle: @techbrand_official                                     │    │
│  │  Credentials:                                                    │    │
│  │    └── Username: techbrand_official                              │    │
│  │    └── Password: ************ (encrypted)                        │    │
│  │    └── 2FA Secret: ************ (encrypted)                      │    │
│  │  Proxy: US-Residential-1                                         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                               │                                          │
│                               ▼                                          │
│  Step 4: Connect Channel (OAuth)                                        │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  [Connect Twitter/X Account]                                     │    │
│  │         │                                                        │    │
│  │         ▼                                                        │    │
│  │  OAuth Popup → Authorize → Token Stored                          │    │
│  │         │                                                        │    │
│  │         ▼                                                        │    │
│  │  Integration Created: @techbrand_official (Twitter)              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                               │                                          │
│                               ▼                                          │
│  Step 5: Link Account to Integration                                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Account: @techbrand_official                                    │    │
│  │         │                                                        │    │
│  │         ▼ (match by platform + handle)                           │    │
│  │  Integration: @techbrand_official (Twitter)                      │    │
│  │         │                                                        │    │
│  │         ▼                                                        │    │
│  │  account.integrationId = integration.id                          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                               │                                          │
│                               ▼                                          │
│  Step 6: Map Soul to Channel (Matrix)                                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Soul: TechBrand                                                 │    │
│  │         │                                                        │    │
│  │         ▼                                                        │    │
│  │  SoulIntegrationMapping:                                         │    │
│  │    - soulId: [TechBrand ID]                                      │    │
│  │    - integrationId: [Twitter Integration ID]                     │    │
│  │    - accountId: [Account ID] ← NEW                               │    │
│  │    - isPrimary: true                                             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Connection Methods

| Method | Description | Use Case | Implementation |
|--------|-------------|----------|----------------|
| **OAuth** | Standard OAuth 2.0 flow | Publishing posts via API | ✅ Implemented (Postiz) |
| **Credentials** | Username/password/2FA | Account management, backup | ✅ Storage ready, login pending |
| **API Keys** | Direct API access | Some platforms (Farcaster, etc.) | ✅ Storage ready |
| **Browser Automation** | Puppeteer/Playwright | Non-API actions | 🔜 Future phase |

### 3.3 How Posting Works (Current System)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         POSTING FLOW                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. User Creates Post                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Select Soul: TechBrand                                          │    │
│  │  Select Channel: @techbrand_official (Twitter)                   │    │
│  │  Content: "Check out our new product..."                         │    │
│  │  Schedule: 2026-01-27 09:00 AM                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                               │                                          │
│                               ▼                                          │
│  2. Post Saved to Database                                              │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Post {                                                          │    │
│  │    integrationId: "int_xyz",                                     │    │
│  │    publishDate: "2026-01-27T09:00:00Z",                          │    │
│  │    content: "Check out...",                                      │    │
│  │    state: "QUEUE"                                                │    │
│  │  }                                                               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                               │                                          │
│                               ▼                                          │
│  3. Temporal Workflow Started                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  PostWorkflow:                                                   │    │
│  │    - Wait until publishDate                                      │    │
│  │    - Fetch Integration (with OAuth token)                        │    │
│  │    - Call postSocial() activity                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                               │                                          │
│                               ▼                                          │
│  4. Post Published via API                                              │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  XProvider.post():                                               │    │
│  │    - Use OAuth token from Integration                            │    │
│  │    - Call Twitter API                                            │    │
│  │    - Return post URL                                             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ⚠️  NOTE: Currently NO proxy is used for posting                       │
│  ⚠️  NOTE: Currently NO Account credentials used (OAuth only)           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Implementation Status

### 4.1 Completed (Phase 1) ✅

| Feature | Status | Notes |
|---------|--------|-------|
| Soul CRUD | ✅ Complete | Firestore |
| Account CRUD | ✅ Complete | Firestore with encrypted credentials |
| Persona CRUD | ✅ Complete | Firestore |
| Proxy CRUD | ✅ Complete | Firestore |
| Soul-Channel Matrix | ✅ Complete | PostgreSQL mapping table |
| Matrix UI | ✅ Complete | Grid view, bulk operations |
| Credentials Storage | ✅ Complete | Encrypted in Account entity |
| Proxy Assignment | ✅ Complete | Account.proxyId |

### 4.2 In Progress (Phase 2) 🔄

| Feature | Status | Priority |
|---------|--------|----------|
| Account ↔ Integration Link | 🔄 Needed | High |
| Add `accountId` to SoulIntegrationMapping | 🔄 Needed | High |
| Auto-link Account to Integration on OAuth | 🔄 Needed | Medium |

### 4.3 Future (Phase 3) 🔜

| Feature | Status | Priority |
|---------|--------|----------|
| Proxy-based posting | 🔜 Future | Medium |
| Browser automation for login | 🔜 Future | Low |
| Credentials-based actions | 🔜 Future | Low |
| Account warming workflows | 🔜 Future | Low |

---

## 5. API Endpoints

### 5.1 Soul Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/axon/souls` | Create soul |
| GET | `/axon/souls` | List souls (paginated) |
| GET | `/axon/souls/:id` | Get soul by ID |
| PUT | `/axon/souls/:id` | Update soul |
| DELETE | `/axon/souls/:id` | Delete soul |

### 5.2 Account Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/axon/accounts` | Create account |
| GET | `/axon/accounts` | List accounts |
| GET | `/axon/accounts?soulId=xxx` | Get accounts by soul |
| GET | `/axon/accounts/:id` | Get account by ID |
| PUT | `/axon/accounts/:id` | Update account |
| DELETE | `/axon/accounts/:id` | Delete account |
| PATCH | `/axon/accounts/:id/proxy` | Assign/unassign proxy |
| PATCH | `/axon/accounts/:id/integration` | Link to integration **NEW** |

### 5.3 Proxy Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/axon/proxies` | Create proxy |
| GET | `/axon/proxies` | List proxies |
| GET | `/axon/proxies/:id` | Get proxy by ID |
| PUT | `/axon/proxies/:id` | Update proxy |
| DELETE | `/axon/proxies/:id` | Delete proxy |
| POST | `/axon/proxies/:id/test` | Test proxy connectivity |

### 5.4 Matrix Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/axon/matrix` | Get full matrix |
| GET | `/axon/matrix/souls/:soulId/integrations` | Get integrations for soul |
| GET | `/axon/matrix/integrations/:integrationId/souls` | Get souls for integration |
| POST | `/axon/matrix/mappings` | Create mapping |
| POST | `/axon/matrix/mappings/toggle` | Toggle mapping |
| POST | `/axon/matrix/mappings/bulk` | Bulk operations |
| PATCH | `/axon/matrix/mappings/:id` | Update mapping |
| DELETE | `/axon/matrix/mappings/:id` | Delete mapping |
| POST | `/axon/matrix/mappings/:id/primary` | Set as primary |

### 5.5 Integration Endpoints (Existing Postiz)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/integrations/social/:provider` | Get OAuth URL |
| POST | `/integrations/social/:provider/connect` | Complete OAuth |
| GET | `/integrations/list` | List connected channels |
| DELETE | `/integrations/:id` | Disconnect channel |

---

## 6. Database Schema Changes

### 6.1 Current Schema (Complete)

**PostgreSQL - SoulIntegrationMapping:**
```prisma
model SoulIntegrationMapping {
  id             String       @id @default(cuid())
  soulId         String       // Firestore Soul ID
  integrationId  String
  organizationId String
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
  @@map("soul_integration_mapping")
}
```

### 6.2 Proposed Changes (Phase 2)

**Add `accountId` to SoulIntegrationMapping:**
```prisma
model SoulIntegrationMapping {
  // ... existing fields ...
  
  accountId      String?      // NEW: Firestore Account ID
  
  @@index([accountId])        // NEW: Index for account lookups
}
```

**Add `integrationId` to Account (Firestore):**
```typescript
interface Account {
  // ... existing fields ...
  
  integrationId?: string;  // NEW: Link to PostgreSQL Integration
}
```

---

## 7. Frontend Components

### 7.1 Matrix Page

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Soul-Channel Matrix                                      [Bulk Edit]    │
├──────────────────────────────────────────────────────────────────────────┤
│  Filters: [All Platforms ▼] [Search souls...] [Connected Only ☐]        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│              │ 🐦 Twitter  │ 📸 Instagram │ 💼 LinkedIn │ 🎵 TikTok   │
│              │ @brand1     │ @brand1      │ @company    │ @viral      │
│  ────────────┼─────────────┼──────────────┼─────────────┼─────────────│
│  🟣 TechBrand│    [✓]⭐    │     [✓]      │     [ ]     │     [ ]     │
│              │   linked    │    linked    │             │             │
│  ────────────┼─────────────┼──────────────┼─────────────┼─────────────│
│  🔵 Personal │    [ ]      │     [✓]⭐    │     [✓]     │     [ ]     │
│              │             │    linked    │   linked    │             │
│  ────────────┼─────────────┼──────────────┼─────────────┼─────────────│
│  🟢 Viral    │    [✓]      │     [✓]      │     [ ]     │     [✓]⭐   │
│              │   linked    │    linked    │             │   linked    │
│                                                                          │
│  Legend: [✓] = Mapped  ⭐ = Primary  "linked" = Account connected       │
└──────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Account Management Page

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Accounts                                          [+ Create Account]    │
├──────────────────────────────────────────────────────────────────────────┤
│  Filters: [All Souls ▼] [All Platforms ▼] [Status ▼]                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ 🐦 @techbrand_official                                              │ │
│  │ Soul: TechBrand  │  Platform: Twitter  │  Status: Active           │ │
│  │                                                                     │ │
│  │ Credentials: ✓ Stored    Proxy: US-Residential-1                   │ │
│  │ Channel: ✓ Connected (OAuth)                                       │ │
│  │                                                                     │ │
│  │ [Edit] [Connect Channel] [Test Proxy] [View Details]               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ 📸 @techbrand_ig                                                   │ │
│  │ Soul: TechBrand  │  Platform: Instagram  │  Status: Warming        │ │
│  │                                                                     │ │
│  │ Credentials: ✓ Stored    Proxy: EU-Residential-2                   │ │
│  │ Channel: ⚠ Not Connected                                           │ │
│  │                                                                     │ │
│  │ [Edit] [Connect Channel] [Test Proxy] [View Details]               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Security Considerations

### 8.1 Credential Encryption

All sensitive credentials are encrypted at rest:

```typescript
// Encrypted fields in Account.credentials:
- password
- accessToken
- refreshToken
- apiKey
- apiSecret
- twoFactorSecret
- backupCodes[]

// Encryption method:
- AES-256-GCM encryption
- Keys stored in environment variables
- Decrypted only when needed
```

### 8.2 Proxy Security

```typescript
// Proxy credentials are also encrypted:
interface ProxyCredentials {
  username: string;   // encrypted
  password: string;   // encrypted
}
```

### 8.3 Access Control

- All endpoints require authentication
- Organization-level isolation (users only see their org's data)
- Audit logging for sensitive operations

---

## 9. Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Matrix load time | < 500ms | ✅ Met |
| Mapping operation latency | < 200ms | ✅ Met |
| User can create Soul→Channel mapping | < 30 seconds | ✅ Met |
| Account creation with credentials | < 1 minute | ✅ Met |
| Proxy assignment to account | < 10 seconds | ✅ Met |

---

## 10. Glossary

| Term | Definition |
|------|------------|
| **Soul** | An identity container representing a brand, person, or bot |
| **Account** | A platform-specific account with credentials (stored in Firestore) |
| **Integration** | An OAuth-connected social media channel (stored in PostgreSQL) |
| **Channel** | Synonym for Integration - a connected social media channel |
| **Mapping** | A link between a Soul and an Integration |
| **Matrix** | The visual representation of all Soul-Integration mappings |
| **Primary Channel** | The default channel for a Soul when creating content |
| **Proxy** | An IP address used for account safety and anonymity |
| **Credentials** | Username/password/tokens for platform authentication |
| **Warming** | Gradual account activity increase to build trust |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-26 | WeCrew Team | Initial draft (Matrix only) |
| 2.0 | 2026-01-26 | WeCrew Team | Complete rewrite with Account-Integration architecture |
