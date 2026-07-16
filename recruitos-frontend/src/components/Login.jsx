import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
    }
  }

  return (
    <div id="screen-login">
      <div className="login-brand-side">
        <div className="login-logo">
          <div className="brand-mark">R</div>
          <div>
            <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 17, color: 'var(--white)' }}>RecruitOS</div>
            <div style={{ fontSize: 10, color: 'var(--gold-soft)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Campus Recruitment Platform</div>
          </div>
        </div>
        <div className="login-tagline">One platform to run every <em>campus</em> and <em>corporate</em> hiring drive, end to end.</div>
        <div className="login-meta">From job profile to joining day — campus database, resume intelligence, assessments, offers, and reporting, unified for Talent Corner.</div>
        <div className="login-stats">
          <div><div className="n">38+</div><div className="l">Campuses Engaged</div></div>
          <div><div className="n">12</div><div className="l">Corporate Clients</div></div>
          <div><div className="n">94</div><div className="l">Selections this drive</div></div>
        </div>
      </div>
      <div className="login-form-side">
        <div className="login-card">
          <div className="login-logo">
            <div className="brand-mark">R</div>
            <div>
              <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 17, color: 'var(--navy-deep)' }}>RecruitOS</div>
              <div style={{ fontSize: 10, color: 'var(--slate-light)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Campus Recruitment Platform</div>
            </div>
          </div>
          <h2>Welcome back, Admin</h2>
          <p className="sub">Sign in to the Talent Corner workspace</p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && (
              <p style={{ color: 'var(--red, #d64545)', fontSize: 12.5, marginTop: -6, marginBottom: 12 }}>{error}</p>
            )}
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--slate-light)', marginTop: 16 }}>Administrator access only</p>
        </div>
      </div>
    </div>
  );
}