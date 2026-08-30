
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,          -- PBKDF2: iterations$salt$hash (base64)
  must_change_password INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,               -- 256-bit random, hex
  user_id INTEGER NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL              -- sliding 90 days
);

CREATE TABLE assets (
  id TEXT PRIMARY KEY,                  -- keeps existing ids from data.json
  name TEXT NOT NULL,
  investment_type TEXT NOT NULL,
  currency TEXT NOT NULL,
  start_date TEXT NOT NULL,
  initial_amount REAL NOT NULL,
  profit_type TEXT NOT NULL,
  profit_rate REAL,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_liquid INTEGER NOT NULL DEFAULT 0,
  liquidity_date TEXT,
  track_profit INTEGER NOT NULL DEFAULT 0,
  staleness_reminder INTEGER NOT NULL DEFAULT 1,
  notes TEXT NOT NULL DEFAULT '',
  deleted_at TEXT,                      -- soft delete
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE asset_updates (            -- INSERT-ONLY, never UPDATE/DELETE
  id INTEGER PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES assets(id),
  date TEXT NOT NULL,                   -- YYYY-MM-DD (value effective date)
  amount REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by INTEGER REFERENCES users(id)
);
CREATE INDEX idx_updates_asset_date ON asset_updates(asset_id, date, id);

CREATE TABLE investment_types (
  name TEXT PRIMARY KEY,
  exclude_periodical_profit INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE login_attempts (           -- rate limiting
  ip TEXT NOT NULL,
  attempted_at TEXT NOT NULL
);
