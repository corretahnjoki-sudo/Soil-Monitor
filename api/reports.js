import { list, del } from '@vercel/blob';
import { roleOf, json, readJSON, writeJSON, seedOnce } from './_lib.js';

const okId = id => typeof id === 'string' && /^r[a-z0-9]{4,40}$/.test(id);
const pathOf = id => `reports/${id}.json`;
const ADMIN_ONLY = ['reviewed', 'reviewedAt', 'adminNote', 'editedAt', 'editLog'];

async function allReports() {
  const blobs = [];
  let cursor;
  do {
    const r = await list({ prefix: 'reports/', cursor, limit: 1000 });
    blobs.push(...r.blobs);
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  const docs = await Promise.all(blobs.map(b => readJSON(b.pathname)));
  return docs.filter(Boolean);
}
function cleanPhotos(ids) {
  return Array.isArray(ids) ? ids.filter(p => typeof p === 'string' && p.startsWith('photos/') && !p.includes('..')).slice(0, 6) : [];
}
async function body(req) {
  const text = await req.text();
  if (text.length > 200000) throw Object.assign(new Error('too large'), { status: 413 });
  const b = JSON.parse(text);
  if (!b || typeof b !== 'object' || Array.isArray(b)) throw Object.assign(new Error('bad'), { status: 400 });
  return b;
}

export default {
  async fetch(req) {
    const role = roleOf(req);
    if (!role) return json({ error: 'Sign in first' }, 401);
    const id = new URL(req.url).searchParams.get('id');
    try {
      if (req.method === 'GET') {
        if (role === 'admin') { await seedOnce(); return json(await allReports()); }
        const dev = req.headers.get('x-device') || '';
        return json(dev ? (await allReports()).filter(r => r.by === dev) : []);
      }
      if (req.method === 'POST') {
        const rec = await body(req);
        if (!okId(rec.id)) return json({ error: 'Bad report id' }, 400);
        if (await readJSON(pathOf(rec.id))) return json({ ok: true, duplicate: true });
        if (role !== 'admin') for (const k of ADMIN_ONLY) delete rec[k];
        rec.reviewed = false;
        rec.by = req.headers.get('x-device') || rec.by || null;
        rec.photoIds = cleanPhotos(rec.photoIds);
        rec.receivedAt = new Date().toISOString();
        await writeJSON(pathOf(rec.id), rec, false);
        return json({ ok: true }, 201);
      }
      if (role !== 'admin') return json({ error: 'Only the coordinator can change reports' }, 403);
      if (!okId(id)) return json({ error: 'Bad report id' }, 400);
      if (req.method === 'PATCH') {
        const cur = await readJSON(pathOf(id));
        if (!cur) return json({ error: 'Not found' }, 404);
        const upd = await body(req);
        if ('photoIds' in upd) upd.photoIds = cleanPhotos(upd.photoIds);
        await writeJSON(pathOf(id), { ...cur, ...upd, id });
        return json({ ok: true });
      }
      if (req.method === 'DELETE') {
        const { blobs } = await list({ prefix: pathOf(id), limit: 5 });
        const hit = blobs.filter(b => b.pathname === pathOf(id)).map(b => b.url);
        if (hit.length) await del(hit);
        return json({ ok: true });
      }
      return json({ error: 'Method not allowed' }, 405);
    } catch (e) {
      return json({ error: e.status ? e.message : 'Server error' }, e.status || 500);
    }
  },
};
