# PRD: M4 - Soul-Channel Matrix

**Version:** 1.0
**Date:** 2026-01-26
**Status:** Draft
**Owner:** WeCrew Team

---

## 1. Executive Summary

The Soul-Channel Matrix is a many-to-many relationship system that connects AXON Souls (brand identities) with Postiz Integrations (connected social media channels). This enables flexible content distribution where any Soul can post to any assigned channel, with persona-driven content generation.

### 1.1 Problem Statement

Currently, AXON Souls/Accounts and Postiz Integrations exist as separate, disconnected systems:
- Users cannot associate their brand identities (Souls) with connected channels
- Content creation doesn't leverage persona/brand voice
- No way to manage which brands can post to which channels
- No unified view of brand → channel relationships

### 1.2 Solution Overview

Create a Matrix system that:
- Links Souls to Integrations via a many-to-many mapping
- Provides a visual matrix UI for managing relationships
- Integrates with content creation to filter channels by Soul
- Enables persona-driven content generation per Soul

---

## 2. Goals & Success Metrics

### 2.1 Goals

| Goal | Description |
|------|-------------|
| G1 | Enable many-to-many Soul ↔ Integration mapping |
| G2 | Provide intuitive matrix UI for relationship management |
| G3 | Filter content creation by Soul's assigned channels |
| G4 | Support bulk operations (assign/unassign multiple) |
| G5 | Maintain backward compatibility with existing Postiz flows |

### 2.2 Success Metrics

| Metric | Target |
|--------|--------|
| Matrix load time | < 500ms |
| Mapping operation latency | < 200ms |
| User can create Soul→Channel mapping | < 30 seconds |
| Zero breaking changes to existing posts |

---

## 3. User Stories

### 3.1 Core User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US1 | Brand Manager | See all my Souls and Channels in a matrix view | I can understand which brands post where |
| US2 | Brand Manager | Click a cell to toggle Soul↔Channel connection | I can quickly configure relationships |
| US3 | Content Creator | Filter channels by Soul when creating content | I only see relevant channels for my brand |
| US4 | Content Creator | See the Soul's persona when drafting | I can match the brand voice |
| US5 | Admin | Bulk assign a Soul to multiple channels | I can quickly set up a new brand |
| US6 | Admin | Bulk assign multiple Souls to one channel | I can share a channel across brands |

### 3.2 Edge Cases

| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| EC1 | Integration deleted in Postiz | Remove from all Soul mappings automatically |
| EC2 | Soul deleted in AXON | Remove all its channel mappings |
| EC3 | Channel token expires | Show warning in matrix, still show mapping |
| EC4 | No Souls exist | Show empty state with "Create Soul" CTA |
| EC5 | No Integrations exist | Show empty state with "Connect Channel" CTA |

---

## 4. Functional Requirements

### 4.1 Matrix Data Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOUL-CHANNEL MATRIX                          │
│                                                                 │
│                     Integrations (Columns)                      │
│              ┌─────────┬─────────┬─────────┬─────────┐         │
│              │ Twitter │ Insta   │ LinkedIn│ TikTok  │         │
│              │ @brand1 │ @brand1 │ @corp   │ @viral  │         │
│  ┌───────────┼─────────┼─────────┼─────────┼─────────┤         │
│  │ Soul A    │   ●     │   ●     │   ○     │   ○     │         │
│  │ "Startup" │ active  │ active  │         │         │         │
│  ├───────────┼─────────┼─────────┼─────────┼─────────┤         │
│  │ Soul B    │   ○     │   ○     │   ●     │   ○     │         │
│  │ "Corp"    │         │         │ active  │         │         │
│  ├───────────┼─────────┼─────────┼─────────┼─────────┤         │
│  │ Soul C    │   ●     │   ●     │   ○     │   ●     │         │
│  │ "Viral"   │ active  │ active  │         │ active  │         │
│  └───────────┴─────────┴─────────┴─────────┴─────────┘         │
│                                                                 │
│  ● = Mapped (Soul can post to this channel)                    │
│  ○ = Not mapped                                                │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Database Schema

#### PostgreSQL (New Table)

```sql
-- Soul-Integration Mapping Table
CREATE TABLE soul_integration_mapping (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soul_id         VARCHAR(255) NOT NULL,        -- Firestore Soul ID
  integration_id  VARCHAR(255) NOT NULL,        -- PostgreSQL Integration ID
  organization_id VARCHAR(255) NOT NULL,        -- For multi-tenancy

  -- Mapping metadata
  is_primary      BOOLEAN DEFAULT false,        -- Primary channel for this Soul
  priority        INTEGER DEFAULT 0,            -- Ordering preference

  -- Audit fields
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),
  created_by      VARCHAR(255),

  -- Constraints
  UNIQUE(soul_id, integration_id),
  FOREIGN KEY (integration_id) REFERENCES "Integration"(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES "Organization"(id)
);

-- Index for fast lookups
CREATE INDEX idx_mapping_soul ON soul_integration_mapping(soul_id);
CREATE INDEX idx_mapping_integration ON soul_integration_mapping(integration_id);
CREATE INDEX idx_mapping_org ON soul_integration_mapping(organization_id);
```

#### Prisma Schema Addition

```prisma
model SoulIntegrationMapping {
  id              String      @id @default(cuid())
  soulId          String      // Firestore document ID
  integrationId   String
  organizationId  String
  isPrimary       Boolean     @default(false)
  priority        Int         @default(0)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  createdBy       String?

  // Relations
  integration     Integration @relation(fields: [integrationId], references: [id], onDelete: Cascade)
  organization    Organization @relation(fields: [organizationId], references: [id])

  @@unique([soulId, integrationId])
  @@index([soulId])
  @@index([integrationId])
  @@index([organizationId])
  @@map("soul_integration_mapping")
}
```

### 4.3 API Endpoints

#### Matrix Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/matrix` | Get full matrix (Souls × Integrations) |
| GET | `/api/v1/matrix/souls/:soulId/integrations` | Get integrations for a Soul |
| GET | `/api/v1/matrix/integrations/:integrationId/souls` | Get Souls for an Integration |
| POST | `/api/v1/matrix/mappings` | Create a mapping |
| DELETE | `/api/v1/matrix/mappings/:id` | Delete a mapping |
| POST | `/api/v1/matrix/mappings/bulk` | Bulk create/delete mappings |
| PATCH | `/api/v1/matrix/mappings/:id` | Update mapping (isPrimary, priority) |

#### Request/Response Examples

**GET /api/v1/matrix**
```json
{
  "souls": [
    {
      "id": "soul_abc123",
      "name": "Startup Brand",
      "persona": { "id": "persona_1", "name": "Tech Enthusiast" },
      "integrationIds": ["int_1", "int_2"]
    }
  ],
  "integrations": [
    {
      "id": "int_1",
      "name": "@startup_official",
      "platform": "twitter",
      "picture": "https://...",
      "soulIds": ["soul_abc123", "soul_xyz789"]
    }
  ],
  "mappings": [
    {
      "id": "map_1",
      "soulId": "soul_abc123",
      "integrationId": "int_1",
      "isPrimary": true,
      "priority": 1
    }
  ]
}
```

**POST /api/v1/matrix/mappings/bulk**
```json
{
  "operations": [
    { "action": "create", "soulId": "soul_1", "integrationId": "int_1" },
    { "action": "create", "soulId": "soul_1", "integrationId": "int_2" },
    { "action": "delete", "soulId": "soul_2", "integrationId": "int_3" }
  ]
}
```

### 4.4 Frontend Components

#### Matrix View Component

```
┌──────────────────────────────────────────────────────────────────┐
│  Soul-Channel Matrix                              [+ Add Soul]   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filter: [All Platforms ▼] [Search souls...]  [Bulk Edit]       │
│                                                                  │
│  ┌────────────┬──────────┬──────────┬──────────┬──────────┐     │
│  │            │ 🐦       │ 📸       │ 💼       │ 🎵       │     │
│  │ SOULS      │ Twitter  │ Instagram│ LinkedIn │ TikTok   │     │
│  │            │ @brand1  │ @brand1  │ @company │ @viral   │     │
│  ├────────────┼──────────┼──────────┼──────────┼──────────┤     │
│  │ 🟣 Startup │   [✓]    │   [✓]    │   [ ]    │   [ ]    │     │
│  │   Brand    │  ⭐ pri  │          │          │          │     │
│  ├────────────┼──────────┼──────────┼──────────┼──────────┤     │
│  │ 🔵 Corp    │   [ ]    │   [ ]    │   [✓]    │   [ ]    │     │
│  │   Identity │          │          │  ⭐ pri  │          │     │
│  ├────────────┼──────────┼──────────┼──────────┼──────────┤     │
│  │ 🟢 Viral   │   [✓]    │   [✓]    │   [ ]    │   [✓]    │     │
│  │   Content  │          │          │          │  ⭐ pri  │     │
│  └────────────┴──────────┴──────────┴──────────┴──────────┘     │
│                                                                  │
│  Legend: [✓] = Mapped  ⭐ = Primary channel for this Soul       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### Integration with Content Creation

```
┌──────────────────────────────────────────────────────────────────┐
│  Create Post                                                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Select Brand Voice                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  [🟣 Startup Brand ▼]                                      │ │
│  │                                                            │ │
│  │  Persona: "Tech Enthusiast"                                │ │
│  │  Tone: Professional, Innovative                            │ │
│  │  Style: Data-driven, Thought leadership                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Step 2: Select Channels (filtered by Soul)                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Available for "Startup Brand":                            │ │
│  │                                                            │ │
│  │  [✓] 🐦 @startup_official (Twitter)  ⭐ Primary           │ │
│  │  [✓] 📸 @startup_official (Instagram)                     │ │
│  │  [ ] 💼 @company (LinkedIn) - Not mapped                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Step 3: Compose Content                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  [AI Assist with Persona] [Generate Draft]                 │ │
│  │                                                            │ │
│  │  ________________________________________________         │ │
│  │  |                                                |         │ │
│  │  | Your content here...                           |         │ │
│  │  |________________________________________________|         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│                                    [Save Draft] [Schedule Post]  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Technical Architecture

### 5.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   Matrix View   │  │  Content Create │  │   Soul Manager  │     │
│  │   Component     │  │   (Enhanced)    │  │   (Existing)    │     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
│           │                    │                    │               │
│           └────────────────────┼────────────────────┘               │
│                                │                                    │
│                    ┌───────────▼───────────┐                       │
│                    │   useMatrix() Hook    │                       │
│                    │   useSoulChannels()   │                       │
│                    └───────────┬───────────┘                       │
└────────────────────────────────┼────────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      API Gateway        │
                    │   /api/v1/matrix/*      │
                    └────────────┬────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────────┐
│                         BACKEND (NestJS)                            │
│                                │                                    │
│  ┌─────────────────────────────▼─────────────────────────────┐     │
│  │                   MatrixController                         │     │
│  │  - GET /matrix                                            │     │
│  │  - POST/DELETE /matrix/mappings                           │     │
│  │  - POST /matrix/mappings/bulk                             │     │
│  └─────────────────────────────┬─────────────────────────────┘     │
│                                │                                    │
│  ┌─────────────────────────────▼─────────────────────────────┐     │
│  │                    MatrixService                           │     │
│  │  - getMatrix()                                            │     │
│  │  - createMapping()                                        │     │
│  │  - deleteMapping()                                        │     │
│  │  - bulkOperations()                                       │     │
│  └───────────────┬─────────────────────────┬─────────────────┘     │
│                  │                         │                        │
│  ┌───────────────▼───────────┐ ┌───────────▼───────────────┐       │
│  │  SoulIntegrationMapping   │ │     SoulService           │       │
│  │  Repository (Prisma)      │ │     (Firestore)           │       │
│  └───────────────┬───────────┘ └───────────┬───────────────┘       │
│                  │                         │                        │
└──────────────────┼─────────────────────────┼────────────────────────┘
                   │                         │
         ┌─────────▼─────────┐     ┌─────────▼─────────┐
         │    PostgreSQL     │     │     Firestore     │
         │                   │     │                   │
         │ - Integration     │     │ - Soul            │
         │ - Mapping Table   │     │ - Persona         │
         │ - Post            │     │ - Account         │
         └───────────────────┘     └───────────────────┘
```

### 5.2 Data Flow

#### Creating a Mapping

```
User clicks cell in Matrix
         │
         ▼
┌─────────────────────┐
│ Frontend dispatches │
│ createMapping()     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ POST /matrix/mapping│
│ { soulId, intId }   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ MatrixService       │
│ validates:          │
│ - Soul exists (FS)  │
│ - Int exists (PG)   │
│ - Same org          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Create mapping in   │
│ PostgreSQL          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Return updated      │
│ matrix state        │
└─────────────────────┘
```

#### Content Creation with Soul Filter

```
User selects Soul in Create Post
         │
         ▼
┌─────────────────────┐
│ Fetch integrations  │
│ for selected Soul   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ GET /matrix/souls/  │
│ {soulId}/integrations│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Return filtered     │
│ integrations list   │
│ with mapping status │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ UI shows only       │
│ mapped channels     │
│ (others greyed out) │
└─────────────────────┘
```

### 5.3 File Structure

```
Backend:
├── apps/backend/src/api/routes/
│   └── matrix.controller.ts              # NEW
├── libraries/nestjs-libraries/src/
│   ├── database/prisma/
│   │   ├── schema.prisma                 # MODIFY: Add mapping model
│   │   └── matrix/
│   │       ├── matrix.service.ts         # NEW
│   │       └── matrix.repository.ts      # NEW
│   └── dtos/
│       └── matrix/
│           ├── matrix.dto.ts             # NEW
│           └── mapping.dto.ts            # NEW

Frontend:
├── apps/frontend/src/
│   ├── app/(app)/(site)/
│   │   └── axon/
│   │       └── matrix/
│   │           └── page.tsx              # NEW: Matrix page
│   ├── components/axon/
│   │   └── matrix/
│   │       ├── matrix-view.tsx           # NEW: Main matrix component
│   │       ├── matrix-cell.tsx           # NEW: Individual cell
│   │       ├── matrix-header.tsx         # NEW: Column headers
│   │       ├── matrix-row.tsx            # NEW: Row with Soul info
│   │       ├── bulk-edit-modal.tsx       # NEW: Bulk operations
│   │       └── matrix-filters.tsx        # NEW: Filter controls
│   ├── hooks/
│   │   └── use-matrix.ts                 # NEW: Matrix data hook
│   └── components/launches/
│       └── add.edit.modal.tsx            # MODIFY: Add Soul selector
```

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Requirement | Target |
|-------------|--------|
| Matrix load (50 souls × 20 integrations) | < 500ms |
| Single mapping operation | < 200ms |
| Bulk operation (100 mappings) | < 2s |
| Matrix re-render on change | < 100ms |

### 6.2 Scalability

| Limit | Value |
|-------|-------|
| Max Souls per organization | 1000 |
| Max Integrations per organization | 100 |
| Max mappings per organization | 10,000 |

### 6.3 Security

- All endpoints require authentication
- Organization-level isolation (users can only see their org's data)
- Audit logging for all mapping changes
- Rate limiting: 100 requests/minute per user

---

## 7. Migration & Rollout

### 7.1 Migration Steps

1. **Database Migration**
   - Add `soul_integration_mapping` table
   - No existing data migration needed (new feature)

2. **Backend Deployment**
   - Deploy new Matrix endpoints
   - No breaking changes to existing endpoints

3. **Frontend Deployment**
   - Add Matrix page to navigation
   - Enhance content creation with Soul selector
   - Existing flows remain unchanged

### 7.2 Feature Flags

```typescript
const FEATURE_FLAGS = {
  SOUL_CHANNEL_MATRIX: true,      // Enable matrix view
  SOUL_FILTER_IN_POSTS: true,     // Enable Soul filter in post creation
  BULK_MATRIX_OPERATIONS: true,   // Enable bulk edit
};
```

### 7.3 Rollback Plan

1. Disable feature flags
2. Matrix page becomes inaccessible
3. Post creation reverts to original flow
4. Mapping data preserved for re-enable

---

## 8. Dependencies

### 8.1 Internal Dependencies

| Dependency | Status | Required For |
|------------|--------|--------------|
| AXON Soul Service | ✅ Complete | Soul data |
| AXON Persona Service | ✅ Complete | Persona data |
| Postiz Integration Service | ✅ Existing | Integration data |
| AXON Navigation | ✅ Complete | Matrix page routing |

### 8.2 External Dependencies

None - all required services are internal.

---

## 9. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Performance with large matrices | High | Medium | Implement virtualization, pagination |
| Data inconsistency (Soul deleted) | Medium | Low | Cascade delete via triggers |
| User confusion with new UI | Medium | Medium | Add onboarding tooltips |
| Firestore-PostgreSQL sync issues | High | Low | Use transactions, add health checks |

---

## 10. Future Considerations

### 10.1 Phase 2 Enhancements

- **Matrix Templates**: Save and apply common mapping patterns
- **Scheduled Mappings**: Time-based channel access (e.g., campaign periods)
- **Mapping Analytics**: Track which Soul-Channel combos perform best
- **Auto-suggestions**: AI recommends optimal mappings based on content

### 10.2 Integration Opportunities

- **Content Calendar**: Show matrix-filtered view in calendar
- **Analytics Dashboard**: Performance by Soul-Channel combination
- **Bulk Content**: Create same post for all channels of a Soul

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| Soul | An identity container representing a brand or persona |
| Integration | A connected social media channel (OAuth-authenticated) |
| Mapping | A link between a Soul and an Integration |
| Matrix | The visual representation of all Soul-Integration mappings |
| Primary Channel | The default channel for a Soul when creating content |

---

## Appendix B: API Reference

See detailed API documentation in `/docs/api/matrix-api.md`

---

**Document History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-26 | WeCrew Team | Initial draft |
