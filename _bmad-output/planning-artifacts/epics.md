---
stepsCompleted: ['epic-creation']
workflowType: 'epics'
created: 2026-01-16T08:07:34Z
basedOn: planning-artifacts/prd.md
---

# Epics - follow_the_money

**Created:** 2026-01-16T08:07:34Z  
**Updated:** 2026-01-16T08:07:34Z (Added Epic 0: Test Automation)  
**Based on:** PRD v1.0  
**Priority:** Critical bug fixes first, then UX improvements

## Epic 0: Automated Testing Infrastructure (IMMEDIATE)

**Priority:** P0 - Critical Foundation  
**Status:** ✅ DONE  
**Estimated Effort:** 2-3 days (Completed: 2026-01-16)

### Problem Statement
No automated tests exist for the application. All functionality implemented in Epics 1-3 is untested. Future development needs automated testing to ensure code quality and prevent regressions.

### User Story
As a developer, I want comprehensive automated tests for all existing functionality and a testing framework for future development, so that I can ensure code quality and catch regressions early.

### Acceptance Criteria
- [ ] Test framework set up (Playwright or Cypress for E2E, Jest/Vitest for unit)
- [ ] Test directory structure created with proper organization
- [ ] All Epic 1 functionality tested (asset update, cache bypass, data refresh)
- [ ] All Epic 2 functionality tested (local dev environment, .env support)
- [ ] All Epic 3 functionality tested (progress indicator, GitHub Actions polling)
- [ ] Code coverage report shows >80% coverage for core functions
- [ ] CI/CD integration for automated test execution
- [ ] Testing standards documented for future epics/stories
- [ ] All future stories include automated tests as part of definition of done

### Technical Notes
- **Project Type:** Static site (vanilla JavaScript, HTML, CSS)
- **Recommended Framework:** Playwright for E2E (better for static sites), Vitest for unit tests
- **Test Levels:**
  - E2E tests for critical user journeys (save, load, update investments)
  - Unit tests for pure functions (calculations, data transformations)
  - Integration tests for API interactions (GitHub API, Exchange Rate API)
- **Coverage Requirements:**
  - Core business logic: >90%
  - UI interactions: >80%
  - API integrations: >80%
  - Overall: >80%

### Testing Standards for Future Work
- **Every story must include:**
  - Unit tests for new functions
  - Integration tests for API calls
  - E2E tests for user-facing features
  - Tests written before or alongside code (TDD/ATDD)
- **Test Requirements:**
  - All tests must pass before story marked "done"
  - Code coverage must not decrease
  - Tests must be maintainable and use proper patterns
  - Tests must run in CI/CD pipeline

### Related FRs
- FR6: System can provide clear feedback on data save status (needs testing)
- FR9: System can load updated asset data (needs testing)
- FR10: System can read GitHub PAT from .env (needs testing)
- FR11: System can display progress indicator (needs testing)
- FR12: System can verify asset update completion (needs testing)

---

## Epic 1: Fix Asset Update Bug (CRITICAL)

**Priority:** P0 - Critical Bug Fix  
**Status:** Ready for Development  
**Estimated Effort:** 2-3 days

### Problem Statement
Asset update functionality is broken. After updating an asset, the JSON database doesn't load properly due to cache issues. Users cannot see their updates reflected in the application.

### User Story
As a user, I want my asset updates to be immediately visible after saving, so that I can verify my changes were applied correctly.

### Acceptance Criteria
- [ ] Asset updates are saved successfully to GitHub repository
- [ ] After save, application automatically refreshes data from GitHub (bypassing cache)
- [ ] Updated asset data is immediately visible in the investment list
- [ ] Dashboard calculations update correctly after asset update
- [ ] Charts refresh to show updated data
- [ ] No stale data displayed after update
- [ ] Cache is properly invalidated or bypassed after updates

### Technical Notes
- Current implementation: `saveData()` function commits directly to GitHub API
- Issue: Data refresh after save may be using cached version
- Solution: Force cache bypass on data reload after save (add timestamp query param or cache-busting header)
- Consider: Polling mechanism to check for updated data if GitHub Action is involved

### Related FRs
- FR9: System can load updated asset data from GitHub repository after GitHub Action completes
- FR12: System can verify asset update completion and refresh data automatically
- FR3: Users can save investment data changes to GitHub repository

---

## Epic 2: Local Development Environment Setup

**Priority:** P0 - Development Blocking  
**Status:** Ready for Development  
**Estimated Effort:** 1 day

### Problem Statement
No ability to test the application locally. Currently requires GitHub PAT in URL parameter which is insecure and inconvenient for development.

### User Story
As a developer, I want to test the application locally using a .env file for the GitHub PAT, so that I can develop and debug without exposing credentials in URLs.

### Acceptance Criteria
- [ ] `.env` file created and added to `.gitignore`
- [ ] Application reads `GITHUB_PAT` from `.env` file when available (local development)
- [ ] Application falls back to URL parameter if `.env` file not found (production)
- [ ] `.env.example` file created with placeholder values
- [ ] Documentation updated with local development setup instructions
- [ ] Local testing works without requiring URL parameters

### Technical Notes
- Create `.env` file with: `GITHUB_PAT=your_github_personal_access_token_here`
- Add `.env` to `.gitignore`
- Modify `app.js` to check for environment variable first, then URL parameter
- For static site: May need to use a simple script to inject env vars at build time, or use a local dev server

### Related FRs
- FR10: System can read GitHub PAT from .env file for local development (production uses URL parameter)

---

## Epic 3: GitHub Action Progress Feedback

**Priority:** P1 - High Priority UX  
**Status:** Ready for Development  
**Estimated Effort:** 2-3 days

### Problem Statement
GitHub Action takes approximately 20 seconds to complete after asset update. Users have no feedback during this time and don't know if the update is processing or has failed.

### User Story
As a user, I want to see progress feedback when updating assets, so that I know the system is processing my request and when it completes.

### Acceptance Criteria
- [ ] Progress indicator displayed immediately after save button is clicked
- [ ] Progress bar or spinner shows during GitHub Action execution (~20 seconds)
- [ ] Status messages indicate current state (Saving..., Processing..., Complete)
- [ ] User can see when GitHub Action starts and completes
- [ ] Error state displayed if GitHub Action fails
- [ ] Success confirmation shown when update completes
- [ ] Data automatically refreshes after successful completion

### Technical Notes
- Current flow: Save → GitHub API commit → GitHub Action triggers → ~20 seconds → Complete
- Need to: Poll GitHub API to check Action status, or use webhooks, or estimate progress
- Options:
  1. Poll GitHub Actions API to check workflow run status
  2. Poll data.json file with cache-busting to detect when it's updated
  3. Show estimated progress bar based on typical 20-second duration
- Best approach: Poll GitHub Actions API for workflow run status

### Related FRs
- FR11: System can display progress indicator during GitHub Action execution (~20 seconds)
- FR12: System can verify asset update completion and refresh data automatically
- FR6: System can provide clear feedback on data save status (success, failure, in-progress)

---

## Epic 4: Mobile-First UI/UX Redesign

**Priority:** P1 - High Priority UX  
**Status:** Ready for Design  
**Estimated Effort:** 5-7 days (Design + Implementation)

### Problem Statement
Current UI/UX doesn't look good and is not optimized for mobile devices. Application needs a complete mobile-first redesign to improve usability and visual appeal.

### User Story
As a user, I want a modern, mobile-first interface that looks good and works well on all devices, so that I can easily manage my portfolio from any device.

### Acceptance Criteria
- [ ] Design system created with mobile-first approach
- [ ] All layouts optimized for mobile viewports first, then enhanced for desktop
- [ ] Touch targets meet minimum 44x44px requirement
- [ ] Typography is readable and appropriately sized for mobile
- [ ] Forms are mobile-friendly with proper input types
- [ ] Navigation is intuitive and thumb-friendly on mobile
- [ ] Visual design is modern and appealing
- [ ] Consistent spacing and visual hierarchy
- [ ] Responsive breakpoints tested on multiple devices
- [ ] Desktop experience enhanced but not required

### Technical Notes
- Current: Uses Bootstrap 5.3.0, but not optimized for mobile-first
- Approach: Redesign with mobile-first CSS, then add desktop enhancements
- Consider: Modern CSS Grid/Flexbox, improved color scheme, better typography
- Testing: Test on iOS Safari, Chrome Mobile, various screen sizes

### Related FRs
- FR63: Application uses mobile-first responsive design approach
- FR64: Application provides improved UI/UX with modern, visually appealing design
- FR54: Users can access the application from mobile browsers (iOS Safari, Chrome Mobile)

---

## Epic 5: Enhanced Error Handling and User Feedback

**Priority:** P2 - Medium Priority  
**Status:** Ready for Development  
**Estimated Effort:** 2-3 days

### Problem Statement
Current error handling is basic. Users need better feedback for all operations, especially during async operations like saving data.

### User Story
As a user, I want clear feedback for all operations (loading, success, errors), so that I always know what's happening with my data.

### Acceptance Criteria
- [ ] Loading indicators for all async operations
- [ ] Success confirmations with clear messaging
- [ ] Error messages are user-friendly and actionable
- [ ] Form validation provides real-time feedback
- [ ] Network errors are handled gracefully
- [ ] GitHub API errors show helpful messages
- [ ] Users can retry failed operations easily

### Related FRs
- FR6: System can provide clear feedback on data save status (success, failure, in-progress)
- FR57: System can provide loading indicators during async operations
- FR58: System can display error messages in user-friendly language
- FR59: System can provide success confirmations after operations complete

---

## Epic 6: Input Validation and Data Integrity

**Priority:** P2 - Medium Priority  
**Status:** Ready for Development  
**Estimated Effort:** 2-3 days

### Problem Statement
Form validation is minimal. Need comprehensive validation to prevent data entry errors and ensure data integrity.

### Acceptance Criteria
- [ ] Required fields validated before submission
- [ ] Data types validated (numbers, dates, strings)
- [ ] Date formats validated and normalized
- [ ] Profit rate validation for loan-type investments
- [ ] Real-time validation feedback in forms
- [ ] Clear error messages for invalid inputs
- [ ] Duplicate investment prevention

### Related FRs
- FR21: System can validate investment data entry (required fields, data types, date formats)
- FR65: System can validate required fields before allowing form submission
- FR66: System can validate data types (numbers, dates, strings)
- FR67: System can validate date formats and ranges
- FR71: System can validate profit rate input for loan-type investments

---

## Epic 7: Accessibility Improvements

**Priority:** P2 - Medium Priority  
**Status:** Ready for Development  
**Estimated Effort:** 3-4 days

### Problem Statement
Application has limited accessibility support. Need WCAG 2.1 Level AA compliance for keyboard navigation and screen readers.

### Acceptance Criteria
- [ ] All interactive elements keyboard accessible
- [ ] ARIA labels on all form inputs and interactive elements
- [ ] Proper semantic HTML5 elements used
- [ ] Focus indicators visible and clear
- [ ] Logical tab order maintained
- [ ] Screen reader announcements for dynamic content
- [ ] Color contrast meets WCAG AA standards
- [ ] Text resizable up to 200% without breaking layout

### Related FRs
- FR55: Users can interact with all features using keyboard navigation
- FR56: Users can access form fields and interactive elements via screen readers

---

## Epic 8: Mobile UX Improvements and Investment Type Filtering

**Priority:** P1 - High Priority  
**Status:** Ready for Development  
**Estimated Effort:** 2-3 days

### Problem Statement
Mobile UX needs refinement for better usability on small screens. Additionally, the filter button (funnel icon) is currently decorative and doesn't function. Users need the ability to filter investments by investment type to better manage large portfolios. **CRITICAL: Users cannot save changes when updating investments - the form submission does not work properly.**

### Acceptance Criteria
- [ ] **CRITICAL: Edit investment form submission works correctly - users can save changes**
- [ ] Form validation works properly for edit investment form
- [ ] Error handling provides clear feedback if save fails
- [ ] Filter button (funnel icon) is functional
- [ ] Users can filter investments by investment type
- [ ] Filter UI is mobile-friendly (dropdown, chips, or modal)
- [ ] Multiple investment types can be selected for filtering
- [ ] "Show all" option to clear filters
- [ ] Filter state persists during session
- [ ] Mobile UX improvements for investment list header (better spacing, touch targets)
- [ ] Mobile-friendly filter controls (large touch targets, clear labels)
- [ ] Filter indicator shows active filter count
- [ ] Filter works seamlessly with existing sort functionality

### User Story
As a mobile user with many investments,
I want to filter investments by type and have a better mobile experience,
so that I can quickly find and manage specific investments on my phone.

### Related FRs
- FR45: Users can filter and sort investments by multiple criteria (name, type, amount, date)
- FR46: Users can filter investments by investment type
- FR47: Filter controls are mobile-friendly and accessible

### Technical Notes
- Filter should work with existing sort functionality
- Filter state should be stored in a global variable
- Filter UI should be responsive (dropdown on mobile, chips on desktop)
- Consider using Bootstrap dropdown or modal for mobile filter UI
- Filter should update renderInvestments() function

---

## Summary

**Total Epics:** 9  
**Critical (P0):** 3 epics (Test Automation, Asset Update Bug, Local Dev Environment)  
**High Priority (P1):** 3 epics (Progress Feedback, Mobile-First Redesign, Mobile UX & Filtering)  
**Medium Priority (P2):** 3 epics (Error Handling, Validation, Accessibility)

**Recommended Sprint Order:**
1. **Epic 0: Automated Testing Infrastructure (IMMEDIATE - foundation for quality)**
2. Epic 1: Fix Asset Update Bug (CRITICAL - blocks user functionality)
3. Epic 2: Local Development Environment (blocks development)
4. Epic 3: GitHub Action Progress Feedback (improves UX for existing feature)
5. Epic 4: Mobile-First UI/UX Redesign (major UX improvement)
6. Epic 5-7: Polish and enhancements (can be done in parallel or after Epic 4)
7. Epic 8: Mobile UX Improvements and Investment Type Filtering (enhances mobile experience)

**Note:** Epic 0 should be done immediately to establish testing standards. All future epics and stories must include automated tests as part of their definition of done.
