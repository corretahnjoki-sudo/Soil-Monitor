import { roleOf, json, readJSON, writeJSON } from './_lib.js';
import { SEED_CONFIG } from './_seed.js';

const NAMES = { main: 'docs/main.json', notes: 'docs/notes.json' };

export default {
  async fetch(req) {
    const role = roleOf(req);
    if (!role) return json({ error: 'Sign in first' }, 401);
    const name = new URL(req.url).searchParams.get('name');
    const path = NAMES[name];
    if (!path) return json({ error: 'Unknown document' }, 400);
    if (req.method === 'GET') {
      if (name === 'notes' && role !== 'admin') return json({ error: 'Not found' }, 404);
      const doc = (await readJSON(path)) || (name === 'main' ? SEED_CONFIG : null);
      return doc ? json(doc) : json({ error: 'Not found' }, 404);
    }
    if (req.method === 'PUT') {
      if (role !== 'admin') return json({ error: 'Only the coordinator can change this' }, 403);
      const text = await req.text();
      if (text.length > 300000) return json({ error: 'Too large' }, 413);
      let body; try { body = JSON.parse(text); } catch { return json({ error: 'Bad JSON' }, 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Bad document' }, 400);
      await writeJSON(path, body);
      return json({ ok: true });
    }
    return json({ error: 'Method not allowed' }, 405);
  },
};
