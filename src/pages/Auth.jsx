import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, apiConfigured } from '../services/api';
import { passwordIssue, safeReturnPath } from '../utils/auth';
import { photo } from '../data/products';
export function PasswordField({ name = 'password', label = 'Password', fresh = false, onChange }) {
  const [show, setShow] = useState(false);
  return <label>{label}<span className="password-input"><input type={show ? 'text' : 'password'} name={name} required minLength={fresh ? 12 : 1} maxLength={fresh ? 72 : 128} autoComplete={fresh ? 'new-password' : 'current-password'} onChange={onChange}/><button type="button" aria-label={`${show ? 'Hide' : 'Show'} ${label.toLowerCase()}`} aria-pressed={show} onClick={() => setShow(!show)}>{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span></label>;
}
export function Feedback({ error, success }) {
  return <div aria-live="polite">{(error || success) && <p className={`${error ? 'field-error' : 'form-success'} feedback-box`} role={error ? 'alert' : 'status'}>{error || success}</p>}</div>;
}
export default function Auth({ signup = false }) {
  const { user, login } = useAuth(), location = useLocation(), navigate = useNavigate();
  const [pending, setPending] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState(''), [password, setPassword] = useState('');
  const returnTo = safeReturnPath(location.state?.from);
  if (user) return <Navigate to={returnTo} replace/>;
  async function submit(e) {
    e.preventDefault(); const form = e.currentTarget, values = Object.fromEntries(new FormData(form));
    setError(''); setSuccess('');
    if (signup && (passwordIssue(values.password) || values.password !== values.confirm)) { setError(passwordIssue(values.password) || 'Both passwords must match.'); return; }
    setPending(true);
    try {
      if (signup) { const data = await api('/auth/register', { method: 'POST', body: { name: values.name.trim(), email: values.email, password: values.password } }); setSuccess(data.message); form.reset(); setPassword(''); }
      else { await login({ email: values.email, password: values.password }); navigate(returnTo, { replace: true }); }
    } catch (e) { setError(e.message); } finally { setPending(false); }
  }
  return <main className="auth-layout"><div className="auth-image"><img src={photo('photo-1445205170230-053b83016050')} alt="VelvetAura wardrobe inspiration"/><h2>Your style.<br/>Your space.</h2></div><div className="auth-form"><p className="eyebrow">THE VELVETAURA COMMUNITY</p><h1>{signup ? 'Make yourself at home.' : 'Welcome back.'}</h1><p>{signup ? 'Create your personal VelvetAura account.' : 'Sign in to your personal space.'}</p>{!apiConfigured && <p className="configuration-note">Account services are not connected on this deployment yet.</p>}<form onSubmit={submit}>{signup && <label>Full name<input name="name" autoComplete="name" required minLength={2} maxLength={80}/></label>}<label>Email address<input type="email" name="email" autoComplete="email" required maxLength={254}/></label><PasswordField fresh={signup} onChange={e => setPassword(e.target.value)}/>{signup ? <><div className="password-guidance"><meter min="0" max="3" value={password.length >= 20 ? 3 : password.length >= 12 ? 2 : password.length ? 1 : 0} aria-label="Password length guidance"/><span>{password.length >= 12 ? 'Minimum length met. Use a unique passphrase.' : '12–72 characters. Longer, unique passphrases are better.'}</span></div><PasswordField fresh name="confirm" label="Confirm password"/><label className="checkbox"><input type="checkbox" required/><span>I agree to the <Link to="/policies#privacy">privacy & terms</Link>.</span></label></> : <Link className="text-link" to="/forgot-password">Forgot your password?</Link>}<Feedback error={error} success={success}/><button className="button" disabled={pending || !apiConfigured}>{pending ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}<ArrowRight size={16}/></button></form><p className="auth-switch">{signup ? 'Already a member?' : 'New to VelvetAura?'} <Link to={signup ? '/login' : '/signup'} state={{ from: returnTo }}>{signup ? 'Sign in' : 'Join us'}</Link></p><Link className="text-link" to="/resend-verification">Resend verification email</Link></div></main>;
}
export function Recovery({ mode }) {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') || '');
  const [pending, setPending] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
  const { sessionEnded } = useAuth();
  const titles = { forgot: 'A fresh start.', reset: 'Choose a new password.', verify: 'Verify your email.', resend: 'A new invitation.' };
  const routes = { forgot: 'forgot-password', reset: 'reset-password', verify: 'verify-email', resend: 'resend-verification' };
  const needsToken = ['reset', 'verify'].includes(mode);
  async function submit(e) {
    e.preventDefault(); const form = e.currentTarget, values = Object.fromEntries(new FormData(form));
    setError(''); setSuccess('');
    if (mode === 'reset' && (passwordIssue(values.password) || values.password !== values.confirm)) { setError(passwordIssue(values.password) || 'Both passwords must match.'); return; }
    setPending(true);
    try {
      const body = mode === 'reset' ? { token, password: values.password } : mode === 'verify' ? { token } : { email: values.email };
      const data = await api(`/auth/${routes[mode]}`, { method: 'POST', body }); setSuccess(data.message); form.reset();
      if (mode === 'reset') sessionEnded();
      if (needsToken) window.history.replaceState(window.history.state, '', window.location.pathname);
    } catch (e) { setError(e.message); } finally { setPending(false); }
  }
  return <main className="auth-form recovery-form"><p className="eyebrow">YOUR ACCOUNT, LOOKED AFTER</p><h1>{titles[mode]}</h1><p>{needsToken ? 'This secure link can be used only once.' : 'Enter your email. An eligible account receives a link when mail delivery is configured.'}</p><form onSubmit={submit}>{!needsToken && <label>Email address<input type="email" name="email" required autoComplete="email"/></label>}{mode === 'reset' && <><PasswordField fresh/><PasswordField fresh name="confirm" label="Confirm password"/></>}{needsToken && !token && <p className="field-error">The link is missing its token. Request a new email.</p>}<Feedback error={error} success={success}/>{!apiConfigured && <p className="configuration-note">Account services are not connected on this deployment.</p>}<button className="button" disabled={pending || !apiConfigured || (needsToken && !token) || Boolean(success)}>{pending ? 'Please wait…' : mode === 'reset' ? 'Save new password' : mode === 'verify' ? 'Verify email' : 'Request email'}</button></form><Link className="text-link" to="/login">Back to sign in</Link></main>;
}
