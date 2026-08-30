// Route mocks for the D1-backed /api/* backend and the exchange-rate API.

export function e2eData() {
  return {
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
        staleness_reminder: true,
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
        staleness_reminder: true,
        updates: [
          { date: '2020-01-01', amount: 10000 },
          // Duplicate date: legacy data can contain these. The real backend's
          // /api/portfolio query dedupes updates per (asset_id, date), keeping
          // the latest insert — installApiMocks() below applies the same
          // dedup before serving, so this duplicate exercises that behavior
          // without the detail view crashing on it.
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

// Dedupes an investment's updates by date (latest entry for a date wins),
// mirroring the real /api/portfolio backend, and derives current_amount
// from the resulting (sorted) list.
function dedupeInvestment(inv) {
  const byDate = new Map();
  for (const u of inv.updates || []) byDate.set(u.date, u.amount);
  const updates = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));
  const current_amount = updates.length > 0 ? updates.at(-1).amount : inv.initial_amount;
  return { ...inv, updates, current_amount };
}

// Installs mocks for the /api/* backend + the exchange-rate API. Returns
// `{ posted, currentData }` — `posted` records the bodies of every mutating
// request so specs can assert on exactly what was sent to the server.
export async function installApiMocks(
  page,
  { data = e2eData(), loggedIn = true, mustChangePassword = false } = {}
) {
  let authed = loggedIn;
  let requiresPasswordChange = mustChangePassword;
  let investments = data.investments.map(dedupeInvestment);
  let metadata = structuredClone(data.metadata);
  const posted = { assets: [], updates: [], patches: [] };

  await page.route('https://api.exchangerate-api.com/**', (route) =>
    route.fulfill({ json: { rates: { ILS: 3.5 } } })
  );

  await page.route('**/api/me', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    if (authed) {
      await route.fulfill({ json: { username: 'shay', mustChangePassword: requiresPasswordChange } });
    } else {
      await route.fulfill({ status: 401, json: { error: 'unauthorized' } });
    }
  });

  await page.route('**/api/login', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    const { username, password } = route.request().postDataJSON() || {};
    if (username === 'shay' && password === 'test1234') {
      authed = true;
      await route.fulfill({ json: { ok: true, mustChangePassword: requiresPasswordChange } });
    } else {
      await route.fulfill({ status: 401, json: { error: 'Invalid username or password' } });
    }
  });

  await page.route('**/api/logout', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    authed = false;
    await route.fulfill({ json: { ok: true } });
  });

  await page.route('**/api/password', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    requiresPasswordChange = false;
    await route.fulfill({ json: { ok: true } });
  });

  await page.route('**/api/portfolio', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    if (!authed) return route.fulfill({ status: 401, json: { error: 'unauthorized' } });
    await route.fulfill({ json: { investments, metadata } });
  });

  await page.route('**/api/assets', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    const fields = route.request().postDataJSON();
    posted.assets.push(fields);
    const id = String(Date.now());
    const initialAmount = Number(fields.initial_amount);
    const investment = {
      id,
      name: fields.name,
      is_active: fields.is_active !== false,
      track_profit: !!fields.track_profit,
      start_date: fields.start_date,
      end_date: null,
      initial_amount: initialAmount,
      currency: fields.currency,
      current_amount: initialAmount,
      profit_type: fields.profit_type,
      notes: fields.notes || '',
      is_liquid: !!fields.is_liquid,
      investment_type: fields.investment_type,
      liquidity_date: fields.liquidity_date || null,
      staleness_reminder: fields.staleness_reminder !== false,
      updates: [{ date: fields.start_date, amount: initialAmount }],
    };
    if (fields.profit_rate !== undefined && fields.profit_rate !== '') {
      investment.profit_rate = Number(fields.profit_rate);
    }
    investments = [...investments, investment];
    await route.fulfill({ json: investment });
  });

  await page.route('**/api/assets/*', async (route) => {
    const request = route.request();
    const id = decodeURIComponent(new URL(request.url()).pathname.split('/').pop());
    if (request.method() === 'PATCH') {
      const fields = request.postDataJSON();
      posted.patches.push({ id, fields });
      investments = investments.map((inv) => (inv.id === id ? { ...inv, ...fields } : inv));
      await route.fulfill({ json: { ok: true } });
      return;
    }
    if (request.method() === 'DELETE') {
      investments = investments.filter((inv) => inv.id !== id);
      await route.fulfill({ json: { ok: true } });
      return;
    }
    await route.fallback();
  });

  await page.route('**/api/updates', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    const items = route.request().postDataJSON();
    posted.updates.push(items);
    for (const { asset_id, date, amount } of items) {
      investments = investments.map((inv) => {
        if (inv.id !== asset_id) return inv;
        const updates = inv.updates
          .filter((u) => u.date !== date)
          .concat([{ date, amount }])
          .sort((a, b) => a.date.localeCompare(b.date));
        return { ...inv, updates, current_amount: updates.at(-1).amount };
      });
    }
    await route.fulfill({ json: { inserted: items.length } });
  });

  await page.route('**/api/types', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    const { name, exclude_periodical_profit } = route.request().postDataJSON();
    metadata = {
      ...metadata,
      investment_types: [
        ...metadata.investment_types,
        { name, exclude_periodical_profit: !!exclude_periodical_profit },
      ],
    };
    await route.fulfill({ json: { ok: true } });
  });

  await page.route('**/api/types/*', async (route) => {
    const request = route.request();
    if (request.method() !== 'PATCH') return route.fallback();
    const name = decodeURIComponent(new URL(request.url()).pathname.split('/').pop());
    const fields = request.postDataJSON();
    metadata = {
      ...metadata,
      investment_types: metadata.investment_types.map((t) =>
        t.name === name ? { ...t, ...fields } : t
      ),
    };
    await route.fulfill({ json: { ok: true } });
  });

  return {
    posted,
    currentData: () => ({ investments, metadata }),
  };
}
