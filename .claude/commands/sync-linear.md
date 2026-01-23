# Sync Linear Command

Sync current work status with Linear ticket.

## Usage

```
/sync-linear WEC-XX
```

## Workflow

1. **Get Current State**
   - Check git branch and commits
   - Check for uncommitted changes
   - Check if PR exists

2. **Determine Appropriate Status**
   - No commits yet → Keep as "In Progress"
   - Has commits, no PR → "In Progress"
   - PR created → "In Review"
   - PR merged → "Done"

3. **Update Linear**
   - Update status if needed
   - Add progress comment

## Progress Comment Template

```markdown
🔄 **Sync Update**

**Branch**: feature/blake/auth-wec51-firebase-setup
**Commits**: 5 commits ahead of main
**Files Changed**: 8 files

**Progress**:
- ✅ Firebase config setup
- ✅ Auth service created
- 🔄 Testing in progress

**Next Steps**:
- Complete unit tests
- Create PR for review
```

## Example Output

```
📊 Linear Sync for WEC-51

Current State:
- Branch: feature/blake/auth-wec51-firebase-setup
- Commits: 5 ahead of main
- Uncommitted: 2 files
- PR: None

Linear Status: In Progress ✅ (no change needed)

Added comment with progress update.
```
