import { get, put } from '@vercel/blob';
import { timingSafeEqual } from 'node:crypto';
import { SEED_REPORTS } from './_seed.js';

const norm = s => String(s || '').trim().toUpperCase();
function same(a, b) {
  const x = Buffer.from(norm(a)), y = Buffer.from(norm(b));
  return x.length > 0 && x.length === y.length && timingSafeEqual(x, y);
}
export function codeRole(code) {
  if (process.env.ADMIN_CODE && same(code, process.env.ADMIN_CODE)) return 'admin';
  if (process.env.PATRON_CODE && same(code, process.env.PATRON_CODE)) return 'patron';
  return null;
}
export function cookie(req, name) {
  const h = req.headers.get('cookie') || '';
  for (const part of h.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}
export const roleOf = req => codeRole(cookie(req, 'scm'));
export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers },
  });
}
export async function readJSON(pathname) {
  const r = await get(pathname, { access: 'private', useCache: false });
  if (!r || r.statusCode !== 200 || !r.stream) return null;
  try { return JSON.parse(await new Response(r.stream).text()); } catch { return null; }
}
export function writeJSON(pathname, data, overwrite = true) {
  return put(pathname, JSON.stringify(data), {
    access: 'private', contentType: 'application/json',
    addRandomSuffix: false, allowOverwrite: overwrite, cacheControlMaxAge: 60,
  });
}
// One-time copy of the reports that were already sent on the claude.ai version.
export async function seedOnce() {
  if (await readJSON('meta/seeded.json')) return;
  for (const r of SEED_REPORTS) {
    if (!(await readJSON(`reports/${r.id}.json`))) await writeJSON(`reports/${r.id}.json`, r, false);
  }
  await writeJSON('meta/seeded.json', { at: new Date().toISOString() });
}
