import { useEffect, useRef, useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
export default function Dialog({ title, onClose, side = false, children }) {
  const ref = useRef(null), titleId = useId(), reduced = useReducedMotion();
  useEffect(() => {
    const node = ref.current, previous = document.activeElement, overflow = document.body.style.overflow;
    node.showModal(); document.body.style.overflow = 'hidden';
    return () => { node.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, []);
  return <motion.dialog ref={ref} className={`va-dialog ${side ? 'side-dialog' : ''}`} aria-labelledby={titleId} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }} initial={reduced ? false : { opacity: 0, x: side ? 40 : 0 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .2 }}><div className="dialog-content"><div className="dialog-heading"><h2 id={titleId}>{title}</h2><button className="icon" autoFocus aria-label={`Close ${title}`} onClick={onClose}><X/></button></div>{children}</div></motion.dialog>;
}
