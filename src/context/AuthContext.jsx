import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { api, apiConfigured, localAccountSetup, resetCsrf } from '../services/api';
import { Skeleton } from '../components/Motion';
const Context = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null), [status, setStatus] = useState(apiConfigured ? 'loading' : 'unconfigured'), [error, setError] = useState('');
  const generation = useRef(0), channel = useRef(null);
  const refresh = useCallback(async () => {
    if (!apiConfigured) return;
    const current = ++generation.current;
    try { const data = await api('/auth/me'); if (current !== generation.current) return; setUser(data.user); setStatus('ready'); setError(''); }
    catch (e) { if (current !== generation.current) return; setUser(null); setStatus(e.status === 401 ? 'ready' : 'error'); setError(e.message); }
  }, []);
  useEffect(() => {
    refresh();
    const clear = () => { setUser(null); setStatus('ready'); resetCsrf(); };
    const focus = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('va:unauthorized', clear); document.addEventListener('visibilitychange', focus);
    if ('BroadcastChannel' in window) { channel.current = new BroadcastChannel('va-account-events'); channel.current.onmessage = () => { resetCsrf(); refresh(); }; }
    return () => { generation.current++; channel.current?.close(); window.removeEventListener('va:unauthorized', clear); document.removeEventListener('visibilitychange', focus); };
  }, [refresh]);
  function sessionEnded() { generation.current++; setUser(null); setStatus('ready'); resetCsrf(); channel.current?.postMessage('session-changed'); }
  async function login(values) { generation.current++; const data = await api('/auth/login', { method: 'POST', body: values }); setUser(data.user); setStatus('ready'); channel.current?.postMessage('session-changed'); }
  async function logout() { await api('/auth/logout', { method: 'POST' }); sessionEnded(); }
  return <Context.Provider value={{ user, status, error, refresh, login, logout, sessionEnded, setUser }}>{children}</Context.Provider>;
}
export const useAuth = () => useContext(Context);
export function RequireAuth({ children }) {
  const { user, status, error, refresh } = useAuth(), location = useLocation();
  if (status === 'loading') return <Skeleton/>;
  if (status === 'unconfigured' || status === 'error') return <main className="empty account-unavailable"><p className="eyebrow">YOUR VELVETAURA ACCOUNT</p><h1>{localAccountSetup ? 'Start your local account service.' : 'Sign-in is unavailable.'}</h1><p role="status">{status === 'unconfigured' ? 'Accounts are not connected on this website yet. You can still explore the collection and use your shopping bag and wishlist.' : error}</p>{localAccountSetup && <div className="local-account-help"><p>Stop the frontend-only terminal, then run this in the project folder:</p><code>npm run dev:local</code><p>First time? Run <code>npm ci</code> and <code>npm ci --prefix server</code> first. Keep the terminal open, then visit <a href="http://localhost:5173/account">localhost:5173/account</a>.</p></div>}<div className="account-unavailable-actions">{status === 'error' && <button className="button" onClick={refresh}>Try again</button>}<Link className={status === 'error' ? 'text-link' : 'button'} to="/shop">Continue shopping</Link><Link className="text-link" to="/wishlist">Your wishlist</Link></div></main>;
  return user ? children : <Navigate replace to="/login" state={{ from: location.pathname + location.search }}/>;
}
