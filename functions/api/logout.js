import { destroySession, clearSessionCookie, json } from '../lib/auth.js';

export async function onRequestPost({ request, env }) {
  await destroySession(env.DB, request);
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() });
}
