import { codeRole, roleOf, json } from './_lib.js';

const setCookie = v => `scm=${encodeURIComponent(v)}; Path=/; Max-Age=${v ? 31536000 : 0}; HttpOnly; Secure; SameSite=Lax`;

export default {
  async fetch(req) {
    if (req.method === 'GET') {
      const role = roleOf(req);
      return json({ role });
    }
    if (req.method === 'POST') {
      const { code } = await req.json().catch(() => ({}));
      const role = codeRole(code);
      if (!role) return json({ error: 'That code is not right. Check it and try again.' }, 401);
      // A coordinator who opens a patron link stays signed in as coordinator.
      if (role === 'patron' && roleOf(req) === 'admin') return json({ role: 'admin' });
      return json({ role }, 200, { 'set-cookie': setCookie(String(code).trim().toUpperCase()) });
    }
    if (req.method === 'DELETE') return json({ role: null }, 200, { 'set-cookie': setCookie('') });
    return json({ error: 'Method not allowed' }, 405);
  },
};
