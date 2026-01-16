# Story 8.2: Create Mobile-Friendly Filter UI

Status: done

## Story

As a mobile user,
I want a mobile-friendly interface to filter investments by type,
so that I can easily select and apply filters on my phone.

## Acceptance Criteria

1. Filter button (funnel icon) is functional and clickable
2. Filter UI is mobile-friendly (dropdown, chips, or modal)
3. Large touch targets (minimum 44x44px) for filter controls
4. Clear labels for filter options
5. Multiple investment types can be selected for filtering
6. "Show all" option to clear filters
7. Filter UI works on both mobile and desktop

## Tasks / Subtasks

- [x] Task 1: Make funnel icon functional (AC: 1)
  - [x] Add click handler to funnel icon
  - [x] Toggle filter UI visibility on click
  - [x] Add aria-label for accessibility
  
- [x] Task 2: Create mobile-friendly filter UI (AC: 2, 7)
  - [x] Create filter dropdown/modal component
  - [x] Use Bootstrap dropdown for desktop
  - [x] Use Bootstrap modal for mobile (responsive)
  - [x] Show all available investment types as checkboxes
  
- [x] Task 3: Implement filter selection (AC: 5)
  - [x] Add checkboxes for each investment type
  - [x] Allow multiple selections
  - [x] Update filter state when checkboxes change
  - [x] Call applyInvestmentTypeFilter() with selected types
  
- [x] Task 4: Add "Show all" option (AC: 6)
  - [x] Add "Clear filters" or "Show all" button
  - [x] Clear selectedInvestmentTypes array
  - [x] Refresh investment list
  
- [x] Task 5: Ensure mobile-friendly touch targets (AC: 3, 4)
  - [x] Ensure checkboxes are at least 44x44px on mobile
  - [x] Add clear labels for each filter option
  - [x] Test on mobile viewport sizes

## Dev Notes

### Implementation Details

The filter UI will use Bootstrap components for responsiveness:
- Desktop: Bootstrap dropdown menu
- Mobile: Bootstrap modal (better for small screens)
- Checkboxes for each investment type
- "Clear filters" button to reset

### Technical Approach

1. Make funnel icon clickable with event handler
2. Create filter dropdown/modal with investment type checkboxes
3. Use Bootstrap's responsive utilities to show dropdown on desktop, modal on mobile
4. Wire up checkboxes to update `selectedInvestmentTypes` array
5. Call `applyInvestmentTypeFilter()` when selections change

### Files to Modify

- `index.html`:
  - Add filter dropdown/modal structure (after sort controls, ~line 424)
  - Add checkboxes for each investment type
  - Add "Clear filters" button
  
- `app.js`:
  - Add click handler for funnel icon (~line 193)
  - Add function to populate filter UI with investment types
  - Add function to handle checkbox changes
  - Add function to show/hide filter UI

### Testing Requirements

- Unit tests for filter UI functions
- E2E tests for filter UI interaction
- Test mobile viewport behavior
- Test desktop viewport behavior
- Test checkbox selection/deselection
- Test "Clear filters" functionality

### Project Structure Notes

- Uses Bootstrap components for consistency
- Follows existing UI patterns
- Mobile-first responsive design

### References

- [Source: index.html#407-424] - Investment list header with sort controls
- [Source: app.js#applyInvestmentTypeFilter] - Filter function from Story 8-1
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 8] - Epic 8 acceptance criteria

## Dev Agent Record

### Agent Model Used

Auto (Cursor AI)

### Completion Notes List

- Made funnel icon functional with Bootstrap dropdown (desktop) and modal (mobile)
- Created responsive filter UI with checkboxes for each investment type
- Implemented filter selection with multiple type support
- Added "Show all" button to clear filters
- Ensured mobile-friendly touch targets (44x44px minimum)
- Filter UI updates when investment types are added/removed
- All acceptance criteria met

### File List

- `index.html` - Added filter dropdown and modal UI
- `app.js` - Added setupFilterUI(), updateFilterUI(), and handleFilterCheckboxChange() functions
