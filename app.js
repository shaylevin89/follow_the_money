// Configuration - Replace these with your values
const GITHUB_TOKEN = ''; // Your GitHub token
const REPO_OWNER = ''; // Your GitHub username
const REPO_NAME = ''; // Your repository name
const DATA_FILE = 'data.json';

// State
let incomeData = {
    incomes: [],
    lastUpdated: new Date().toISOString()
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupForm();
});

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

        await saveData();
        renderIncomes();
        e.target.reset();
    });
}

// Load data from GitHub
async function loadData() {
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
async function saveData() {
    if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
        alert('Please configure GitHub credentials in app.js');
        return;
    }

    try {
        // Get current file SHA
        const getFileResponse = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_FILE}`,
            {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
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
                    'Authorization': `token ${GITHUB_TOKEN}`,
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