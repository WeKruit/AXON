# M4: Soul-Channel Matrix - Task Breakdown

## Overview

This document tracks all tasks for implementing the Soul-Channel Matrix feature, which enables many-to-many relationships between AXON Souls (Firestore) and Postiz Integrations (PostgreSQL).

**Epic**: [WEC-164](https://linear.app/wecrew-axon/issue/WEC-164/m4-soul-channel-matrix-epic)

---

## Task Dependency Graph

```
                    ┌─────────────────────────────────────────┐
                    │         WEC-164: Epic                   │
                    └─────────────────────────────────────────┘
                                        │
          ┌─────────────────────────────┼─────────────────────────────┐
          │                             │                             │
          ▼                             │                             ▼
┌─────────────────┐                     │               ┌─────────────────┐
│  WEC-165        │                     │               │  WEC-170        │
│  Prisma Schema  │                     │               │  FE Types       │
│  (Blake)        │                     │               │  (Casey)        │
└────────┬────────┘                     │               └────────┬────────┘
         │                              │                        │
         ▼                              │                        │
┌─────────────────┐                     │                        │
│  WEC-166        │                     │                        │
│  DTOs           │                     │                        │
│  (Blake)        │                     │                        │
└────────┬────────┘                     │                        │
         │                              │                        │
         ▼                              │                        │
┌─────────────────┐                     │                        │
│  WEC-167        │                     │                        │
│  Repository     │                     │                        │
│  (Blake)        │                     │                        │
└────────┬────────┘                     │                        │
         │                              │                        │
         ▼                              │                        │
┌─────────────────┐                     │                        │
│  WEC-168        │                     │                        │
│  Service        │                     │                        │
│  (Blake)        │                     │                        │
└────────┬────────┘                     │                        │
         │                              │                        │
         ▼                              │                        │
┌─────────────────┐                     │                        │
│  WEC-169        │◄────────────────────┼────────────────────────┤
│  Controller     │                     │                        │
│  (Blake)        │                     │                        │
└────────┬────────┘                     │                        │
         │                              │                        │
         ├──────────────────────────────┤                        │
         │                              │                        │
         ▼                              │                        ▼
┌─────────────────┐                     │               ┌─────────────────┐
│  WEC-177        │                     │               │  WEC-171        │
│  Module Reg     │                     │               │  FE Hooks       │
│  (Blake)        │                     │               │  (Casey)        │
└────────┬────────┘                     │               └────────┬────────┘
         │                              │                        │
         ▼                              │                        │
┌─────────────────┐                     │               ┌─────────────────┐
│  WEC-178        │                     │               │  WEC-173        │
│  BE Tests       │                     │               │  Cell Component │
│  (Blake)        │                     │               │  (Casey)        │
└─────────────────┘                     │               └────────┬────────┘
                                        │                        │
                                        │                        ▼
                                        │               ┌─────────────────┐
                                        │               │  WEC-172        │
                                        │               │  Grid Component │
                                        │               │  (Casey)        │
                                        │               └────────┬────────┘
                                        │                        │
                                        │               ┌────────┴────────┐
                                        │               │                 │
                                        │               ▼                 ▼
                                        │     ┌─────────────────┐ ┌─────────────────┐
                                        │     │  WEC-175        │ │  WEC-174        │
                                        │     │  Navigation     │ │  Matrix Page    │
                                        │     │  (Casey)        │ │  (Casey)        │
                                        │     └─────────────────┘ └────────┬────────┘
                                        │                                  │
                                        │                                  ▼
                                        │                         ┌─────────────────┐
                                        │                         │  WEC-176        │
                                        │                         │  Content Integ  │
                                        │                         │  (Casey)        │
                                        │                         └────────┬────────┘
                                        │                                  │
                                        └──────────────────────────────────┤
                                                                           │
                                        ┌──────────────────────────────────┤
                                        │                                  │
                                        ▼                                  ▼
                              ┌─────────────────┐               ┌─────────────────┐
                              │  WEC-179        │               │  WEC-180        │
                              │  FE Tests       │               │  E2E Tests      │
                              │  (Casey)        │               │  (All)          │
                              └─────────────────┘               └─────────────────┘
```

---

## Backend Tasks (Blake)

### Phase 1: Database & DTOs

| Ticket | Title | Priority | Status | Blocked By |
|--------|-------|----------|--------|------------|
| [WEC-165](https://linear.app/wecrew-axon/issue/WEC-165) | Create SoulIntegrationMapping Prisma Schema | Urgent | Backlog | - |
| [WEC-166](https://linear.app/wecrew-axon/issue/WEC-166) | Create Matrix DTOs | High | Backlog | WEC-165 |

### Phase 2: Repository & Service

| Ticket | Title | Priority | Status | Blocked By |
|--------|-------|----------|--------|------------|
| [WEC-167](https://linear.app/wecrew-axon/issue/WEC-167) | Create Matrix Repository | High | Backlog | WEC-165, WEC-166 |
| [WEC-168](https://linear.app/wecrew-axon/issue/WEC-168) | Create Matrix Service | High | Backlog | WEC-167 |

### Phase 3: Controller & Module

| Ticket | Title | Priority | Status | Blocked By |
|--------|-------|----------|--------|------------|
| [WEC-169](https://linear.app/wecrew-axon/issue/WEC-169) | Create Matrix Controller | High | Backlog | WEC-168 |
| [WEC-177](https://linear.app/wecrew-axon/issue/WEC-177) | Register Matrix Module in App | High | Backlog | WEC-169 |

### Phase 4: Testing

| Ticket | Title | Priority | Status | Blocked By |
|--------|-------|----------|--------|------------|
| [WEC-178](https://linear.app/wecrew-axon/issue/WEC-178) | Matrix Backend Unit Tests | High | Backlog | WEC-177 |

---

## Frontend Tasks (Casey)

### Phase 1: Types & Hooks

| Ticket | Title | Priority | Status | Blocked By |
|--------|-------|----------|--------|------------|
| [WEC-170](https://linear.app/wecrew-axon/issue/WEC-170) | Create Matrix TypeScript Types | High | Backlog | - |
| [WEC-171](https://linear.app/wecrew-axon/issue/WEC-171) | Create Matrix API Hooks | High | Backlog | WEC-170, WEC-169 |

### Phase 2: Components

| Ticket | Title | Priority | Status | Blocked By |
|--------|-------|----------|--------|------------|
| [WEC-173](https://linear.app/wecrew-axon/issue/WEC-173) | Create Matrix Cell Component | High | Backlog | WEC-171 |
| [WEC-172](https://linear.app/wecrew-axon/issue/WEC-172) | Create Matrix Grid Component | Urgent | Backlog | WEC-171, WEC-173 |

### Phase 3: Page & Navigation

| Ticket | Title | Priority | Status | Blocked By |
|--------|-------|----------|--------|------------|
| [WEC-175](https://linear.app/wecrew-axon/issue/WEC-175) | Add Matrix Navigation to AXON Sidebar | High | Backlog | - |
| [WEC-174](https://linear.app/wecrew-axon/issue/WEC-174) | Create Matrix Page | Urgent | Backlog | WEC-172, WEC-175 |

### Phase 4: Integration & Testing

| Ticket | Title | Priority | Status | Blocked By |
|--------|-------|----------|--------|------------|
| [WEC-176](https://linear.app/wecrew-axon/issue/WEC-176) | Integrate Soul Selector in Content Creation | Medium | Backlog | WEC-174 |
| [WEC-179](https://linear.app/wecrew-axon/issue/WEC-179) | Matrix Frontend Component Tests | Medium | Backlog | WEC-174 |

---

## Integration Testing

| Ticket | Title | Priority | Status | Blocked By |
|--------|-------|----------|--------|------------|
| [WEC-180](https://linear.app/wecrew-axon/issue/WEC-180) | Matrix E2E Tests | Medium | Backlog | WEC-174, WEC-177 |

---

## Developer Assignments

### Blake (Backend & Infrastructure)
- **Branch prefix**: `feature/blake/`
- **Tickets**: WEC-165, WEC-166, WEC-167, WEC-168, WEC-169, WEC-177, WEC-178
- **Total**: 7 tickets

### Casey (Frontend)
- **Branch prefix**: `feature/casey/`
- **Tickets**: WEC-170, WEC-171, WEC-172, WEC-173, WEC-174, WEC-175, WEC-176, WEC-179
- **Total**: 8 tickets

---

## Parallel Work Strategy

```
Week 1:
├── Blake: WEC-165 (Schema) → WEC-166 (DTOs) → WEC-167 (Repository)
└── Casey: WEC-170 (Types) → WEC-175 (Navigation)

Week 2:
├── Blake: WEC-168 (Service) → WEC-169 (Controller) → WEC-177 (Module)
└── Casey: WEC-171 (Hooks) → WEC-173 (Cell) → WEC-172 (Grid)

Week 3:
├── Blake: WEC-178 (BE Tests)
└── Casey: WEC-174 (Page) → WEC-176 (Content Integration) → WEC-179 (FE Tests)

Week 4:
└── All: WEC-180 (E2E Tests) → Final QA
```

---

## Files to Create

### Backend (Blake)

```
libraries/nestjs-libraries/src/
├── database/prisma/
│   ├── schema.prisma                     # UPDATE: Add SoulIntegrationMapping
│   └── matrix/
│       ├── matrix.module.ts              # NEW
│       ├── matrix.repository.ts          # NEW
│       ├── matrix.service.ts             # NEW
│       ├── matrix.repository.spec.ts     # NEW
│       └── matrix.service.spec.ts        # NEW
└── dtos/matrix/
    ├── index.ts                          # NEW
    └── matrix.dto.ts                     # NEW

apps/backend/src/api/routes/
├── matrix.controller.ts                  # NEW
└── matrix.controller.spec.ts             # NEW
```

### Frontend (Casey)

```
apps/frontend/src/
├── app/(app)/(site)/axon/matrix/
│   └── page.tsx                          # NEW
├── components/axon/
│   ├── types/
│   │   └── matrix.types.ts               # NEW
│   ├── hooks/
│   │   └── use-matrix.ts                 # NEW
│   ├── matrix/
│   │   ├── matrix-grid.component.tsx     # NEW
│   │   ├── matrix-cell.component.tsx     # NEW
│   │   ├── matrix-stats.component.tsx    # NEW
│   │   └── matrix-filters.component.tsx  # NEW
│   └── layout/
│       └── axon-sub-nav.tsx              # UPDATE: Add Matrix link
└── components/launches/
    └── [existing files]                  # UPDATE: Add Soul selector
```

---

## Success Criteria

- [ ] Users can connect any Soul to any Integration
- [ ] Matrix UI displays all relationships at a glance
- [ ] Bulk operations work for 50+ mappings
- [ ] Content creation flow filters channels by selected Soul
- [ ] API response times < 200ms for matrix operations
- [ ] 80% test coverage on backend
- [ ] 70% test coverage on frontend
- [ ] All E2E tests pass

---

## Related Documents

- **PRD**: `/docs/prd/M4-Soul-Channel-Matrix.md`
- **Implementation Plan**: `/docs/implementation-plans/m4-matrix-implementation.md`
- **Linear Epic**: [WEC-164](https://linear.app/wecrew-axon/issue/WEC-164)
