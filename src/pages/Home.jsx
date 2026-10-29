import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Star } from 'lucide-react';
import { products } from '../data/products';
import { editorial } from '../data/media';
import { ProductGrid } from '../components/ProductCard';
import { Benefits, Newsletter } from '../components/Layout';
import { SectionHeading, EditorialCard } from '../components/Editorial';
import { Reveal } from '../components/Motion';
import FashionImage from '../components/FashionImage';
import ProductCarousel from '../components/ProductCarousel';
import { categoryById } from '../data/categories';

const quotes = [
  ['The kind of pieces you reach for without thinking. Understated, but never unnoticed.', 'Ananya S.', 'Mumbai'],
  ['Finally, everyday essentials that feel a little more special. The fit is everything.', 'Rohan M.', 'Bengaluru'],
  ['Simple, beautiful, and so easy to style. Exactly what my wardrobe was missing.', 'Priya K.', 'New Delhi'],
];

export default function Home() {
  return <main>
    <section className="editorial-hero" aria-labelledby="hero-title">
      <div className="editorial-hero-copy">
        <Reveal><p className="eyebrow">THE EVERYDAY EDIT / VOLUME 02</p></Reveal>
        <Reveal delay={0.07}><h1 id="hero-title">A quieter kind<br/>of <em>statement.</em></h1></Reveal>
        <Reveal delay={0.14}><p className="hero-description">Modern silhouettes. An effortless point of view.<br/> Pieces to make entirely your own.</p><Link className="button" to="/shop">Discover the collection<ArrowUpRight size={18}/></Link></Reveal>
        <div className="hero-colophon"><span>CONSIDERED. INDIVIDUAL. EVERYDAY.</span><span>MEN / WOMEN / EVERYDAY</span></div>
      </div>
      <div className="editorial-hero-image"><FashionImage src={editorial.hero} alt="A relaxed beige suit styled with a black top in a sunlit, minimal studio" priority sizes="(max-width: 760px) 100vw, 56vw"/><span className="campaign-caption">THE ART OF EVERYDAY</span></div>
    </section>
    <Benefits/>

    <section className="section shop-by-edit">
      <SectionHeading eyebrow="TWO PERSPECTIVES. ONE POINT OF VIEW." title="Find your everyday." href="/collections" linkLabel="Explore the edits"/>
      <div className="editorial-pair">
        <EditorialCard number="01" title="The women’s edit" description="Soft lines. A little quiet confidence." image={editorial.women} alt="A woman in a neutral blazer and shorts beside a pale architectural wall" href="/shop/women" label="Shop women"/>
        <EditorialCard number="02" title="The men’s edit" description="Easy layers. Understated by design." image={editorial.men} alt="A man wearing a camel overcoat with a white shirt and dark trousers" href="/shop/men" label="Shop men"/>
      </div>
    </section>

    <section className="section category-discovery"><div><p className="eyebrow">START WITH WHAT YOU LOVE</p><h2>Your wardrobe,<br/> <em>your point of view.</em></h2><p>{products.length} considered pieces. Find your fit.</p></div><div className="category-shortcut-grid">{['women-dresses', 'men-linen-shirts', 'women-co-ord-sets', 'men-polo-t-shirts', 'women-knitwear', 'men-jeans-denim'].map((id, i) => { const category = categoryById[id]; const p = products.find(p => p.subcategory === id && p.id.startsWith('va-')); return <Link key={id} to={category.href}><div><FashionImage src={p?.images[0] || editorial.wardrobe} alt={`${category.department} / ${category.name}`} sizes="(max-width: 600px) 40vw, 15vw"/></div><small>{category.department}</small><h3>{category.name}<ArrowUpRight size={15}/></h3></Link>; })}</div></section>
    <ProductCarousel eyebrow="NEW IN THE WARDROBE" title="Fresh arrivals. Lasting appeal." href="/shop?edit=new" products={products.filter(p => p.tag === 'NEW').sort((a, b) => b.newness - a.newness).filter((p, i) => i % 4 === 0).slice(0, 8)}/>

    <section className="soft-story" aria-labelledby="soft-title">
      <div className="soft-story-image"><FashionImage src={editorial.soft} alt="An ivory knitted layer arranged with blue denim and warm beige accessories" sizes="(max-width: 760px) 100vw, 50vw"/></div>
      <Reveal className="soft-story-copy"><p className="eyebrow">TEXTURE, TONE & A LITTLE ROOM TO BREATHE</p><h2 id="soft-title">The softer<br/><em>side of everyday.</em></h2><p>Warm neutrals. Tactile layers. Uncomplicated pieces that feel as good as a slow Sunday.</p><Link className="text-link" to="/shop?category=Knitwear">Discover the soft edit<ArrowUpRight size={19}/></Link><span className="editorial-footnote">VELVETAURA / THE SOFT EDIT</span></Reveal>
    </section>

    <section className="section">
      <SectionHeading eyebrow="RETURN TO WHAT YOU LOVE" title="On repeat, for a reason." href="/shop?edit=best" linkLabel="Shop the favourites"/>
      <ProductGrid products={products.filter(p => p.tag === 'BESTSELLER').slice(0, 4)}/>
    </section>

    <ProductCarousel eyebrow="THE PIECES IN FOCUS" title="Trending in the edit." href="/shop?edit=trending" products={products.filter(p => p.trending && p.id.startsWith('va-')).filter((p, i) => i % 5 === 0).slice(0, 8)}/>

    <section className="brand-story section">
      <div className="brand-story-image"><FashionImage src={editorial.story} alt="A carefully arranged wardrobe in natural ivory, beige and charcoal tones" sizes="(max-width: 760px) 100vw, 45vw"/><span>FEWER PIECES. MORE POSSIBILITY.</span></div>
      <Reveal className="brand-story-copy"><p className="eyebrow">THE VELVETAURA PHILOSOPHY</p><h2>A wardrobe.<br/><em>A way of feeling.</em></h2><p>We believe the pieces you keep coming back to say the most about you. Thoughtful in their details. Easy in their expression. Beautiful in the everyday.</p><p>That’s our point of view. Modern essentials with a little room for you.</p><Link className="text-link" to="/about">Read our story<ArrowRight size={17}/></Link></Reveal>
    </section>

    <section className="testimonials"><p className="eyebrow">THE FEELING OF VELVETAURA</p><div className="quote-grid">{quotes.map(([quote, name, city]) => <figure key={name}><div className="stars" aria-label="5 out of 5 stars">{Array.from({ length: 5 }, (_, i) => <Star size={12} key={i} fill="currentColor"/>)}</div><blockquote>“{quote}”</blockquote><figcaption>{name}<span>{city}</span></figcaption></figure>)}</div><p className="preview-caption">Illustrative reviews for this storefront preview.</p></section>
    <Newsletter/>
  </main>;
}
