# TDD Rules for WeCrew-AXON

## Red-Green-Refactor Cycle

```
┌─────────────────────────────────────────────────────┐
│  1. RED: Write failing test                         │
│     ↓                                               │
│  2. GREEN: Write minimal code to pass               │
│     ↓                                               │
│  3. REFACTOR: Improve code, keep tests passing      │
│     ↓                                               │
│  (repeat)                                           │
└─────────────────────────────────────────────────────┘
```

## Coverage Requirements

| Area | Minimum Coverage |
|------|------------------|
| Overall | 80% |
| Critical paths (auth, payments) | 90% |
| New code | 100% |
| API endpoints | 85% |
| Service layer | 90% |

## Test File Structure

```
apps/
├── backend/
│   └── src/
│       ├── services/
│       │   ├── post.service.ts
│       │   └── post.service.spec.ts    # Unit tests
│       └── api/
│           └── routes/
│               ├── posts.controller.ts
│               └── posts.controller.spec.ts  # Integration tests
└── frontend/
    └── src/
        └── components/
            ├── PostCard.tsx
            └── PostCard.spec.tsx    # Component tests
```

## Test Naming Convention

```typescript
describe('ClassName', () => {
  describe('methodName', () => {
    it('should [expected behavior] when [condition]', () => {
      // test
    });
  });
});
```

### Examples
```typescript
describe('PostService', () => {
  describe('create', () => {
    it('should create a post when valid data provided', () => {});
    it('should throw error when content is empty', () => {});
    it('should set default status to draft', () => {});
  });

  describe('publish', () => {
    it('should change status to published', () => {});
    it('should throw error when post not found', () => {});
    it('should trigger notification to subscribers', () => {});
  });
});
```

## Test Categories

### Unit Tests
- Test single function/method
- Mock all dependencies
- Fast execution (< 100ms)

```typescript
// Example: Unit test with mocks
describe('PostService', () => {
  let service: PostService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      post: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    } as any;

    service = new PostService(prisma);
  });

  it('should create post', async () => {
    prisma.post.create.mockResolvedValue({ id: '1', content: 'Test' });

    const result = await service.create({ content: 'Test' });

    expect(result.id).toBe('1');
    expect(prisma.post.create).toHaveBeenCalledWith({
      data: { content: 'Test' },
    });
  });
});
```

### Integration Tests
- Test multiple components together
- Use real database (test instance)
- Test API endpoints

```typescript
// Example: API integration test
describe('PostController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('POST /posts should create post', () => {
    return request(app.getHttpServer())
      .post('/posts')
      .send({ content: 'Test post' })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
      });
  });
});
```

### Component Tests
- Test React components
- Use React Testing Library
- Focus on user interactions

```tsx
// Example: Component test
import { render, screen, fireEvent } from '@testing-library/react';

describe('PostCard', () => {
  it('should display post content', () => {
    render(<PostCard post={{ id: '1', content: 'Hello' }} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should call onDelete when delete clicked', () => {
    const onDelete = jest.fn();
    render(<PostCard post={{ id: '1', content: 'Hello' }} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    expect(onDelete).toHaveBeenCalledWith('1');
  });
});
```

## Mock Patterns

### Database Mock (Prisma)
```typescript
const mockPrisma = {
  post: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn((fn) => fn(mockPrisma)),
};
```

### External API Mock (OpenAI)
```typescript
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Generated content' } }],
        }),
      },
    },
  })),
}));
```

### HTTP Mock (Axios)
```typescript
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

mockedAxios.get.mockResolvedValue({ data: { result: 'success' } });
```

## Commands

```bash
# Run all tests
pnpm run test

# Run with coverage
pnpm run test -- --coverage

# Run specific file
pnpm run test -- --testPathPattern="post.service.spec.ts"

# Run in watch mode
pnpm run test -- --watch

# Run only changed tests
pnpm run test -- --onlyChanged
```

## Pre-commit Checklist

- [ ] All tests pass
- [ ] Coverage meets requirements
- [ ] No skipped tests (`.skip`)
- [ ] No focused tests (`.only`)
- [ ] Test descriptions are clear

## Best Practices

1. **Test behavior, not implementation**
2. **One assertion per test** (when reasonable)
3. **Use meaningful test data**
4. **Keep tests independent**
5. **Clean up after tests**
6. **Don't test framework code**
