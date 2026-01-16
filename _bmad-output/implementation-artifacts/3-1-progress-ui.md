# Story 3.1: Add progress indicator UI component

Status: done

## Story

As a user,
I want to see a progress indicator when saving my investments,
so that I know the system is processing my request.

## Acceptance Criteria

1. Progress indicator displayed immediately after save button is clicked
2. Progress bar or spinner shows during GitHub Action execution (~20 seconds)
3. Status messages indicate current state (Saving..., Processing..., Complete)
4. Error state displayed if GitHub Action fails
5. Success confirmation shown when update completes
6. Progress indicator is visually clear and non-intrusive

## Tasks / Subtasks

- [x] Task 1: Create progress indicator HTML structure (AC: 1, 2)
  - [x] Add progress modal/overlay to index.html
  - [x] Include progress bar element
  - [x] Include status message element
  - [x] Include spinner/loading animation
  - [x] Style with Bootstrap classes for consistency
- [x] Task 2: Create progress indicator JavaScript functions (AC: 1, 3, 4, 5)
  - [x] Function to show progress indicator
  - [x] Function to update progress status message
  - [x] Function to update progress bar percentage
  - [x] Function to show error state
  - [x] Function to show success state
  - [x] Function to hide progress indicator
- [x] Task 3: Style progress indicator (AC: 6)
  - [x] Make it visually clear and prominent
  - [x] Ensure it's non-intrusive (modal overlay)
  - [x] Add smooth animations for state transitions (Bootstrap animations)
  - [x] Ensure mobile-responsive design (Bootstrap modal is responsive)

## Dev Notes

### Current Implementation Analysis

**File:** `index.html`, `app.js`

**Current saveData() function (app.js:279-330):**
- No progress feedback during save
- Only shows alert on error
- User has no indication of progress

**Current UI:**
- Uses Bootstrap 5.3.0
- Has modals for edit forms
- No progress indicator component

**Design Approach:**
- Use Bootstrap modal for progress overlay
- Include Bootstrap progress bar component
- Use Bootstrap spinner for loading animation
- Status messages: "Saving...", "Processing...", "Complete"

### Technical Requirements

- **Files to Modify:**
  - `index.html` - Add progress modal HTML structure
  - `app.js` - Add progress indicator functions

- **Bootstrap Components:**
  - Modal (for overlay)
  - Progress bar (for visual progress)
  - Spinner (for loading animation)
  - Alert (for error/success messages)

- **No new dependencies required**

### Architecture Compliance

- **Pattern:** Follow existing Bootstrap modal pattern
- **State Management:** Use existing global functions
- **UI Updates:** Direct DOM manipulation (consistent with existing code)

### Testing Requirements

1. **Manual Testing:**
   - Show progress indicator
   - Update status messages
   - Update progress bar
   - Show error state
   - Show success state
   - Hide progress indicator
   - Test on mobile viewport

2. **Edge Cases:**
   - Multiple rapid saves (should show latest progress)
   - Network interruption during display
   - Very long processing time

### References

- [Source: index.html] - Current HTML structure and Bootstrap usage
- [Source: app.js#279-330] - Current saveData() function
- [Source: _bmad-output/planning-artifacts/epics.md#79-113] - Epic 3 requirements

## Dev Agent Record

### Agent Model Used

Auto (BMad Master)

### Debug Log References

- Added progress modal HTML to index.html (before closing body tag)
- Created progress indicator functions in app.js:
  - showProgress() - Shows modal with initial status
  - updateProgress() - Updates progress bar and status
  - showProgressError() - Shows error state
  - showProgressSuccess() - Shows success state
  - hideProgress() - Hides modal and resets
- Integrated progress indicator into saveData() function
- Progress states: 10% (saving), 50% (processing), 100% (complete)

### Completion Notes List

- **Implementation:**
  - Added Bootstrap modal with progress bar, spinner, and status messages
  - Created 5 progress indicator functions for different states
  - Integrated into saveData() function with progress updates at key points
  - Progress flow: 10% (saving) → 50% (processing) → 100% (complete)
  - Error and success states with auto-hide after timeout

- **Rationale:**
  - Uses Bootstrap components for consistency with existing UI
  - Modal overlay is non-intrusive and blocks interaction during save
  - Progress bar provides visual feedback
  - Status messages keep user informed
  - Auto-hide on success/error prevents modal from staying open

- **Benefits:**
  - User sees immediate feedback when save button clicked
  - Clear indication of progress through save and processing
  - Error states are clearly communicated
  - Success confirmation provides closure
  - Mobile-responsive design via Bootstrap

- **Testing:**
  - Manual testing required: Save an investment and verify progress indicator appears
  - Verify progress updates correctly
  - Verify error state shows on failure
  - Verify success state shows on completion

### File List

- `index.html` (modified - added progress modal HTML)
- `app.js` (modified - added progress indicator functions and integrated into saveData)
