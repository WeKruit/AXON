# Create PR Command

Create a pull request and update Linear ticket.

## Usage

```
/create-pr
```

## Workflow

1. **Pre-flight Checks**
   - Run tests: `pnpm run test`
   - Run linting: `pnpm run lint`
   - Run build: `pnpm run build`

2. **Commit Final Changes**
   - Stage all changes
   - Create final commit if needed

3. **Push to Remote**
   - Push branch to origin

4. **Create GitHub PR**
   - Generate PR title from branch/commits
   - Fill PR template with:
     - Description from Linear ticket
     - Link to Linear ticket
     - Checklist items

5. **Update Linear**
   - Move ticket to "In Review"
   - Add comment with PR link

## PR Template

```markdown
## Description
[Auto-generated from Linear ticket]

## Linear Ticket
[Link to WEC-XX]

## Changes
- [Auto-generated from commits]

## Type of Change
- [x] Feature / Bug fix / Refactor

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing done

## Checklist
- [ ] Code follows project conventions
- [ ] Self-reviewed my code
- [ ] Added necessary documentation
```

## Example Output

```
✅ Tests passed
✅ Lint passed
✅ Build succeeded
✅ Pushed to origin/feature/blake/auth-wec51-firebase-setup
✅ Created PR: https://github.com/org/repo/pull/123
✅ Updated WEC-51 to "In Review"
✅ Added PR link comment to ticket
```
