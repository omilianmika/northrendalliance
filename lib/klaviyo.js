export const isLive = () => !!process.env.KLAVIYO_API_KEY;

export async function createTemplate(name, html) {
  if (!isLive()) return { demo: true, message: 'KLAVIYO_API_KEY saknas – demo-läge, inget skickades.' };
  const r = await fetch('https://a.klaviyo.com/api/templates', {
    method: 'POST',
    headers: { Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY}`, revision: '2024-10-15',
      'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ data: { type: 'template', attributes: { name, editor_type: 'CODE', html } } })
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.errors?.[0]?.detail || 'Klaviyo-fel ' + r.status);
  return { id: j.data.id, message: 'Mall skapad i Klaviyo: ' + name };
}
