# Story 8.3: Improve Mobile UX for Investment List Header

Status: done

## Story

As a mobile user,
I want a better mobile experience for the investment list header,
so that I can easily access sorting and filtering controls on my phone.

## Acceptance Criteria

1. Better spacing for mobile viewport
2. Touch targets are at least 44x44px
3. Controls are thumb-friendly (placed for easy reach)
4. Header layout adapts to screen size
5. No horizontal scrolling on mobile

## Tasks / Subtasks

- [x] Task 1: Improve mobile spacing (AC: 1, 4)
  - [x] Add responsive spacing classes
  - [x] Adjust gap between controls on mobile
  - [x] Ensure header doesn't overflow on small screens
  
- [x] Task 2: Ensure touch targets meet size requirements (AC: 2)
  - [x] Verify all buttons are at least 44x44px on mobile
  - [x] Add padding to increase touch target size if needed
  
- [x] Task 3: Optimize layout for thumb reach (AC: 3)
  - [x] Position frequently used controls in thumb zone
  - [x] Stack controls vertically on mobile if needed
  - [x] Ensure important actions are easily accessible

## Dev Notes

### Implementation Details

The investment list header needs mobile optimization:
- Better spacing and layout for small screens
- Larger touch targets
- Thumb-friendly positioning

### Files to Modify

- `index.html` - Update investment list header structure and classes
- CSS in `index.html` - Add mobile-specific styles

### References

- [Source: index.html#403-425] - Investment list header
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 8] - Epic 8 acceptance criteria

## Dev Agent Record

### Agent Model Used

Auto (Cursor AI)

### Completion Notes List

- Improved header layout with flexbox for responsive design
- Added min-width and min-height (44px) to all buttons for touch targets
- Made header stack vertically on mobile with proper spacing
- Hidden "Sort by:" label on very small screens to save space
- Adjusted select dropdown width for mobile
- All acceptance criteria met

### File List

- `index.html` - Updated investment list header with responsive classes and touch target sizes
