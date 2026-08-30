// Route mocks for the GitHub Contents API and the exchange-rate API.

export function e2eData() {
  return {
    version: '1.0',
    lastUpdated: '2024-03-20T12:00:00Z',
    investments: [
      {
        id: 'usa1',
        name: 'USA Real Estate Loan 1',
        is_active: true,
        track_profit: true,
        start_date: '2017-12-04',
        end_date: null,
        initial_amount: 35000,
        currency: 'USD',
        current_amount: 35000,
        profit_type: 'commission',
        notes: '',
        is_liquid: false,
        investment_type: 'real_estate_loan',
        liquidity_date: null,
        updates: [{ date: '2017-12-04', amount: 35000 }],
        profit_rate: 6.75,
      },
      {
        id: 'fund1',
        name: 'Training Fund A',
        is_active: true,
        track_profit: true,
        start_date: '2020-01-01',
        end_date: null,
        initial_amount: 10000,
        currency: 'ILS',
        current_amount: 13000,
        profit_type: 'price',
        notes: '',
        is_liquid: true,
        investment_type: 'Training_fund',
        liquidity_date: null,
        updates: [
          { date: '2020-01-01', amount: 10000 },
          // Duplicate date: legacy data contains these; detail view must not crash.
          { date: '2022-01-01', amount: 12500 },
          { date: '2022-01-01', amount: 13000 },
        ],
      },
    ],
    metadata: {
      currencies: ['ILS', 'USD'],
      profit_types: ['price', 'commission', 'other'],
      investment_types: [
        { name: 'real_estate_loan', exclude_periodical_profit: false },
        { name: 'Training_fund', exclude_periodical_profit: false },
        { name: 'stocks', exclude_periodical_profit: false },
      ],
    },
  };
}

function b64utf8(str) {
  return Buffer.from(str, 'utf-8').toString('base64');
}

export function decodeContent(b64) {
  return JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
}

// Installs GitHub + rates mocks. Returns a recorder of PUT payloads.
export async function installMocks(page, { data = e2eData(), failFirstPutWith } = {}) {
  const puts = [];
  let sha = 'sha-0';
  let current = data;
  let putCount = 0;

  await page.route('https://api.exchangerate-api.com/**', (route) =>
    route.fulfill({ json: { rates: { ILS: 3.5 } } })
  );

  await page.route('https://api.github.com/repos/**/contents/data.json', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      await route.fulfill({
        json: {
          content: b64utf8(JSON.stringify(current)),
          sha,
          size: 1000,
        },
      });
      return;
    }
    if (request.method() === 'PUT') {
      putCount += 1;
      if (failFirstPutWith && putCount === 1) {
        await route.fulfill({
          status: failFirstPutWith,
          json: { message: 'data.json does not match sha' },
        });
        return;
      }
      const body = request.postDataJSON();
      puts.push(body);
      current = decodeContent(body.content);
      sha = `sha-${puts.length}`;
      await route.fulfill({
        json: { content: { sha }, commit: { sha: `commit-${puts.length}` } },
      });
      return;
    }
    await route.fallback();
  });

  await page.addInitScript(() => {
    window.localStorage.setItem('ftm_github_token', 'e2e-token');
  });

  return { puts, currentData: () => current };
}
