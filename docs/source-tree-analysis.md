# Source Tree Analysis

## Project Structure

```
follow_the_money/
├── app.js              # Main application logic (~906 lines)
├── index.html         # Single-page HTML entry point
├── data.json          # Investment data storage
├── README.md          # Project documentation
└── docs/              # Generated documentation
    ├── project-scan-report.json
    ├── api-contracts.md
    ├── data-models.md
    └── source-tree-analysis.md
```

## Critical Directories and Files

### Entry Points

- **`index.html`**: Primary entry point for the application
  - Loads Bootstrap CSS and JS from CDN
  - Loads Chart.js from CDN
  - Contains HTML structure and inline styles
  - References `app.js` for application logic

- **`app.js`**: Main application JavaScript file
  - Contains all business logic
  - Handles DOM manipulation
  - Manages state via `investmentData` object
  - Implements GitHub API integration
  - Contains chart rendering logic

### Data Files

- **`data.json`**: Investment portfolio data
  - Stores all investment records
  - Contains metadata (currencies, profit types, investment types)
  - Synchronized with GitHub repository

### Configuration

- **No build configuration files** (no package.json, webpack, etc.)
- **No environment files** (configuration hardcoded in app.js)
- **CDN-based dependencies** (Bootstrap, Chart.js loaded from jsdelivr.net)

## File Organization

**Pattern:** Flat structure with minimal organization
- All application code in root directory
- No separation of concerns (HTML, CSS, JS in separate files but minimal structure)
- No build step required (static files only)

## Integration Points

**External Services:**
- GitHub API (data persistence)
- Exchange Rate API (currency conversion)
- CDN services (Bootstrap, Chart.js, Bootstrap Icons)

**No internal integration points** (single monolithic client-side application)
