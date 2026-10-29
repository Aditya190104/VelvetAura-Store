import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, User, Heart, ShoppingBag, Menu, ArrowRight, ArrowUpRight, Instagram, Linkedin, Truck, RefreshCw, ShieldCheck, ChevronDown } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../context/Store';
import Dialog from './Dialog';
import CartDrawer from './CartDrawer';
import { categoriesFor } from '../data/categories';
import { products } from '../data/products';
import { editorial } from '../data/media';
import FashionImage from './FashionImage';

const navigation = [
  ['Home', '/'], ['Women', '/shop?gender=Women'], ['Men', '/shop?gender=Men'],
  ['New Arrivals', '/shop?edit=new'], ['Collections', '/collections'],
];

function isCurrent(url, location) {
  const [path, query] = url.split('?');
  if (location.pathname !== path) return false;
  if (!query) return true;
  const current = new URLSearchParams(location.search);
  return [...new URLSearchParams(query)].every(([key, value]) => current.get(key) === value);
}

export function Navbar() {
  const { cart, wishlist, drawerOpen, setDrawerOpen } = useStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState('');
  const [mega, setMega] = useState('');
  const headerRef = useRef(null);
  const megaTriggers = useRef({});
  const location = useLocation(), navigate = useNavigate();
  useEffect(() => { setOpen(false); setSearch(false); setMega(''); setDrawerOpen(false); }, [location.pathname, location.search, setDrawerOpen]);
  useEffect(() => {
    if (!mega) return;
    const close = e => { if (!headerRef.current?.contains(e.target)) setMega(''); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [mega]);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  return <>
    <div className="announcement"><span>AN EVERYDAY KIND OF EXTRAORDINARY</span><span className="announcement-divider" aria-hidden="true">/</span>Complimentary shipping on orders ₹3,000+</div>
    <header className="site-header" ref={headerRef} onKeyDown={e => { if (e.key === 'Escape' && mega) { megaTriggers.current[mega]?.focus(); setMega(''); } }}>
      <div className="nav-shell">
        <div className="nav-leading"><span className="locale-label">INDIA / INR ₹</span><button className="icon mobile-menu" aria-label="Open navigation" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}><Menu/></button></div>
        <Link className="wordmark" to="/" aria-label="VelvetAura home">VelvetAura<span>THE ART OF EVERYDAY</span></Link>
        <div className="nav-tools">
          <button className="icon" aria-label="Search products" aria-haspopup="dialog" onClick={() => setSearch(true)}><Search/></button>
          <Link className="icon account-icon" aria-label="Your account" to="/account"><User/></Link>
          <Link className="icon wishlist-icon" aria-label={`Wishlist, ${wishlist.length} items`} to="/wishlist"><Heart/>{wishlist.length > 0 && <motion.b key={wishlist.length} initial={{ opacity: .3 }} animate={{ opacity: 1 }}>{wishlist.length}</motion.b>}</Link>
          <button className="icon" aria-label={`Open shopping bag, ${count} items`} aria-haspopup="dialog" onClick={() => setDrawerOpen(true)}><ShoppingBag/>{count > 0 && <motion.b key={count} initial={{ opacity: .3 }} animate={{ opacity: 1 }}>{count}</motion.b>}</button>
        </div>
      </div>
      <nav className="desktop-navigation" aria-label="Main navigation">{navigation.map(([label, url]) => ['Women', 'Men'].includes(label) ? <div className="nav-department" key={label}><Link className={isCurrent(url, location) || location.pathname.startsWith(`/shop/${label.toLowerCase()}`) ? 'active' : ''} to={`/shop/${label.toLowerCase()}`}>{label}</Link><button ref={node => { megaTriggers.current[label] = node; }} aria-label={`Explore ${label.toLowerCase()}’s categories`} aria-expanded={mega === label} aria-controls="wardrobe-menu" onClick={() => setMega(mega === label ? '' : label)}><ChevronDown size={13}/></button></div> : <Link key={url} className={isCurrent(url, location) ? 'active' : ''} aria-current={isCurrent(url, location) ? 'page' : undefined} to={url}>{label}</Link>)}</nav>
      <AnimatePresence>{mega && <motion.div id="wardrobe-menu" className="mega-menu" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .16 }}><div className="mega-intro"><p className="eyebrow">THE {mega.toUpperCase()}’S WARDROBE</p><h2>Find your<br/><em>everyday.</em></h2><Link className="text-link" to={`/shop/${mega.toLowerCase()}`}>Explore all pieces<ArrowRight size={16}/></Link><Link className="text-link" to={`/shop?gender=${mega}&edit=new`}>New arrivals<ArrowUpRight size={16}/></Link></div><nav className="mega-categories" aria-label={`${mega} categories`}>{categoriesFor(mega).map(c => <Link key={c.id} to={c.href}>{c.name}<span>{products.filter(p => p.subcategory === c.id).length}</span></Link>)}</nav><Link className="mega-editorial" to={`/shop/${mega.toLowerCase()}`}><FashionImage src={mega === 'Men' ? editorial.men : editorial.women} alt={`The ${mega.toLowerCase()}’s editorial collection`} sizes="220px"/><span>A point of view for every day<ArrowUpRight size={16}/></span></Link></motion.div>}</AnimatePresence>
    </header>
    <AnimatePresence>
      {open && <Dialog title="Explore VelvetAura" side onClose={() => setOpen(false)}><p className="eyebrow menu-eyebrow">A WARDROBE THAT FEELS LIKE YOU</p><nav className="mobile-navigation" aria-label="Mobile navigation">{navigation.map(([label, url]) => ['Women', 'Men'].includes(label) ? <details key={label} className="mobile-department"><summary>{label}<ChevronDown size={18}/></summary><Link to={`/shop/${label.toLowerCase()}`}>All {label.toLowerCase()}’s pieces<ArrowUpRight size={15}/></Link>{categoriesFor(label).map(c => <Link to={c.href} key={c.id}>{c.name}</Link>)}</details> : <Link key={url} to={url} aria-current={isCurrent(url, location) ? 'page' : undefined} onClick={() => setOpen(false)}>{label}<ArrowUpRight size={19}/></Link>)}<Link to="/account" onClick={() => setOpen(false)}>Your account<User size={18}/></Link><Link to="/wishlist" onClick={() => setOpen(false)}>Your saved edit ({wishlist.length})<Heart size={18}/></Link></nav><Link className="menu-story text-link" to="/about">The VelvetAura story<ArrowRight size={16}/></Link></Dialog>}
      {search && <Dialog title="What speaks to you?" onClose={() => setSearch(false)}><form className="search-panel" onSubmit={e => { e.preventDefault(); navigate(`/shop?q=${encodeURIComponent(q.trim())}`); setSearch(false); }}><Search size={19}/><input aria-label="Search products by name" placeholder="Search shirts, knits, dresses…" value={q} onChange={e => setQ(e.target.value)}/><button type="submit" className="search-submit" aria-label="Submit product search"><ArrowRight size={22}/></button></form><div className="search-suggestions"><p className="eyebrow">A GOOD PLACE TO START</p>{[['New arrivals', '/shop?edit=new'], ['Everyday shirts', '/shop?category=Shirts'], ['The soft edit', '/shop?category=Knitwear']].map(([label, url]) => <Link key={url} to={url} onClick={() => setSearch(false)}>{label}<ArrowUpRight size={16}/></Link>)}</div></Dialog>}
      {drawerOpen && <CartDrawer onClose={() => setDrawerOpen(false)}/>}
    </AnimatePresence>
  </>;
}

export function Benefits() {
  return <div className="benefits"><div><Truck/><span>COMPLIMENTARY SHIPPING<small>On orders above ₹3,000</small></span></div><div><RefreshCw/><span>ROOM TO CHANGE YOUR MIND<small>14-day returns · proposed policy</small></span></div><div><ShieldCheck/><span>THOUGHTFULLY SELECTED<small>Style that goes beyond the season</small></span></div></div>;
}

export function Newsletter() {
  const { notify } = useStore();
  const [email, setEmail] = useState('');
  return <section className="newsletter"><div><p className="eyebrow">LETTERS FROM VELVETAURA</p><h2>Something good.<br/><em>Every now and then.</em></h2></div><div><p>Fresh perspectives, new collections and a little inspiration. Consider this your invitation.</p><form onSubmit={e => { e.preventDefault(); notify('Email validated. Newsletter signup will be available when we launch.'); setEmail(''); }}><input aria-label="Email for newsletter" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email address"/><button type="submit" aria-label="Subscribe to newsletter"><ArrowRight size={23}/></button></form><small>Preview only. Your email is not sent or stored.</small></div></section>;
}

export function Footer() {
  return <footer>
    <div className="footer-top"><div className="footer-brand"><Link className="wordmark" to="/">VelvetAura</Link><p>Quiet confidence. Effortless style.<br/>A wardrobe that feels like you.</p><a className="social icon" href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Explore Instagram"><Instagram size={18}/></a></div><div><h4>EXPLORE</h4><Link to="/shop?gender=Women">Women</Link><Link to="/shop?gender=Men">Men</Link><Link to="/shop?edit=new">New arrivals</Link><Link to="/collections">Collections</Link></div><div><h4>HERE TO HELP</h4><Link to="/contact">Contact us</Link><Link to="/policies#shipping">Shipping & returns</Link><Link to="/policies#sizing">Size guide</Link><Link to="/wishlist">Your wishlist</Link></div><div><h4>THE BRAND</h4><Link to="/about">Our story</Link><Link to="/about#philosophy">Our philosophy</Link><Link to="/policies#privacy">Privacy & terms</Link><Link to="/account">Your account</Link></div></div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} VelvetAura. All rights reserved.</span><span>INDIA · INR ₹<span className="dot">●</span>PORTFOLIO STORE · DEMONSTRATION STOCK & PRICING</span></div>
    <div className="footer-credit">
      <div>
        <p className="footer-credit-byline">Designed &amp; Developed by <span>Aditya Raj</span></p>
        <p className="footer-credit-note">Crafted with care, creativity, and code.</p>
      </div>
      <a className="footer-credit-link" href="https://www.linkedin.com/in/adityarajtech19/" target="_blank" rel="noopener noreferrer" aria-label="Connect on LinkedIn with Aditya Raj (opens in a new tab)">
        <Linkedin size={17} aria-hidden="true" focusable="false"/>
        <span>Connect on LinkedIn</span>
        <ArrowUpRight size={15} aria-hidden="true" focusable="false"/>
      </a>
    </div>
  </footer>;
}
