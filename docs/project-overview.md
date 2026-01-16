# Project Overview

## Project Information

**Name:** follow_the_money  
**Type:** Static Web Application  
**Purpose:** Investment Portfolio Tracker  
**Architecture:** Client-side Single Page Application (SPA)

## Executive Summary

A simple, client-side web application for tracking and managing investment portfolios. The application allows users to:
- Track multiple investment sources
- View portfolio summaries and analytics
- Manage investment data with CRUD operations
- Visualize portfolio distribution via charts
- Persist data using GitHub API

## Technology Stack Summary

| Category | Technology |
|----------|-----------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **UI Framework** | Bootstrap 5.3.0 |
| **Charts** | Chart.js |
| **Icons** | Bootstrap Icons 1.11.0 |
| **Data Storage** | GitHub API + JSON file |
| **Deployment** | GitHub Pages |

## Architecture Type

**Pattern:** Client-side Single Page Application  
**Style:** Vanilla JavaScript with modular functions  
**State Management:** Global object pattern  
**Data Flow:** Local state → GitHub API persistence

## Repository Structure

**Type:** Monolith (single cohesive codebase)  
**Parts:** 1 (main web application)

```
follow_the_money/
├── app.js          # Application logic
├── index.html      # Entry point
├── data.json       # Data storage
└── README.md       # Documentation
```

## Quick Reference

- **Entry Point:** `index.html`
- **Main Logic:** `app.js` (~906 lines)
- **Data File:** `data.json`
- **Deployment:** GitHub Pages
- **External APIs:** GitHub REST API, Exchange Rate API

## Links to Detailed Documentation

- [Architecture](./architecture.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [API Contracts](./api-contracts.md)
- [Data Models](./data-models.md)
- [Development Guide](./development-guide.md)
