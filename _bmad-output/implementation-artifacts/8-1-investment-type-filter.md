# Story 8.1: Implement Investment Type Filtering Functionality

Status: ready-for-dev

## Story

As a user,
I want to filter investments by investment type,
so that I can quickly find and manage specific types of investments in my portfolio.

## Acceptance Criteria

1. Users can filter investments by investment type (single or multiple types)
2. Filter state is stored in a global variable
3. Filter works seamlessly with existing sort functionality
4. Filter updates renderInvestments() function to show only filtered investments
5. Filter persists during session (until page refresh)
6. Filter can be cleared to show all investments

## Tasks / Subtasks

- [ ] Task 1: Add global filter state variable (AC: 2)
  - [ ] Create global variable `selectedInvestmentTypes` (array)
  - [ ] Initialize as empty array (show all by default)
  
- [ ] Task 2: Implement filter logic in renderInvestments() (AC: 4)
  - [ ] Add filter step before sorting in renderInvestments()
  - [ ] Filter investments by selected types (if array is not empty)
  - [ ] If array is empty, show all investments
  - [ ] Maintain existing sort functionality after filtering
  
- [ ] Task 3: Create filter function (AC: 1, 6)
  - [ ] Create `applyInvestmentTypeFilter()` function
  - [ ] Function accepts array of investment type names
  - [ ] Updates global `selectedInvestmentTypes` variable
  - [ ] Calls renderInvestments() to refresh display
  - [ ] If empty array passed, clears filter (show all)
  
- [ ] Task 4: Integrate filter with existing code (AC: 3)
  - [ ] Ensure filter runs before sort in renderInvestments()
  - [ ] Verify sort direction and sort field work with filtered results
  - [ ] Test that inactive investments are still handled correctly

## Dev Notes

### Implementation Details

The investment type filtering will be implemented as a client-side filter that works with the existing sort functionality. The filter will:

1. **Global State**: Store selected investment types in a global array variable
2. **Filter Logic**: Filter investments before sorting in `renderInvestments()`
3. **Integration**: Work seamlessly with existing sort functionality
4. **Persistence**: Filter state persists during session (stored in memory)

### Technical Approach

- Add global variable: `let selectedInvestmentTypes = [];`
- Modify `renderInvestments()` to filter before sorting
- Filter logic: `if (selectedInvestmentTypes.length > 0 && !selectedInvestmentTypes.includes(inv.investment_type)) continue;`
- Create helper function `applyInvestmentTypeFilter(types)` to update filter state

### Files to Modify

- `app.js`:
  - Add global `selectedInvestmentTypes` variable (after sort variables, ~line 190)
  - Modify `renderInvestments()` function to add filter step (~line 988)
  - Add `applyInvestmentTypeFilter()` function (after renderInvestments, ~line 1137)

### Testing Requirements

- Unit tests for filter logic
- Unit tests for `applyInvestmentTypeFilter()` function
- E2E tests for filtering investments by type
- Test filter with sort functionality
- Test clearing filter
- Test filter with multiple types

### Project Structure Notes

- Follows existing pattern for global state (similar to `sortInvestmentsBy`, `sortDirection`)
- Maintains consistency with existing code structure
- No breaking changes to existing functionality

### References

- [Source: app.js#188-190] - Global sort variables pattern
- [Source: app.js#988-1022] - renderInvestments() function
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 8] - Epic 8 acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md#FR78] - Filter by investment type functional requirement

## Dev Agent Record

### Agent Model Used

Auto (Cursor AI)

### Completion Notes List

(To be filled by dev agent)

### File List

(To be filled by dev agent)
