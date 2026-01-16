# Story 3.2: Implement GitHub Actions API polling

Status: done

## Story

As a user,
I want to see real-time progress of the GitHub Action workflow,
so that I know exactly when my changes are being processed and deployed.

## Acceptance Criteria

1. Application polls GitHub Actions API to check workflow run status
2. Progress bar updates based on actual workflow status (queued, in_progress, completed)
3. Status messages reflect actual workflow state
4. Application detects when GitHub Action starts (after commit)
5. Application detects when GitHub Action completes successfully
6. Application detects when GitHub Action fails
7. Polling stops when workflow completes or fails
8. Data refreshes automatically after workflow completes successfully

## Tasks / Subtasks

- [x] Task 1: Create GitHub Actions API polling function (AC: 1, 4, 5, 6, 7)
  - [x] Function to get latest workflow run for repository
  - [x] Function to check workflow run status
  - [x] Function to poll workflow status with interval
  - [x] Handle workflow states: queued, in_progress, completed, failure
  - [x] Stop polling when workflow completes or fails
  - [x] Handle API errors gracefully
- [x] Task 2: Map workflow status to progress percentage (AC: 2)
  - [x] queued → 20%
  - [x] in_progress → 30-90% (gradual increase)
  - [x] completed → 100%
  - [x] failure → show error
- [x] Task 3: Update status messages based on workflow state (AC: 3)
  - [x] "Waiting for GitHub Action to start..." (queued)
  - [x] "GitHub Action is running and deploying..." (in_progress)
  - [x] "Deployment completed successfully!" (completed)
  - [x] "Workflow failed" (failure)
- [x] Task 4: Integrate polling with saveData() function (AC: 5, 8)
  - [x] Start polling after successful commit
  - [x] Update progress based on workflow status
  - [x] Refresh data when workflow completes
  - [x] Handle timeout (max polling duration: 60 seconds)

## Dev Notes

### Current Implementation Analysis

**File:** `app.js`

**Current saveData() function:**
- Commits to GitHub API successfully
- Shows progress indicator (Story 3-1)
- Calls loadData() after save
- No GitHub Actions API integration

**GitHub Actions API:**
- Endpoint: `GET /repos/{owner}/{repo}/actions/runs`
- Can filter by workflow file, branch, status
- Returns workflow runs with status: queued, in_progress, completed
- Need to find the run triggered by our commit

**Workflow Details:**
- Workflow file: `.github/workflows/static.yml`
- Workflow name: "Deploy static content to Pages"
- Triggers on: push to main branch
- Takes ~20 seconds to complete

### Technical Requirements

- **GitHub API Endpoints:**
  - `GET /repos/{owner}/{repo}/actions/runs` - List workflow runs
  - `GET /repos/{owner}/{repo}/actions/runs/{run_id}` - Get specific run status
  - Filter by: workflow file, branch (main), event (push), status

- **Polling Strategy:**
  - Poll every 2-3 seconds
  - Maximum polling duration: 60 seconds (safety timeout)
  - Stop when status is "completed" or "failure"

- **Files to Modify:**
  - `app.js` - Add GitHub Actions API polling functions

- **No new dependencies required**

### Architecture Compliance

- **Pattern:** Follow existing async/await pattern
- **Error Handling:** Maintain existing try/catch structure
- **API Integration:** Use existing GitHub API authentication pattern

### Testing Requirements

1. **Manual Testing:**
   - Save an investment
   - Verify polling starts after commit
   - Verify progress updates based on workflow status
   - Verify data refreshes when workflow completes
   - Test error handling if API fails

2. **Edge Cases:**
   - Workflow doesn't start (timeout)
   - Workflow fails
   - API rate limits
   - Network errors during polling

### References

- [Source: app.js#279-330] - Current saveData() function
- [Source: .github/workflows/static.yml] - GitHub Actions workflow
- [Source: _bmad-output/planning-artifacts/epics.md#79-113] - Epic 3 requirements
- [Source: GitHub API Docs] - Actions API endpoints

## Dev Agent Record

### Agent Model Used

Auto (BMad Master)

### Debug Log References

- Created getLatestWorkflowRun() function to fetch workflow runs from GitHub Actions API
- Created getWorkflowRunStatus() function to get specific run status
- Created pollWorkflowStatus() function to poll workflow status with 2-second intervals
- Integrated polling into saveData() function after successful commit
- Progress mapping: queued (20%), in_progress (30-90%), completed (100%)
- Timeout handling: 60-second maximum polling duration

### Completion Notes List

- **Implementation:**
  - Added GitHub Actions API polling functions
  - getLatestWorkflowRun() finds workflow run by commit SHA or returns latest
  - pollWorkflowStatus() polls every 2 seconds with progress updates
  - Progress updates based on actual workflow status (queued, in_progress, completed)
  - Integrated into saveData() to poll after commit
  - Data refreshes automatically when workflow completes successfully

- **Rationale:**
  - Polls GitHub Actions API to get real-time workflow status
  - Uses commit SHA to find the specific workflow run triggered by our commit
  - Progress percentages reflect actual workflow state
  - 60-second timeout prevents infinite polling
  - Graceful error handling if API fails

- **Benefits:**
  - Real-time progress feedback based on actual workflow status
  - User sees exactly when workflow starts, runs, and completes
  - Clear error messages if workflow fails
  - Automatic data refresh when deployment completes
  - Better UX than estimated progress

- **Testing:**
  - Manual testing required: Save investment and verify polling works
  - Verify progress updates based on actual workflow status
  - Verify data refreshes when workflow completes
  - Test error handling if API fails

### File List

- `app.js` (modified - added GitHub Actions API polling functions and integrated into saveData)
