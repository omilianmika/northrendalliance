const shop = () => process.env.SHOPIFY_SHOP, token = () => process.env.SHOPIFY_ADMIN_TOKEN;
export const isLive = () => !!(shop() && token());

const DEMO = [1, 2, 3, 4, 5, 6].map(i => ({
  id: 'demo-' + i, title: ['Booster Tights', 'Cargo Shorts', 'Signature Hoodie', 'Swirl Bra', 'Seamless Tee', 'Lift Leggings'][i - 1],
  price: String(399 + i * 50) + ' kr', url: 'https://example.com/products/demo-' + i,
  image: `https://picsum.photos/seed/gavelo${i}/800/1000`
}));

async function gql(query, variables) {
  const r = await fetch(`https://${shop()}/admin/api/2025-01/graphql.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token() },
    body: JSON.stringify({ query, variables })
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}

const PRODUCT_FIELDS = `id title onlineStoreUrl handle featuredImage { url }
  priceRangeV2 { minVariantPrice { amount currencyCode } }`;
const norm = p => ({ id: p.id, title: p.title, image: p.featuredImage?.url || '',
  price: `${Math.round(p.priceRangeV2.minVariantPrice.amount)} ${p.priceRangeV2.minVariantPrice.currencyCode}`,
  url: p.onlineStoreUrl || `https://${shop()}/products/${p.handle}` });

export async function searchProducts(q = '') {
  if (!isLive()) return DEMO.filter(p => p.title.toLowerCase().includes(q.toLowerCase()));
  const d = await gql(`query($q:String){products(first:40,query:$q,sortKey:UPDATED_AT,reverse:true){nodes{${PRODUCT_FIELDS}}}}`, { q: q || null });
  return d.products.nodes.map(norm);
}

export async function listCollections() {
  if (!isLive()) return [{ id: 'demo-c', title: 'Demo-kollektion' }];
  const d = await gql(`{collections(first:50){nodes{id title}}}`);
  return d.collections.nodes;
}

export async function collectionProducts(id) {
  if (!isLive()) return DEMO.slice(0, 4);
  const d = await gql(`query($id:ID!){collection(id:$id){products(first:12){nodes{${PRODUCT_FIELDS}}}}}`, { id });
  return d.collection.products.nodes.map(norm);
}

export async function newest(n = 4) {
  if (!isLive()) return DEMO.slice(0, n);
  const d = await gql(`query($n:Int){products(first:$n,sortKey:CREATED_AT,reverse:true){nodes{${PRODUCT_FIELDS}}}}`, { n });
  return d.products.nodes.map(norm);
}

export async function resolveProducts(source) {
  if (source.type === 'collection') return collectionProducts(source.collectionId);
  if (source.type === 'newest') return newest();
  if (source.type === 'products') return (source.products || []);
  return [];
}
