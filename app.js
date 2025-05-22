// Configuration
const REPO_OWNER = 'shaylevin89'; // Your GitHub username
const REPO_NAME = 'follow_the_money'; // Your repository name
const DATA_FILE = 'data.json';
const CLIENT_ID = 'Ov23liwJ0KWVUo1VftpR'; // You'll need to add your OAuth App's client ID here

// State
let incomeData = {
    incomes: [],
    lastUpdated: new Date().toISOString()
};

let accessToken = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're returning from OAuth
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
        // Remove the code from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        exchangeCodeForToken(code);
    } else {
        // Check if we have a stored token
        const storedToken = sessionStorage.getItem('github_token');
        if (storedToken) {
            accessToken = storedToken;
            showApp();
        } else {
            showLogin();
        }
    }
});

// Show login screen
function showLogin() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('appSection').style.display = 'none';
    document.getElementById('loginButton').addEventListener('click', initiateOAuth);
}

// Show main app
function showApp() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('appSection').style.display = 'block';
    loadData();
    setupForm();
}

// Initiate OAuth flow
function initiateOAuth() {
    const redirectUri = window.location.origin + window.location.pathname;
    const scope = 'repo';
    const state = generateRandomString();
    
    // Store state for verification
    sessionStorage.setItem('oauth_state', state);
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
    window.location.href = authUrl;
}

// Exchange code for token
async function exchangeCodeForToken(code) {
    try {
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                code: code
            })
        });

        const data = await response.json();
        if (data.access_token) {
            accessToken = data.access_token;
            sessionStorage.setItem('github_token', accessToken);
            showApp();
        } else {
            throw new Error('Failed to get access token');
        }
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        alert('Failed to authenticate. Please try again.');
        showLogin();
    }
}

// Generate random string for state parameter
function generateRandomString() {
    return Math.random().toString(36).substring(2, 15);
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
    if (!accessToken) {
        alert('Not authenticated. Please log in again.');
        showLogin();
        return;
    }

    try {
        // Get current file SHA
        const getFileResponse = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_FILE}`,
            {
                headers: {
                    'Authorization': `token ${accessToken}`,
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
                    'Authorization': `token ${accessToken}`,
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