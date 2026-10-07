import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname } from 'node:path';
import { loadSkills } from './lib/skills.js';
import * as shopify from './lib/shopify.js';
import * as klaviyo from './lib/klaviyo.js';
import { renderAd, renderEmail } from './lib/render.js';

if (existsSync('.env')) readFileSync('.env', 'utf8').split('\n').forEach(l => {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
});

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const json = (res, data, code = 200) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
const body = req => new Promise(r => { let b = ''; req.on('data', c => b += c); req.on('end', () => r(b ? JSON.parse(b) : {})); });

async function build(b) {
  const skill = loadSkills().find(s => s.id === b.skillId);
  if (!skill) throw new Error('Okänd skill');
  const products = await shopify.resolveProducts(b.source);
  return skill.output === 'email'
    ? { skill, html: renderEmail({ ...b, skill, products }) }
    : { skill, html: renderAd({ ...b, skill, products }) };
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname === '/api/status') return json(res, { shopify: shopify.isLive(), klaviyo: klaviyo.isLive() });
    if (url.pathname === '/api/skills') return json(res, loadSkills());
    if (url.pathname === '/api/products') return json(res, await shopify.searchProducts(url.searchParams.get('q') || ''));
    if (url.pathname === '/api/collections') return json(res, await shopify.listCollections());
    if (url.pathname === '/api/preview' && req.method === 'POST') return json(res, { html: (await build(await body(req))).html });
    if (url.pathname === '/api/klaviyo' && req.method === 'POST') {
      const b = await body(req), { html } = await build(b);
      return json(res, await klaviyo.createTemplate(b.subject || b.headline || 'Northren Alliance', html));
    }
    const file = url.pathname === '/' ? '/index.html' : url.pathname;
    const p = new URL('./public' + file, import.meta.url).pathname;
    if (!file.includes('..') && existsSync(p)) { res.writeHead(200, { 'Content-Type': types[extname(p)] || 'text/plain' }); return res.end(readFileSync(p)); }
    res.writeHead(404); res.end('Not found');
  } catch (e) { json(res, { error: e.message }, 500); }
}).listen(process.env.PORT || 3000, () => console.log('http://localhost:' + (process.env.PORT || 3000)));
