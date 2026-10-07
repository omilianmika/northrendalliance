const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const FORMATS = { story: [1080, 1920], feed: [1080, 1350] };

export function renderAd({ skill, products, headline, cta, format = 'story' }) {
  const [w, h] = FORMATS[format] || FORMATS.story, p = products[0] || {}, ac = skill.accent, bg = skill.bg;
  const rest = products.slice(1, 4);
  return `<!doctype html><html><head><meta charset="utf-8"><title>Annons</title><style>
body{margin:0}.ad{width:${w}px;height:${h}px;background:${bg};position:relative;overflow:hidden;font-family:Helvetica,Arial,sans-serif;color:${ac}}
.hero{position:absolute;inset:0 0 ${rest.length ? 34 : 24}% 0;background:url('${esc(p.image)}') center/cover}
h1{position:absolute;left:60px;right:60px;top:${format === 'story' ? 200 : 60}px;margin:0;font-size:110px;line-height:1;text-transform:uppercase;color:#fff;text-shadow:0 2px 20px rgba(0,0,0,.4)}
.bar{position:absolute;left:0;right:0;bottom:0;padding:40px 60px;display:flex;gap:30px;align-items:center;flex-wrap:wrap}
.thumbs{display:flex;gap:20px;width:100%}.thumbs div{flex:1;height:200px;background-size:cover;background-position:center}
.btn{background:${ac};color:${bg};padding:28px 56px;font-size:44px;font-weight:700;text-transform:uppercase}
.meta{font-size:40px}</style></head><body><div class="ad">
<div class="hero"></div><h1>${esc(headline || p.title)}</h1>
<div class="bar">${rest.length ? `<div class="thumbs">${rest.map(r => `<div style="background-image:url('${esc(r.image)}')"></div>`).join('')}</div>` : ''}
<span class="btn">${esc(cta || 'Handla nu')}</span><span class="meta">${esc(p.title)} · ${esc(p.price)}</span></div></div></body></html>`;
}

export function renderEmail({ skill, products, subject, headline, body, cta }) {
  const ac = skill.accent, cells = products.slice(0, 4).map(p => `<td width="50%" style="padding:8px;vertical-align:top;text-align:center">
<a href="${esc(p.url)}" style="color:${ac};text-decoration:none"><img src="${esc(p.image)}" width="270" style="width:100%;display:block" alt="${esc(p.title)}">
<div style="font-weight:700;margin-top:8px">${esc(p.title)}</div><div>${esc(p.price)}</div></a></td>`);
  const rows = []; for (let i = 0; i < cells.length; i += 2) rows.push(`<tr>${cells[i]}${cells[i + 1] || '<td></td>'}</tr>`);
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(subject)}</title></head>
<body style="margin:0;background:#eee;font-family:Helvetica,Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:${skill.bg};color:${ac}"><tr><td style="padding:32px;text-align:center">
<h1 style="margin:0 0 12px;font-size:32px">${esc(headline || subject)}</h1><p style="margin:0;font-size:16px;line-height:1.5">${esc(body)}</p></td></tr>
<tr><td><table width="100%" cellpadding="0" cellspacing="0">${rows.join('')}</table></td></tr>
<tr><td style="padding:32px;text-align:center"><a href="${esc(products[0]?.url || '#')}" style="background:${ac};color:${skill.bg};padding:16px 36px;text-decoration:none;font-weight:700;display:inline-block">${esc(cta || 'Handla nu')}</a></td></tr>
<tr><td style="padding:16px;text-align:center;font-size:12px;color:#888">{% unsubscribe_link %}</td></tr></table></td></tr></table></body></html>`;
}
