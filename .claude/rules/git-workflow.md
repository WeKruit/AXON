# Git Workflow Rules for WeCrew-AXON

## Branch Naming Convention

```
<type>/<developer>/<module>-<ticket>-<short-desc>
```

### Types
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation changes
- `test/` - Test additions/fixes

### Developers
- `blake` - Backend & Infrastructure
- `casey` - Frontend
- `alex` - Backend & AI

### Examples
```
feature/blake/auth-wec51-firebase-setup
feature/casey/dashboard-wec55-ui-components
feature/alex/ai-wec58-content-generation
fix/blake/api-wec60-rate-limiting
```

## Commit Message Format

```
<type>: <description>

[optional body]

[optional footer]
```

### Types
| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code refactoring (no functional change) |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `chore` | Build, config, dependencies |
| `perf` | Performance improvement |
| `ci` | CI/CD changes |

### Examples
```bash
# Simple commit
feat: add Firebase authentication service

# With body
fix: resolve race condition in post scheduler

The scheduler was triggering duplicate posts when
the queue processing exceeded the timeout limit.
Added mutex lock to prevent concurrent execution.

# With ticket reference
feat: implement user profile API endpoint

Implements WEC-52 requirements for user profile CRUD.
```

## Workflow Steps

### Starting New Work

```bash
# 1. Ensure main is up to date
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/blake/auth-wec51-firebase-setup

# 3. Start work
# ... make changes ...
```

### During Development

```bash
# Commit frequently with meaningful messages
git add -A
git commit -m "feat: add Firebase config and initialization"

# Keep branch updated with main
git fetch origin
git rebase origin/main
```

### Before Creating PR

```bash
# 1. Run tests
pnpm run test

# 2. Run linting
pnpm run lint

# 3. Build check
pnpm run build

# 4. Squash commits if needed (optional)
git rebase -i HEAD~3

# 5. Push to remote
git push origin feature/blake/auth-wec51-firebase-setup
```

### Pull Request

1. Create PR with descriptive title
2. Fill in PR template
3. Request review from relevant team members
4. Address feedback
5. Merge when approved

## PR Template

```markdown
## Description
[Brief description of changes]

## Linear Ticket
[Link to Linear ticket]

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation
- [ ] Tests

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing done

## Checklist
- [ ] Code follows project conventions
- [ ] Self-reviewed my code
- [ ] Added necessary documentation
- [ ] No console.log or debug code
```

## Merge Strategy

- **Feature branches → main**: Squash and merge
- **Hotfixes**: Cherry-pick to release branches

## Conflict Resolution

```bash
# When conflicts occur during rebase
git rebase origin/main

# If conflicts:
# 1. Resolve conflicts in affected files
# 2. Stage resolved files
git add <resolved-files>

# 3. Continue rebase
git rebase --continue

# If need to abort
git rebase --abort
```

## Protected Branches

- `main` - Requires PR review before merge
- No direct pushes to `main`
- All tests must pass before merge

## Linear Integration

Update ticket status at each step:

| Action | Linear Status |
|--------|---------------|
| Start work | Todo → In Progress |
| Create PR | In Progress → In Review |
| PR merged | In Review → Done |

## Best Practices

1. **Small, focused commits**: One logical change per commit
2. **Descriptive messages**: Future you will thank present you
3. **Rebase over merge**: Keep history clean
4. **Push frequently**: Don't lose work
5. **Review your own PR first**: Before requesting reviews
