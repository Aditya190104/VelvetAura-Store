import { cleanCart, cleanWishlist } from '../utils/persistence';
import { useEffect, useState, useRef, useCallback } from 'react';
import { StoreContext as Store } from './StoreContext';
import { products, productById } from '../data/products';
import { addCartItem, stockFor } from '../utils/shop';

function read(key) {
  try { const data = JSON.parse(localStorage.getItem(key)); return Array.isArray(data) ? data : []; }
  catch { return []; }
}
export function StoreProvider({ children }) {
  const [cart, setCart] = useState(() => cleanCart(read('va-cart'), products));
  const [wishlist, setWishlist] = useState(() => cleanWishlist(read('va-wishlist'), products));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState('');
  const timer = useRef(), cartRef = useRef(cart);
  const notify = useCallback(message => {
    clearTimeout(timer.current); setToast(message);
    timer.current = setTimeout(() => setToast(''), 3500);
  }, []);
  const commitCart = next => { cartRef.current = next; setCart(next); };
  useEffect(() => {
    try { localStorage.setItem('va-cart', JSON.stringify(cart)); localStorage.setItem('va-wishlist', JSON.stringify(wishlist)); }
    catch { notify('Browser storage is unavailable. Changes will last for this visit.'); }
  }, [cart, wishlist, notify]);
  useEffect(() => () => clearTimeout(timer.current), []);
  function add(product, size, color, quantity = 1) {
    const p = productById[product.id];
    if (!p) { notify('This piece is no longer available.'); return false; }
    const result = addCartItem(cartRef.current, p, size, color, quantity);
    if (result.error) { notify(result.error); return false; }
    commitCart(result.items); notify(`${p.name} added to your bag`); setDrawerOpen(true); return true;
  }
  function toggle(id) {
    if (!productById[id]) return;
    setWishlist(items => items.includes(id) ? items.filter(x => x !== id) : [...items, id]);
    notify(wishlist.includes(id) ? 'Removed from your wishlist' : 'Saved to your wishlist');
  }
  function quantity(key, n) {
    if (!Number.isInteger(n) || n < 1) return;
    const item = cartRef.current.find(x => x.key === key), p = item && productById[item.id];
    if (!p) return;
    const limit = Math.min(10, stockFor(p, item.size, item.color));
    if (n > limit) { notify('The quantity limit for this variant has been reached.'); return; }
    commitCart(cartRef.current.map(x => x.key === key ? { ...x, quantity: n } : x));
  }
  function remove(key) { commitCart(cartRef.current.filter(x => x.key !== key)); notify('Item removed from your bag'); }
  return <Store.Provider value={{ cart, wishlist, add, toggle, quantity, remove, notify, drawerOpen, setDrawerOpen }}>{children}<div className={`toast ${toast ? 'visible' : ''}`} role="status" aria-live="polite">{toast}</div></Store.Provider>;
}
export { useStore } from './StoreContext';
