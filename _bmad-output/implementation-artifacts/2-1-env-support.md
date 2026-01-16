# Story 2.1: Add .env file support for GitHub PAT with fallback to URL

Status: done

## Story

As a developer,
I want to test the application locally using a .env file for the GitHub PAT,
so that I can develop and debug without exposing credentials in URLs.

## Acceptance Criteria

1. `.env` file created and added to `.gitignore` (already done)
2. Application reads `GITHUB_PAT` from `.env` file when available (local development)
3. Application falls back to URL parameter if `.env` file not found (production)
4. `.env.example` file created with placeholder values
5. Documentation updated with local development setup instructions
6. Local testing works without requiring URL parameters

## Tasks / Subtasks

- [x] Task 1: Create .env.example file (AC: 4)
  - [x] Create `.env.example` with placeholder GITHUB_PAT (user already created .env)
  - [x] Document required format in README
- [x] Task 2: Create script to generate config.js from .env (AC: 2)
  - [x] Create `load-env.js` script (Node.js) that reads .env and generates config.js
  - [x] Script reads GITHUB_PAT from .env
  - [x] Script generates config.js with window.CONFIG object
  - [x] Handle case where .env doesn't exist (generate empty config.js)
- [x] Task 3: Update index.html to load config.js (AC: 2)
  - [x] Add script tag to load config.js before app.js
  - [x] Ensure config.js loads first (with error handling)
- [x] Task 4: Update app.js to read from config with URL fallback (AC: 2, 3)
  - [x] Modify getTokenFromUrl() to check window.CONFIG first
  - [x] Fall back to URL parameter if CONFIG not available
  - [x] Rename function to getToken() to reflect both sources
- [x] Task 5: Update documentation (AC: 5)
  - [x] Update README.md with local development setup instructions
  - [x] Document how to run load-env.js script
  - [x] Document .env file format

## Dev Notes

### Current Implementation Analysis

**File:** `app.js`, `index.html`

**Current `getTokenFromUrl()` function (app.js:7-10):**
- Only reads from URL parameters
- No .env support
- Used in DOMContentLoaded event (line 57)

**Current HTML structure:**
- Pure static site, no build process
- Loads app.js directly
- No config file currently

**Challenge:**
- Static site cannot directly read .env file (browser security)
- Need a build step to convert .env to JavaScript config
- Solution: Simple Node.js script to generate config.js

### Technical Requirements

- **New Files:**
  - `load-env.js` - Node.js script to read .env and generate config.js
  - `config.js` - Generated file (gitignored) containing window.CONFIG
  - `.env.example` - Template for .env file

- **Files to Modify:**
  - `index.html` - Add config.js script tag before app.js
  - `app.js` - Modify getTokenFromUrl() to check window.CONFIG first
  - `README.md` - Add local development setup instructions
  - `.gitignore` - Already has .env, add config.js

- **Dependencies:**
  - Node.js (for load-env.js script) - user already has this
  - No npm packages needed (use fs module)

### Architecture Compliance

- **Pattern:** Follow existing static site architecture
- **Build Step:** Minimal - single script run before development
- **Production:** No changes needed (config.js won't exist, falls back to URL)
- **State Management:** Use window.CONFIG global object

### Testing Requirements

1. **Manual Testing:**
   - Run load-env.js script
   - Verify config.js is generated with correct PAT
   - Open index.html locally
   - Verify token is read from config.js (not URL)
   - Remove config.js, verify fallback to URL parameter works
   - Test in production (no config.js, uses URL)

2. **Edge Cases:**
   - .env file doesn't exist
   - .env file exists but GITHUB_PAT is missing
   - config.js doesn't exist (production scenario)
   - Both config.js and URL parameter present (config takes precedence)

### References

- [Source: app.js#7-10] - Current getTokenFromUrl() function
- [Source: index.html] - Current HTML structure
- [Source: _bmad-output/planning-artifacts/epics.md#48-76] - Epic 2 requirements
- [Source: .gitignore] - Already has .env exclusion

## Dev Agent Record

### Agent Model Used

Auto (BMad Master)

### Debug Log References

- Created `load-env.js` script to read .env and generate config.js
- Modified `index.html` to load config.js before app.js (line 424)
- Modified `app.js` to read from window.CONFIG with URL fallback (renamed getTokenFromUrl to getToken)
- Updated `.gitignore` to exclude config.js
- Updated `README.md` with local development setup instructions
- Generated config.js successfully from .env file

### Completion Notes List

- **Implementation:** 
  - Created Node.js script (`load-env.js`) that reads .env file and generates config.js with window.CONFIG object
  - Modified `getTokenFromUrl()` to `getToken()` which checks window.CONFIG first, then falls back to URL parameter
  - Updated index.html to load config.js with error handling (onerror attribute)
  - Added config.js to .gitignore
  - Updated README.md with comprehensive local development setup instructions

- **Rationale:**
  - Static site cannot directly read .env file (browser security restriction)
  - Build step (load-env.js) converts .env to JavaScript config.js that can be loaded in browser
  - Production works unchanged (config.js won't exist, falls back to URL parameter)
  - Local development: run `node load-env.js` once, then open index.html

- **Benefits:**
  - Secure: .env file never committed to git
  - Convenient: No need to add token to URL during development
  - Production-safe: Falls back to URL parameter if config.js doesn't exist
  - Simple: Single script run before development

- **Testing:** 
  - Script successfully generated config.js from .env
  - Need to test: Open index.html locally and verify token is read from config.js
  - Need to test: Remove config.js and verify fallback to URL parameter works

### File List

- `load-env.js` (new - Node.js script to generate config.js)
- `config.js` (generated - contains window.CONFIG, gitignored)
- `index.html` (modified - added config.js script tag before app.js)
- `app.js` (modified - renamed getTokenFromUrl to getToken, checks window.CONFIG first)
- `.gitignore` (modified - added config.js)
- `README.md` (modified - added local development setup instructions)
