# Linear Workflow Rules for WeCrew-AXON

## Team & Project Info

- **Team ID**: c7cc1945-904c-40d9-86e6-87044917b7a1
- **Team Key**: WEC (WeCrew)

## Status Workflow

```
┌──────────┐    ┌─────────────┐    ┌───────────┐    ┌──────────┐
│   Todo   │ → │ In Progress │ → │ In Review │ → │   Done   │
└──────────┘    └─────────────┘    └───────────┘    └──────────┘
```

### Status IDs

| Status | ID | Trigger |
|--------|-----|---------|
| Todo | `5a4583b7-9498-47a9-91f6-9b62e58c05d4` | New ticket created |
| In Progress | `b79e056d-c036-4069-90af-be28d875b931` | Work started |
| In Review | `0ad07573-e827-4f58-a5b4-3cea0c3cc37a` | PR created |
| Done | `7ab38e5f-b864-4373-91f4-c15c2ac09b37` | PR merged |

## Developer Assignments

| Developer | Email | Role |
|-----------|-------|------|
| Blake | indolencorlol@gmail.com | Backend & Infrastructure |
| Casey | wekruit2024@gmail.com | Frontend |
| Alex/Admin | (admin) | Backend & AI |

## Ticket Lifecycle

### 1. Starting Work

When picking up a ticket:

```bash
# 1. Create feature branch
git checkout -b feature/blake/auth-wec51-firebase-setup

# 2. Update Linear status to "In Progress"
# Use Linear MCP: update_issue(id, state: "b79e056d-c036-4069-90af-be28d875b931")
```

### 2. During Development

- Keep ticket updated with progress comments
- Link commits to ticket using `WEC-XX` in commit messages
- Update description if scope changes

### 3. Creating PR

When PR is ready:

```bash
# Update Linear status to "In Review"
# Use Linear MCP: update_issue(id, state: "0ad07573-e827-4f58-a5b4-3cea0c3cc37a")
```

PR description should include:
- Link to Linear ticket
- Summary of changes
- Testing instructions

### 4. Completing Work

When PR is merged:

```bash
# Update Linear status to "Done"
# Use Linear MCP: update_issue(id, state: "7ab38e5f-b864-4373-91f4-c15c2ac09b37")
```

## Ticket Fields

### Required Fields
- **Title**: Clear, concise description
- **Description**: Detailed requirements
- **Assignee**: Who's responsible
- **Priority**: 1 (Urgent) - 4 (Low)
- **Labels**: Feature, Bug, etc.

### Optional Fields
- **Estimate**: Story points
- **Cycle**: Sprint assignment
- **Due Date**: Deadline

## Creating Tickets

When creating new tickets:

```markdown
## Title
[Clear action-oriented title]

## Description
### Context
[Why this work is needed]

### Requirements
- [ ] Requirement 1
- [ ] Requirement 2

### Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2

### Technical Notes
[Any technical considerations]
```

## Linking & Relations

### Blocking Relations
- Use "blocks" when one ticket must complete before another
- Use "blocked by" when waiting on another ticket

### Parent/Child
- Use sub-issues for breaking down large tickets
- Keep parent updated with overall progress

## Comments Best Practices

### Progress Updates
```
🔄 **Update**: [Brief description]
- Completed X
- Working on Y
- Blocked by Z
```

### Blockers
```
🚫 **Blocked**: [Description]
**Reason**: [Why blocked]
**Need**: [What's required to unblock]
```

### Completion
```
✅ **Completed**: [Brief summary]
**PR**: [Link to PR]
```

## Automation

### Git Integration
- Commits with `WEC-XX` auto-link to ticket
- PR merges can auto-move tickets (if configured)

### Claude Code Integration
Use Linear MCP for programmatic updates:

```typescript
// Get issue details
mcp__linear__get_issue({ id: "WEC-51" })

// Update status
mcp__linear__update_issue({
  id: "issue-uuid",
  state: "b79e056d-c036-4069-90af-be28d875b931"
})

// Add comment
mcp__linear__create_comment({
  issueId: "issue-uuid",
  body: "Progress update..."
})
```

## Priority Definitions

| Priority | Meaning | Response Time |
|----------|---------|---------------|
| 1 - Urgent | Critical blocker | Immediate |
| 2 - High | Important, needs attention | Within 1 day |
| 3 - Medium | Normal priority | Within sprint |
| 4 - Low | Nice to have | When possible |

## Labels

| Label | Use For |
|-------|---------|
| Feature | New functionality |
| Bug | Something broken |
| Tech Debt | Code improvement |
| Documentation | Docs only |
| Testing | Test-related work |
