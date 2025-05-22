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

// Helper to check if type is a loan
function isLoanType(type) {
    return typeof type === 'string' && type.toLowerCase().includes('loan');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const token = getTokenFromUrl();
    if (!token) {
        showTokenInput();
    } else {
        loadData(token);
        setupForm();
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

        const type = document.getElementById('investmentType').value;
        let profitRate = null;
        if (isLoanType(type)) {
            profitRate = parseFloat(document.getElementById('profitRate').value);
            if (isNaN(profitRate)) {
                document.getElementById('profitRate').focus();
                return;
            }
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

        investmentData.investments.push(newInvestment);
        await saveData(getTokenFromUrl());
        renderInvestments();
        
        // Reset form
        form.reset();
        form.classList.remove('was-validated');
        document.getElementById('profitRateGroup').style.display = 'none';
    });
}

// Load data from GitHub
async function loadData(token) {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${DATA_FILE}?t=${Date.now()}`);
        if (response.ok) {
            investmentData = await response.json();
        }
        renderInvestments();
        await updateDashboard();
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
        
        // Update dashboard after successful save
        await updateDashboard();
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
        updateDashboard();
        return;
    }

    container.innerHTML = investmentData.investments.map(investment => {
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
                    </div>
                    <div class="text-muted small">
                        ${investment.investment_type} • Started ${new Date(investment.start_date).toLocaleDateString()}
                        ${investment.liquidity_date ? `• Liquid on ${new Date(investment.liquidity_date).toLocaleDateString()}` : ''}
                    </div>
                    ${investment.notes ? `<div class="text-muted small mt-1"><i class='bi bi-sticky'></i> ${investment.notes}</div>` : ''}
                    <div class="mt-2">
                        <strong>Profit:</strong> ${profitAmount === 'N/A' ? 'N/A' : (investment.currency === 'USD' ? '$' : '₪') + profitAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}
                        <span class="text-muted small ms-2">Rate: ${profitRate === 'N/A' ? 'N/A' : profitRate.toFixed(2) + '%'}</span>
                        <span class="text-muted small ms-2">Yearly: ${profitRateYearly === 'N/A' ? 'N/A' : profitRateYearly + '%'}</span>
                        <span class="text-muted small ms-2">Monthly: ${profitRateMonthly === 'N/A' ? 'N/A' : (typeof profitRateMonthly === 'number' ? profitRateMonthly.toFixed(2) : profitRateMonthly) + '%'}</span>
                    </div>
                </div>
                <div class="text-end">
                    <div class="amount">${investment.currency === 'USD' ? '$' : '₪'}${investment.current_amount.toLocaleString()}</div>
                    <div class="text-muted small">Initial: ${investment.currency === 'USD' ? '$' : '₪'}${investment.initial_amount.toLocaleString()}</div>
                    <div class="mt-2 d-flex gap-2 justify-content-end">
                        <button class="btn btn-sm btn-outline-primary edit-investment-btn" data-id="${investment.id}" title="Edit"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger delete-investment-btn" data-id="${investment.id}" title="Delete"><i class="bi bi-trash"></i></button>
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
    document.getElementById('editInvestmentId').value = investment.id;
    document.getElementById('editCurrentAmount').value = investment.current_amount;
    document.getElementById('editIsActive').checked = investment.is_active;
    document.getElementById('editIsLiquid').checked = investment.is_liquid;
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
            const id = document.getElementById('editInvestmentId').value;
            const investment = investmentData.investments.find(inv => inv.id === id);
            if (!investment) return;
            const newAmount = parseFloat(document.getElementById('editCurrentAmount').value);
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
            investment.liquidity_date = document.getElementById('editLiquidityDate').value || (investment.is_liquid ? investment.start_date : null);
            // Profit rate logic
            if (isLoanType(investment.investment_type)) {
                const rate = parseFloat(document.getElementById('editProfitRate').value);
                if (isNaN(rate)) {
                    document.getElementById('editProfitRate').focus();
                    return;
                }
                investment.profit_rate = rate;
            } else {
                delete investment.profit_rate;
            }
            investment.notes = document.getElementById('editNotes').value;
            await saveData(getTokenFromUrl());
            renderInvestments();
            bootstrap.Modal.getInstance(document.getElementById('editInvestmentModal')).hide();
        });
    }
});

function deleteInvestment(id) {
    investmentData.investments = investmentData.investments.filter(inv => inv.id !== id);
    (async () => {
        await saveData(getTokenFromUrl());
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
        activeInvestments.forEach(inv => {
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
                // Sort updates by date
                const updatesSorted = inv.updates.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
                const last = updatesSorted[updatesSorted.length - 1];
                const prev = updatesSorted[updatesSorted.length - 2];
                const lastDate = new Date(last.date);
                const prevDate = new Date(prev.date);
                const days = (lastDate - prevDate) / (1000 * 60 * 60 * 24);
                if (days > 30) {
                    profit = (last.amount - prev.amount) / (days / 30);
                } else {
                    const beforePrev = updatesSorted.length >= 3 ? updatesSorted[updatesSorted.length - 3] : null;
                    if (!beforePrev) {
                        profit = last.amount - prev.amount;
                    } else {
                        const beforePrevDate = new Date(beforePrev.date);
                        const days2 = (lastDate - beforePrevDate) / (1000 * 60 * 60 * 24);
                        if (days2 > 30) {
                            profit = (last.amount - beforePrev.amount) / (days2 / 30);
                        } else {
                            profit = last.amount - beforePrev.amount;
                        }
                    }
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
        activeInvestments.forEach(inv => {
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
                const updatesSorted = inv.updates.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
                const last = updatesSorted[updatesSorted.length - 1];
                const prev = updatesSorted[updatesSorted.length - 2];
                const lastDate = new Date(last.date);
                const prevDate = new Date(prev.date);
                const days = (lastDate - prevDate) / (1000 * 60 * 60 * 24);
                if (days > 365) {
                    profit = (last.amount - prev.amount) / (days / 365);
                } else {
                    const beforePrev = updatesSorted.length >= 3 ? updatesSorted[updatesSorted.length - 3] : null;
                    if (!beforePrev) {
                        profit = last.amount - prev.amount;
                    } else {
                        const beforePrevDate = new Date(beforePrev.date);
                        const days2 = (lastDate - beforePrevDate) / (1000 * 60 * 60 * 24);
                        if (days2 > 365) {
                            profit = (last.amount - beforePrev.amount) / (days2 / 365);
                        } else {
                            profit = last.amount - beforePrev.amount;
                        }
                    }
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
                backgroundColor: ['#198754', '#ffc107'],
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
    const ctx = document.getElementById('typeChart').getContext('2d');
    // Remove previous chart instance if exists
    if (window.typeChartInstance) {
        window.typeChartInstance.destroy();
    }
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
    window.typeChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: sortedTypes.map(([type, total]) => `${type} (₪${formatNumber(total)})`),
            datasets: [{
                data: sortedTypes.map(([,total]) => total),
                backgroundColor: [
                    '#198754', // green
                    '#0d6efd', // blue
                    '#ffc107', // yellow
                    '#dc3545', // red
                    '#6f42c1', // purple
                    '#fd7e14', // orange
                    '#20c997', // teal
                    '#0dcaf0', // cyan
                    '#6610f2'  // indigo
                ],
                borderColor: '#fff',
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
                            const total = sortedTypes.reduce((sum, [,val]) => sum + val, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${percentage}% of total value`;
                        }
                    }
                }
            }
        }
    });
} 