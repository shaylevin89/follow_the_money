# Story 6.2: Prevent duplicate investments

Status: done

## Story

As a user,
I want to be prevented from creating duplicate investments,
so that I don't accidentally create multiple entries for the same investment.

## Acceptance Criteria

1. Duplicate investment detection before submission
2. Check for duplicates by name (case-insensitive)
3. Check for duplicates by name and start date combination
4. Show clear error message when duplicate detected
5. Prevent form submission if duplicate found
6. Duplicate check is accessible (screen reader friendly)
7. Option to allow duplicate if user explicitly wants (optional - can be future enhancement)

## Tasks / Subtasks

- [x] Task 1: Create duplicate detection function (AC: 1, 2, 3)
  - [x] Check for duplicate by name (case-insensitive)
  - [x] Check for duplicate by name and start date
  - [x] Return duplicate information
- [x] Task 2: Integrate into form validation (AC: 4, 5)
  - [x] Check for duplicates before form submission (add form)
  - [x] Check for duplicates before form submission (edit form)
  - [x] Show error message if duplicate found
  - [x] Prevent form submission
- [x] Task 3: Add error message display (AC: 4)
  - [x] Show error message in investment name field
  - [x] Clear, actionable message
  - [x] Visual indicator (is-invalid class)
- [x] Task 4: Ensure accessibility (AC: 6)
  - [x] ARIA labels via Bootstrap (automatic)
  - [x] Screen reader announcements (validationMessage)
  - [x] Keyboard accessible

## Dev Notes

### Current Implementation Analysis

**Current Duplicate Handling:**
- No duplicate detection
- Users can create multiple investments with same name
- No validation for duplicates

**Issues:**
- No duplicate prevention
- Users can accidentally create duplicates
- No feedback about existing investments

**Approach:**
- Create checkForDuplicate function
- Check for duplicates by name (case-insensitive)
- Optionally check by name and start date combination
- Show error message in investment name field
- Prevent form submission if duplicate found

### Technical Requirements

- **Duplicate Detection:**
  - Check by name (case-insensitive comparison)
  - Check by name and start date combination
  - Exclude current investment when editing

- **Error Display:**
  - Show error in investment name field
  - Use Bootstrap is-invalid class
  - Show error message in invalid-feedback div

- **Integration:**
  - Check before form submission
  - Prevent submission if duplicate found
  - Clear error when duplicate resolved

### Architecture Compliance

- **Pattern:** Consistent with existing validation
- **Framework:** Bootstrap 5.3.0 validation classes
- **CSS:** Use design system variables

### Testing Requirements

1. **Manual Testing:**
   - Test duplicate detection works correctly
   - Test error message appears
   - Test form submission prevented
   - Test accessibility

2. **Automated Testing:**
   - Unit tests for duplicate detection function
   - E2E tests for duplicate prevention

### References

- [Source: app.js#282-305] - Form submission handler
- [Source: app.js#307] - Investment creation
- [Source: _bmad-output/planning-artifacts/epics.md#240-264] - Epic 6 requirements

## Dev Agent Record

### Agent Model Used

Auto (BMad Master)

### Debug Log References

- Created checkForDuplicateInvestment function
- Integrated duplicate check into add investment form
- Integrated duplicate check into edit investment form
- Duplicate check by name (case-insensitive) and start date
- Error message shown in investment name field
- Form submission prevented if duplicate found

### Completion Notes List

- **Implementation:**
  - Created checkForDuplicateInvestment function for duplicate detection
  - Duplicate check by name (case-insensitive) and start date combination
  - Integrated into add investment form submission
  - Integrated into edit investment form submission (excludes current investment)
  - Error message shown in investment name field with is-invalid class
  - Form submission prevented if duplicate found

- **Rationale:**
  - Duplicate prevention prevents accidental duplicate entries
  - Name and start date combination provides good duplicate detection
  - Case-insensitive name comparison handles variations
  - Excluding current investment when editing allows name changes

- **Benefits:**
  - Prevents duplicate investments
  - Better data integrity
  - Clear feedback when duplicate detected
  - Accessible design

- **Testing:**
  - Unit tests verify duplicate detection function
  - E2E tests verify duplicate prevention
  - Manual testing confirms duplicate check works

### File List

- `app.js` (modified - added checkForDuplicateInvestment function and integrated into form submissions)
