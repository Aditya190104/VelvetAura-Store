import FashionImage from './FashionImage';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useStore } from '../context/Store';
import { products } from '../data/products';
import { money, subtotal, stockFor } from '../utils/shop';
import Dialog from './Dialog';
export default function CartDrawer({ onClose }) {
  const { cart, quantity, remove } = useStore();
  return <Dialog title="Your shopping bag" onClose={onClose} side><div className="drawer-items">{cart.length ? cart.map(item => {
    const p = products.find(p => p.id === item.id); if (!p) return null;
    return <article className="drawer-item" key={item.key}><Link to={`/product/${p.id}`} onClick={onClose}><FashionImage src={p.images[0]} alt={p.name} sizes="120px"/></Link><div><Link to={`/product/${p.id}`} onClick={onClose}><h3>{p.name}</h3></Link><p>{item.color} / {item.size}</p><strong>{money(p.price * item.quantity)}</strong><div className="quantity"><button aria-label={`Decrease ${p.name}`} disabled={item.quantity === 1} onClick={() => quantity(item.key, item.quantity - 1)}><Minus size={14}/></button><span>{item.quantity}</span><button aria-label={`Increase ${p.name}`} disabled={item.quantity >= Math.min(10, stockFor(p, item.size, item.color))} onClick={() => quantity(item.key, item.quantity + 1)}><Plus size={14}/></button></div></div><button className="icon" aria-label={`Remove ${p.name}`} onClick={() => remove(item.key)}><Trash2 size={17}/></button></article>;
  }) : <div className="empty"><ShoppingBag/><h2>Room for something lovely.</h2><Link className="text-link" to="/shop" onClick={onClose}>Discover the collection <ArrowRight size={16}/></Link></div>}</div>{cart.length > 0 && <div className="drawer-summary"><div><span>Estimated subtotal</span><strong>{money(subtotal(cart))}</strong></div><p>Shipping shown in your bag. Pricing is illustrative.</p><Link className="button" to="/cart" onClick={onClose}>View your bag <ArrowRight size={16}/></Link><button className="text-link" onClick={onClose}>Keep exploring</button></div>}</Dialog>;
}
