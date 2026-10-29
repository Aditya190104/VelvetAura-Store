const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const money = value => rupees.format(value);
export const itemKey = (id, size, color) => `${id}:${size}:${color}`;
export const subtotal = items => items.reduce((sum, item) => sum + item.price * item.quantity, 0);
export const stockFor = (product, size, color) => {
  if (!product?.sizes.includes(size) || !product.colors.includes(color)) return 0;
  if (!product.variants) return 10; // Compatibility with existing saved catalogue fixtures.
  return product.variants.find(v => v.size === size && v.color === color)?.stock || 0;
};
export const totalStock = product => product.variants ? product.variants.reduce((n, v) => n + v.stock, 0) : 10;
const values = input => Array.isArray(input) ? input : String(input || '').split(',').filter(Boolean);
const finitePrice = (input, fallback) => input === '' || input == null || !Number.isFinite(Number(input)) ? fallback : Math.max(0, Number(input));

export function filterProducts(products, { q = '', gender = '', category = '', subcategory = '', min = 0, max = Infinity, sizes = [], colors = [], availability = '', sort = 'featured', edit = '' } = {}) {
  const wantedSizes = values(sizes), wantedColors = values(colors);
  const tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const list = products.filter(p => {
    if (gender && p.gender !== gender) return false;
    if (category && p.category !== category) return false;
    if (subcategory && p.subcategory !== subcategory) return false;
    if (p.price < finitePrice(min, 0) || p.price > finitePrice(max, Infinity)) return false;
    if (!tokens.every(t => `${p.name} ${p.brand || ''} ${p.category} ${p.searchTerms || ''}`.toLowerCase().includes(t))) return false;
    if (edit === 'new' && p.tag !== 'NEW') return false;
    if (edit === 'best' && p.tag !== 'BESTSELLER') return false;
    if (edit === 'trending' && !p.trending) return false;
    const variants = p.variants || p.sizes?.flatMap(size => p.colors.map(color => ({ size, color, stock: 10 }))) || [];
    const matching = variants.filter(v => (!wantedSizes.length || wantedSizes.includes(v.size)) && (!wantedColors.length || wantedColors.includes(v.color)));
    if ((wantedSizes.length || wantedColors.length) && !matching.length) return false;
    if (availability === 'in' && !matching.some(v => v.stock > 0)) return false;
    if (availability === 'out' && matching.some(v => v.stock > 0)) return false;
    return true;
  });
  return list.sort((a, b) => sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : sort === 'new' ? b.newness - a.newness : b.popularity - a.popularity);
}

export function paginateProducts(products, page = 1, perPage = 24) {
  const pages = Math.max(1, Math.ceil(products.length / perPage));
  const current = Math.max(1, Math.min(pages, Math.floor(Number(page)) || 1));
  const start = (current - 1) * perPage;
  return { items: products.slice(start, start + perPage), page: current, pages, start, total: products.length };
}

export function addCartItem(items, product, size, color, requested = 1) {
  if (!product.sizes.includes(size) || !product.colors.includes(color)) return { items, error: 'Please choose a valid size and colour.' };
  if (!Number.isInteger(requested) || requested < 1) return { items, error: 'Please choose a valid quantity.' };
  const key = itemKey(product.id, size, color);
  const existing = items.find(item => item.key === key);
  const limit = Math.min(10, stockFor(product, size, color));
  if (!limit) return { items, error: 'This size and colour is currently unavailable.' };
  if ((existing?.quantity || 0) + requested > limit) return { items, error: `You can add up to ${limit} of this variant to your bag.` };
  const item = { id: product.id, key, size, color, quantity: (existing?.quantity || 0) + requested, price: product.price };
  return { items: existing ? items.map(x => x.key === key ? item : x) : [...items, item] };
}
