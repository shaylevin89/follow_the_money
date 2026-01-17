// Configuration
const REPO_OWNER = 'shaylevin89';
const REPO_NAME = 'follow_the_money';
const DATA_FILE = 'data.json';

// Get token from config.js (local dev) or URL parameters (production)
function getToken() {
    // First, try to get from window.CONFIG (generated from .env file for local development)
    if (window.CONFIG && window.CONFIG.GITHUB_PAT) {
        return window.CONFIG.GITHUB_PAT;
    }
    
    // Fall back to URL parameter (production or if config.js doesn't exist)
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
}

// State
let investmentData = {
    version: "1.0",
    lastUpdated: new Date().toISOString(),
    investments: [],
    portfolio_snapshots: [],
    metadata: {
        currencies: ["ILS", "USD"],
        profit_types: ["price", "commission", "other"],
        investment_types: []
    }
};

// Helper to check if type is a loan
function isLoanType(type) {
    return typeof type === 'string' && type.toLowerCase().includes('loan');
}

// Normalize date to YYYY-MM-DD format
function normalizeDate(date) {
    if (!date) return null;
    
    // If already in YYYY-MM-DD format, return as is
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
    }
    
    // Try to parse and normalize
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
        return null;
    }
    
    // Return in YYYY-MM-DD format
    return dateObj.toISOString().split('T')[0];
}

// Check for duplicate investments
function checkForDuplicateInvestment(name, startDate, excludeId = null) {
    if (!name || !startDate) {
        return null;
    }
    
    const nameLower = name.trim().toLowerCase();
    
    // Check for duplicate by name (case-insensitive) and start date
    const duplicate = investmentData.investments.find(inv => {
        // Exclude current investment if editing
        if (excludeId && inv.id === excludeId) {
            return false;
        }
        
        // Check if name matches (case-insensitive) and start date matches
        const invNameLower = (inv.name || '').trim().toLowerCase();
        return invNameLower === nameLower && inv.start_date === startDate;
    });
    
    return duplicate || null;
}

// Real-time field validation function
function validateField(field) {
    // Remove previous validation classes
    field.classList.remove('is-valid', 'is-invalid');
    
    // Remove previous feedback messages
    const existingFeedback = field.parentElement.querySelector('.valid-feedback, .invalid-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    // Check if field is valid
    const isValid = field.checkValidity();
    
    // Special validation for profit rate (loan types)
    if (field.id === 'profitRate' && field.required) {
        const value = parseFloat(field.value);
        if (isNaN(value) || value <= 0) {
            field.classList.add('is-invalid');
            field.setAttribute('aria-invalid', 'true');
            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.setAttribute('role', 'alert');
            feedback.setAttribute('aria-live', 'polite');
            feedback.textContent = 'Please enter a valid profit rate (greater than 0).';
            field.parentElement.appendChild(feedback);
            return false;
        }
    }
    
    // Special validation for number fields
    if (field.type === 'number' && field.value) {
        const value = parseFloat(field.value);
        if (isNaN(value) || value < 0) {
            field.classList.add('is-invalid');
            field.setAttribute('aria-invalid', 'true');
            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.setAttribute('role', 'alert');
            feedback.setAttribute('aria-live', 'polite');
            feedback.textContent = 'Please enter a valid number (greater than or equal to 0).';
            field.parentElement.appendChild(feedback);
            return false;
        }
    }
    
    // Special validation for date fields
    if (field.type === 'date' && field.value) {
        // Normalize date to YYYY-MM-DD format
        const dateValue = field.value;
        const date = new Date(dateValue);
        
        if (isNaN(date.getTime())) {
            field.classList.add('is-invalid');
            field.setAttribute('aria-invalid', 'true');
            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.setAttribute('role', 'alert');
            feedback.setAttribute('aria-live', 'polite');
            feedback.textContent = 'Please enter a valid date.';
            field.parentElement.appendChild(feedback);
            return false;
        }
        
        // Normalize date to YYYY-MM-DD format
        const normalizedDate = date.toISOString().split('T')[0];
        if (dateValue !== normalizedDate) {
            field.value = normalizedDate;
        }
        
        // Date range validation
        const fieldId = field.id;
        if (fieldId === 'liquidityDate' || fieldId === 'editLiquidityDate') {
            // Liquidity date must be after start date
            const startDateField = document.getElementById(fieldId === 'liquidityDate' ? 'startDate' : 'editStartDate');
            if (startDateField && startDateField.value) {
                const startDate = new Date(startDateField.value);
                if (date < startDate) {
                    field.classList.add('is-invalid');
                    field.setAttribute('aria-invalid', 'true');
                    const feedback = document.createElement('div');
                    feedback.className = 'invalid-feedback';
                    feedback.setAttribute('role', 'alert');
                    feedback.setAttribute('aria-live', 'polite');
                    feedback.textContent = 'Liquidity date must be after or equal to start date.';
                    field.parentElement.appendChild(feedback);
                    return false;
                }
            }
        }
        
        if (fieldId === 'endDate' || fieldId === 'editEndDate') {
            // End date must be after start date
            const startDateField = document.getElementById(fieldId === 'endDate' ? 'startDate' : 'editStartDate');
            if (startDateField && startDateField.value) {
                const startDate = new Date(startDateField.value);
                if (date < startDate) {
                    field.classList.add('is-invalid');
                    field.setAttribute('aria-invalid', 'true');
                    const feedback = document.createElement('div');
                    feedback.className = 'invalid-feedback';
                    feedback.setAttribute('role', 'alert');
                    feedback.setAttribute('aria-live', 'polite');
                    feedback.textContent = 'End date must be after or equal to start date.';
                    field.parentElement.appendChild(feedback);
                    return false;
                }
            }
        }
    }
    
    if (isValid) {
        field.classList.add('is-valid');
        field.setAttribute('aria-invalid', 'false');
    } else {
        field.classList.add('is-invalid');
        field.setAttribute('aria-invalid', 'true');
        // Show default browser validation message or custom message
        const feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        feedback.setAttribute('role', 'alert');
        feedback.setAttribute('aria-live', 'polite');
        feedback.textContent = field.validationMessage || 'Please fill in this field correctly.';
        field.parentElement.appendChild(feedback);
    }
    
    return isValid;
}

// Global sort field
let sortInvestmentsBy = 'default';
let sortDirection = 'desc'; // 'asc' or 'desc'

// Global filter state
let selectedInvestmentTypes = []; // Empty array = show all, populated = filter by types

// Listen for sort changes and sort direction toggle
window.addEventListener('DOMContentLoaded', () => {
    const sortSelect = document.getElementById('sortInvestmentsBy');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortInvestmentsBy = e.target.value;
            renderInvestments();
        });
    }
    // Sort direction button
    const sortDirBtn = document.getElementById('sortDirectionBtn');
    const sortDirIcon = document.getElementById('sortDirectionIcon');
    if (sortDirBtn && sortDirIcon) {
        sortDirBtn.addEventListener('click', () => {
            sortDirection = (sortDirection === 'asc') ? 'desc' : 'asc';
            sortDirIcon.className = sortDirection === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down';
            renderInvestments();
        });
    }
    
    // Filter UI initialization
    setupFilterUI();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const token = getToken();
    if (!token) {
        showTokenInput();
    } else {
        loadData(token);
        setupForm();
    }
    migrateInvestmentTypes();
    renderInvestmentTypesConfig();

    // MIGRATION: Ensure all investment_types are objects with a name property
    if (investmentData.metadata && Array.isArray(investmentData.metadata.investment_types)) {
        investmentData.metadata.investment_types = investmentData.metadata.investment_types.map((type, i) => {
            if (typeof type === 'string') {
                return { name: type, exclude_periodical_profit: true };
            } else if (typeof type === 'object' && type !== null) {
                if (!type.name || typeof type.name !== 'string') {
                    return { ...type, name: `unknown_type_${i}`, exclude_periodical_profit: true };
                }
                // Robustly coerce exclude_periodical_profit to boolean (true or 'true' only)
                return { ...type, exclude_periodical_profit: (type.exclude_periodical_profit === true || type.exclude_periodical_profit === 'true') };
            } else {
                return { name: `unknown_type_${i}`, exclude_periodical_profit: true };
            }
        });
        // Force re-render after migration
        renderInvestmentTypesConfig();
    }

    // Add form: Show/hide and require profit rate
    const investmentType = document.getElementById('investmentType');
    const profitRateGroup = document.getElementById('profitRateGroup');
    const profitRateInput = document.getElementById('profitRate');
    if (investmentType) {
        investmentType.addEventListener('change', function() {
            if (isLoanType(this.value)) {
                profitRateGroup.style.display = '';
                profitRateInput.required = true;
            } else {
                profitRateGroup.style.display = 'none';
                profitRateInput.required = false;
                profitRateInput.value = '';
            }
        });
    }

    // Edit form: Show/hide and require profit rate
    const editInvestmentType = document.getElementById('editInvestmentType');
    const editProfitRateGroup = document.getElementById('editProfitRateGroup');
    const editProfitRateInput = document.getElementById('editProfitRate');
    if (editProfitRateInput) {
        // Handled in openEditInvestmentModal
    }

    // Add Investment form collapse behavior
    const addInvestmentForm = document.getElementById('addInvestmentForm');
    const addInvestmentBtn = document.querySelector('[data-bs-target="#addInvestmentForm"]');
    if (addInvestmentForm && addInvestmentBtn) {
        addInvestmentForm.addEventListener('show.bs.collapse', () => {
            // Scroll to the form when it's opened
            addInvestmentForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // Make card headers clickable to toggle their sections
    document.querySelectorAll('.card-header[data-target]').forEach(header => {
        header.addEventListener('click', function(e) {
            // Prevent toggle if the collapse button was clicked
            if (e.target.closest('button')) return;
            // Prevent toggle if clicking inside the sort dropdown, its label, or the funnel icon
            if (e.target.closest('#sortInvestmentsBy, label[for=sortInvestmentsBy], .bi-funnel')) return;
            // Prevent toggle if clicking on filter button, dropdown, or sort controls
            if (e.target.closest('#filterDropdownBtn, #filterDropdownMenu, #filterModalBtn, #sortInvestmentsBy, #sortDirectionBtn, .dropdown, .dropdown-menu')) return;
            // Prevent toggle if clicking on the sum display
            if (e.target.closest('#filteredSumHeader')) return;
            const target = header.getAttribute('data-target');
            if (target) {
                const collapse = document.querySelector(target);
                if (collapse) {
                    const bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapse);
                    bsCollapse.toggle();
                }
            }
        });
    });

    const addTypeBtn = document.getElementById('addTypeBtn');
    if (addTypeBtn) {
        addTypeBtn.addEventListener('click', () => {
            document.getElementById('editTypeName').value = '';
            document.getElementById('editTypeExclude').checked = true;
            document.getElementById('editTypeIdx').value = -1;
            const modal = new bootstrap.Modal(document.getElementById('editTypeModal'));
            modal.show();
        });
    }
});

// Show token input form
function showTokenInput() {
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="card mt-4">
            <div class="card-body">
                <h5 class="card-title">GitHub Token Required</h5>
                <p class="card-text">To use this app, you need to provide your GitHub token.</p>
                <ol>
                    <li>Go to <a href="https://github.com/settings/tokens" target="_blank">GitHub Settings > Developer Settings > Personal Access Tokens</a></li>
                    <li>Click "Generate new token (classic)"</li>
                    <li>Select the "repo" scope</li>
                    <li>Copy the token and paste it below</li>
                </ol>
                <form id="tokenForm" class="mt-3">
                    <div class="mb-3">
                        <input type="text" class="form-control" id="tokenInput" placeholder="Paste your GitHub token here" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Continue</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('tokenForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const token = document.getElementById('tokenInput').value;
        window.location.href = `${window.location.pathname}?token=${token}`;
    });
}

// Setup form submission
function setupForm() {
    const form = document.getElementById('investmentForm');
    
    // Dynamically populate investment type dropdown from metadata
    const investmentTypeSelect = document.getElementById('investmentType');
    if (investmentTypeSelect && investmentData.metadata && Array.isArray(investmentData.metadata.investment_types)) {
        investmentTypeSelect.innerHTML = '<option value="">Select type...</option>';
        investmentData.metadata.investment_types.forEach(type => {
            const option = document.createElement('option');
            option.value = type.name;
            option.textContent = type.name;
            investmentTypeSelect.appendChild(option);
        });
    }
    
    // Real-time form validation
    const formFields = form.querySelectorAll('input, select, textarea');
    formFields.forEach(field => {
        // Validate on blur (when user leaves field)
        field.addEventListener('blur', () => {
            validateField(field);
        });
        
        // For text inputs, also validate on input (as user types)
        if (field.type === 'text' || field.type === 'number' || field.type === 'date') {
            field.addEventListener('input', () => {
                // Only show validation if field has been touched (has was-validated class on form)
                if (form.classList.contains('was-validated')) {
                    validateField(field);
                }
            });
        }
        
        // For selects, validate on change
        if (field.tagName === 'SELECT') {
            field.addEventListener('change', () => {
                if (form.classList.contains('was-validated')) {
                    validateField(field);
                }
            });
        }
    });
    
    // Special validation for profit rate (loan types)
    // Reuse investmentTypeSelect from above
    const profitRateInput = document.getElementById('profitRate');
    if (investmentTypeSelect && profitRateInput) {
        investmentTypeSelect.addEventListener('change', () => {
            const type = investmentTypeSelect.value;
            if (isLoanType(type)) {
                // Profit rate is required for loan types
                profitRateInput.required = true;
                if (form.classList.contains('was-validated')) {
                    validateField(profitRateInput);
                }
            } else {
                profitRateInput.required = false;
                // Clear validation state
                profitRateInput.classList.remove('is-valid', 'is-invalid');
            }
        });
    }
    
    // Form validation - prevent multiple submissions
    let isSubmitting = false;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Prevent multiple submissions
        if (isSubmitting) {
            return;
        }
        
        isSubmitting = true;
        
        try {
            // Mark form as validated to show all validation feedback
            form.classList.add('was-validated');
            
            // Validate all fields
            let isValid = true;
            formFields.forEach(field => {
                if (!validateField(field)) {
                    isValid = false;
                }
            });
            
            if (!isValid) {
                e.stopPropagation();
                isSubmitting = false;
                return;
            }

            const type = document.getElementById('investmentType').value;
            let profitRate = null;
            if (isLoanType(type)) {
                profitRate = parseFloat(document.getElementById('profitRate').value);
                if (isNaN(profitRate)) {
                    document.getElementById('profitRate').focus();
                    isSubmitting = false;
                    return;
                }
            }

            const newInvestment = {
                id: Date.now().toString(),
                name: document.getElementById('investmentName').value,
                is_active: document.getElementById('isActive').checked,
                is_static: document.getElementById('isStatic').checked,
                start_date: document.getElementById('startDate').value,
                end_date: null,
                initial_amount: parseFloat(document.getElementById('initialAmount').value),
                currency: document.getElementById('currency').value,
                current_amount: parseFloat(document.getElementById('initialAmount').value),
                profit_type: document.getElementById('profitType').value,
                notes: document.getElementById('notes').value,
                is_liquid: document.getElementById('isLiquid').checked,
                investment_type: type,
                liquidity_date: document.getElementById('liquidityDate').value || 
                    (document.getElementById('isLiquid').checked ? document.getElementById('startDate').value : null),
                updates: [
                    {
                        date: document.getElementById('startDate').value,
                        amount: parseFloat(document.getElementById('initialAmount').value)
                    }
                ],
                profit_rate: profitRate
            };

            // Add investment to array
            investmentData.investments.push(newInvestment);
            
            // Save to GitHub
            const token = getToken();
            if (!token) {
                // Remove investment if token is missing
                investmentData.investments = investmentData.investments.filter(inv => inv.id !== newInvestment.id);
                showErrorToast('Please provide a valid GitHub token');
                isSubmitting = false;
                return;
            }
            
            try {
                await saveData(token);
                // Only render and reset form if save was successful
                renderInvestments();
                
                // Reset form
                form.reset();
                form.classList.remove('was-validated');
                document.getElementById('profitRateGroup').style.display = 'none';
            } catch (error) {
                // Remove investment if save failed
                investmentData.investments = investmentData.investments.filter(inv => inv.id !== newInvestment.id);
                console.error('Failed to save investment:', error);
                throw error; // Re-throw to be caught by outer catch
            }
        } catch (error) {
            console.error('Error adding investment:', error);
            // Error toast is already shown by saveData
        } finally {
            isSubmitting = false;
        }
        
        // Clear all validation states
        formFields.forEach(field => {
            field.classList.remove('is-valid', 'is-invalid');
            const feedback = field.parentElement.querySelector('.valid-feedback, .invalid-feedback');
            if (feedback) {
                feedback.remove();
            }
        });
    });
}

// Load data from GitHub
async function loadData(token) {
    // Show loading indicator
    showLoadingIndicator('Loading data from GitHub...');
    
    try {
        const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${DATA_FILE}?t=${Date.now()}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            // Log detailed error information
            console.error(`Failed to load data.json: ${response.status} ${response.statusText}`);
            console.error(`URL: ${url}`);
            
            // Try to get error details
            let errorText = '';
            try {
                errorText = await response.text();
                console.error('Response body:', errorText);
            } catch (e) {
                console.error('Could not read error response');
            }
            
            throw new Error(`Failed to load data: ${response.status} ${response.statusText}. Please ensure data.json exists in the repository.`);
        }
        
        investmentData = await response.json();
        migrateInvestmentTypes();
        renderInvestmentTypesConfig();
        setupForm();
        renderInvestments();
        await updateDashboard();
    } catch (error) {
        console.error('Error loading data:', error);
        // Show user-friendly error message
        const userMessage = getUserFriendlyErrorMessage(error, 'loading data');
        
        // Store failed operation for retry
        setLastFailedOperation(loadData, token);
        
        // Show error with retry option
        showErrorToast(userMessage, true);
        renderInvestments();
    } finally {
        // Hide loading indicator
        hideLoadingIndicator();
    }
}

// Loading indicator functions (for quick operations)
function showLoadingIndicator(message = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    const text = document.getElementById('loadingText');
    if (overlay && text) {
        text.textContent = message;
        overlay.classList.add('show');
    }
}

function hideLoadingIndicator() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

// Success confirmation functions (toast notifications)
function showSuccessToast(message) {
    const toastElement = document.getElementById('successToast');
    const toastBody = document.getElementById('successToastBody');
    
    if (toastElement && toastBody) {
        toastBody.textContent = message;
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: 3000
        });
        toast.show();
    }
}

// Retry functionality
let lastFailedOperation = null;

function setLastFailedOperation(operation, ...args) {
    lastFailedOperation = {
        operation: operation,
        args: args
    };
}

function clearLastFailedOperation() {
    lastFailedOperation = null;
}

async function retryLastOperation() {
    if (!lastFailedOperation) {
        return;
    }
    
    const { operation, args } = lastFailedOperation;
    const retryButton = document.getElementById('retryButton');
    
    // Disable retry button and show loading state
    if (retryButton) {
        retryButton.disabled = true;
        retryButton.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Retrying...';
    }
    
    try {
        // Hide error toast
        const errorToast = document.getElementById('errorToast');
        if (errorToast) {
            const toast = bootstrap.Toast.getInstance(errorToast);
            if (toast) {
                toast.hide();
            }
        }
        
        // Retry the operation
        await operation(...args);
        
        // Clear failed operation on success
        clearLastFailedOperation();
    } catch (error) {
        // Operation failed again - error will be shown by the operation's error handling
        console.error('Retry failed:', error);
        
        // Re-enable retry button
        if (retryButton) {
            retryButton.disabled = false;
            retryButton.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i> Retry';
        }
    }
}

// Error message functions
function getUserFriendlyErrorMessage(error, context = 'operation') {
    // Handle network errors
    if (!navigator.onLine) {
        return 'You appear to be offline. Please check your internet connection and try again.';
    }
    
    // Handle fetch errors (network failures)
    if (error instanceof TypeError && error.message.includes('fetch')) {
        return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    
    // Handle GitHub API errors
    if (error.status) {
        switch (error.status) {
            case 401:
                return 'Authentication failed. Please check your GitHub token and try again.';
            case 403:
                return 'Access denied. Please check your token permissions and repository access.';
            case 404:
                return 'Resource not found. Please check the repository settings.';
            case 429:
                return 'Too many requests. Please wait a moment and try again.';
            case 500:
            case 502:
            case 503:
                return 'Server error. Please try again in a few moments.';
            default:
                return `Unable to complete ${context}. Please try again.`;
        }
    }
    
    // Handle specific error messages
    if (error.message) {
        const message = error.message.toLowerCase();
        if (message.includes('network') || message.includes('fetch')) {
            return 'Network error. Please check your connection and try again.';
        }
        if (message.includes('token') || message.includes('auth')) {
            return 'Authentication error. Please check your GitHub token.';
        }
        if (message.includes('timeout')) {
            return 'Request timed out. Please try again.';
        }
    }
    
    // Generic error message
    return `Something went wrong with ${context}. Please try again.`;
}

function showErrorToast(message, showRetry = false) {
    const toastElement = document.getElementById('errorToast');
    const toastMessage = document.getElementById('errorToastMessage');
    const retryContainer = document.getElementById('errorToastRetry');
    const retryButton = document.getElementById('retryButton');
    
    if (toastElement && toastMessage) {
        toastMessage.textContent = message;
        
        // Show/hide retry button
        if (retryContainer) {
            retryContainer.style.display = showRetry ? 'block' : 'none';
        }
        
        // Reset retry button state
        if (retryButton) {
            retryButton.disabled = false;
            retryButton.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i> Retry';
        }
        
        const toast = new bootstrap.Toast(toastElement, {
            autohide: !showRetry, // Don't auto-hide if retry is available
            delay: showRetry ? 0 : 5000
        });
        toast.show();
    }
}

// Progress indicator functions (for long operations)
function showProgress(status = 'Saving...', message = 'Please wait while your changes are being saved...') {
    const progressModal = new bootstrap.Modal(document.getElementById('progressModal'));
    document.getElementById('progressStatus').textContent = status;
    document.getElementById('progressMessage').textContent = message;
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('progressText').textContent = '0%';
    progressModal.show();
}

function updateProgress(percent, status = null, message = null) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    progressBar.style.width = `${percent}%`;
    progressBar.setAttribute('aria-valuenow', percent);
    progressText.textContent = `${Math.round(percent)}%`;
    
    if (status) {
        document.getElementById('progressStatus').textContent = status;
    }
    if (message) {
        document.getElementById('progressMessage').textContent = message;
    }
}

function showProgressError(errorMessage) {
    const progressStatus = document.getElementById('progressStatus');
    const progressMessage = document.getElementById('progressMessage');
    const progressBar = document.getElementById('progressBar');
    
    // Use user-friendly message if provided, otherwise use default
    const userMessage = errorMessage || 'An error occurred. Please try again.';
    
    progressStatus.textContent = 'Error';
    progressStatus.className = 'mb-3 text-danger';
    progressMessage.textContent = userMessage;
    progressMessage.className = 'text-danger small mb-0';
    progressBar.className = 'progress-bar bg-danger';
    progressBar.style.width = '100%';
    
    // Also show error toast for additional feedback
    showErrorToast(userMessage);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        hideProgress();
    }, 3000);
}

function showProgressSuccess(message = 'Changes saved successfully!') {
    const progressStatus = document.getElementById('progressStatus');
    const progressMessage = document.getElementById('progressMessage');
    const progressBar = document.getElementById('progressBar');
    
    progressStatus.textContent = 'Complete';
    progressStatus.className = 'mb-3 text-success';
    progressMessage.textContent = message;
    progressMessage.className = 'text-success small mb-0';
    progressBar.className = 'progress-bar bg-success';
    progressBar.style.width = '100%';
    document.getElementById('progressText').textContent = '100%';
    
    // Also show toast notification for additional feedback
    showSuccessToast(message);
    
    // Auto-hide after 2 seconds
    setTimeout(() => {
        hideProgress();
    }, 2000);
}

function hideProgress() {
    const progressModal = bootstrap.Modal.getInstance(document.getElementById('progressModal'));
    if (progressModal) {
        progressModal.hide();
    }
    
    // Reset progress bar styling
    const progressBar = document.getElementById('progressBar');
    const progressStatus = document.getElementById('progressStatus');
    progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated';
    progressStatus.className = 'mb-3';
}

// GitHub Actions API polling functions
async function getLatestWorkflowRun(token, commitSha = null) {
    try {
        // Get workflow runs, filtered by workflow file and branch
        let url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=5&branch=main`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch workflow runs');
        }
        
        const data = await response.json();
        const runs = data.workflow_runs || [];
        
        // If commitSha provided, find run for that commit, otherwise get latest
        if (commitSha) {
            const runForCommit = runs.find(run => run.head_sha === commitSha);
            if (runForCommit) {
                return runForCommit;
            }
        }
        
        // Return latest run
        return runs.length > 0 ? runs[0] : null;
    } catch (error) {
        console.error('Error fetching workflow run:', error);
        return null;
    }
}

async function getWorkflowRunStatus(token, runId) {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${runId}`,
            {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { message: 'Failed to fetch workflow run status', status: response.status };
            }
            const error = new Error(errorData.message || 'Failed to fetch workflow run status');
            error.status = response.status;
            throw error;
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching workflow run status:', error);
        return null;
    }
}

async function pollWorkflowStatus(token, commitSha, maxDuration = 60000) {
    const startTime = Date.now();
    const pollInterval = 2000; // Poll every 2 seconds
    let lastStatus = null;
    let progressPercent = 20; // Start at 20% (queued)
    
    updateProgress(progressPercent, 'Processing...', 'Waiting for GitHub Action to start...');
    
    while (Date.now() - startTime < maxDuration) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        const run = await getLatestWorkflowRun(token, commitSha);
        
        if (!run) {
            // Workflow not found yet, continue polling
            continue;
        }
        
        const status = run.status; // queued, in_progress, completed
        const conclusion = run.conclusion; // success, failure, cancelled, etc.
        
        // Update progress based on status
        if (status === 'queued' && lastStatus !== 'queued') {
            progressPercent = 20;
            updateProgress(progressPercent, 'Queued', 'Workflow is queued and waiting to start...');
        } else if (status === 'in_progress') {
            // Gradually increase progress from 30% to 90% while in progress
            if (progressPercent < 30) progressPercent = 30;
            if (progressPercent < 90) {
                progressPercent = Math.min(90, progressPercent + 5);
            }
            updateProgress(progressPercent, 'Deploying...', 'GitHub Action is running and deploying your changes...');
        } else if (status === 'completed') {
            if (conclusion === 'success') {
                progressPercent = 100;
                updateProgress(progressPercent, 'Complete', 'Deployment completed successfully!');
                return { success: true, run };
            } else {
                // Workflow completed but failed
                showProgressError(`Workflow failed: ${conclusion || 'unknown error'}`);
                return { success: false, error: conclusion || 'Workflow failed' };
            }
        }
        
        lastStatus = status;
    }
    
    // Timeout reached
    updateProgress(90, 'Timeout', 'Workflow is taking longer than expected. It may still be running...');
    return { success: false, error: 'Polling timeout' };
}

// Track ongoing save operations to prevent conflicts
let isSaving = false;
let latestCommitSha = null;

// Save data to GitHub
async function saveData(token) {
    if (!token || !REPO_OWNER || !REPO_NAME) {
        alert('Please provide a valid GitHub token');
        return;
    }

    // Prevent concurrent saves - queue the request
    if (isSaving) {
        // Wait a bit and retry
        await new Promise(resolve => setTimeout(resolve, 500));
        if (isSaving) {
            showErrorToast('Another save is in progress. Please wait...');
            return;
        }
    }

    isSaving = true;

    // Show progress indicator immediately
    showProgress('Saving...', 'Uploading your changes to GitHub...');
    updateProgress(10);

    try {
        // Always get the latest file SHA to handle concurrent saves
        const getFileResponse = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_FILE}`,
            {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        let sha = '';
        if (getFileResponse.ok) {
            const fileData = await getFileResponse.json();
            sha = fileData.sha;
        } else if (getFileResponse.status !== 404) {
            throw new Error('Failed to fetch file');
        }

        // Update file
        const jsonString = JSON.stringify(investmentData, null, 2);
        const content = btoa(unescape(encodeURIComponent(jsonString)));
        const response = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_FILE}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: 'Update investment data',
                    content: content,
                    sha: sha
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 409) {
                // Conflict - file was modified, need to retry with new SHA
                throw new Error('File was modified. Please try again.');
            }
            throw new Error(errorData.message || 'Failed to save data');
        }
        
        // Get commit SHA from response to track workflow run
        const commitData = await response.json();
        const commitSha = commitData.commit?.sha || null;
        latestCommitSha = commitSha; // Track latest commit
        
        // Update progress - file saved
        updateProgress(50, 'Saved', 'File saved to GitHub. Deployment will start shortly...');
        
        // Hide progress modal quickly - don't block user
        setTimeout(() => {
            hideProgress();
        }, 1500);
        
        // Reset isSaving flag immediately after successful save (before background polling)
        isSaving = false;
        
        // Poll GitHub Actions API in background (non-blocking)
        pollWorkflowStatusInBackground(token, commitSha);
        
        // Show success immediately - don't wait for workflow
        showSuccessToast('Changes saved successfully! Deployment in progress...');
        
        // Clear any failed operation on success
        clearLastFailedOperation();
        
    } catch (error) {
        console.error('Error saving data:', error);
        const errorMessage = error.message || 'Failed to save data. Please check console for details.';
        showProgressError(errorMessage);
        showErrorToast(errorMessage);
        // Reset flag on error
        isSaving = false;
    }
}

// Poll workflow status in background without blocking
async function pollWorkflowStatusInBackground(token, commitSha, maxDuration = 120000) {
    // Wait a bit for workflow to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
        const workflowResult = await pollWorkflowStatus(token, commitSha, maxDuration);
        
        if (workflowResult.success) {
            // Workflow completed successfully, reload data in background
            await loadData(token);
            showSuccessToast('Deployment completed successfully!');
        } else if (workflowResult.error === 'Polling timeout') {
            // Timeout - workflow may still be running, but refresh data anyway
            await loadData(token);
            showSuccessToast('Deployment may still be in progress. Data refreshed.');
        } else {
            // Workflow failed - reload data anyway
            await loadData(token);
            showErrorToast('Deployment failed. Data refreshed, but please check GitHub Actions.');
        }
    } catch (error) {
        console.error('Error polling workflow status:', error);
        // Silently fail - don't bother user with background polling errors
        // Data was already saved successfully
    }
}

// Render investment list
function renderInvestments() {
    const container = document.getElementById('investmentList');
    if (!investmentData.investments || investmentData.investments.length === 0) {
        container.innerHTML = '<div class="text-center text-muted">No investments added yet</div>';
        updateDashboard();
        return;
    }

    // Separate active and inactive investments
    let activeInvestmentsList = investmentData.investments.filter(inv => inv.is_active);
    let inactiveInvestmentsList = investmentData.investments.filter(inv => !inv.is_active);

    // Apply investment type filter if types are selected
    if (selectedInvestmentTypes.length > 0) {
        activeInvestmentsList = activeInvestmentsList.filter(inv => 
            selectedInvestmentTypes.includes(inv.investment_type)
        );
        inactiveInvestmentsList = inactiveInvestmentsList.filter(inv => 
            selectedInvestmentTypes.includes(inv.investment_type)
        );
    }

    // Sort only active investments
    let sortedActive = activeInvestmentsList.slice().sort((a, b) => {
        let cmp = 0;
        if (sortInvestmentsBy === 'name') {
            cmp = a.name.localeCompare(b.name);
        } else if (sortInvestmentsBy === 'type') {
            cmp = a.investment_type.localeCompare(b.investment_type);
        } else if (sortInvestmentsBy === 'amount') {
            cmp = (b.current_amount || 0) - (a.current_amount || 0);
        } else if (sortInvestmentsBy === 'init_date') {
            cmp = new Date(a.start_date) - new Date(b.start_date);
        } else if (sortInvestmentsBy === 'last_update') {
            const aLast = Array.isArray(a.updates) && a.updates.length > 0 ? a.updates[a.updates.length - 1].date : a.start_date;
            const bLast = Array.isArray(b.updates) && b.updates.length > 0 ? b.updates[b.updates.length - 1].date : b.start_date;
            cmp = new Date(bLast) - new Date(aLast);
        }
        if (sortDirection === 'asc') cmp = -cmp;
        return cmp;
    });

    // Concatenate active (sorted) and inactive (original order)
    let sortedInvestments = [...sortedActive, ...inactiveInvestmentsList];

    container.innerHTML = sortedInvestments.map(investment => {
        // --- PROFIT CALCULATIONS ---
        const initial = investment.initial_amount || 0;
        const current = investment.current_amount || 0;
        let profitAmount, profitRate, profitRateYearly, profitRateMonthly;
        if (isLoanType(investment.investment_type)) {
            // Use profit_rate field, calculate based on years from start to today
            if (typeof investment.profit_rate === 'number' && !isNaN(investment.profit_rate)) {
                const start = new Date(investment.start_date);
                const end = new Date(); // today
                const msInYear = 1000 * 60 * 60 * 24 * 365.25;
                const years = Math.max((end - start) / msInYear, 0);
                profitAmount = initial * (investment.profit_rate / 100) * years;
                profitRate = investment.profit_rate * years;
                profitRateYearly = investment.profit_rate;
                profitRateMonthly = investment.profit_rate / 12;
            } else {
                profitAmount = profitRate = profitRateYearly = profitRateMonthly = 'N/A';
            }
        } else {
            // Use current/initial amount
            profitAmount = current - initial;
            profitRate = initial !== 0 ? (profitAmount / initial) * 100 : 0;
            // Find last update date
            let lastUpdateDate = investment.start_date;
            if (Array.isArray(investment.updates) && investment.updates.length > 0) {
                lastUpdateDate = investment.updates[investment.updates.length - 1].date || investment.start_date;
            }
            const start = new Date(investment.start_date);
            const end = new Date(lastUpdateDate);
            // Calculate years and months difference
            const msInYear = 1000 * 60 * 60 * 24 * 365.25;
            const msInMonth = 1000 * 60 * 60 * 24 * 30.44;
            const years = Math.max((end - start) / msInYear, 0);
            const months = Math.max((end - start) / msInMonth, 0);
            // CAGR for yearly and monthly
            if (initial > 0 && years > 0) {
                profitRateYearly = ((Math.pow(current / initial, 1 / years) - 1) * 100).toFixed(2);
            } else if (initial > 0) {
                profitRateYearly = '0.00';
            } else {
                profitRateYearly = 'N/A';
            }
            if (initial > 0 && months > 0) {
                profitRateMonthly = ((Math.pow(current / initial, 1 / months) - 1) * 100).toFixed(2);
            } else if (initial > 0) {
                profitRateMonthly = '0.00';
            } else {
                profitRateMonthly = 'N/A';
            }
        }
        // --- END PROFIT CALCULATIONS ---
        return `
        <div class="investment-item">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <div class="d-flex align-items-center">
                        <strong>${investment.name}</strong>
                        <span class="badge bg-${investment.is_active ? 'success' : 'secondary'} ms-2">
                            ${investment.is_active ? 'Active' : 'Inactive'}
                        </span>
                        ${!investment.is_liquid ? '<span class="badge bg-warning ms-2">Illiquid</span>' : ''}
                        ${investment.is_static ? '<span class="badge bg-info ms-2">Static</span>' : ''}
                    </div>
                    <div class="text-muted small">
                        ${investment.investment_type} • Started ${new Date(investment.start_date).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: '2-digit'})}
                        ${investment.liquidity_date ? `• Liquid on ${new Date(investment.liquidity_date).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: '2-digit'})}` : ''}
                    </div>
                    ${investment.notes ? `<div class="text-muted small mt-1"><i class='bi bi-sticky'></i> ${investment.notes}</div>` : ''}
                    <div class="mt-2">
                        <strong>Profit:</strong> ${profitAmount === 'N/A' ? 'N/A' : (investment.currency === 'USD' ? '$' : '₪') + profitAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}
                        <span class="text-muted small ms-2">Rate: ${profitRate === 'N/A' ? 'N/A' : profitRate.toFixed(2) + '%'}</span>
                        <span class="text-muted small ms-2">Yearly: ${profitRateYearly === 'N/A' ? 'N/A' : profitRateYearly + '%'}</span>
                        <span class="text-muted small ms-2">Monthly: ${profitRateMonthly === 'N/A' ? 'N/A' : (typeof profitRateMonthly === 'number' ? profitRateMonthly.toFixed(2) : profitRateMonthly) + '%'}</span>
                    </div>
                    <div class="text-muted small mt-1">
                        <i class="bi bi-clock-history"></i> Last Update: ${(() => {
                            let lastUpdateDate = investment.start_date;
                            if (Array.isArray(investment.updates) && investment.updates.length > 0) {
                                lastUpdateDate = investment.updates[investment.updates.length - 1].date || investment.start_date;
                            }
                            const d = new Date(lastUpdateDate);
                            return isNaN(d) ? '-' : d.toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: '2-digit'});
                        })()}
                    </div>
                </div>
                <div class="text-end">
                    <div class="amount">${investment.currency === 'USD' ? '$' : '₪'}${investment.current_amount.toLocaleString()}</div>
                    <div class="text-muted small">Initial: ${investment.currency === 'USD' ? '$' : '₪'}${investment.initial_amount.toLocaleString()}</div>
                    <div class="mt-2 d-flex gap-2 justify-content-end">
                        <button class="btn btn-sm btn-outline-primary edit-investment-btn" data-id="${investment.id}" title="Edit" aria-label="Edit investment ${investment.name}"><i class="bi bi-pencil" aria-hidden="true"></i></button>
                        <button class="btn btn-sm btn-outline-danger delete-investment-btn" data-id="${investment.id}" title="Delete" aria-label="Delete investment ${investment.name}"><i class="bi bi-trash" aria-hidden="true"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `;
    }).join('');

    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-investment-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            openEditInvestmentModal(id);
        });
    });
    document.querySelectorAll('.delete-investment-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this investment?')) {
                deleteInvestment(id);
            }
        });
    });
}

// Apply investment type filter
function applyInvestmentTypeFilter(types) {
    if (Array.isArray(types)) {
        selectedInvestmentTypes = types;
    } else {
        selectedInvestmentTypes = [];
    }
    renderInvestments();
    updateFilterUI();
    updateFilterIndicator();
    // Update sum display when filter changes
    updateFilteredSumDisplay();
}

// Update filter indicator badge
function updateFilterIndicator() {
    const count = selectedInvestmentTypes.length;
    const badgeDesktop = document.getElementById('filterBadgeDesktop');
    const badgeMobile = document.getElementById('filterBadgeMobile');
    
    if (badgeDesktop) {
        if (count > 0) {
            badgeDesktop.textContent = count;
            badgeDesktop.style.display = 'block';
        } else {
            badgeDesktop.style.display = 'none';
        }
    }
    
    if (badgeMobile) {
        if (count > 0) {
            badgeMobile.textContent = count;
            badgeMobile.style.display = 'block';
        } else {
            badgeMobile.style.display = 'none';
        }
    }
    
    // Update filtered sum display
    updateFilteredSumDisplay();
}

// Calculate and display sum of filtered active investments in header
async function updateFilteredSumDisplay() {
    const sumHeader = document.getElementById('filteredSumHeader');
    
    if (!sumHeader) return;
    
    // Get filtered active investments
    let filteredInvestments = investmentData.investments.filter(inv => inv.is_active);
    
    // Apply type filter if active
    if (selectedInvestmentTypes.length > 0) {
        filteredInvestments = filteredInvestments.filter(inv => 
            selectedInvestmentTypes.includes(inv.investment_type)
        );
        
        // Only show sum if filters are active
        if (filteredInvestments.length === 0) {
            sumHeader.style.display = 'none';
            return;
        }
        
        // Calculate sum in ILS
        const usdToIlsRate = await getUsdToIlsRate();
        let totalIls = 0;
        let totalUsd = 0;
        
        filteredInvestments.forEach(inv => {
            const amount = inv.current_amount || inv.initial_amount;
            if (inv.currency === 'USD') {
                totalUsd += amount;
            } else {
                totalIls += amount;
            }
        });
        
        // Convert USD to ILS and add to total
        const totalIlsConverted = totalIls + (totalUsd * usdToIlsRate);
        
        // Display sum in header
        const count = filteredInvestments.length;
        const displayText = `(${count} ${count === 1 ? 'investment' : 'investments'}: ₪${formatNumber(totalIlsConverted)})`;
        sumHeader.textContent = displayText;
        sumHeader.style.display = 'inline';
    } else {
        // No filters active - hide sum
        sumHeader.style.display = 'none';
    }
}

// Setup filter UI with checkboxes
function setupFilterUI() {
    updateFilterUI();
    updateFilterIndicator();
    
    // Desktop dropdown - update UI when dropdown is shown
    const filterDropdownBtn = document.getElementById('filterDropdownBtn');
    const filterDropdownMenu = document.getElementById('filterDropdownMenu');
    if (filterDropdownBtn && filterDropdownMenu) {
        filterDropdownMenu.addEventListener('show.bs.dropdown', () => {
            // Update filter UI when dropdown opens
            updateFilterUI();
        });
    }
    
    // Mobile filter modal button
    const filterModalBtn = document.getElementById('filterModalBtn');
    if (filterModalBtn) {
        filterModalBtn.addEventListener('click', () => {
            // Update filter UI before showing modal
            updateFilterUI();
            const modal = new bootstrap.Modal(document.getElementById('filterModal'));
            modal.show();
        });
    }
    
    // Clear filters buttons
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const clearFiltersModalBtn = document.getElementById('clearFiltersModalBtn');
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            applyInvestmentTypeFilter([]);
        });
    }
    
    if (clearFiltersModalBtn) {
        clearFiltersModalBtn.addEventListener('click', () => {
            applyInvestmentTypeFilter([]);
            const modal = bootstrap.Modal.getInstance(document.getElementById('filterModal'));
            if (modal) modal.hide();
        });
    }
}

// Update filter UI checkboxes
function updateFilterUI() {
    if (!investmentData.metadata || !Array.isArray(investmentData.metadata.investment_types)) {
        return;
    }
    
    const types = investmentData.metadata.investment_types.map(t => t.name || t);
    
    // Desktop dropdown
    const dropdownContainer = document.getElementById('filterCheckboxesContainer');
    if (dropdownContainer) {
        dropdownContainer.innerHTML = types.map(type => `
            <li>
                <label class="dropdown-item-text" style="cursor: pointer; padding: 0.5rem 1rem; min-height: 44px; display: flex; align-items: center;">
                    <input type="checkbox" class="form-check-input me-2 filter-type-checkbox" value="${type}" 
                           ${selectedInvestmentTypes.includes(type) ? 'checked' : ''}
                           style="min-width: 18px; min-height: 18px; cursor: pointer;">
                    <span style="flex: 1;">${type}</span>
                </label>
            </li>
        `).join('');
        
        // Add event listeners to checkboxes
        dropdownContainer.querySelectorAll('.filter-type-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', handleFilterCheckboxChange);
        });
    }
    
    // Mobile modal
    const modalContainer = document.getElementById('filterModalCheckboxesContainer');
    if (modalContainer) {
        modalContainer.innerHTML = types.map(type => `
            <div class="form-check mb-3" style="min-height: 44px; display: flex; align-items: center;">
                <input class="form-check-input filter-type-checkbox-modal" type="checkbox" value="${type}" 
                       id="filterCheckbox-${type}" 
                       ${selectedInvestmentTypes.includes(type) ? 'checked' : ''}
                       style="min-width: 20px; min-height: 20px; cursor: pointer;">
                <label class="form-check-label" for="filterCheckbox-${type}" style="flex: 1; cursor: pointer; padding-left: 0.5rem;">
                    ${type}
                </label>
            </div>
        `).join('');
        
        // Add event listeners to checkboxes
        modalContainer.querySelectorAll('.filter-type-checkbox-modal').forEach(checkbox => {
            checkbox.addEventListener('change', handleFilterCheckboxChange);
        });
    }
}

// Handle filter checkbox change
function handleFilterCheckboxChange(e) {
    const type = e.target.value;
    const isChecked = e.target.checked;
    
    if (isChecked) {
        if (!selectedInvestmentTypes.includes(type)) {
            selectedInvestmentTypes.push(type);
        }
    } else {
        selectedInvestmentTypes = selectedInvestmentTypes.filter(t => t !== type);
    }
    
    applyInvestmentTypeFilter(selectedInvestmentTypes);
    
    // Update other checkboxes (sync desktop and mobile)
    document.querySelectorAll('.filter-type-checkbox, .filter-type-checkbox-modal').forEach(cb => {
        if (cb.value === type) {
            cb.checked = isChecked;
        }
    });
}

function showNotesModal(id) {
    const investment = investmentData.investments.find(inv => inv.id === id);
    const notesContent = document.getElementById('notesModalContent');
    notesContent.textContent = investment && investment.notes ? investment.notes : 'No notes for this investment.';
    const modal = new bootstrap.Modal(document.getElementById('notesModal'));
    modal.show();
}

function openEditInvestmentModal(id) {
    const investment = investmentData.investments.find(inv => inv.id === id);
    if (!investment) return;
    document.getElementById('editInvestmentName').value = investment.name;
    document.getElementById('editInvestmentId').value = investment.id;
    document.getElementById('editCurrentAmount').value = investment.current_amount;
    document.getElementById('editIsActive').checked = investment.is_active;
    document.getElementById('editIsLiquid').checked = investment.is_liquid;
    document.getElementById('editIsStatic').checked = investment.is_static || false;
    document.getElementById('editLiquidityDate').value = investment.liquidity_date || '';
    // Profit rate logic
    const editProfitRateGroup = document.getElementById('editProfitRateGroup');
    const editProfitRateInput = document.getElementById('editProfitRate');
    if (isLoanType(investment.investment_type)) {
        editProfitRateGroup.style.display = '';
        editProfitRateInput.required = true;
        editProfitRateInput.value = investment.profit_rate != null ? investment.profit_rate : '';
    } else {
        editProfitRateGroup.style.display = 'none';
        editProfitRateInput.required = false;
        editProfitRateInput.value = '';
    }
    document.getElementById('editNotes').value = investment.notes || '';
    const modal = new bootstrap.Modal(document.getElementById('editInvestmentModal'));
    modal.show();
}

document.addEventListener('DOMContentLoaded', () => {
    // ... existing code ...
    // Edit investment form submit
    const editForm = document.getElementById('editInvestmentForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Mark form as validated to show all validation feedback
            editForm.classList.add('was-validated');
            
            // Validate required fields
            const editInvestmentName = document.getElementById('editInvestmentName');
            const editCurrentAmount = document.getElementById('editCurrentAmount');
            
            if (!editInvestmentName.value.trim()) {
                editInvestmentName.classList.add('is-invalid');
                editInvestmentName.focus();
                e.stopPropagation();
                return;
            }
            
            if (!editCurrentAmount.value || isNaN(parseFloat(editCurrentAmount.value))) {
                editCurrentAmount.classList.add('is-invalid');
                editCurrentAmount.focus();
                e.stopPropagation();
                return;
            }
            
            const id = document.getElementById('editInvestmentId').value;
            const investment = investmentData.investments.find(inv => inv.id === id);
            if (!investment) {
                showErrorToast('Investment not found. Please refresh the page.');
                return;
            }
            
            // Check for duplicate investments (excluding current investment)
            const editStartDate = normalizeDate(document.getElementById('editStartDate')?.value || investment.start_date);
            const duplicate = checkForDuplicateInvestment(editInvestmentName.value.trim(), editStartDate, id);
            
            if (duplicate) {
                editInvestmentName.classList.add('is-invalid');
                const existingFeedback = editInvestmentName.parentElement.querySelector('.invalid-feedback');
                if (existingFeedback) {
                    existingFeedback.remove();
                }
                const feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                feedback.textContent = `An investment with the name "${duplicate.name}" and start date ${duplicate.start_date} already exists.`;
                editInvestmentName.parentElement.appendChild(feedback);
                editInvestmentName.focus();
                e.stopPropagation();
                return;
            }
            
            try {
                investment.name = editInvestmentName.value.trim();
                const newAmount = parseFloat(editCurrentAmount.value);
                if (investment.current_amount !== newAmount) {
                    // Add update record
                    if (!Array.isArray(investment.updates)) investment.updates = [];
                    investment.updates.push({
                        date: new Date().toISOString().slice(0, 10),
                        amount: newAmount
                    });
                }
                investment.current_amount = newAmount;
                investment.is_active = document.getElementById('editIsActive').checked;
                investment.is_liquid = document.getElementById('editIsLiquid').checked;
                investment.is_static = document.getElementById('editIsStatic').checked;
                investment.liquidity_date = document.getElementById('editLiquidityDate').value || (investment.is_liquid ? investment.start_date : null);
                
                // Profit rate logic
                if (isLoanType(investment.investment_type)) {
                    const rate = parseFloat(document.getElementById('editProfitRate').value);
                    if (isNaN(rate) || rate <= 0) {
                        const profitRateField = document.getElementById('editProfitRate');
                        profitRateField.classList.add('is-invalid');
                        profitRateField.focus();
                        e.stopPropagation();
                        return;
                    }
                    investment.profit_rate = rate;
                } else {
                    delete investment.profit_rate;
                }
                investment.notes = document.getElementById('editNotes').value;
                
                const token = getToken();
                if (!token) {
                    showErrorToast('Please provide a valid GitHub token.');
                    return;
                }
                
                await saveData(token);
                renderInvestments();
                bootstrap.Modal.getInstance(document.getElementById('editInvestmentModal')).hide();
            } catch (error) {
                console.error('Error updating investment:', error);
                showErrorToast('Failed to update investment. Please try again.');
            }
        });
    }
});

function deleteInvestment(id) {
    investmentData.investments = investmentData.investments.filter(inv => inv.id !== id);
    (async () => {
        await saveData(getToken());
        renderInvestments();
    })();
}

// Add these functions after the existing functions but before the event listeners

async function updateDashboard() {
    const usdToIlsRate = await getUsdToIlsRate();
    await updateTotalValue(usdToIlsRate);
    updateLiquidityChart(usdToIlsRate);
    updateTypeChart(usdToIlsRate);
}

async function updateTotalValue(usdToIlsRate) {
    try {
        const activeInvestments = investmentData.investments.filter(inv => inv.is_active);
        // Dynamically get excluded types from metadata
        const excludedTypes = (investmentData.metadata && Array.isArray(investmentData.metadata.investment_types))
          ? investmentData.metadata.investment_types
              .filter(t => t.exclude_periodical_profit === true)
              .map(t => t.name)
          : [];
        // Calculate total value in ILS
        const totalValue = activeInvestments.reduce((sum, inv) => {
            const currentAmount = inv.current_amount || inv.initial_amount;
            if (inv.currency === 'ILS') {
                return sum + currentAmount;
            } else if (inv.currency === 'USD') {
                return sum + (currentAmount * usdToIlsRate);
            }
            return sum;
        }, 0);
        // Update the dashboard widget
        const totalValueElement = document.getElementById('totalValueILS');
        totalValueElement.textContent = `₪${formatNumber(totalValue)}`;
        // --- Monthly Profit Calculation ---
        let monthlyProfit = 0;
        activeInvestments.filter(inv => 
            inv.is_static && 
            !excludedTypes.includes(inv.investment_type)
        ).forEach(inv => {
            let profit = 0;
            if (isLoanType(inv.investment_type) && typeof inv.profit_rate === 'number' && !isNaN(inv.profit_rate)) {
                const startDate = new Date(inv.start_date);
                const now = new Date();
                const daysSinceStart = (now - startDate) / (1000 * 60 * 60 * 24);
                if (daysSinceStart < 30) {
                    profit = ((inv.current_amount || inv.initial_amount) * (inv.profit_rate / 100) / 12) * (daysSinceStart / 30);
                } else {
                    profit = (inv.current_amount || inv.initial_amount) * (inv.profit_rate / 100) / 12;
                }
            } else if (Array.isArray(inv.updates) && inv.updates.length >= 2) {
                // Use first and last update
                const updatesSorted = inv.updates.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
                const first = updatesSorted[0];
                const last = updatesSorted[updatesSorted.length - 1];
                const firstDate = new Date(first.date);
                const lastDate = new Date(last.date);
                const days = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
                if (days < 30) {
                    profit = last.amount - first.amount;
                } else if (days > 0) {
                    profit = ((last.amount - first.amount) / days) * 30;
                } else {
                    profit = 0;
                }
            } else {
                return;
            }
            // Convert to ILS if needed
            if (inv.currency === 'USD') {
                profit = profit * usdToIlsRate;
            }
            monthlyProfit += profit;
        });
        const monthlyProfitElement = document.getElementById('monthlyProfit');
        monthlyProfitElement.textContent = `₪${formatNumber(monthlyProfit)}`;
        // --- End Monthly Profit Calculation ---
        // --- Yearly Profit Calculation ---
        let yearlyProfit = 0;
        activeInvestments.filter(inv => 
            inv.is_static && 
            !excludedTypes.includes(inv.investment_type)
        ).forEach(inv => {
            let profit = 0;
            if (isLoanType(inv.investment_type) && typeof inv.profit_rate === 'number' && !isNaN(inv.profit_rate)) {
                const startDate = new Date(inv.start_date);
                const now = new Date();
                const daysSinceStart = (now - startDate) / (1000 * 60 * 60 * 24);
                if (daysSinceStart < 365) {
                    profit = ((inv.current_amount || inv.initial_amount) * (inv.profit_rate / 100)) * (daysSinceStart / 365);
                } else {
                    profit = (inv.current_amount || inv.initial_amount) * (inv.profit_rate / 100);
                }
            } else if (Array.isArray(inv.updates) && inv.updates.length >= 2) {
                // Use first and last update
                const updatesSorted = inv.updates.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
                const first = updatesSorted[0];
                const last = updatesSorted[updatesSorted.length - 1];
                const firstDate = new Date(first.date);
                const lastDate = new Date(last.date);
                const days = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
                if (days < 365) {
                    profit = last.amount - first.amount;
                } else if (days > 0) {
                    profit = ((last.amount - first.amount) / days) * 365;
                } else {
                    profit = 0;
                }
            } else {
                return;
            }
            if (inv.currency === 'USD') {
                profit = profit * usdToIlsRate;
            }
            yearlyProfit += profit;
        });
        const yearlyProfitElement = document.getElementById('yearlyProfit');
        yearlyProfitElement.textContent = `₪${formatNumber(yearlyProfit)}`;
        // --- End Yearly Profit Calculation ---
    } catch (error) {
        console.error('Error updating total value:', error);
    }
}

async function getUsdToIlsRate() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        return data.rates.ILS;
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        // Fallback to a default rate if API fails
        return 3.65;
    }
}

function formatNumber(number) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
}

function updateLiquidityChart(usdToIlsRate) {
    const ctx = document.getElementById('liquidityChart').getContext('2d');
    // Remove previous chart instance if exists
    if (window.liquidityChartInstance) {
        window.liquidityChartInstance.destroy();
    }
    // Count active investments by liquidity and sum ILS value
    const activeInvestments = investmentData.investments.filter(inv => inv.is_active);
    let liquidCount = 0, illiquidCount = 0;
    let liquidTotal = 0, illiquidTotal = 0;
    activeInvestments.forEach(inv => {
        const currentAmount = inv.current_amount || inv.initial_amount;
        const amountIls = inv.currency === 'USD' ? currentAmount * usdToIlsRate : currentAmount;
        if (inv.is_liquid) {
            liquidCount++;
            liquidTotal += amountIls;
        } else {
            illiquidCount++;
            illiquidTotal += amountIls;
        }
    });
    window.liquidityChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: [
                `Liquid (${liquidCount} investments, ₪${formatNumber(liquidTotal)})`,
                `Illiquid (${illiquidCount} investments, ₪${formatNumber(illiquidTotal)})`
            ],
            datasets: [{
                data: [liquidTotal, illiquidTotal],
                backgroundColor: ['#A3C9A8', '#C7CEEA'], // soft green, lavender
                borderColor: ['#fff', '#fff'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = liquidTotal + illiquidTotal;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${percentage}% of total value`;
                        }
                    }
                }
            }
        }
    });
}

function updateTypeChart(usdToIlsRate) {
    const container = document.getElementById('typeLabels');
    // Group active investments by type and sum their ILS values
    const typeTotals = {};
    const activeInvestments = investmentData.investments.filter(inv => inv.is_active);
    activeInvestments.forEach(inv => {
        const currentAmount = inv.current_amount || inv.initial_amount;
        const amountIls = inv.currency === 'USD' ? currentAmount * usdToIlsRate : currentAmount;
        if (!typeTotals[inv.investment_type]) {
            typeTotals[inv.investment_type] = 0;
        }
        typeTotals[inv.investment_type] += amountIls;
    });
    // Sort types by total value (descending)
    const sortedTypes = Object.entries(typeTotals)
        .sort(([,a], [,b]) => b - a);
    
    // Calculate total for percentage
    const total = sortedTypes.reduce((sum, [,val]) => sum + val, 0);
    
    // Create HTML for type labels
    container.innerHTML = sortedTypes.map(([type, amount]) => {
        const percentage = ((amount / total) * 100).toFixed(1);
        return `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span>${type}</span>
                <span>₪${formatNumber(amount)} (${percentage}%)</span>
            </div>
        `;
    }).join('');
}

// Render investment types config section
function renderInvestmentTypesConfig() {
    const container = document.getElementById('investmentTypesConfigList');
    if (!investmentData.metadata || !Array.isArray(investmentData.metadata.investment_types)) {
        container.innerHTML = '<div class="text-center text-muted">No investment types found</div>';
        return;
    }
    container.innerHTML = investmentData.metadata.investment_types.map((type, idx) => {
        const typeName = type && typeof type === 'object' && type.name ? type.name : String(type);
        const isExcluded = type.exclude_periodical_profit === true;
        return `
        <div class="investment-item d-flex justify-content-between align-items-center mb-2">
            <div>
                <strong>${typeName}</strong>
                <span class="badge bg-${isExcluded ? 'secondary' : 'success'} ms-2">
                    ${isExcluded ? 'Excluded from Periodical Profit' : 'Included in Periodical Profit'}
                </span>
            </div>
            <div class="d-flex align-items-center gap-2">
                <button class="btn btn-sm btn-outline-primary edit-type-btn" data-name="${typeName}" title="Edit"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger remove-type-btn" data-idx="${idx}" title="Remove"><i class="bi bi-trash"></i></button>
            </div>
        </div>
        `;
    }).join('');

    // Edit type
    container.querySelectorAll('.edit-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const name = btn.getAttribute('data-name');
            const idx = investmentData.metadata.investment_types.findIndex(t => t.name === name);
            openEditTypeModal(idx);
        });
    });
    // Remove type
    container.querySelectorAll('.remove-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.getAttribute('data-idx'));
            if (confirm('Are you sure you want to remove this investment type?')) {
                investmentData.metadata.investment_types.splice(idx, 1);
                renderInvestmentTypesConfig();
            }
        });
    });
}

// Edit type modal form submit
if (document.getElementById('editTypeForm')) {
    document.getElementById('editTypeForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const idx = parseInt(document.getElementById('editTypeIdx').value);
        const name = document.getElementById('editTypeName').value.trim();
        const exclude = document.getElementById('editTypeExclude').checked;
        if (!name) return;
        if (idx === -1) {
            // Add new type
            investmentData.metadata.investment_types.push({ name, exclude_periodical_profit: exclude });
        } else {
            // Edit existing type
            const oldName = investmentData.metadata.investment_types[idx].name;
            if (oldName !== name) {
                // Update all investments with the old type name
                investmentData.investments.forEach(inv => {
                    if (inv.investment_type === oldName) {
                        inv.investment_type = name;
                    }
                });
            }
            investmentData.metadata.investment_types[idx].name = name;
            investmentData.metadata.investment_types[idx].exclude_periodical_profit = exclude;
        }
        await saveData(getToken());
        renderInvestmentTypesConfig();
        bootstrap.Modal.getInstance(document.getElementById('editTypeModal')).hide();
    });
}

function openEditTypeModal(idx) {
    const type = investmentData.metadata.investment_types[idx];
    if (!type) return;
    document.getElementById('editTypeName').value = type.name || '';
    document.getElementById('editTypeExclude').checked = !!type.exclude_periodical_profit;
    document.getElementById('editTypeIdx').value = idx;
    setTimeout(() => {
        const modal = new bootstrap.Modal(document.getElementById('editTypeModal'));
        modal.show();
    }, 50);
}

function migrateInvestmentTypes() {
    if (investmentData.metadata && Array.isArray(investmentData.metadata.investment_types)) {
        investmentData.metadata.investment_types = investmentData.metadata.investment_types.map((type, i) => {
            if (typeof type === 'string') {
                return { name: type, exclude_periodical_profit: true };
            } else if (typeof type === 'object' && type !== null) {
                if (!type.name || typeof type.name !== 'string') {
                    return { ...type, name: `unknown_type_${i}`, exclude_periodical_profit: true };
                }
                // Robustly coerce exclude_periodical_profit to boolean (true or 'true' only)
                return { ...type, exclude_periodical_profit: (type.exclude_periodical_profit === true || type.exclude_periodical_profit === 'true') };
            } else {
                return { name: `unknown_type_${i}`, exclude_periodical_profit: true };
            }
        });
    }
} 