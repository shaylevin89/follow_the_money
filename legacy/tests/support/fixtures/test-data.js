/**
 * Test data fixtures
 * Reusable test data for use across tests
 */

export const sampleInvestmentData = {
  version: "1.0",
  lastUpdated: new Date().toISOString(),
  investments: [
    {
      id: 1,
      name: "Test Stock",
      type: "stock",
      initial_amount: 1000,
      current_amount: 1200,
      currency: "USD",
      start_date: "2024-01-01",
      is_active: true,
      is_liquid: true,
      profit_type: "price",
    },
    {
      id: 2,
      name: "Test Loan",
      type: "loan",
      initial_amount: 5000,
      current_amount: 5000,
      currency: "ILS",
      start_date: "2024-01-01",
      is_active: true,
      is_liquid: false,
      profit_type: "commission",
      profit_rate: 5.5,
    },
  ],
  portfolio_snapshots: [],
  metadata: {
    currencies: ["ILS", "USD"],
    profit_types: ["price", "commission", "other"],
    investment_types: [
      { name: "stock", exclude_periodical_profit: false },
      { name: "loan", exclude_periodical_profit: false },
    ],
  },
};

export const emptyInvestmentData = {
  version: "1.0",
  lastUpdated: new Date().toISOString(),
  investments: [],
  portfolio_snapshots: [],
  metadata: {
    currencies: ["ILS", "USD"],
    profit_types: ["price", "commission", "other"],
    investment_types: [],
  },
};
