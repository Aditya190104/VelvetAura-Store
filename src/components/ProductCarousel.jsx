import { useRef, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductCard } from './ProductCard';

export default function ProductCarousel({ products, title, eyebrow, href }) {
  const rail = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const measure = () => { const el = rail.current; if (el) setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 }); };
  useEffect(() => {
    measure();
    const observer = new ResizeObserver(measure); if (rail.current) observer.observe(rail.current);
    return () => observer.disconnect();
  }, []);
  function move(direction) {
    const el = rail.current;
    el?.scrollBy({ left: direction * el.clientWidth * .85, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  return <section className="section carousel-section"><div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div><div className="carousel-actions"><Link className="text-link" to={href}>View the edit<ArrowRight size={16}/></Link><button className="icon" disabled={edges.start} aria-label={`Previous ${title} products`} onClick={() => move(-1)}><ArrowLeft size={18}/></button><button className="icon" disabled={edges.end} aria-label={`Next ${title} products`} onClick={() => move(1)}><ArrowRight size={18}/></button></div></div><div className="product-carousel" ref={rail} onScroll={measure} aria-label={title} tabIndex={0}>{products.map(p => <ProductCard key={p.id} product={p}/>)}</div></section>;
}
