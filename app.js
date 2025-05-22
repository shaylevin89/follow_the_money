// Configuration
const REPO_OWNER = 'shaylevin89';
const REPO_NAME = 'follow_the_money';
const DATA_FILE = 'data.json';

// Get token from URL parameters
function getTokenFromUrl() {
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
        investment_types: [
            "stocks",
            "real_estate_loan",
            "crypto_miners",
            "whiskey",
            "pension",
            "company_shares",
            "gov_funds",
            "crypto",
            "bank"
        ]
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const token = getTokenFromUrl();
    if (!token) {
        showTokenInput();
    } else {
        loadData(token);
        setupForm();
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
    
    // Form validation
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!form.checkValidity()) {
            e.stopPropagation();
            form.classList.add('was-validated');
            return;
        }

        const newInvestment = {
            id: Date.now().toString(),
            name: document.getElementById('investmentName').value,
            is_active: document.getElementById('isActive').checked,
            start_date: document.getElementById('startDate').value,
            end_date: null,
            initial_amount: parseFloat(document.getElementById('initialAmount').value),
            currency: document.getElementById('currency').value,
            current_amount: parseFloat(document.getElementById('initialAmount').value),
            profit_type: document.getElementById('profitType').value,
            notes: document.getElementById('notes').value,
            is_liquid: document.getElementById('isLiquid').checked,
            investment_type: document.getElementById('investmentType').value,
            liquidity_date: document.getElementById('liquidityDate').value || null,
            updates: [
                {
                    date: document.getElementById('startDate').value,
                    amount: parseFloat(document.getElementById('initialAmount').value)
                }
            ]
        };

        investmentData.investments.push(newInvestment);
        await saveData(getTokenFromUrl());
        renderInvestments();
        
        // Reset form
        form.reset();
        form.classList.remove('was-validated');
    });
}

// Load data from GitHub
async function loadData(token) {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${DATA_FILE}`);
        if (response.ok) {
            investmentData = await response.json();
        }
        renderInvestments();
    } catch (error) {
        console.error('Error loading data:', error);
        renderInvestments();
    }
}

// Save data to GitHub
async function saveData(token) {
    if (!token || !REPO_OWNER || !REPO_NAME) {
        alert('Please provide a valid GitHub token');
        return;
    }

    try {
        // Get current file SHA
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

        if (!response.ok) throw new Error('Failed to save data');
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving data. Please check console for details.');
    }
}

// Render investment list
function renderInvestments() {
    const container = document.getElementById('investmentList');
    if (!investmentData.investments || investmentData.investments.length === 0) {
        container.innerHTML = '<div class="text-center text-muted">No investments added yet</div>';
        return;
    }

    container.innerHTML = investmentData.investments.map(investment => `
        <div class="investment-item">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <div class="d-flex align-items-center">
                        <strong>${investment.name}</strong>
                        <span class="badge bg-${investment.is_active ? 'success' : 'secondary'} ms-2">
                            ${investment.is_active ? 'Active' : 'Inactive'}
                        </span>
                        ${!investment.is_liquid ? '<span class="badge bg-warning ms-2">Illiquid</span>' : ''}
                    </div>
                    <div class="text-muted small">
                        ${investment.investment_type} • Started ${new Date(investment.start_date).toLocaleDateString()}
                        ${investment.liquidity_date ? `• Liquid on ${new Date(investment.liquidity_date).toLocaleDateString()}` : ''}
                    </div>
                    ${investment.notes ? `<div class="text-muted small mt-1">${investment.notes}</div>` : ''}
                </div>
                <div class="text-end">
                    <div class="amount">${investment.currency === 'USD' ? '$' : '₪'}${investment.current_amount.toLocaleString()}</div>
                    <div class="text-muted small">Initial: ${investment.currency === 'USD' ? '$' : '₪'}${investment.initial_amount.toLocaleString()}</div>
                </div>
            </div>
        </div>
    `).join('');
} 