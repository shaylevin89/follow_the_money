# Development Guide

## Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- GitHub account (for data persistence)
- GitHub Personal Access Token with `repo` scope
- Web server (optional, for local development)

## Installation

No installation required. This is a static web application with no dependencies to install.

**Dependencies are loaded via CDN:**
- Bootstrap 5.3.0
- Chart.js
- Bootstrap Icons 1.11.0

## Environment Setup

1. **Clone or fork the repository:**
   ```bash
   git clone https://github.com/your-username/follow_the_money.git
   cd follow_the_money
   ```

2. **Configure GitHub API credentials:**
   - Edit `app.js`
   - Update the following constants:
     ```javascript
     const REPO_OWNER = 'your-github-username';
     const REPO_NAME = 'your-repo-name';
     ```
   - Note: GitHub token is provided via URL parameter (see Usage)

3. **Initialize data file (if needed):**
   ```bash
   # data.json should already exist, but if creating new:
   echo '{"version":"1.0","lastUpdated":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'","investments":[],"metadata":{"currencies":["ILS","USD"],"profit_types":["price","commission","other"],"investment_types":[]}}' > data.json
   ```

## Local Development

### Option 1: Direct File Access
Simply open `index.html` in a web browser:
```bash
open index.html  # macOS
# or double-click index.html
```

**Note:** Some browsers may restrict local file access for security. Use a local server for best results.

### Option 2: Local Web Server

**Using Python:**
```bash
python3 -m http.server 8000
# Then open http://localhost:8000
```

**Using Node.js (http-server):**
```bash
npx http-server -p 8000
# Then open http://localhost:8000
```

**Using PHP:**
```bash
php -S localhost:8000
# Then open http://localhost:8000
```

## Build Process

**No build process required.** This is a static application with no compilation or bundling step.

Files are served directly:
- `index.html` → HTML entry point
- `app.js` → JavaScript application logic
- `data.json` → Data storage

## Testing

**No automated tests configured.** Manual testing approach:

1. Open application in browser
2. Test adding investments
3. Test editing investments
4. Test deleting investments
5. Verify GitHub API persistence
6. Verify chart rendering
7. Test currency conversion
8. Test sorting and filtering

## Common Development Tasks

### Adding a New Investment Type

1. Edit `app.js`
2. Locate `investmentData.metadata.investment_types` initialization
3. Add new type object:
   ```javascript
   {
     name: "new_type_name",
     exclude_periodical_profit: true/false
   }
   ```

### Modifying Data Structure

1. Update `data.json` schema
2. Update `investmentData` initialization in `app.js`
3. Update all functions that access/modify the data structure
4. Test data migration if needed

### Adding New Features

1. Add HTML structure to `index.html`
2. Add JavaScript logic to `app.js`
3. Update state management in `investmentData` if needed
4. Test thoroughly before committing

## Deployment

### GitHub Pages

1. Push code to GitHub repository
2. Go to repository Settings → Pages
3. Select source branch (usually `main`)
4. Application will be available at: `https://your-username.github.io/follow_the_money/`

### Custom Domain

1. Add `CNAME` file to repository root
2. Configure DNS settings for your domain
3. Update GitHub Pages settings

## Troubleshooting

### GitHub API Errors
- Verify token has `repo` scope
- Check token is passed via URL parameter: `?token=your-token`
- Verify repository name and owner are correct

### Data Not Loading
- Check browser console for errors
- Verify `data.json` exists and is valid JSON
- Check GitHub API rate limits

### Charts Not Rendering
- Verify Chart.js is loaded from CDN
- Check browser console for JavaScript errors
- Ensure data structure matches expected format
