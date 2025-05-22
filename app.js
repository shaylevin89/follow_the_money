// Configuration
const REPO_OWNER = 'shaylevin89'; // Your GitHub username
const REPO_NAME = 'follow_the_money'; // Your repository name
const DATA_FILE = 'data.json';

// Get token from URL parameters
function getTokenFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
}

// State
let incomeData = {
    incomes: [],
    lastUpdated: new Date().toISOString()
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
        // Add token to URL and reload
        window.location.href = `${window.location.pathname}?token=${token}`;
    });
}

// Setup form submission
function setupForm() {
    document.getElementById('incomeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('incomeName').value;
        const amount = parseFloat(document.getElementById('incomeAmount').value);
        
        if (!name || isNaN(amount)) {
            alert('Please fill in all fields correctly');
            return;
        }

        incomeData.incomes.push({
            id: Date.now(),
            name,
            amount,
            date: new Date().toISOString()
        });

        await saveData(getTokenFromUrl());
        renderIncomes();
        e.target.reset();
    });
}

// Load data from GitHub
async function loadData(token) {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${DATA_FILE}`);
        if (response.ok) {
            incomeData = await response.json();
        }
        renderIncomes();
    } catch (error) {
        console.error('Error loading data:', error);
        renderIncomes();
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
        const content = btoa(JSON.stringify(incomeData, null, 2));
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
                    message: 'Update income data',
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

// Render income list
function renderIncomes() {
    const container = document.getElementById('incomeList');
    if (!incomeData.incomes || incomeData.incomes.length === 0) {
        container.innerHTML = '<div class="text-center text-muted">No incomes added yet</div>';
        return;
    }

    container.innerHTML = incomeData.incomes.map(income => `
        <div class="income-item">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${income.name}</strong>
                    <div class="text-muted small">${new Date(income.date).toLocaleDateString()}</div>
                </div>
                <div class="income-amount">$${income.amount.toFixed(2)}</div>
            </div>
        </div>
    `).join('');
} 