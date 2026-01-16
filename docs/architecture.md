# Architecture Documentation

## Executive Summary

This is a client-side Single Page Application (SPA) built with vanilla JavaScript. The application provides investment portfolio tracking functionality with data persistence via GitHub API. It uses Bootstrap for UI components and Chart.js for data visualization.

## Technology Stack

### Frontend Technologies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Language** | JavaScript | ES6+ | Application logic |
| **UI Framework** | Bootstrap | 5.3.0 | Responsive UI components |
| **Icons** | Bootstrap Icons | 1.11.0 | Icon library |
| **Charts** | Chart.js | Latest (CDN) | Data visualization |
| **HTTP Client** | Fetch API | Native | API communication |

### External Services

- **GitHub REST API v3**: Data persistence
- **Exchange Rate API v4**: Currency conversion (USD to ILS)

## Architecture Pattern

**Type:** Client-side Single Page Application  
**Pattern:** Vanilla JavaScript with Global State Object  
**Style:** Procedural with modular functions

### Key Characteristics

- **No Framework:** Pure JavaScript, no React/Vue/Angular
- **No Build Step:** Static files served directly
- **CDN Dependencies:** Bootstrap and Chart.js loaded from CDN
- **Global State:** Single `investmentData` object manages application state
- **Event-Driven:** DOM event listeners trigger state updates

## Data Architecture

### Data Flow

```
User Action → DOM Event → JavaScript Function → State Update → GitHub API → Persistence
                                                      ↓
                                              UI Re-render
```

### State Management

**Pattern:** Global Object
- Single `investmentData` object holds all application state
- Manual state updates (no reactive framework)
- Direct DOM manipulation for UI updates

**State Structure:**
```javascript
investmentData = {
  version: "1.0",
  lastUpdated: timestamp,
  investments: [/* array of investment objects */],
  metadata: {
    currencies: ["ILS", "USD"],
    profit_types: ["price", "commission", "other"],
    investment_types: [/* type definitions */]
  }
}
```

### Data Persistence

1. **Local Storage:** `data.json` file in repository
2. **Remote Storage:** GitHub API for synchronization
3. **In-Memory:** `investmentData` JavaScript object

## API Design

### External APIs

**GitHub REST API:**
- **Read:** `GET /repos/{owner}/{repo}/contents/data.json`
- **Write:** `PUT /repos/{owner}/{repo}/contents/data.json`
- **Authentication:** Personal Access Token

**Exchange Rate API:**
- **Read:** `GET https://api.exchangerate-api.com/v4/latest/USD`
- **Purpose:** Real-time currency conversion
- **Authentication:** None (public API)

### Internal API Patterns

**None.** This is a client-side only application. All operations are:
- Direct DOM manipulation
- JavaScript function calls
- External API requests

## Component Overview

### UI Components

**Bootstrap Components Used:**
- Cards (investment display)
- Modals (edit forms)
- Forms (add/edit investments)
- Buttons (actions)
- Collapse (expandable sections)
- Badges (status indicators)

**Custom Components:**
- Investment item cards
- Dashboard widgets
- Chart containers

### Application Structure

**Main Functions:**
- `loadData()` - Fetch data from GitHub
- `saveData()` - Persist data to GitHub
- `renderInvestments()` - Display investment list
- `updateDashboard()` - Update summary statistics
- `setupForm()` - Initialize form handlers

## Source Tree

```
follow_the_money/
├── index.html         # HTML entry point with Bootstrap/Chart.js CDN links
├── app.js            # All application logic (~906 lines)
├── data.json         # Investment data storage
└── README.md         # Project documentation
```

**Key Files:**
- **Entry Point:** `index.html` - Loads dependencies and references `app.js`
- **Application Logic:** `app.js` - Contains all business logic and DOM manipulation
- **Data Storage:** `data.json` - JSON file with investment portfolio data

## Development Workflow

1. **No Build Step:** Files served directly
2. **No Package Manager:** Dependencies via CDN
3. **No Module System:** Global scope, script tags
4. **Local Development:** Simple HTTP server or direct file access

## Deployment Architecture

**Platform:** GitHub Pages  
**Type:** Static file hosting  
**Process:**
1. Push code to GitHub repository
2. Enable GitHub Pages in repository settings
3. Files served from `main` branch root

**No Server-Side Components:**
- No backend API
- No database
- No server-side rendering
- Pure client-side application

## Testing Strategy

**Current State:** Manual testing only  
**No Automated Tests:**
- No unit tests
- No integration tests
- No E2E tests
- Manual browser testing

**Testing Approach:**
- Manual verification of features
- Browser console for debugging
- Direct file editing and refresh

## Security Considerations

**Current Implementation:**
- GitHub token stored in frontend code (security risk)
- Token passed via URL parameter
- No authentication/authorization layer
- Public repository with sensitive data

**Recommendations:**
- Use environment variables (not possible with static hosting)
- Consider backend proxy for API calls
- Implement token rotation
- Use GitHub token with minimal permissions

## Performance Considerations

**Current State:**
- All dependencies loaded from CDN
- No code splitting
- No lazy loading
- Single JavaScript file (~906 lines)

**Optimization Opportunities:**
- Minify JavaScript
- Implement code splitting
- Add loading states
- Optimize chart rendering

## Integration Points

**External Services:**
- GitHub API (data persistence)
- Exchange Rate API (currency conversion)
- CDN services (Bootstrap, Chart.js)

**No Internal Integration:**
- Single monolithic application
- No microservices
- No API gateway
- No service mesh
