import { motion, useReducedMotion } from 'motion/react';
export function Reveal({ children, className = '', delay = 0 }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.08 }} transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : delay }}>{children}</motion.div>;
}
export function Skeleton() { return <div className="skeleton-panel" role="status" aria-label="Loading your page"><span className="skeleton skeleton-title"/><span className="skeleton"/><span className="skeleton"/><span className="sr-only">Loading your page</span></div>; }
