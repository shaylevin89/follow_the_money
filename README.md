# Money Management Dashboard

A simple web application to track and manage your passive income sources. This application is designed to be hosted on GitHub Pages and uses GitHub's API for data persistence.

## Features

- Track multiple passive income sources
- View monthly income summaries
- Categorize income by type (rental, investment, dividends, etc.)
- Automatic data persistence using GitHub
- Clean, modern interface
- Mobile-responsive design

## Setup Instructions

### Production Setup (GitHub Pages)

1. Fork this repository to your GitHub account
2. Enable GitHub Pages in your repository settings
3. Create a GitHub Personal Access Token:
   - Go to GitHub Settings > Developer Settings > Personal Access Tokens
   - Generate a new token with `repo` scope
   - Copy the token

4. Access the application with token in URL:
   ```
   https://your-username.github.io/repo-name/?token=your-token-here
   ```

### Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/follow_the_money.git
   cd follow_the_money
   ```

2. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your GitHub Personal Access Token:
   ```
   GITHUB_PAT=your_github_personal_access_token_here
   ```

4. Generate `config.js` from `.env`:
   ```bash
   node load-env.js
   ```

5. Open `index.html` in your browser:
   - The application will automatically use the token from `config.js`
   - No need to add token to URL when developing locally

**Note:** The `.env` file is gitignored and will not be committed. The `config.js` file is also gitignored and generated locally.

5. Create the data directory and initial JSON file:
   ```bash
   mkdir data
   echo '{"passiveIncome":[],"lastUpdated":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}' > data/finances.json
   ```

6. Commit and push your changes:
   ```bash
   git add .
   git commit -m "Initial setup"
   git push
   ```

## Usage

1. Open your GitHub Pages URL (usually `https://your-username.github.io/repo-name/`)
2. Click "Add Income Source" to add new passive income entries
3. View your monthly summary and total passive income
4. All changes are automatically saved to your GitHub repository

## Data Structure

The application uses a simple JSON structure to store data:

```json
{
  "passiveIncome": [
    {
      "id": 1234567890,
      "name": "Rental Property A",
      "amount": 1500.00,
      "type": "rental",
      "dateAdded": "2024-03-20T12:00:00Z"
    }
  ],
  "lastUpdated": "2024-03-20T12:00:00Z"
}
```

## Security Note

Your GitHub token is stored in the frontend code. While this is not ideal for production applications, for personal use it's acceptable. However, you should:

1. Use a token with minimal required permissions
2. Regularly rotate your token
3. Never share your repository with the token included

## Testing

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

### Running Tests

- **Unit tests:** `npm test` (or `npm run test:watch` for watch mode)
- **E2E tests:** `npm run test:e2e`
- **All tests:** `npm run test:all`
- **Coverage:** `npm run test:coverage`

### Test Structure

```
tests/
├── e2e/          # End-to-end tests (Playwright)
├── unit/         # Unit tests (Vitest)
└── support/      # Test utilities
    ├── fixtures/ # Test data
    └── helpers/  # Helper functions
```

### Test Requirements

- All new code must include automated tests
- Code coverage must be >80% overall
- Tests must pass before merging
- See `_bmad-output/planning-artifacts/testing-standards.md` for detailed requirements

### CI/CD

Tests run automatically on every push and pull request via GitHub Actions:

- **Unit Tests:** Run on every push/PR (fast feedback)
- **E2E Tests:** Run on every push/PR (comprehensive testing)
- **Coverage Reports:** Generated and uploaded as artifacts

**View Test Results:**
- Go to the "Actions" tab in GitHub
- Click on the latest workflow run
- View test results and download coverage reports

**Workflow File:** `.github/workflows/test.yml`

## Contributing

Feel free to submit issues and enhancement requests! 