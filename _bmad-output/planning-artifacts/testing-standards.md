# Testing Standards - follow_the_money

**Created:** 2026-01-16  
**Purpose:** Establish testing requirements for all future development work

## Testing Requirements for All Stories

### Definition of Done - Testing

Every story must include automated tests before being marked "done". The following applies:

1. **Unit Tests** - Required for:
   - All new functions
   - Business logic calculations
   - Data transformations
   - Utility functions
   - Edge cases and error handling

2. **Integration Tests** - Required for:
   - API interactions (GitHub API, Exchange Rate API)
   - External service integrations
   - Data persistence operations
   - Cross-component interactions

3. **E2E Tests** - Required for:
   - Critical user journeys
   - User-facing features
   - Complete workflows (save, load, update)
   - UI interactions

### Test Coverage Requirements

- **Core Business Logic:** >90% coverage
- **UI Interactions:** >80% coverage
- **API Integrations:** >80% coverage
- **Overall Project:** >80% coverage
- **New Code:** 100% coverage (all new functions must be tested)

### Test Quality Standards

1. **Test Structure:**
   - Use Given-When-Then format
   - Clear, descriptive test names
   - One assertion per test (atomic design)
   - No test interdependencies

2. **Test Patterns:**
   - Use `data-testid` selectors (not CSS classes)
   - Explicit waits (no hard sleeps)
   - Network-first pattern for E2E tests
   - Proper mocking for external dependencies

3. **Test Maintenance:**
   - Tests must be maintainable
   - Use page objects or similar patterns
   - Avoid flaky patterns (race conditions, timing issues)
   - Tests should run in any order

### CI/CD Integration

- All tests must run in CI/CD pipeline
- Tests must pass before merge
- Code coverage must not decrease
- Test failures block deployment

### Test Framework

- **E2E:** Playwright (recommended for static sites)
- **Unit:** Vitest or Jest
- **Coverage:** Built-in coverage tools

### Story Development Process

1. **Create Story** - Include test requirements in acceptance criteria
2. **Write Tests First (TDD)** - Or alongside code (ATDD)
3. **Implement Feature** - Make tests pass
4. **Code Review** - Verify tests are comprehensive
5. **Mark Done** - Only after all tests pass and coverage requirements met

### Testing Checklist for Each Story

- [ ] Unit tests written for all new functions
- [ ] Integration tests written for API calls
- [ ] E2E tests written for user-facing features
- [ ] All tests pass locally
- [ ] Code coverage meets requirements
- [ ] Tests run in CI/CD pipeline
- [ ] Test documentation updated if needed

## Exceptions

- **Documentation-only changes:** No tests required
- **Configuration changes:** Tests for affected functionality only
- **Refactoring:** Existing tests must still pass, may need updates

## Enforcement

- Stories cannot be marked "done" without tests
- Code reviews must verify test coverage
- CI/CD pipeline enforces test execution
- Coverage reports tracked in project metrics
