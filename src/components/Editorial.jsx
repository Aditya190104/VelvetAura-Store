import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import FashionImage from './FashionImage';
import { Reveal } from './Motion';

export function SectionHeading({ eyebrow, title, href, linkLabel }) {
  return <div className="section-heading">
    <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>
    {href && <Link className="text-link" to={href}>{linkLabel}<ArrowRight size={17}/></Link>}
  </div>;
}

export function EditorialCard({ number, title, description, image, alt, href, label }) {
  return <Reveal className="edit-card">
    <Link className="edit-card-image" to={href} aria-label={label}>
      <FashionImage src={image} alt={alt} sizes="(max-width: 640px) 100vw, 50vw"/>
      <span className="edit-image-label">THE VELVETAURA EDIT · {number}</span>
      <span className="edit-image-arrow" aria-hidden="true"><ArrowUpRight size={25}/></span>
    </Link>
    <div className="edit-card-caption"><div><h3><Link to={href}>{title}</Link></h3><p>{description}</p></div><Link to={href} className="text-link">{label}<ArrowRight size={16}/></Link></div>
  </Reveal>;
}
