# Review Code Command

Run code review on current changes.

## Usage

```
/review-code
```

## Workflow

1. **Automated Checks**
   ```bash
   pnpm run lint
   pnpm run typecheck
   pnpm run test -- --coverage
   ```

2. **Code Analysis**
   - Check changed files
   - Analyze for common issues
   - Security review

3. **Generate Report**
   - List blocking issues
   - List suggestions
   - Coverage report

## Review Checklist

### Code Quality
- [ ] Functions < 50 lines
- [ ] No code duplication
- [ ] Meaningful names
- [ ] Proper error handling

### TypeScript
- [ ] Proper type annotations
- [ ] No `any` without justification
- [ ] Null/undefined handled

### Testing
- [ ] Tests exist for new code
- [ ] Edge cases covered
- [ ] Coverage meets minimum

### Security
- [ ] Inputs validated
- [ ] No hardcoded secrets
- [ ] Auth properly enforced

## Output Format

```markdown
## Code Review Report

### Automated Checks
- ✅ Lint: Passed
- ✅ TypeScript: Passed
- ⚠️ Coverage: 78% (below 80% target)

### Blocking Issues (1)
🚫 **BLOCKING**: Missing null check
**File**: src/services/post.service.ts:45
**Fix**: Add null guard before accessing property

### Suggestions (2)
💡 **SUGGESTION**: Consider memoization
**File**: src/components/PostList.tsx:23

💡 **SUGGESTION**: Extract to utility function
**File**: src/services/user.service.ts:67

### Verdict: CHANGES REQUESTED
```
