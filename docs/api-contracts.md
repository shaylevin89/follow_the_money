# API Contracts

## External APIs

### GitHub REST API v3

**Base URL:** `https://api.github.com`

#### Get File Contents
- **Endpoint:** `GET /repos/{owner}/{repo}/contents/{path}`
- **Purpose:** Read data.json file from repository
- **Authentication:** Token via Authorization header
- **Response:** File content with SHA for updates

#### Update File Contents
- **Endpoint:** `PUT /repos/{owner}/{repo}/contents/{path}`
- **Purpose:** Save investment data to repository
- **Authentication:** Token via Authorization header
- **Method:** PUT
- **Body:** JSON with message, content (base64), sha
- **Response:** Commit information

### Exchange Rate API

**Base URL:** `https://api.exchangerate-api.com/v4/latest/USD`

#### Get Exchange Rates
- **Endpoint:** `GET /v4/latest/USD`
- **Purpose:** Fetch current USD to ILS exchange rate
- **Authentication:** None (public API)
- **Response:** JSON with rates object containing ILS conversion rate

## Internal API Patterns

**Note:** This is a client-side only application. No internal API endpoints exist. All data operations are performed via:
- Direct DOM manipulation
- GitHub API for persistence
- Local state management via JavaScript objects
