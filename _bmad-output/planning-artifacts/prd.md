---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
inputDocuments: 
  - docs/index.md
  - docs/project-overview.md
  - docs/architecture.md
  - docs/data-models.md
  - docs/api-contracts.md
  - docs/source-tree-analysis.md
  - docs/development-guide.md
workflowType: 'prd'
briefCount: 0
researchCount: 0
brainstormingCount: 0
projectDocsCount: 7
yoloMode: true
classification:
  projectType: web_app
  domain: fintech
  complexity: high
  projectContext: brownfield
---

# Product Requirements Document - follow_the_money

**Author:** shay  
**Date:** 2026-01-16T08:07:34Z

## Executive Summary

follow_the_money is a personal investment portfolio tracking application that enables users to manage their investments across multiple asset types and currencies. The application provides real-time profit calculations, visual portfolio analytics, and secure data persistence via GitHub API. Built as a single-page web application, it serves users who want a simple, reliable tool for tracking their personal investment portfolio without complex financial software overhead.

**Product Differentiator:** GitHub-based data persistence gives users complete control over their financial data while enabling cross-device access. The application focuses on simplicity and reliability for personal finance tracking.

**Target Users:** Individual investors managing personal portfolios across multiple investment types (real estate loans, crypto, stocks, training funds, etc.) who need a straightforward tool for tracking portfolio value and performance.

## Success Criteria

### User Success

Users track and manage their investment portfolio with minimal friction:
- Users can add new investments in under 2 minutes
- Users can view their complete portfolio overview at a glance
- Users can update investment values and see real-time profit calculations
- Users can filter and sort investments by multiple criteria (name, type, amount, date)
- Users can visualize portfolio distribution through charts (liquidity, types)
- Users can track investments in multiple currencies (ILS, USD) with automatic conversion
- Users feel confident their data is safely persisted and accessible across devices

### Business Success

The application serves as a reliable personal finance tool with:
- Zero data loss incidents (all changes persist via GitHub API)
- User can access portfolio from any device with internet connection
- Application loads and renders within 3 seconds on standard broadband
- Monthly active usage indicates regular portfolio monitoring
- User retention: users return to update investments at least monthly

### Technical Success

The application maintains reliability and performance with:
- GitHub API sync success rate > 99% (handles rate limits gracefully)
- Chart rendering completes within 1 second for portfolios with up to 50 investments
- Application works across modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design works on mobile, tablet, and desktop viewports
- Exchange rate API integration provides accurate USD to ILS conversion
- No JavaScript errors that prevent core functionality

### Measurable Outcomes

**MVP Success Metrics:**
- Users can complete full CRUD operations (Create, Read, Update, Delete) on investments
- Portfolio dashboard displays accurate totals and profit calculations
- Charts render correctly showing liquidity and type distribution
- Data persists successfully via GitHub API
- Application is accessible via GitHub Pages deployment

**Growth Metrics (Post-MVP):**
- Support for additional investment types beyond current set
- Enhanced filtering and search capabilities
- Export functionality (CSV, PDF reports)
- Historical trend visualization
- Multi-currency support expansion

**Vision Metrics (Future):**
- Mobile app version for native iOS/Android experience
- Real-time investment price updates via API integration
- Portfolio performance analytics and recommendations
- Integration with financial institutions for automatic data import
- Collaborative features for shared portfolios

## Product Scope

### MVP - Minimum Viable Product

**Core Features (Already Implemented):**
- Investment CRUD operations (add, edit, delete investments)
- Portfolio dashboard with total value, monthly/yearly profit calculations
- Investment type management (add, edit, remove types)
- Multi-currency support (ILS, USD) with exchange rate conversion
- Chart visualizations (liquidity distribution, type distribution)
- Data persistence via GitHub API
- Responsive design for mobile and desktop

**MVP Enhancements Needed:**
- Improved error handling for GitHub API failures
- Better user feedback during save operations
- Validation for investment data entry
- Loading states for async operations
- Basic accessibility improvements (ARIA labels, keyboard navigation)

### Growth Features (Post-MVP)

- Advanced filtering and search (by date range, profit threshold, etc.)
- Investment export functionality (CSV, JSON)
- Historical performance tracking and trend charts
- Investment notes and attachments
- Reminder notifications for investment updates
- Dark mode theme
- Customizable dashboard widgets
- Investment goal setting and tracking

### Vision (Future)

- Native mobile applications (iOS, Android)
- Real-time investment price updates via financial APIs
- Portfolio analytics and AI-powered insights
- Integration with banks and financial institutions
- Multi-user support with shared portfolios
- Investment recommendation engine
- Tax reporting and optimization features
- Integration with accounting software

## User Journeys

### Journey 1: Sarah - First-Time Portfolio Tracker (Primary User - Success Path)

**Opening Scene:**
Sarah is a 32-year-old software engineer who has been investing in various assets over the past few years - some real estate loans, crypto, stocks, and training funds. She's been tracking everything in spreadsheets, but it's become overwhelming. She has investments in both ILS and USD, and calculating her total portfolio value manually is tedious and error-prone.

**Rising Action:**
Sarah discovers the follow_the_money application through a friend's recommendation. She opens the application on her laptop and is prompted to enter her GitHub token. She creates a personal access token with repo scope and enters it. The application loads her existing data.json file from her GitHub repository (she had been manually maintaining it).

She sees her portfolio dashboard immediately - total value in ILS, monthly profit, yearly profit. The charts show her liquidity distribution and investment types. She's impressed by how quickly everything loads.

**Climax:**
Sarah decides to add a new investment - a new crypto miner purchase. She clicks "Add Investment", fills in the form with the investment details (name, type, amount in USD, start date), and submits. The form validates her input, and she sees a success message. The investment appears in her list immediately, and the dashboard updates automatically with new totals and charts.

She then updates an existing investment's current value. She clicks edit, changes the amount, and saves. The system automatically calculates profit rates and updates the dashboard. She realizes she can now track her portfolio in real-time without manual spreadsheet calculations.

**Resolution:**
Sarah's new reality: She checks her portfolio weekly, updating values as needed. The automatic profit calculations and currency conversion save her hours each month. The visual charts help her understand her portfolio distribution at a glance. She feels confident her data is safely stored in GitHub and accessible from any device. The application has transformed portfolio tracking from a chore into a quick, satisfying weekly check-in.

**Requirements Revealed:**
- GitHub token authentication flow
- Data loading and initialization
- Investment CRUD operations with validation
- Real-time dashboard updates
- Automatic profit calculations
- Multi-currency conversion
- Chart rendering and updates
- Responsive form design

### Journey 2: David - Power User Managing Complex Portfolio (Primary User - Edge Case)

**Opening Scene:**
David is a 45-year-old financial advisor managing his personal investment portfolio with 30+ investments across multiple types: real estate loans, stocks, crypto, training funds, pensions, and company shares. He needs to frequently update values, filter by different criteria, and analyze his portfolio from multiple angles.

**Rising Action:**
David opens the application and sees his extensive investment list. He uses the sort dropdown to organize investments by "last_update" date to see which ones need attention. He notices some investments haven't been updated in months. He filters through his list, identifying which investments need value updates.

He clicks edit on an investment that has gained value. He updates the current amount and saves. The system automatically recalculates profit rates (yearly and monthly) and updates the dashboard totals. He appreciates how the system handles both static investments (with profit rates) and dynamic investments (with update history).

**Climax:**
David wants to add a new investment type - "whiskey collection" - which should be excluded from periodical profit calculations. He goes to the Config section, clicks "Add Type", enters "whiskey" and checks "Exclude from Periodical Profit". The new type is added and immediately available in the investment form dropdown.

He then adds a new whiskey investment. The form recognizes it's a loan type (contains "loan" in name) and shows the profit rate field. Wait - that's wrong. He realizes the system needs to distinguish between loan types and other types better. He adds the investment anyway, noting this as a potential improvement.

**Resolution:**
David successfully manages his complex portfolio, but identifies areas for improvement: better investment type categorization, bulk update capabilities, and export functionality for tax reporting. The system handles his complex needs but could be enhanced for power users like him.

**Requirements Revealed:**
- Advanced sorting and filtering
- Investment type management
- Bulk operations consideration
- Edge case handling (loan type detection)
- Performance with large datasets (30+ investments)
- Export functionality (future)

### Journey 3: Error Recovery - GitHub API Failure

**Opening Scene:**
Alex is updating several investments when their internet connection becomes unstable. They successfully update one investment, but when trying to save the second update, the GitHub API call fails due to network issues.

**Rising Action:**
The application shows an error message: "Error saving data. Please check console for details." Alex checks the browser console and sees a network timeout error. They're concerned about data loss - did the first update save?

**Climax:**
Alex refreshes the page. The application loads data from GitHub, and they see their first update was successfully saved. The second update was lost, but they can re-enter it. However, they realize there's no offline capability or local caching - if GitHub is down, they can't access their data at all.

**Resolution:**
Alex successfully recovers by re-entering the lost update once connectivity is restored. They note that the application needs better error handling, offline capability, and clearer feedback about save status.

**Requirements Revealed:**
- Robust error handling for API failures
- Clear user feedback on save status
- Offline capability (future)
- Data loss prevention strategies
- Retry mechanisms for failed API calls

### Journey 4: Mobile User - Quick Portfolio Check

**Opening Scene:**
Rachel is on her phone during a lunch break and wants to quickly check her portfolio value. She opens the application on her mobile browser.

**Rising Action:**
The application loads responsively on her phone. The dashboard widgets stack vertically, and the charts resize appropriately. She can see her total value, monthly profit, and yearly profit. She scrolls down to see her investment list.

**Climax:**
Rachel wants to quickly update one investment's value. She taps on the edit button, and a modal opens. The form is mobile-friendly, but entering numbers on a mobile keyboard is slightly cumbersome. She successfully updates the value and saves. The dashboard updates immediately.

**Resolution:**
Rachel successfully checks and updates her portfolio on mobile, but notes that a native mobile app would provide a better experience. The responsive web version works but could be optimized further for mobile interactions.

**Requirements Revealed:**
- Responsive design for mobile viewports
- Touch-friendly interactions
- Mobile-optimized forms
- Native mobile app consideration (future)

### Journey Requirements Summary

**Core Capabilities Needed:**
1. **Authentication & Data Loading**: GitHub token flow, data initialization
2. **Investment Management**: Full CRUD operations with validation
3. **Dashboard & Analytics**: Real-time calculations, chart rendering, multi-currency support
4. **Investment Type Management**: Add, edit, remove types with configuration options
5. **Sorting & Filtering**: Multiple sort criteria, direction toggle
6. **Error Handling**: API failure recovery, user feedback, data integrity
7. **Responsive Design**: Mobile, tablet, desktop support
8. **Performance**: Fast rendering with large datasets, efficient chart updates

**Future Capabilities Identified:**
- Bulk operations for power users
- Export functionality (CSV, PDF)
- Offline capability
- Native mobile applications
- Enhanced investment type categorization
- Historical trend analysis

## Domain-Specific Requirements

### Compliance & Regulatory

**Personal Finance Application Considerations:**
- **Data Privacy**: User financial data is sensitive. Consider GDPR principles for data handling (if EU users), though not strictly required for personal use
- **Security Standards**: Implement basic security best practices for financial data:
  - Secure token storage (currently token in URL is a security risk - needs improvement)
  - HTTPS-only communication (GitHub Pages provides this)
  - Input validation to prevent injection attacks
  - Secure data transmission to GitHub API

**Regional Compliance (Future Considerations):**
- If expanding to support multiple users or commercial use:
  - KYC/AML requirements may apply depending on jurisdiction
  - Financial services regulations if offering investment advice
  - Tax reporting requirements if generating tax documents

**Current Status:**
- Application is personal-use only, minimizing regulatory burden
- No financial advice provided, reducing compliance requirements
- Data stored in user's own GitHub repository, maintaining user control

### Technical Constraints

**Security Requirements:**
- **Authentication**: GitHub token must be handled securely (currently passed via URL - needs improvement)
- **Data Encryption**: Data stored in GitHub is in plain JSON - consider encryption for sensitive financial data
- **Access Control**: Application relies on GitHub repository access control
- **Audit Trail**: GitHub API provides commit history as audit trail

**Privacy Requirements:**
- **Data Handling**: User's financial data should never be exposed to third parties
- **Data Retention**: User controls data retention via GitHub repository
- **Consent**: User explicitly provides GitHub token, indicating consent for data storage

**Performance Requirements:**
- **Real-time Calculations**: Profit calculations must be accurate and update immediately
- **API Rate Limits**: GitHub API has rate limits (5,000 requests/hour) - must handle gracefully
- **Exchange Rate Updates**: Exchange rate API calls should be cached to avoid excessive requests

**Availability Requirements:**
- **GitHub Dependency**: Application depends on GitHub API availability
- **Offline Capability**: Currently no offline mode - future consideration
- **Data Backup**: User's GitHub repository serves as backup

### Integration Requirements

**Current Integrations:**
- **GitHub REST API v3**: Primary data persistence mechanism
- **Exchange Rate API**: Real-time currency conversion

**Future Integration Considerations:**
- **Financial Institution APIs**: If adding automatic data import (Open Banking, Plaid, etc.)
- **Tax Software Integration**: For tax reporting features
- **Investment Price APIs**: For real-time price updates

### Risk Mitigations

**Data Loss Risks:**
- **Risk**: GitHub API failures could result in data loss
- **Mitigation**: Implement retry logic, local caching, and clear error messaging
- **Future**: Offline mode with local storage sync

**Security Risks:**
- **Risk**: GitHub token exposed in URL or frontend code
- **Mitigation**: Move to secure token storage (environment variables, secure backend proxy)
- **Current**: User education about token security best practices

**Accuracy Risks:**
- **Risk**: Incorrect profit calculations due to data entry errors
- **Mitigation**: Input validation, calculation verification, user confirmation for large changes
- **Future**: Audit log of all calculations

**Currency Conversion Risks:**
- **Risk**: Exchange rate API failures or inaccurate rates
- **Mitigation**: Cache exchange rates, provide manual override, show rate source and timestamp

**Compliance Risks (Future):**
- **Risk**: If expanding to commercial use, may trigger financial regulations
- **Mitigation**: Legal review before commercial expansion, proper licensing if required

## Web App Specific Requirements

### Project-Type Overview

This is a Single Page Application (SPA) built with vanilla JavaScript, served as static files via GitHub Pages. The application provides investment portfolio tracking functionality with real-time calculations and data visualization.

### Technical Architecture Considerations

**Application Type:**
- **SPA (Single Page Application)**: All functionality in a single HTML page with JavaScript
- **No Server-Side Rendering**: Pure client-side application
- **Static File Hosting**: GitHub Pages deployment
- **No Build Process**: Files served directly without compilation or bundling

**Browser Support:**
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **No Legacy Support**: No IE11 or older browser support required
- **Progressive Enhancement**: Core functionality works without JavaScript (limited), enhanced with JS

**Real-Time Requirements:**
- **Dashboard Updates**: Real-time calculation updates when investment values change
- **Chart Rendering**: Charts update immediately when data changes
- **Currency Conversion**: Exchange rates fetched on-demand (cached for performance)
- **No WebSocket**: No real-time data streaming needed (user-triggered updates only)

**SEO Considerations:**
- **Limited SEO Needs**: Personal finance tool, not public-facing content
- **No Search Engine Indexing Required**: Application requires authentication (GitHub token)
- **Meta Tags**: Basic meta tags for social sharing (if applicable)
- **No Sitemap**: Not needed for authenticated application

### Browser Matrix

| Browser | Minimum Version | Support Level | Notes |
|---------|----------------|---------------|-------|
| Chrome | 90+ | Full Support | Primary development target |
| Firefox | 88+ | Full Support | Full feature parity |
| Safari | 14+ | Full Support | iOS and macOS |
| Edge | 90+ | Full Support | Chromium-based |
| Mobile Safari | iOS 14+ | Full Support | Responsive design tested |
| Chrome Mobile | Latest | Full Support | Android devices |

**Testing Requirements:**
- Manual testing on Chrome, Firefox, Safari, Edge
- Responsive design testing on mobile devices (iOS, Android)
- Cross-browser compatibility verification for core features

### Responsive Design

**Viewport Support:**
- **Desktop**: 1920x1080, 1366x768, 1440x900
- **Tablet**: 768x1024 (iPad), 1024x768 (landscape)
- **Mobile**: 375x667 (iPhone SE), 390x844 (iPhone 12), 360x640 (Android)

**Design Approach:**
- **Mobile-First**: Responsive design optimized for mobile, enhanced for desktop
- **Bootstrap Grid**: Uses Bootstrap 5.3.0 responsive grid system
- **Flexible Layouts**: Cards and widgets stack vertically on mobile
- **Touch-Friendly**: Button sizes and spacing optimized for touch interactions

**Responsive Features:**
- Dashboard widgets stack vertically on mobile
- Charts resize appropriately for viewport
- Forms adapt to screen size
- Modals are mobile-friendly with proper scrolling

### Performance Targets

**Load Time:**
- **Initial Load**: < 3 seconds on standard broadband (5 Mbps)
- **Time to Interactive**: < 2 seconds after page load
- **Chart Rendering**: < 1 second for portfolios with up to 50 investments

**Runtime Performance:**
- **Dashboard Calculations**: < 100ms for profit calculations
- **Form Submission**: < 500ms for API save operations
- **Chart Updates**: < 200ms when data changes
- **Sorting/Filtering**: < 50ms for investment list operations

**Optimization Strategies:**
- CDN loading for Bootstrap and Chart.js (already implemented)
- Lazy loading consideration for future enhancements
- Efficient DOM manipulation
- Minimal re-renders (update only changed elements)

### SEO Strategy

**Current Status:**
- **No SEO Required**: Application is authenticated and personal-use only
- **No Public Content**: All content requires GitHub token authentication
- **No Search Indexing**: Application should not be indexed by search engines

**Future Considerations:**
- If expanding to public-facing features, implement:
  - Meta tags for social sharing
  - Open Graph tags
  - Structured data (JSON-LD) if applicable
  - Sitemap generation for public pages

### Accessibility Level

**Current Implementation:**
- **Basic Accessibility**: Bootstrap components provide some accessibility features
- **Keyboard Navigation**: Partial support (forms work, some interactions need improvement)
- **Screen Reader Support**: Limited (needs ARIA labels and semantic HTML improvements)

**MVP Enhancements Needed:**
- **ARIA Labels**: Add proper labels to form inputs and interactive elements
- **Keyboard Navigation**: Ensure all functionality accessible via keyboard
- **Focus Management**: Proper focus indicators and tab order
- **Semantic HTML**: Use proper HTML5 semantic elements
- **Color Contrast**: Verify WCAG AA contrast ratios

**Target Compliance:**
- **WCAG 2.1 Level AA**: Target for MVP enhancements
- **Keyboard Accessible**: All functionality usable without mouse
- **Screen Reader Friendly**: Proper labels and announcements

### Implementation Considerations

**Technology Stack:**
- **No Framework**: Vanilla JavaScript for maximum compatibility
- **CDN Dependencies**: Bootstrap and Chart.js loaded from CDN
- **No Module System**: Global scope, script tags
- **No Build Tools**: Direct file serving

**Deployment:**
- **GitHub Pages**: Static file hosting
- **No Server Configuration**: Pure static hosting
- **HTTPS**: Provided by GitHub Pages
- **Custom Domain**: Supported via CNAME file

**Future Considerations:**
- Consider build process for minification and optimization
- Evaluate framework adoption if complexity increases
- Consider service worker for offline capability
- Evaluate PWA features for mobile app-like experience

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-Solving MVP - Focus on solving the core problem of portfolio tracking with essential features that make the product useful immediately.

**Resource Requirements:**
- **Team Size**: Solo developer or small team (1-2 developers)
- **Skills Needed**: Frontend JavaScript, HTML/CSS, API integration, basic UX design
- **Timeline**: MVP enhancements can be completed in 2-4 weeks given existing codebase

**MVP Philosophy:**
The MVP focuses on making the existing application more reliable and user-friendly. Since core functionality already exists, MVP enhancements address critical gaps: error handling, user feedback, validation, and accessibility. This is a "polish and harden" MVP rather than a "build from scratch" MVP.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- ✅ Primary user success path (Sarah's journey) - fully supported
- ✅ Power user edge cases (David's journey) - mostly supported, needs enhancements
- ⚠️ Error recovery journey - needs improvement
- ✅ Mobile user journey - supported with responsive design

**Must-Have Capabilities for MVP:**

1. **Core Functionality (Already Implemented):**
   - Investment CRUD operations
   - Portfolio dashboard with calculations
   - Multi-currency support
   - Chart visualizations
   - Investment type management
   - Data persistence via GitHub API

2. **MVP Enhancements (Critical Gaps - Priority Fixes):**
   - **Asset Update Bug Fix**: Fix update asset functionality - resolve cache issues preventing JSON DB from loading after update
   - **Local Development Environment**: Support local testing with .env file for GitHub PAT (excluded from git)
   - **GitHub Action Progress Feedback**: Display progress indicator during asset updates (GitHub Action takes ~20 seconds)
   - **Mobile-First Design**: Redesign UI/UX with mobile-first approach, improve overall visual design
   - **Error Handling**: Robust GitHub API failure recovery with retry logic
   - **User Feedback**: Clear save status indicators, loading states
   - **Input Validation**: Form validation for data entry accuracy
   - **Accessibility**: ARIA labels, keyboard navigation, WCAG AA compliance
   - **Performance**: Optimize chart rendering for large portfolios (50+ investments)

3. **User Experience Improvements:**
   - Better error messages (user-friendly, actionable)
   - Loading indicators during async operations
   - Success confirmations after save operations
   - Form validation feedback (real-time, helpful)

**MVP Success Criteria:**
- Users can reliably track their portfolio without data loss
- Application handles errors gracefully with clear user feedback
- All core functionality accessible via keyboard
- Application works consistently across modern browsers
- Performance targets met (load time < 3s, calculations < 100ms)

### Post-MVP Features

**Phase 2 (Growth - Post-MVP):**

**Enhanced User Experience:**
- Advanced filtering and search (date ranges, profit thresholds, custom filters)
- Investment export functionality (CSV, JSON formats)
- Historical performance tracking with trend visualization
- Enhanced investment notes with rich text support
- Dark mode theme for better user preference support
- Customizable dashboard widgets (user-configurable layout)

**Power User Features:**
- Bulk operations (bulk edit, bulk delete, bulk update)
- Investment goal setting and tracking
- Reminder notifications for investment updates
- Enhanced investment type categorization (tags, hierarchies)
- Portfolio comparison views (year-over-year, month-over-month)

**Phase 3 (Expansion - Future Vision):**

**Platform Features:**
- Native mobile applications (iOS, Android) with offline sync
- Real-time investment price updates via financial APIs
- Portfolio analytics and AI-powered insights
- Integration with banks and financial institutions (Open Banking, Plaid)
- Multi-user support with shared portfolios and permissions
- Investment recommendation engine based on portfolio analysis
- Tax reporting and optimization features
- Integration with accounting software (QuickBooks, Xero)

**Advanced Capabilities:**
- Automated investment tracking via API integrations
- Portfolio rebalancing recommendations
- Risk analysis and diversification insights
- Investment performance benchmarking
- Collaborative features for financial advisors

### Risk Mitigation Strategy

**Technical Risks:**

**Risk**: GitHub API dependency creates single point of failure
- **Mitigation**: Implement robust retry logic, local caching, clear error messaging
- **Future**: Consider backup storage options (localStorage, IndexedDB)

**Risk**: Token security vulnerability (currently in URL)
- **Mitigation**: MVP enhancement to move token to secure storage, user education
- **Future**: Backend proxy for token management

**Risk**: Performance degradation with large portfolios (100+ investments)
- **Mitigation**: Optimize chart rendering, implement pagination/virtualization
- **Future**: Server-side processing for very large datasets

**Market Risks:**

**Risk**: Limited user adoption due to GitHub token requirement
- **Mitigation**: Clear onboarding instructions, user education
- **Future**: Alternative authentication methods, simplified setup

**Risk**: Competition from established portfolio tracking tools
- **Mitigation**: Focus on unique value (GitHub-based persistence, simplicity, personal control)
- **Future**: Differentiate through customization and user control

**Resource Risks:**

**Risk**: Solo developer capacity limits feature velocity
- **Mitigation**: Prioritize MVP enhancements, defer non-essential features
- **Future**: Consider open-source community or team expansion

**Risk**: Maintenance burden as codebase grows
- **Mitigation**: Keep architecture simple, document well, avoid over-engineering
- **Future**: Consider framework adoption if complexity justifies it

## Functional Requirements

### Authentication & Data Management

- FR1: Users can authenticate using GitHub Personal Access Token
- FR2: Users can load their investment portfolio data from GitHub repository
- FR3: Users can save investment data changes to GitHub repository
- FR4: System can handle GitHub API authentication failures gracefully
- FR5: System can retry failed save operations automatically
- FR6: System can provide clear feedback on data save status (success, failure, in-progress)
- FR7: System can cache exchange rate data to minimize API calls
- FR8: System can handle GitHub API rate limits without data loss
- FR9: System can load updated asset data from GitHub repository after GitHub Action completes (fix cache issues)
- FR10: System can read GitHub PAT from .env file for local development (production uses URL parameter)
- FR11: System can display progress indicator during GitHub Action execution (~20 seconds)
- FR12: System can verify asset update completion and refresh data automatically

### Investment Management

- FR13: Users can create new investment entries with required fields (name, type, amount, currency, start date)
- FR14: Users can view all their investments in a list format
- FR15: Users can edit existing investment details (name, current amount, active status, liquidity status, notes)
- FR16: Users can delete investments from their portfolio
- FR17: Users can mark investments as active or inactive
- FR18: Users can specify investment liquidity status (liquid/illiquid)
- FR19: Users can set liquidity dates for investments
- FR20: Users can add notes to investments for additional context
- FR21: System can validate investment data entry (required fields, data types, date formats)
- FR22: System can prevent duplicate investment entries
- FR23: Users can update investment values and see automatic profit calculations

### Investment Type Management

- FR24: Users can create custom investment types
- FR25: Users can edit existing investment type names
- FR26: Users can remove investment types (with appropriate handling of existing investments)
- FR27: Users can configure whether investment types are excluded from periodical profit calculations
- FR28: System can provide investment type dropdown populated from user's custom types
- FR29: System can handle loan-type investments with profit rate configuration
- FR30: System can distinguish between loan types and other investment types for profit calculation

### Portfolio Dashboard & Analytics

- FR31: Users can view total portfolio value in ILS (with automatic currency conversion)
- FR32: Users can view monthly profit calculation for static investments
- FR33: Users can view yearly profit calculation for static investments
- FR34: System can calculate profit rates (total, yearly, monthly) for different investment types
- FR35: System can handle profit calculations for loan-type investments using profit rate
- FR36: System can handle profit calculations for price-based investments using update history
- FR37: Users can view liquidity distribution chart (liquid vs illiquid investments)
- FR38: Users can view investment type distribution chart
- FR39: System can update dashboard calculations in real-time when investment data changes
- FR40: System can exclude specified investment types from periodical profit calculations

### Investment List Management

- FR41: Users can sort investments by name, type, current amount, initial date, or last update date
- FR42: Users can toggle sort direction (ascending/descending)
- FR43: Users can view active and inactive investments separately
- FR44: System can display investments with visual indicators (active badge, illiquid badge, static badge)
- FR45: System can show investment profit information (amount, rate, yearly rate, monthly rate)
- FR46: System can display last update date for each investment
- FR47: System can handle large investment lists (50+ investments) with acceptable performance

### Multi-Currency Support

- FR48: Users can track investments in multiple currencies (ILS, USD)
- FR49: System can automatically convert USD investments to ILS for portfolio totals
- FR50: System can fetch current exchange rates from external API
- FR51: System can display investment amounts in their native currency
- FR52: System can show currency symbols appropriately (₪ for ILS, $ for USD)

### User Interface & Experience

- FR53: Users can access the application from desktop browsers (Chrome, Firefox, Safari, Edge)
- FR54: Users can access the application from mobile browsers (iOS Safari, Chrome Mobile)
- FR55: Users can interact with all features using keyboard navigation
- FR56: Users can access form fields and interactive elements via screen readers
- FR57: System can provide loading indicators during async operations
- FR58: System can display error messages in user-friendly language
- FR59: System can provide success confirmations after operations complete
- FR60: Users can collapse and expand dashboard sections
- FR61: Users can collapse and expand investment list section
- FR62: Users can collapse and expand configuration section
- FR63: Application uses mobile-first responsive design approach
- FR64: Application provides improved UI/UX with modern, visually appealing design

### Data Validation & Error Handling

- FR65: System can validate required fields before allowing form submission
- FR66: System can validate data types (numbers, dates, strings)
- FR67: System can validate date formats and ranges
- FR68: System can handle GitHub API errors and display appropriate messages
- FR69: System can handle exchange rate API errors gracefully
- FR70: System can prevent data loss during network failures
- FR71: System can validate profit rate input for loan-type investments

### Configuration & Settings

- FR72: Users can configure investment type metadata (currencies, profit types)
- FR73: System can persist configuration changes to GitHub
- FR74: System can migrate investment type data structure when schema changes

### Reporting & Visualization

- FR75: Users can view portfolio summary statistics (total value, monthly profit, yearly profit)
- FR76: Users can view visual charts showing portfolio distribution
- FR77: System can render charts responsively for different screen sizes
- FR78: System can update charts automatically when investment data changes

## Non-Functional Requirements

### Performance

**Load Time Requirements:**
- Initial page load completes within 3 seconds on standard broadband (5 Mbps)
- Time to interactive (TTI) is less than 2 seconds after page load
- Chart.js and Bootstrap libraries load from CDN within 1 second

**Runtime Performance Requirements:**
- Dashboard profit calculations complete within 100ms for portfolios with up to 50 investments
- Chart rendering completes within 1 second for portfolios with up to 50 investments
- Form submission and save operations complete within 500ms (excluding network latency)
- Investment list sorting and filtering operations complete within 50ms
- Chart updates when data changes complete within 200ms

**API Performance Requirements:**
- GitHub API read operations complete within 2 seconds (including network latency)
- GitHub API write operations complete within 3 seconds (including network latency)
- Exchange rate API calls complete within 1 second (cached for 1 hour to minimize calls)

**Scalability Considerations:**
- Application maintains acceptable performance with portfolios containing up to 100 investments
- Chart rendering degrades gracefully for very large portfolios (consider pagination or virtualization if needed)

### Security

**Data Protection Requirements:**
- All data transmission to GitHub API must use HTTPS (enforced by GitHub Pages)
- GitHub Personal Access Token must not be stored in frontend code or exposed in URLs (MVP enhancement)
- User financial data must never be exposed to third parties except GitHub (user's own repository)
- Input validation must prevent injection attacks (XSS, code injection)

**Authentication Security:**
- GitHub token authentication must be validated before allowing data operations
- Token validation failures must be handled gracefully with clear user messaging
- Token expiration or revocation must be detected and user notified

**Data Privacy Requirements:**
- User data stored in their own GitHub repository (user maintains control)
- No data sharing with third parties without explicit user consent
- User can delete their data by removing GitHub repository
- Application must not store sensitive data in browser localStorage or cookies

**Security Best Practices:**
- Implement Content Security Policy (CSP) headers
- Validate all user inputs before processing
- Sanitize data before displaying to prevent XSS
- Use secure coding practices for financial data handling

### Accessibility

**WCAG 2.1 Level AA Compliance:**
- All interactive elements must be keyboard accessible
- All form inputs must have proper ARIA labels
- Color contrast ratios must meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Focus indicators must be visible and clear
- Screen reader announcements must be provided for dynamic content updates

**Keyboard Navigation:**
- All functionality must be accessible via keyboard (Tab, Enter, Escape, Arrow keys)
- Logical tab order must be maintained throughout the application
- Keyboard shortcuts must not conflict with browser defaults
- Focus management must be appropriate for modal dialogs and dynamic content

**Screen Reader Support:**
- Semantic HTML5 elements must be used appropriately
- ARIA roles and properties must be used where semantic HTML is insufficient
- Dynamic content updates must be announced to screen readers
- Form validation errors must be announced clearly

**Visual Accessibility:**
- Text must be resizable up to 200% without loss of functionality
- Information must not be conveyed by color alone
- Interactive elements must have sufficient touch target sizes (minimum 44x44px on mobile)

### Integration

**GitHub API Integration:**
- Application must handle GitHub API rate limits (5,000 requests/hour) gracefully
- Application must implement retry logic for transient API failures
- Application must handle API authentication errors with appropriate user messaging
- Application must validate API responses before processing

**Exchange Rate API Integration:**
- Application must cache exchange rate data to minimize API calls
- Application must handle API failures gracefully (fallback to cached rate or manual entry)
- Application must display exchange rate source and timestamp to users
- Application must allow manual exchange rate override if API is unavailable

**Browser Compatibility:**
- Application must work in Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Application must degrade gracefully in unsupported browsers
- Application must handle browser-specific quirks appropriately

**CDN Dependency Management:**
- Application must handle CDN failures gracefully (Bootstrap, Chart.js)
- Application must provide fallback behavior if CDN resources fail to load
- Application must use CDN resources with integrity checks (SRI) where possible
