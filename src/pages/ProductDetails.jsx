import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Heart, Minus, Plus, ArrowRight, Truck, RefreshCw, ZoomIn } from 'lucide-react';
import { products, colorHex, productById } from '../data/products';
import { money, stockFor, totalStock } from '../utils/shop';
import { useStore } from '../context/Store';
import { ProductGrid } from '../components/ProductCard';
import { SectionHeading } from '../components/Editorial';
import FashionImage from '../components/FashionImage';
import Dialog from '../components/Dialog';
import { NotFound } from './Info';
import { categoryById, collectionHref } from '../data/categories';

export default function ProductDetails() {
  const { id } = useParams();
  const product = productById[id];
  return product ? <Product key={id} p={product}/> : <NotFound product/>;
}

function Product({ p }) {
  const [size, setSize] = useState('');
  const [color, setColor] = useState(p.colors[0]);
  const [qty, setQty] = useState(1);
  const [image, setImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [error, setError] = useState('');
  const sizeRef = useRef(null);
  const { add, wishlist, toggle } = useStore();
  const saved = wishlist.includes(p.id);
  const stock = size ? stockFor(p, size, color) : totalStock(p);
  const category = categoryById[p.subcategory];
  const limit = Math.min(10, stock);
  const firstAvailableSize = p.sizes.find(s => stockFor(p, s, color));
  const related = products.filter(x => x.id !== p.id && x.subcategory === p.subcategory).slice(0, 4);

  function addToBag() {
    if (!size) { setError('Please select a size before adding to your bag.'); sizeRef.current?.focus(); return; }
    if (!stock || qty > limit) { setError('Please choose an available size and quantity.'); return; }
    setError('');
    add(p, size, color, qty);
  }

  return <main className="section product-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><Link to={`/shop?gender=${p.gender}`}>{p.gender}</Link><span>/</span><Link to={collectionHref(p)}>{category?.name || p.category}</Link><span>/</span><span>{p.name}</span></nav>
    <div className="product-detail">
      <div className="product-gallery"><button className="detail-image" aria-label={`Enlarge photograph of ${p.name}`} onClick={() => setZoomOpen(true)}><FashionImage src={p.images[image]} alt={`${p.name} — illustrative product photograph`} sizes="(max-width: 760px) 90vw, 50vw" priority/><span><ZoomIn size={16}/> View photograph</span></button>
        {p.images.length > 1 && <div className="thumbnails">{p.images.map((src, i) => <button key={src} aria-label={`View product photograph ${i + 1}`} aria-pressed={image === i} className={image === i ? 'selected' : ''} onClick={() => setImage(i)}><FashionImage src={src} alt="" sizes="75px"/></button>)}</div>}
        <p className="image-note">Reference photography · {p.brand}. Colours and fit may vary; this is a portfolio catalogue.</p>
      </div>
      <div className="product-info"><p className="eyebrow">{p.brand?.toUpperCase()} / {category?.name.toUpperCase() || p.category.toUpperCase()}</p><h1>{p.name}</h1><div className="detail-price">{money(p.price)} {p.oldPrice && <del>{money(p.oldPrice)}</del>}</div><small>Illustrative INR price · taxes included</small><p className="description">{p.description}</p>
        <fieldset className="color-picker"><legend>Colour — <strong>{color}</strong></legend><div>{p.colors.map(c => <button key={c} aria-label={c} aria-pressed={color === c} className={color === c ? 'selected' : ''} style={{ background: colorHex[c] }} onClick={() => { setColor(c); setQty(1); if (size && !stockFor(p, size, c)) setSize(''); setError(''); }}/>)}</div></fieldset>
        <div className="size-heading"><span id="size-label">Choose your size</span><Link to="/policies#sizing">Size guide</Link></div><div className={`sizes ${error ? 'has-error' : ''}`} role="group" aria-labelledby="size-label" aria-describedby={error ? 'size-error' : undefined}>{p.sizes.map(s => <button key={s} ref={s === firstAvailableSize ? sizeRef : null} aria-pressed={size === s} disabled={!stockFor(p, s, color)} title={!stockFor(p, s, color) ? `${s} is unavailable` : undefined} className={s === size ? 'selected' : ''} onClick={() => { setSize(s); setQty(1); setError(''); }}>{s}</button>)}</div>{error && <p id="size-error" className="field-error" role="alert">{error}</p>}
        <p className={`stock-note ${!stock ? 'unavailable' : ''}`} role="status">{stock ? 'Available to add · preview inventory' : 'This piece is currently unavailable'}</p><div className="purchase"><div className="quantity"><button aria-label="Decrease quantity" disabled={qty === 1} onClick={() => setQty(qty - 1)}><Minus size={15}/></button><span aria-live="polite">{qty}</span><button aria-label="Increase quantity" disabled={qty >= limit || !size} onClick={() => setQty(qty + 1)}><Plus size={15}/></button></div><button className="button" disabled={totalStock(p) === 0 || (size && !stock)} onClick={addToBag}>{totalStock(p) === 0 ? 'Currently unavailable' : 'Add to bag'}<ArrowRight size={17}/></button><button className={`wish-button ${saved ? 'saved' : ''}`} aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'} aria-pressed={saved} onClick={() => toggle(p.id)}><Heart size={20}/></button></div>
        <div className="product-perks"><span><Truck size={17}/> Complimentary shipping above ₹3,000</span><span><RefreshCw size={17}/> 14-day returns · proposed launch policy</span></div>
        <details open><summary>The details</summary><p>{p.material}.</p><ul className="product-features">{p.details.map(detail => <li key={detail}>{detail}</li>)}</ul><p className="small">SKU: {p.sku}</p></details><details><summary>Care & composition</summary><p>{p.care}</p><p className="small">Seed specifications are for demonstration. Refer to the garment label for final care and composition.</p></details><details><summary>Shipping & returns</summary><p>Proposed delivery within India: 3–7 working days. ₹150 delivery below ₹3,000. Returns within 14 days for unworn pieces with tags. Ordering and returns will be enabled at launch.</p></details>
      </div>
    </div>
    <section className="related"><SectionHeading eyebrow="BETTER TOGETHER" title="Complete your edit." href={collectionHref(p)} linkLabel="Explore more"/><ProductGrid products={related}/></section>
    <AnimatePresence>{zoomOpen && <Dialog title={p.name} onClose={() => setZoomOpen(false)}><FashionImage className="enlarged-product" src={p.images[image]} alt={`Enlarged photograph of ${p.name}`} sizes="600px" priority/><p className="image-note">Illustrative product photograph.</p></Dialog>}</AnimatePresence>
  </main>;
}
