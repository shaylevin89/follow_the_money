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

1. Fork this repository to your GitHub account
2. Enable GitHub Pages in your repository settings
3. Create a GitHub Personal Access Token:
   - Go to GitHub Settings > Developer Settings > Personal Access Tokens
   - Generate a new token with `repo` scope
   - Copy the token

4. Configure the application:
   - Open `app.js`
   - Fill in the following variables:
     ```javascript
     const GITHUB_TOKEN = 'your-token-here';
     const REPO_OWNER = 'your-github-username';
     const REPO_NAME = 'your-repo-name';
     ```

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

## Contributing

Feel free to submit issues and enhancement requests! 