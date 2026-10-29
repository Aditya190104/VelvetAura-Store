import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useParams, Link, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, ArrowUpRight, ArrowRight, ArrowLeft, X, Check } from 'lucide-react';
import { products, colorHex } from '../data/products';
import { wardrobeCategories, categoriesFor, findCategory, categoryById } from '../data/categories';
import { editorial } from '../data/media';
import { filterProducts, money, paginateProducts } from '../utils/shop';
import { ProductGrid } from '../components/ProductCard';
import FashionImage from '../components/FashionImage';
import Dialog from '../components/Dialog';
import { NotFound } from './Info';

const split = value => (value || '').split(',').filter(Boolean);
function CollectionFilters({ get, set, clear, gender, activeCategory, options, onCategory }) {
  const id = useId();
  const toggle = (key, value) => set(key, split(get(key)).includes(value) ? split(get(key)).filter(v => v !== value).join(',') : [...split(get(key)), value].join(','));
  return <div className="filters catalogue-filters">
    <div className="filter-heading"><h3>Filter your edit</h3><button className="text-link" onClick={clear}>Reset</button></div>
    <label className="search-field"><Search size={16}/><input aria-label="Search collection" placeholder="Search this collection" value={get('q')} onChange={e => set('q', e.target.value)}/></label>
    <details open><summary>Category</summary><div className="filter-category-links"><button className={!activeCategory ? 'selected' : ''} onClick={() => onCategory('')}>All {gender ? gender.toLowerCase() + '’s pieces' : 'pieces'}</button>{(gender ? categoriesFor(gender) : wardrobeCategories).map(c => <button key={c.id} className={activeCategory === c.id ? 'selected' : ''} onClick={() => onCategory(c.id)}>{!gender && <small>{c.department} / </small>}{c.name}<span>{products.filter(p => p.subcategory === c.id).length}</span></button>)}</div></details>
    <details open><summary>Price range</summary><div className="price-inputs"><label htmlFor={`${id}-min`}>From ₹<input id={`${id}-min`} type="number" min="0" max="25000" step="100" value={get('min')} placeholder="0" onChange={e => set('min', e.target.value)}/></label><span>—</span><label htmlFor={`${id}-max`}>To ₹<input id={`${id}-max`} type="number" min="0" max="25000" step="100" value={get('max')} placeholder="Any" onChange={e => set('max', e.target.value)}/></label></div></details>
    <details open><summary>Size</summary><div className="filter-size-options">{options.sizes.map(s => <button key={s} aria-pressed={split(get('sizes')).includes(s)} className={split(get('sizes')).includes(s) ? 'selected' : ''} onClick={() => toggle('sizes', s)}>{s}</button>)}</div></details>
    <details><summary>Colour</summary><div className="filter-colour-options">{options.colors.map(c => <label key={c}><input type="checkbox" checked={split(get('colors')).includes(c)} onChange={() => toggle('colors', c)}/><i style={{ background: colorHex[c] || '#b9b3a6' }}/>{c}</label>)}</div></details>
    <details open><summary>Availability</summary><label className="filter-option"><input name={`${id}-availability`} type="radio" checked={!get('availability')} onChange={() => set('availability', '')}/>All pieces</label><label className="filter-option"><input name={`${id}-availability`} type="radio" checked={get('availability') === 'in'} onChange={() => set('availability', 'in')}/>Available in the preview</label><label className="filter-option"><input name={`${id}-availability`} type="radio" checked={get('availability') === 'out'} onChange={() => set('availability', 'out')}/>Unavailable</label></details>
    <p className="filter-note">Catalogue stock is demonstration data. Checkout is not yet enabled.</p>
  </div>;
}

export default function Shop() {
  const route = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const latestParams = useRef(params), resultRef = useRef(null);
  useLayoutEffect(() => { latestParams.current = params; }, [params]);
  const get = key => params.get(key) || '';
  const set = (key, value) => {
    const next = new URLSearchParams(latestParams.current);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    latestParams.current = next;
    setParams(next, { replace: key !== 'page' });
  };
  const routeGender = route.department === 'men' ? 'Men' : route.department === 'women' ? 'Women' : '';
  const gender = routeGender || get('gender');
  const category = route.slug ? findCategory(routeGender, route.slug) : categoryById[get('subcategory')];
  const scope = useMemo(() => products.filter(p => (!gender || p.gender === gender) && (!category || p.subcategory === category.id)), [gender, category]);
  const options = useMemo(() => ({ sizes: [...new Set(scope.flatMap(p => p.sizes))], colors: [...new Set(scope.flatMap(p => p.colors))].sort() }), [scope]);
  const result = filterProducts(scope, { q: get('q'), category: get('category'), min: get('min'), max: get('max'), sizes: get('sizes'), colors: get('colors'), availability: get('availability'), sort: get('sort'), edit: get('edit') });
  const page = paginateProducts(result, get('page'), 24);
  const clear = () => {
    const next = new URLSearchParams();
    if (!routeGender && gender) next.set('gender', gender);
    if (!route.slug && category) next.set('subcategory', category.id);
    latestParams.current = next; setParams(next);
  };
  const onCategory = id => {
    const next = new URLSearchParams(latestParams.current);
    ['category', 'subcategory', 'gender', 'page'].forEach(key => next.delete(key));
    const path = id ? categoryById[id].href : gender ? `/shop/${gender.toLowerCase()}` : '/shop';
    navigate(`${path}${next.size ? '?' + next.toString() : ''}`);
  };
  const setPage = n => { set('page', String(n)); resultRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); resultRef.current?.focus({ preventScroll: true }); };
  const chips = ['q', 'category', 'min', 'max', 'sizes', 'colors', 'availability', 'edit'].filter(key => get(key));
  const chipLabel = key => key === 'q' ? `“${get(key)}”` : key === 'min' ? `From ${money(Number(get(key)))}` : key === 'max' ? `Up to ${money(Number(get(key)))}` : key === 'availability' ? get(key) === 'in' ? 'Available' : 'Unavailable' : key === 'edit' ? ({ new: 'New arrivals', best: 'Best sellers', trending: 'Trending' }[get(key)] || get(key)) : get(key).replaceAll(',', ', ');
  const title = category ? category.name : get('edit') === 'new' ? 'New arrivals' : get('edit') === 'best' ? 'The favourites' : get('edit') === 'trending' ? 'Trending now' : gender ? `The ${gender.toLowerCase()}’s wardrobe` : 'The considered wardrobe';
  const filterProps = { get, set, clear, gender, activeCategory: category?.id, options, onCategory };
  if ((route.department && !routeGender) || (route.slug && !category)) return <NotFound/>;
  return <main className="section shop-page catalogue-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/shop">Shop</Link>{gender && <><span>/</span><Link to={`/shop/${gender.toLowerCase()}`}>{gender}</Link></>}{category && <><span>/</span><span aria-current="page">{category.name}</span></>}</nav>
    <div className="catalogue-intro"><p className="eyebrow">THE VELVETAURA WARDROBE</p><h1>{title}<sup>{scope.length}</sup></h1><p>{category?.description || 'More ways to make the everyday your own. Discover pieces with a point of view.'}</p></div>
    <div className="catalogue-shortcuts" aria-label="Collection shortcuts">{(gender ? categoriesFor(gender) : [{ id: 'women', name: 'Women', href: '/shop/women' }, { id: 'men', name: 'Men', href: '/shop/men' }, { id: 'new', name: 'New arrivals', href: '/shop?edit=new' }, ...categoriesFor('Women').filter(c => ['dresses', 'tops', 'knitwear', 'co-ord-sets'].includes(c.slug))]).map(c => <Link className={c.id === category?.id ? 'active' : ''} key={c.id} to={c.href}>{c.name}</Link>)}</div>
    <div className="catalogue-toolbar" ref={resultRef} tabIndex={-1}><button className="mobile-filter-button" onClick={() => setFiltersOpen(true)} aria-haspopup="dialog"><SlidersHorizontal size={16}/>Filters{chips.length ? ` (${chips.length})` : ''}</button><p className="result-count" role="status">{result.length ? `${page.start + 1}–${page.start + page.items.length} of ${result.length}` : '0'} pieces</p><label className="sort"><span>Sort by</span><select aria-label="Sort products" value={get('sort')} onChange={e => set('sort', e.target.value)}><option value="">Popularity</option><option value="new">Newest first</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label></div>
    <div className="shop-layout"><aside className="filter-sidebar" aria-label="Collection filters"><CollectionFilters {...filterProps}/></aside><div className="shop-results">
      {!!chips.length && <div className="active-filters">{chips.map(key => <button key={key} onClick={() => set(key, '')} aria-label={`Remove filter: ${chipLabel(key)}`}>{chipLabel(key)}<X size={13}/></button>)}<button className="clear-filter-chip" onClick={clear}>Clear all</button></div>}
      {page.items.length ? <><ProductGrid products={page.items}/><nav className="pagination" aria-label="Product pagination"><button className="icon" aria-label="Previous page" disabled={page.page === 1} onClick={() => setPage(page.page - 1)}><ArrowLeft size={17}/></button>{Array.from({ length: page.pages }, (_, i) => i + 1).filter(n => n === 1 || n === page.pages || Math.abs(n - page.page) <= 1).map((n, i, list) => <span key={n}>{i > 0 && n - list[i - 1] > 1 && <span className="page-gap">…</span>}<button aria-label={`Page ${n}`} aria-current={page.page === n ? 'page' : undefined} onClick={() => setPage(n)}>{String(n).padStart(2, '0')}</button></span>)}<button className="icon" aria-label="Next page" disabled={page.page === page.pages} onClick={() => setPage(page.page + 1)}><ArrowRight size={17}/></button></nav><p className="pagination-summary">Page {page.page} of {page.pages} · {result.length} pieces</p></> : <div className="empty"><Search size={30}/><h2>A fresh start?</h2><p>No pieces match this combination. Try a different size, colour or price range.</p><button className="button" onClick={clear}>Clear filters<ArrowRight size={16}/></button><Link className="text-link" to="/shop">Explore the whole wardrobe</Link></div>}
    </div></div>
    <AnimatePresence>{filtersOpen && <Dialog title="Refine your edit" side onClose={() => setFiltersOpen(false)}><CollectionFilters {...filterProps}/><button className="button filter-apply" onClick={() => setFiltersOpen(false)}>View {result.length} pieces<Check size={17}/></button></Dialog>}</AnimatePresence>
  </main>;
}

const edits = [
  { name: 'The Soft Edit', category: 'Knitwear', image: editorial.soft, description: 'Touchably soft. Effortlessly layered.' },
  { name: 'Everyday Foundations', category: 'Essentials', image: editorial.wardrobe, description: 'The pieces that make everything work.' },
  { name: 'A Little Structure', category: 'Outerwear', image: editorial.hero, description: 'Clean lines with a confident point of view.' },
];
export function Collections() {
  return <main className="section collections-page"><div className="page-intro"><p className="eyebrow">THOUGHTFULLY CURATED</p><h1>The VelvetAura edits.</h1><p>A point of view for every part of your day.</p></div><div className="collection-grid">{edits.map(({ name, category, image, description }, i) => <Link className="collection-tile" key={category} to={`/shop?category=${category}`}><div className="collection-tile-image"><FashionImage src={image} alt={name} sizes="(max-width: 760px) 90vw, 30vw"/><span>0{i + 1} / THE COLLECTION</span></div><h2>{name}<ArrowUpRight size={23}/></h2><p>{description}</p><span className="text-link">Discover the edit<ArrowRight size={16}/></span></Link>)}</div><div className="wardrobe-directory">{['Women', 'Men'].map(g => <section key={g}><p className="eyebrow">EXPLORE THE WARDROBE</p><h2>For {g.toLowerCase()}.</h2>{categoriesFor(g).map(c => <Link to={c.href} key={c.id}>{c.name}<span>{products.filter(p => p.subcategory === c.id).length}<ArrowUpRight size={15}/></span></Link>)}</section>)}</div></main>;
}
