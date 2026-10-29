import { Component, Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react';
import { StoreProvider } from './context/Store';
import { AuthProvider, RequireAuth } from './context/AuthContext';
import { Navbar, Footer } from './components/Layout';
import { Skeleton } from './components/Motion';
import Home from './pages/Home';
import Shop, { Collections } from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart, { Wishlist } from './pages/Cart';
import { About, Contact, Policies, NotFound } from './pages/Info';
const Auth = lazy(() => import('./pages/Auth'));
const Recovery = lazy(() => import('./pages/Auth').then(m => ({ default: m.Recovery })));
const Account = lazy(() => import('./pages/Account'));
class ErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() { return this.state.error ? <div className="empty"><h1>Something needs a little attention.</h1><p>Reload to try again. Your saved bag stays in this browser.</p><button className="button" onClick={() => window.location.reload()}>Reload storefront</button></div> : this.props.children; }
}
const titles = { '/': 'Wear your aura', '/shop': 'The collection', '/collections': 'The edits', '/cart': 'Your shopping bag', '/wishlist': 'Your saved edit', '/about': 'Our story', '/contact': 'Let’s talk', '/account': 'Your account', '/login': 'Sign in', '/signup': 'Create account', '/forgot-password': 'Password recovery', '/reset-password': 'Reset password', '/verify-email': 'Verify email', '/resend-verification': 'Email verification', '/policies': 'Useful details' };
function Pages() {
  const location = useLocation(), reduced = useReducedMotion();
  useEffect(() => { document.title = `${titles[location.pathname] || (location.pathname.startsWith('/product/') ? 'A considered piece' : location.pathname.startsWith('/shop/') ? 'The collection' : 'Page not found')} — VelvetAura`; if (!location.hash) window.scrollTo(0, 0); }, [location.pathname]);
  return <AnimatePresence mode="wait" initial={false}><motion.div key={location.pathname} id="main-content" tabIndex={-1} className="route-surface" initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: reduced ? 1 : 0 }} transition={{ duration: reduced ? 0 : .16 }}><Suspense fallback={<Skeleton/>}><Routes location={location}><Route path="/" element={<Home/>}/><Route path="/shop" element={<Shop/>}/><Route path="/shop/:department" element={<Shop/>}/><Route path="/shop/:department/:slug" element={<Shop/>}/><Route path="/collections" element={<Collections/>}/><Route path="/product/:id" element={<ProductDetails/>}/><Route path="/cart" element={<Cart/>}/><Route path="/wishlist" element={<Wishlist/>}/><Route path="/about" element={<About/>}/><Route path="/contact" element={<Contact/>}/><Route path="/login" element={<Auth key="login"/>}/><Route path="/signup" element={<Auth key="signup" signup/>}/><Route path="/forgot-password" element={<Recovery key="forgot" mode="forgot"/>}/><Route path="/reset-password" element={<Recovery key="reset" mode="reset"/>}/><Route path="/verify-email" element={<Recovery key="verify" mode="verify"/>}/><Route path="/resend-verification" element={<Recovery key="resend" mode="resend"/>}/><Route path="/account" element={<RequireAuth><Account/></RequireAuth>}/><Route path="/policies" element={<Policies/>}/><Route path="*" element={<NotFound/>}/></Routes></Suspense></motion.div></AnimatePresence>;
}
export default function App() { return <ErrorBoundary><MotionConfig reducedMotion="user"><BrowserRouter><AuthProvider><StoreProvider><a className="skip-link" href="#main-content">Skip to content</a><Navbar/><Pages/><Footer/></StoreProvider></AuthProvider></BrowserRouter></MotionConfig></ErrorBoundary>; }
