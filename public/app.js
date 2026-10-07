const $ = s => document.querySelector(s), api = (p, b) => fetch('/api/' + p, b && { method: 'POST', body: JSON.stringify(b) }).then(r => r.json());
const STEPS = ['Skill', 'Datakälla', 'Innehåll', 'Förhandsvisning'];
const S = { step: 0, skills: [], skill: null, srcType: 'products', picked: [], collections: [], collectionId: '', products: [],
  format: 'story', subject: '', headline: '', body: '', cta: 'Handla nu', html: '', msg: '' };

const source = () => S.srcType === 'collection' ? { type: 'collection', collectionId: S.collectionId }
  : S.srcType === 'newest' ? { type: 'newest' } : { type: 'products', products: S.picked };
const payload = () => ({ skillId: S.skill.id, source: source(), format: S.format, subject: S.subject, headline: S.headline, body: S.body, cta: S.cta });
const esc = s => String(s).replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);

async function render() {
  $('#steps').innerHTML = STEPS.map((t, i) => `<span class="${i === S.step ? 'on' : ''}">${i + 1}. ${t}</span>`).join('');
  $('#back').style.visibility = S.step ? 'visible' : 'hidden';
  $('#next').style.display = S.step === 3 ? 'none' : '';
  const m = $('#main');
  if (S.step === 0) {
    m.innerHTML = `<h2>Vad vill du skapa?</h2><div class="grid">${S.skills.map(s => `<div class="card ${S.skill?.id === s.id ? 'sel' : ''}" data-id="${s.id}">
      <b>${esc(s.name)}</b><br><small>${s.output === 'ad' ? 'Annons' : 'Mail'}</small><p>${esc(s.description)}</p></div>`).join('')}</div>`;
    m.querySelectorAll('.card').forEach(c => c.onclick = () => { S.skill = S.skills.find(s => s.id === c.dataset.id); render(); });
  } else if (S.step === 1) {
    m.innerHTML = `<h2>Var hämtas produkterna?</h2><select id="src"><option value="products">Välj produkter manuellt</option>
      <option value="collection">Hel kollektion</option><option value="newest">Senaste produkterna</option></select><div id="srcbody"></div>`;
    $('#src').value = S.srcType; $('#src').onchange = e => { S.srcType = e.target.value; render(); };
    const b = $('#srcbody');
    if (S.srcType === 'products') {
      b.innerHTML = `<label>Sök</label><input id="q" placeholder="Sök produkt…"><div class="grid" id="pl" style="margin-top:12px"></div>`;
      const draw = () => { $('#pl').innerHTML = S.products.map(p => `<div class="card ${S.picked.some(x => x.id === p.id) ? 'sel' : ''}" data-id="${p.id}">
        <img src="${esc(p.image)}"><b>${esc(p.title)}</b><br><small>${esc(p.price)}</small></div>`).join('');
        $('#pl').querySelectorAll('.card').forEach(c => c.onclick = () => { const p = S.products.find(x => x.id === c.dataset.id);
          S.picked = S.picked.some(x => x.id === p.id) ? S.picked.filter(x => x.id !== p.id) : [...S.picked, p]; draw(); }); };
      const load = async () => { S.products = await api('products?q=' + encodeURIComponent($('#q').value)); draw(); };
      $('#q').oninput = load; load();
    } else if (S.srcType === 'collection') {
      S.collections = S.collections.length ? S.collections : await api('collections');
      S.collectionId ||= S.collections[0]?.id;
      b.innerHTML = `<label>Kollektion</label><select id="col">${S.collections.map(c => `<option value="${c.id}">${esc(c.title)}</option>`).join('')}</select>`;
      $('#col').value = S.collectionId; $('#col').onchange = e => S.collectionId = e.target.value;
    } else b.innerHTML = '<p>De 4 senaste produkterna används.</p>';
  } else if (S.step === 2) {
    const ad = S.skill.output === 'ad';
    m.innerHTML = `<h2>Innehåll</h2>${ad ? `<label>Format</label><select id="f"><option value="story">Story 9:16</option><option value="feed">Feed 4:5</option></select>`
      : `<label>Ämnesrad</label><input id="subject">`}
      <label>Rubrik</label><input id="headline">${ad ? '' : '<label>Text</label><textarea id="body" rows="4"></textarea>'}<label>Knapptext</label><input id="cta">`;
    if (ad) { $('#f').value = S.format; $('#f').onchange = e => S.format = e.target.value; }
    for (const k of ['subject', 'headline', 'body', 'cta']) { const el = $('#' + k); if (el) { el.value = S[k]; el.oninput = e => S[k] = e.target.value; } }
  } else {
    const ad = S.skill.output === 'ad', w = ad ? 270 : 640, h = ad ? (S.format === 'story' ? 480 : 337) : 720;
    m.innerHTML = `<h2>Förhandsvisning</h2><iframe id="pv" width="${ad ? 270 : 640}" height="${h}"></iframe>
      <div class="row"><button id="dl" class="primary">Ladda ner HTML</button>${ad ? '' : '<button id="kl">Skicka till Klaviyo</button>'}</div><div class="msg" id="msg">${esc(S.msg)}</div>`;
    const r = await api('preview', payload());
    if (r.error) { $('#msg').textContent = r.error; return; }
    S.html = r.html;
    const f = $('#pv'); f.srcdoc = ad ? r.html.replace('<body', `<body style="zoom:${w / (1080)}"`) : r.html;
    $('#dl').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([S.html], { type: 'text/html' }));
      a.download = (S.skill.output === 'ad' ? 'annons' : 'mail') + '.html'; a.click(); };
    if (!ad) $('#kl').onclick = async () => { const k = await api('klaviyo', payload()); $('#msg').textContent = k.error || k.message; };
  }
}

$('#back').onclick = () => { S.step--; render(); };
$('#next').onclick = () => {
  if (S.step === 0 && !S.skill) return alert('Välj en skill');
  if (S.step === 1 && S.srcType === 'products' && !S.picked.length) return alert('Välj minst en produkt');
  S.step++; render();
};
(async () => {
  S.skills = await api('skills'); const st = await api('status');
  $('#status').textContent = `Shopify: ${st.shopify ? 'live' : 'demo'} · Klaviyo: ${st.klaviyo ? 'live' : 'demo'}`;
  render();
})();
