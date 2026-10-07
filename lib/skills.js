import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = new URL('../skills/', import.meta.url).pathname;

export function loadSkills() {
  return readdirSync(dir).filter(f => f.endsWith('.md')).map(f => {
    const raw = readFileSync(join(dir, f), 'utf8');
    const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    const meta = {};
    (m?.[1] || '').split('\n').forEach(l => {
      const i = l.indexOf(':');
      if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^"|"$/g, '');
    });
    return { id: f.replace(/\.md$/, ''), name: meta.name || f, output: meta.output || 'ad',
      description: meta.description || '', accent: meta.accent || '#111', bg: meta.bg || '#fff',
      guidelines: m?.[2]?.trim() || '' };
  });
}
