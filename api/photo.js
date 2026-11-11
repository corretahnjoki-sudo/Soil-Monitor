import { put, get } from '@vercel/blob';
import { roleOf, json } from './_lib.js';

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export default {
  async fetch(req) {
    const role = roleOf(req);
    if (!role) return json({ error: 'Sign in first' }, 401);
    if (req.method === 'POST') {
      const type = (req.headers.get('content-type') || '').split(';')[0].trim();
      if (!TYPES[type]) return json({ error: 'Photos must be JPEG, PNG or WebP' }, 415);
      const buf = await req.arrayBuffer();
      if (!buf.byteLength) return json({ error: 'Empty photo' }, 400);
      if (buf.byteLength > 4 * 1024 * 1024) return json({ error: 'Photo too large' }, 413);
      const blob = await put(`photos/p.${TYPES[type]}`, buf, { access: 'private', addRandomSuffix: true, contentType: type });
      return json({ id: blob.pathname }, 201);
    }
    if (req.method === 'GET') {
      if (role !== 'admin') return json({ error: 'Only the coordinator can view photos' }, 403);
      const p = new URL(req.url).searchParams.get('p') || '';
      if (!p.startsWith('photos/') || p.includes('..')) return json({ error: 'Bad photo id' }, 400);
      const r = await get(p, { access: 'private' });
      if (!r || r.statusCode !== 200) return json({ error: 'Not found' }, 404);
      return new Response(r.stream, { headers: { 'content-type': r.blob.contentType || 'image/jpeg', 'cache-control': 'private, max-age=86400' } });
    }
    return json({ error: 'Method not allowed' }, 405);
  },
};
