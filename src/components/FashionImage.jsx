import { useState } from 'react';
import imageManifest from '../data/image-manifest.json';

/** Responsive local photography; failure uses a tiny embedded copy of this exact photo. */
export default function FashionImage({ src, alt, className = '', sizes = '100vw', priority = false, style }) {
  const [failedSource, setFailedSource] = useState(null);
  const failed = failedSource === src;
  const image = imageManifest[src];
  return <img
    className={`fashion-image ${failed ? 'image-preview' : ''} ${className}`}
    src={failed ? image?.preview || image?.small || '/image-fallback.svg' : src}
    srcSet={!failed && image ? `${image.small} ${image.smallWidth || 480}w, ${src} ${image.width}w` : undefined}
    sizes={image ? sizes : undefined}
    width={image?.width || 900}
    height={image?.height || 1200}
    alt={failed ? `${alt}. A lower-resolution preview is shown.` : alt}
    loading={priority ? 'eager' : 'lazy'}
    fetchPriority={priority ? 'high' : undefined}
    decoding="async"
    style={style}
    onError={() => { if (!failed) setFailedSource(src); }}
  />;
}
