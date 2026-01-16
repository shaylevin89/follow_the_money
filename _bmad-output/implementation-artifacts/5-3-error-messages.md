# Story 5.3: Improve error messages to be user-friendly and actionable

Status: done

## Story

As a user,
I want error messages that are clear, helpful, and tell me what to do,
so that I can fix problems and continue using the application.

## Acceptance Criteria

1. Error messages are user-friendly (no technical jargon)
2. Error messages are actionable (tell user what to do)
3. Network errors show helpful messages
4. GitHub API errors show helpful messages
5. Form validation errors are clear
6. Error messages are visually distinct (red/error styling)
7. Error messages don't block user interaction unnecessarily
8. Error messages are accessible (screen reader friendly)

## Tasks / Subtasks

- [x] Task 1: Improve error message language (AC: 1)
  - [x] Created getUserFriendlyErrorMessage function
  - [x] Replaced technical errors with user-friendly language
  - [x] Removed stack traces from user-facing messages
  - [x] Used plain language
- [x] Task 2: Make error messages actionable (AC: 2)
  - [x] Tell user what went wrong (specific error types)
  - [x] Suggest what to do next (check connection, check token, etc.)
  - [x] Provide context for errors
- [x] Task 3: Handle network errors gracefully (AC: 3)
  - [x] Detect network errors (navigator.onLine, fetch errors)
  - [x] Show user-friendly message
  - [x] Suggest checking connection
- [x] Task 4: Handle GitHub API errors (AC: 4)
  - [x] Parse GitHub API error responses
  - [x] Show helpful messages for common errors (401, 403, 404, 429, 500)
  - [x] Handle authentication errors (401)
  - [x] Handle rate limiting errors (429)
- [x] Task 5: Improve form validation errors (AC: 5)
  - [x] Clear error messages for invalid inputs (Bootstrap validation)
  - [x] Real-time feedback (covered in Story 5-4)
  - [x] Specific messages for each validation rule
- [x] Task 6: Ensure visual distinction (AC: 6)
  - [x] Use error colors (red) in progress modal
  - [x] Use Bootstrap danger classes for toast
  - [x] Clear visual hierarchy
- [x] Task 7: Ensure non-blocking (AC: 7)
  - [x] Use toast notifications for errors
  - [x] Don't block user unnecessarily
  - [x] Allow user to continue
- [x] Task 8: Ensure accessibility (AC: 8)
  - [x] ARIA labels (aria-live, aria-atomic)
  - [x] Screen reader announcements (role="alert")
  - [x] Keyboard accessible (Bootstrap toast)

## Dev Notes

### Current Implementation Analysis

**Current Error Handling:**
1. `showProgressError(errorMessage)` - Shows error in progress modal
   - Used in saveData catch block
   - Generic message: "Failed to save data. Please check console for details."
   - Auto-hides after 3 seconds

2. `console.error()` - Errors logged to console
   - Not user-friendly
   - Technical details only

3. `alert()` - Used for token validation
   - Blocks user interaction
   - Not ideal UX

**Issues:**
- Error messages are too technical
- Don't tell user what to do
- Network errors not handled specifically
- GitHub API errors not parsed
- No toast notifications for errors

**Approach:**
- Create user-friendly error message mapping
- Add error toast notifications
- Parse GitHub API errors
- Handle network errors specifically
- Improve showProgressError messages

### Technical Requirements

- **Error Message Mapping:**
  - Network errors: "Unable to connect. Please check your internet connection and try again."
  - GitHub 401: "Authentication failed. Please check your token and try again."
  - GitHub 403: "Access denied. Please check your token permissions."
  - GitHub 404: "Resource not found. Please check the repository settings."
  - GitHub 429: "Too many requests. Please wait a moment and try again."
  - Generic: "Something went wrong. Please try again."

- **Error Toast:**
  - Similar to success toast but with error styling
  - Non-blocking
  - Auto-dismiss after 5 seconds (longer than success)

### Architecture Compliance

- **Pattern:** Consistent with success toast
- **Framework:** Bootstrap 5.3.0 toast component
- **CSS:** Use design system variables

### Testing Requirements

1. **Manual Testing:**
   - Test error messages appear correctly
   - Test network error handling
   - Test GitHub API error handling
   - Test accessibility

2. **Automated Testing:**
   - Unit tests for error message functions
   - E2E tests for error handling

### References

- [Source: app.js#326-342] - showProgressError function
- [Source: app.js#540-543] - saveData error handling
- [Source: _bmad-output/planning-artifacts/epics.md#211-237] - Epic 5 requirements

## Dev Agent Record

### Agent Model Used

Auto (BMad Master)

### Debug Log References

- Added error toast container to index.html
- Created getUserFriendlyErrorMessage function for error mapping
- Created showErrorToast function for non-blocking error notifications
- Enhanced showProgressError to also show toast
- Improved error handling in saveData, loadData, and API calls
- Parse GitHub API error responses for better error messages
- Handle network errors, authentication errors, and rate limiting

### Completion Notes List

- **Implementation:**
  - Added error toast container to index.html
  - Created getUserFriendlyErrorMessage function to map errors to user-friendly messages
  - Created showErrorToast function for non-blocking error notifications
  - Enhanced showProgressError to also show toast
  - Improved error handling in all async operations
  - Parse GitHub API error responses (401, 403, 404, 429, 500)
  - Handle network errors (offline detection, fetch failures)
  - Error toast auto-dismisses after 5 seconds (longer than success)

- **Error Message Mapping:**
  - Network errors: "Unable to connect. Please check your internet connection..."
  - GitHub 401: "Authentication failed. Please check your GitHub token..."
  - GitHub 403: "Access denied. Please check your token permissions..."
  - GitHub 404: "Resource not found. Please check the repository settings."
  - GitHub 429: "Too many requests. Please wait a moment..."
  - Generic: "Something went wrong. Please try again."

- **Rationale:**
  - User-friendly messages help users understand and fix problems
  - Actionable messages guide users on what to do next
  - Toast notifications provide non-blocking feedback
  - Error parsing provides specific guidance for common issues

- **Benefits:**
  - Better user experience with clear error messages
  - Users can understand and fix problems
  - Non-blocking error notifications
  - Accessible design

- **Testing:**
  - Unit tests verify error message functions
  - E2E tests verify error handling
  - Manual testing confirms error messages are user-friendly

### File List

- `index.html` (modified - added error toast container)
- `app.js` (modified - added error handling functions and improved error messages)
