# Start Ticket Command

Start working on a Linear ticket with proper setup.

## Usage

```
/start-ticket WEC-XX
```

## Workflow

1. **Fetch Ticket Details**
   - Get ticket info from Linear
   - Understand requirements and acceptance criteria

2. **Create Branch**
   - Determine developer from assignee
   - Create properly named branch

3. **Update Linear Status**
   - Move ticket to "In Progress"
   - Add comment that work has started

4. **Setup Checklist**
   - [ ] Read ticket requirements
   - [ ] Identify affected files
   - [ ] Plan implementation approach
   - [ ] Write initial tests (TDD)

## Example

```bash
# Input
/start-ticket WEC-51

# Actions taken:
# 1. Fetched WEC-51 from Linear
# 2. Created branch: feature/blake/env-wec51-firebase-setup
# 3. Updated status to "In Progress"
# 4. Added comment: "🔄 Work started on this ticket"
```

## Branch Naming

Based on assignee:
- Blake (indolencorlol@gmail.com) → `feature/blake/...`
- Casey (wekruit2024@gmail.com) → `feature/casey/...`
- Alex/Admin → `feature/alex/...`
