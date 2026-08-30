#!/usr/bin/env node
// Generates a random temporary password for a new user, hashes it with the
// same PBKDF2 scheme functions/lib/auth.js uses, and prints an
// INSERT OR REPLACE statement to stdout. The plaintext temp password is
// printed to stderr ONLY (never stdout, never written to the SQL file) so it
// doesn't end up in migration.sql or shell redirection targets meant for SQL.
//
// Usage: node scripts/seed-user.mjs <username>

import { hashPassword } from '../functions/lib/auth.js';

const TEMP_PASSWORD_LENGTH = 12;
const TEMP_PASSWORD_ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'; // no 0/O/1/l/I to avoid ambiguity

function generateTempPassword(length = TEMP_PASSWORD_LENGTH) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = '';
  for (const b of bytes) {
    out += TEMP_PASSWORD_ALPHABET[b % TEMP_PASSWORD_ALPHABET.length];
  }
  return out;
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function main() {
  const username = process.argv[2];
  if (!username) {
    process.stderr.write('Usage: node scripts/seed-user.mjs <username>\n');
    process.exit(1);
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const sql = `INSERT OR REPLACE INTO users (username, password_hash, must_change_password) VALUES (${sqlString(
    username
  )}, ${sqlString(passwordHash)}, 1);\n`;

  process.stdout.write(sql);
  process.stderr.write(`${username}:${tempPassword}\n`);
}

main();
