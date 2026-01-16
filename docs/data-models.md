# Data Models

## Investment Data Schema

The application uses a JSON-based data model stored in `data.json` and synchronized with GitHub.

### Root Structure

```json
{
  "version": "1.0",
  "lastUpdated": "ISO 8601 timestamp",
  "investments": [/* Investment objects */],
  "metadata": {
    "currencies": ["ILS", "USD"],
    "profit_types": ["price", "commission", "other"],
    "investment_types": [/* Investment type objects */]
  }
}
```

### Investment Object

```json
{
  "id": "string (timestamp-based)",
  "name": "string",
  "is_active": "boolean",
  "is_static": "boolean",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD or null",
  "initial_amount": "number",
  "currency": "ILS | USD",
  "current_amount": "number",
  "profit_type": "price | commission | other",
  "notes": "string",
  "is_liquid": "boolean",
  "investment_type": "string",
  "liquidity_date": "YYYY-MM-DD or null",
  "updates": [
    {
      "date": "YYYY-MM-DD",
      "amount": "number"
    }
  ],
  "profit_rate": "number (optional, for loan types)"
}
```

### Investment Type Object

```json
{
  "name": "string",
  "exclude_periodical_profit": "boolean"
}
```

### Update Object

```json
{
  "date": "YYYY-MM-DD",
  "amount": "number"
}
```

## Data Relationships

- **Investments** → **Updates**: One-to-many (investment has multiple update records)
- **Investments** → **Investment Types**: Many-to-one (via `investment_type` string reference)
- **Metadata** → **Investment Types**: Contains array of available types

## Data Storage

- **Primary:** `data.json` file in repository root
- **Persistence:** GitHub API for remote storage
- **Local State:** `investmentData` JavaScript object in memory
