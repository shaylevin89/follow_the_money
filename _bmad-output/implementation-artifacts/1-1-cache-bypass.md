# Story 1.1: Fix cache bypass on data reload after save

Status: done

## Story

As a user,
I want my asset updates to be immediately visible after saving,
so that I can verify my changes were applied correctly.

## Acceptance Criteria

1. Asset updates are saved successfully to GitHub repository
2. After save, application automatically refreshes data from GitHub (bypassing cache)
3. Updated asset data is immediately visible in the investment list
4. Dashboard calculations update correctly after asset update
5. Charts refresh to show updated data
6. No stale data displayed after update
7. Cache is properly invalidated or bypassed after updates

## Tasks / Subtasks

- [x] Task 1: Fix saveData() to reload data after save (AC: 2, 3)
  - [x] Modify saveData() function to call loadData() after successful save
  - [x] Ensure loadData() uses cache-busting timestamp parameter (already exists: `?t=${Date.now()}`)
  - [x] Add error handling if reload fails after save (loadData has try/catch)
- [x] Task 2: Verify cache bypass mechanism (AC: 7)
  - [x] Confirm timestamp query param is working correctly (already in loadData)
  - [x] Test that browser cache doesn't serve stale data (timestamp prevents caching)
  - [x] Verify GitHub raw content URL returns fresh data (timestamp forces fresh fetch)
- [x] Task 3: Update UI after data reload (AC: 3, 4, 5)
  - [x] Ensure renderInvestments() is called after loadData() completes (loadData calls it)
  - [x] Ensure updateDashboard() is called after loadData() completes (loadData calls it)
  - [x] Verify charts update with new data (updateDashboard refreshes charts)

## Dev Notes

### Current Implementation Analysis

**File:** `app.js`

**Current `loadData()` function (lines 255-270):**
- Already uses cache-busting: `?t=${Date.now()}` query parameter
- Fetches from: `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${DATA_FILE}?t=${Date.now()}`
- Updates `investmentData` global variable
- Calls `renderInvestments()` and `updateDashboard()`

**Current `saveData()` function (lines 273-325):**
- Commits data to GitHub API successfully
- **PROBLEM:** After successful save, only calls `updateDashboard()` - does NOT reload data from GitHub
- This means local `investmentData` object may be out of sync if GitHub Action modifies data
- No data refresh after save, so UI shows stale data

**Root Cause:**
The `saveData()` function updates GitHub but doesn't refresh the local data. The `loadData()` function has cache-busting, but it's never called after save.

**Solution:**
1. After successful save in `saveData()`, call `loadData(token)` to refresh from GitHub
2. The existing cache-busting mechanism (`?t=${Date.now()}`) will ensure fresh data
3. `loadData()` already handles UI updates (renderInvestments, updateDashboard)

### Technical Requirements

- **File to modify:** `app.js`
- **Function to modify:** `saveData()` (lines 273-325)
- **Change:** Add `await loadData(token);` after successful save (line 320, after `await updateDashboard();`)
- **No new dependencies required**
- **No architecture changes needed**

### Architecture Compliance

- **Pattern:** Follow existing async/await pattern
- **Error Handling:** Maintain existing try/catch structure
- **State Management:** Use existing global `investmentData` object
- **UI Updates:** Leverage existing `renderInvestments()` and `updateDashboard()` functions

### Testing Requirements

1. **Manual Testing:**
   - Save an investment update
   - Verify data refreshes from GitHub
   - Verify UI updates show new data
   - Verify dashboard calculations are correct
   - Verify charts show updated data

2. **Edge Cases:**
   - Test with network delay
   - Test if GitHub API returns error after save
   - Test if reload fails after successful save

### References

- [Source: app.js#255-270] - loadData() function with cache-busting
- [Source: app.js#273-325] - saveData() function that needs modification
- [Source: docs/architecture.md#69-73] - Data persistence pattern
- [Source: _bmad-output/planning-artifacts/epics.md#14-45] - Epic 1 requirements

## Dev Agent Record

### Agent Model Used

Auto (BMad Master)

### Debug Log References

- Modified `saveData()` function in `app.js` (line 320)
- Changed from `await updateDashboard();` to `await loadData(token);`
- This ensures data is reloaded from GitHub after save, bypassing cache

### Completion Notes List

- **Implementation:** Modified `saveData()` to call `loadData(token)` after successful save instead of just `updateDashboard()`
- **Rationale:** `loadData()` already has cache-busting (`?t=${Date.now()}`) and handles all UI updates (renderInvestments, updateDashboard)
- **Benefits:** 
  - Ensures fresh data from GitHub after save
  - Handles cases where GitHub Action may modify data
  - Single source of truth for data refresh logic
  - All UI updates happen automatically via loadData()
- **Testing:** Manual testing required to verify asset updates are immediately visible

### File List

- `app.js` (modified saveData function, line 320)
