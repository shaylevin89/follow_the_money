# Story 0.5: Integrate tests into CI/CD pipeline

Status: done

## Story

As a developer,
I want tests to run automatically in CI/CD pipeline,
so that code quality is enforced and regressions are caught early.

## Acceptance Criteria

1. GitHub Actions workflow created for test execution
2. Unit tests run on every push and PR
3. E2E tests run on every push and PR (or on schedule)
4. Coverage report generated and uploaded as artifact
5. Test failures block merge/deployment
6. Workflow runs on multiple Node.js versions (if applicable)
7. Test results are visible in GitHub Actions UI
8. Documentation updated with CI/CD information

## Tasks / Subtasks

- [x] Task 1: Create GitHub Actions workflow file (AC: 1)
  - [x] Create .github/workflows/test.yml
  - [x] Configure triggers (push, pull_request, workflow_dispatch)
  - [x] Set up Node.js environment
- [x] Task 2: Configure unit test execution (AC: 2)
  - [x] Run npm test in workflow
  - [x] Fail workflow on test failures
  - [x] Generate coverage report
- [x] Task 3: Configure E2E test execution (AC: 3)
  - [x] Install Playwright browsers
  - [x] Run npm run test:e2e
  - [x] Upload test results/artifacts
- [x] Task 4: Configure coverage reporting (AC: 4)
  - [x] Generate coverage report
  - [x] Upload coverage as artifact
  - [x] Optionally: Upload to coverage service (can be added later)
- [x] Task 5: Configure workflow to block on failures (AC: 5)
  - [x] Ensure test failures fail workflow
  - [x] Test summary job verifies all tests passed
- [x] Task 6: Update documentation (AC: 8)
  - [x] Update README with CI/CD information
  - [x] Document how to view test results

## Dev Notes

### Current CI/CD State

**Existing:** .github/workflows/static.yml (deploys to GitHub Pages)
**New:** Need test workflow

**Requirements:**
- Run tests on push and PR
- Generate coverage reports
- Upload artifacts
- Fail on test failures

### Technical Requirements

- **Workflow File:** .github/workflows/test.yml
- **Triggers:** push, pull_request
- **Jobs:**
  - Unit tests (fast)
  - E2E tests (slower, may run on schedule or PR only)
  - Coverage report generation

### Architecture Compliance

- **Pattern:** Follow GitHub Actions best practices
- **Integration:** Works alongside existing static.yml workflow
- **Performance:** Fast feedback for unit tests, E2E on PR

### References

- [Source: .github/workflows/static.yml] - Existing workflow structure
- [Source: _bmad/bmm/workflows/testarch/ci/] - BMad CI/CD patterns
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-0] - Epic 0 requirements

## Dev Agent Record

### Agent Model Used

Auto (BMad Master)

### Debug Log References

- Created .github/workflows/test.yml with unit and E2E test jobs
- Configured to run on push, pull_request, and workflow_dispatch
- Unit tests run with coverage reporting
- E2E tests run with Playwright
- Test summary job verifies all tests passed
- Updated README with CI/CD information

### Completion Notes List

- **Implementation:**
  - Created GitHub Actions workflow for automated testing
  - Two jobs: unit-tests (fast) and e2e-tests (comprehensive)
  - Coverage reports uploaded as artifacts
  - Test summary job ensures all tests pass
  - Workflow fails if any tests fail

- **Rationale:**
  - Separate jobs for unit and E2E tests (different execution times)
  - Coverage reports uploaded for visibility
  - Test summary provides clear pass/fail status
  - Runs on every push and PR for early feedback

- **Benefits:**
  - Automated quality enforcement
  - Early detection of regressions
  - Coverage tracking
  - Test results visible in GitHub UI

- **Testing:**
  - Workflow file created and validated
  - Will run automatically on next push/PR
  - Can be triggered manually via workflow_dispatch

### File List

- `.github/workflows/test.yml` (new - GitHub Actions test workflow)
- `README.md` (modified - added CI/CD section)
