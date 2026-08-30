import { SCHEMA } from '../../functions/lib/schema.js';

// Applies the D1 schema to a test database. Grows with more test helpers
// as later tasks add API/auth workers tests.
export async function applySchema(db) {
  for (const stmt of SCHEMA.split(';').map((s) => s.trim()).filter(Boolean)) {
    await db.prepare(stmt).run();
  }
}
