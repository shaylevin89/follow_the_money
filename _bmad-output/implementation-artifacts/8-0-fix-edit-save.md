# Story 8.0: Fix Edit Investment Form Save Functionality (CRITICAL)

Status: done

## Story

As a user,
I want to be able to save changes when editing investments,
so that my investment updates are persisted correctly.

## Acceptance Criteria

1. Edit investment form submission works correctly - users can save changes
2. Form validation works properly for edit investment form
3. Error handling provides clear feedback if save fails
4. Required fields (name, amount) are validated before submission
5. Profit rate is validated for loan-type investments
6. Token validation occurs before attempting save
7. User-friendly error messages are displayed via toast notifications
8. Success confirmation is shown after successful save

## Tasks / Subtasks

- [x] Task 1: Add form validation to edit investment form (AC: 1, 2, 4)
  - [x] Add `was-validated` class on form submission
  - [x] Validate required fields (name, amount) before processing
  - [x] Show validation feedback for invalid fields
  - [x] Prevent submission if validation fails
  
- [x] Task 2: Add error handling and user feedback (AC: 3, 7)
  - [x] Wrap save operation in try-catch block
  - [x] Display user-friendly error messages via toast notifications
  - [x] Handle case where investment is not found
  - [x] Handle case where token is missing or invalid
  
- [x] Task 3: Add profit rate validation for loan types (AC: 5)
  - [x] Validate profit rate is a number and > 0 for loan-type investments
  - [x] Show validation feedback if profit rate is invalid
  - [x] Prevent submission if profit rate validation fails
  
- [x] Task 4: Add token validation (AC: 6)
  - [x] Check if token exists before calling saveData
  - [x] Show error message if token is missing
  - [x] Return early if token validation fails

## Dev Notes

### Implementation Details

The edit investment form was missing proper validation and error handling, causing silent failures when users tried to save changes. The fix includes:

1. **Form Validation**: Added Bootstrap validation pattern matching the add investment form
   - Validates required fields (name, amount) before submission
   - Shows visual feedback for invalid fields
   - Prevents submission if validation fails

2. **Error Handling**: Added comprehensive error handling
   - Try-catch block around save operation
   - User-friendly error messages via `showErrorToast()`
   - Handles edge cases (investment not found, missing token)

3. **Profit Rate Validation**: Enhanced validation for loan-type investments
   - Validates profit rate is a number and > 0
   - Shows validation feedback
   - Prevents submission if invalid

4. **Token Validation**: Added token check before save
   - Validates token exists before calling `saveData()`
   - Shows error message if token is missing
   - Prevents unnecessary API calls

### Files Modified

- `app.js`: Enhanced `editInvestmentForm` submit handler (lines 1174-1238)
  - Added form validation with `was-validated` class
  - Added required field validation (name, amount)
  - Added profit rate validation for loan types
  - Added token validation
  - Added try-catch error handling
  - Added user-friendly error messages

### Testing Requirements

- Unit tests for form validation logic
- Unit tests for error handling paths
- E2E tests for edit investment flow
- Test validation feedback display
- Test error toast notifications
- Test success flow after fix

### Project Structure Notes

- Follows existing validation patterns from add investment form
- Uses existing `showErrorToast()` function from Epic 5
- Uses existing `getToken()` function from Epic 2
- Maintains consistency with other form handlers

### References

- [Source: app.js#405-422] - Add investment form validation pattern
- [Source: app.js#900-985] - saveData function implementation
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 8] - Epic 8 acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md#FR15] - Edit investment functional requirement

## Dev Agent Record

### Agent Model Used

Auto (Cursor AI)

### Completion Notes List

- Form validation implemented following Bootstrap validation pattern
- Error handling added with try-catch and user-friendly messages
- Profit rate validation added for loan-type investments
- Token validation added before save operation
- All acceptance criteria met

### File List

- `app.js` - Enhanced edit investment form submit handler
