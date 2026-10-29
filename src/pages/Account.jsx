import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRound, ShieldCheck, Heart, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { passwordIssue } from '../utils/auth';
import { PasswordField, Feedback } from './Auth';
export default function Account() {
  const { user, setUser, logout, sessionEnded } = useAuth(), navigate = useNavigate();
  const [tab, setTab] = useState('profile'), [pending, setPending] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
  async function submit(e) {
    e.preventDefault(); const values = Object.fromEntries(new FormData(e.currentTarget)); setError(''); setSuccess('');
    if (tab === 'security' && (passwordIssue(values.password) || values.password !== values.confirm)) { setError(passwordIssue(values.password) || 'Both new passwords must match.'); return; }
    setPending(true);
    try {
      if (tab === 'profile') { const data = await api('/auth/profile', { method: 'PATCH', body: { name: values.name.trim() } }); setUser(data.user); setSuccess('Your profile has been updated.'); }
      else { await api('/auth/change-password', { method: 'POST', body: { currentPassword: values.currentPassword, password: values.password } }); sessionEnded(); navigate('/login', { replace: true }); }
    } catch (e) { setError(e.message); } finally { setPending(false); }
  }
  async function signOut() { setPending(true); setError(''); try { await logout(); navigate('/login', { replace: true }); } catch (e) { setError(e.message); } finally { setPending(false); } }
  function select(value) { setTab(value); setError(''); setSuccess(''); }
  return <main className="section"><div className="page-intro"><p className="eyebrow">YOUR VELVETAURA</p><h1>A space that’s yours.</h1><p>Welcome back, {user.name}.</p></div><div className="account-layout"><aside className="account-nav"><button className={tab === 'profile' ? 'selected' : ''} onClick={() => select('profile')}><UserRound size={18}/> Profile</button><button className={tab === 'security' ? 'selected' : ''} onClick={() => select('security')}><ShieldCheck size={18}/> Security</button><Link to="/wishlist"><Heart size={18}/> Your saved edit</Link><button disabled={pending} onClick={signOut}><LogOut size={18}/> Sign out</button></aside><section className="account-panel"><p className="eyebrow">THE PERSONAL DETAILS</p><h2>{tab === 'profile' ? 'Your profile.' : 'Account security.'}</h2><form key={tab} className="form-card" onSubmit={submit}>{tab === 'profile' ? <><label>Full name<input name="name" defaultValue={user.name} required minLength={2} maxLength={80} autoComplete="name"/></label><label>Email address<input value={user.email} readOnly/></label><p className="small">{user.emailVerified ? 'Email verified.' : 'Email not verified.'} Email changes are not enabled in this release.</p>{!user.emailVerified && <Link className="text-link" to="/resend-verification">Verify your email</Link>}</> : <><p className="small">Changing your password signs you out on all devices.</p><PasswordField name="currentPassword" label="Current password"/><PasswordField fresh label="New password"/><PasswordField fresh name="confirm" label="Confirm new password"/></>}<Feedback error={error} success={success}/><button className="button" disabled={pending}>{pending ? 'Saving…' : tab === 'profile' ? 'Save your details' : 'Change password'}</button></form></section></div></main>;
}
