import { useState } from 'react';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setStatus('loading');
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setStatus('done');
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  }

 const pageStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-hero)', padding: 24 };
const cardStyle = { background: 'var(--bg-surface)', borderRadius: 'var(--radius-2xl)', padding: '44px 40px', width: '100%', maxWidth: 420, border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xl)', position: 'relative', overflow: 'hidden' };
  if (status === 'done') {
    return (
      <div style={pageStyle}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>Request Submitted</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5, lineHeight: 1.6 }}>
            An admin has been notified. You'll be able to log in once your account is approved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 6 }}>Request Access</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Submit your details — an admin will review your request.</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Full Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: 12.5, marginBottom: 10 }}>{error}</p>}
          <button className="btn-primary" type="submit" disabled={status === 'loading'} style={{ marginTop: 8 }}>
            {status === 'loading' ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 18, textAlign: 'center' }}>
          Already approved? <a href="/app">Log in here</a>
        </p>
      </div>
    </div>
  );
}