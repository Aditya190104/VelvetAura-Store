import { Link } from 'react-router-dom';
import { Heart, ArrowUpRight } from 'lucide-react';
import { useStore } from '../context/Store';
import { colorHex } from '../data/products';
import { money, totalStock } from '../utils/shop';
import { Reveal } from './Motion';
import FashionImage from './FashionImage';

export function ProductCard({ product: p }) {
  const { wishlist, toggle } = useStore();
  const saved = wishlist.includes(p.id);

  return <article className="product-card">
    <div className={`product-image ${p.imageMode === 'contain' ? 'studio-product' : ''}`}>
      <Link to={`/product/${p.id}`} aria-label={`View ${p.name}`}>
        <FashionImage src={p.images[0]} alt={`${p.name} — illustrative product photograph`} sizes="(max-width: 640px) 46vw, (max-width: 1024px) 32vw, 24vw"/>
      </Link>
      {(p.tag || totalStock(p) === 0) && <span className="product-tag">{totalStock(p) === 0 ? 'UNAVAILABLE' : p.tag === 'EDITOR’S PICK' ? 'THE EDIT' : p.tag === 'BESTSELLER' ? 'THE EDIT' : p.tag}</span>}
      <button className={`favorite ${saved ? 'saved' : ''}`} aria-label={`${saved ? 'Remove' : 'Save'} ${p.name} ${saved ? 'from' : 'to'} wishlist`} aria-pressed={saved} onClick={() => toggle(p.id)}><Heart size={18}/></button>
      <Link className="card-shop" to={`/product/${p.id}`}>{totalStock(p) === 0 ? 'View the details' : 'Choose your size'}<ArrowUpRight size={16}/></Link>
    </div>
    <div className="product-meta">
      <small>{p.brand || p.gender} · {p.category}</small>
      <h3><Link to={`/product/${p.id}`}>{p.name}</Link></h3>
      <p>{money(p.price)} {p.oldPrice && <del>{money(p.oldPrice)}</del>}</p>
      <div className="swatches" aria-label={`Available colours: ${p.colors.join(', ')}`}>
        {p.colors.map(c => <i key={c} title={c} style={{ background: colorHex[c] }}/>) }
        <span>{p.colors.length} {p.colors.length === 1 ? 'colour' : 'colours'}</span>
      </div>
    </div>
  </article>;
}

export function ProductGrid({ products }) {
  return <div className="product-grid">{products.map((p, i) => <Reveal key={p.id} delay={(i % 4) * 0.045}><ProductCard product={p}/></Reveal>)}</div>;
}
