import { itemKey, stockFor } from './shop.js';
export function cleanCart(input, products) {
  if (!Array.isArray(input)) return [];
  const result = new Map();
  for (const item of input.slice(0, 200)) {
    if (!item || typeof item !== 'object') continue;
    const p = products.find(p => p.id === item.id);
    if (!p || !p.sizes.includes(item.size) || !p.colors.includes(item.color) || !Number.isInteger(item.quantity) || item.quantity < 1) continue;
    const limit = Math.min(10, stockFor(p, item.size, item.color));
    if (!limit) continue;
    const key = itemKey(p.id, item.size, item.color);
    result.set(key, { id: p.id, key, size: item.size, color: item.color, quantity: Math.min(limit, item.quantity + (result.get(key)?.quantity || 0)), price: p.price });
  }
  return [...result.values()];
}
export const cleanWishlist = (input, products) => Array.isArray(input) ? [...new Set(input.filter(id => products.some(p => p.id === id)))].slice(0, 1000) : [];
