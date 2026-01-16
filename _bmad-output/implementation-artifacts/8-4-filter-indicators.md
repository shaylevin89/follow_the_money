# Story 8.4: Add Filter Indicators and Clear Functionality

Status: done

## Story

As a user,
I want to see when filters are active and easily clear them,
so that I know what's being filtered and can quickly reset to view all investments.

## Acceptance Criteria

1. Filter indicator shows active filter count
2. Visual indicator when filters are active
3. "Clear filters" functionality is easily accessible
4. Indicator updates when filters change

## Tasks / Subtasks

- [x] Task 1: Add filter indicator badge (AC: 1, 2)
  - [x] Show badge with count of active filters
  - [x] Display badge on filter button
  - [x] Hide badge when no filters active
  
- [x] Task 2: Update indicator when filters change (AC: 4)
  - [x] Update badge count when filters applied
  - [x] Update badge count when filters cleared
  - [x] Call update function from applyInvestmentTypeFilter()

## Dev Notes

### Implementation Details

Add a badge indicator showing the number of active filters. The badge should:
- Show count of selected investment types
- Appear on the filter button
- Update automatically when filters change

### Files to Modify

- `index.html` - Add badge element to filter buttons
- `app.js` - Add function to update filter indicator badge

### References

- [Source: app.js#applyInvestmentTypeFilter] - Filter function
- [Source: index.html#filterDropdownBtn, filterModalBtn] - Filter buttons

## Dev Agent Record

### Agent Model Used

Auto (Cursor AI)

### Completion Notes List

- Added filter indicator badges to both desktop and mobile filter buttons
- Badge shows count of active filters
- Badge automatically updates when filters change
- Badge is hidden when no filters are active
- All acceptance criteria met

### File List

- `index.html` - Added badge elements to filter buttons
- `app.js` - Added updateFilterIndicator() function and integrated with filter system
