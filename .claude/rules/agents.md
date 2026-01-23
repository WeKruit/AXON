# Agent Orchestration Rules for WeCrew-AXON

## Available Agents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| `backend-developer` | NestJS API, Prisma, infrastructure | Backend features, API endpoints, database changes |
| `frontend-developer` | Next.js, React, Tailwind | UI components, pages, client-side logic |
| `ai-developer` | OpenAI, LangChain, Mastra | AI features, content generation, LLM workflows |
| `tdd-guide` | Test-driven development | Writing tests, ensuring coverage |
| `code-reviewer` | Code review, quality checks | PR reviews, code quality assessment |

## Agent Selection Guidelines

### Feature Implementation
1. **Backend-only**: Use `backend-developer`
2. **Frontend-only**: Use `frontend-developer`
3. **Full-stack**: Use both in sequence (backend first, then frontend)
4. **AI features**: Use `ai-developer` with `backend-developer`

### Quality Assurance
1. **Before PR**: Run `code-reviewer` agent
2. **TDD approach**: Start with `tdd-guide` agent
3. **Coverage check**: Use `tdd-guide` for test gaps

## Parallel Task Execution

ALWAYS use parallel execution for independent operations:

```
# Good: Parallel for independent tasks
Task 1: backend-developer → API endpoint
Task 2: frontend-developer → UI component
Task 3: tdd-guide → Test cases

# Bad: Sequential for independent tasks
Task 1: backend → Task 2: frontend → Task 3: tests
```

## Multi-Developer Workflow

When multiple developers work on the same feature:

### Branch Strategy
```
main
├── feature/blake/auth-wec51-backend
├── feature/casey/auth-wec51-frontend
└── feature/alex/auth-wec51-ai
```

### Coordination Rules
1. **Define interfaces first**: Agree on API contracts before coding
2. **Backend first**: Backend should be ready before frontend integration
3. **No conflicts**: Each developer owns specific files/directories
4. **Sync points**: Daily sync on shared dependencies

## Agent Handoff Protocol

When passing work between agents:

### Backend → Frontend
1. Backend completes API endpoint
2. Backend documents API contract (request/response types)
3. Frontend receives API documentation
4. Frontend implements UI consuming the API

### TDD → Developer
1. TDD agent writes failing tests
2. Developer implements code to pass tests
3. TDD agent verifies coverage

### Developer → Code Reviewer
1. Developer completes implementation
2. Code reviewer analyzes changes
3. Developer addresses feedback
4. Code reviewer approves

## Linear Ticket Updates

When completing work, update Linear ticket:

```typescript
// Status transitions
Todo → In Progress (when starting)
In Progress → In Review (when PR created)
In Review → Done (when merged)

// Status IDs
Todo: 5a4583b7-9498-47a9-91f6-9b62e58c05d4
In Progress: b79e056d-c036-4069-90af-be28d875b931
In Review: 0ad07573-e827-4f58-a5b4-3cea0c3cc37a
Done: 7ab38e5f-b864-4373-91f4-c15c2ac09b37
```

## Error Handling

If an agent fails:
1. Log the error with context
2. Attempt retry with more specific instructions
3. If still failing, escalate to human review
4. Document the issue in Linear ticket

## Best Practices

1. **Single Responsibility**: One agent handles one concern
2. **Clear Boundaries**: Don't mix backend and frontend in one agent run
3. **Incremental Progress**: Commit frequently, small changes
4. **Communication**: Update Linear tickets at each step
5. **Verification**: Always run tests after changes
