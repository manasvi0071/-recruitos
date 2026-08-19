import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const ROLES = [
  {
    key: 'recruiter',
    label: 'Recruiter',
    color: '#8B5CF6',
    glow: 'rgba(139,92,246,0.25)',
    desc: 'Manage campus drives, candidates and hiring pipelines',
    features: ['Post & manage jobs', 'Review candidates', 'Track applications', 'Analytics & reports'],
  },
  {
    key: 'candidate',
    label: 'Candidate',
    color: '#2563EB',
    glow: 'rgba(37,99,235,0.25)',
    desc: 'Browse jobs, track applications and interview updates',
    features: ['Browse job openings', 'Track applications', 'Interview updates', 'Offer letters'],
  },
  {
    key: 'corporate',
    label: 'Corporate',
    color: '#059669',
    glow: 'rgba(5,150,105,0.25)',
    desc: 'Post jobs, review applications and hire top talent',
    features: ['Company dashboard', 'Post job openings', 'View applications', 'Hiring reports'],
  },
  {
    key: 'admin',
    label: 'Admin',
    color: '#EA580C',
    glow: 'rgba(234,88,12,0.25)',
    desc: 'Manage users, roles and platform settings',
    features: ['User management', 'Role & permissions', 'System settings', 'Activity logs'],
  },
];

const STAT_ITEMS = [
  { value: '38+', label: 'Colleges' },
  { value: '12', label: 'Companies' },
  { value: '94', label: 'Selections' },
  { value: '75%', label: 'Placement rate' },
];

export default function LoginSelect() {
  const [role, setRole] = useState('recruiter');
  const [tab, setTab] = useState('signin');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [animating, setAnimating] = useState(false);
  const [counts, setCounts] = useState({ 0: 0, 1: 0, 2: 0, 3: 0 });

  const active = ROLES.find(r => r.key === role);

  // Animate stat counters on mount
  useEffect(() => {
    const targets = [38, 12, 94, 75];
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setCounts({
        0: Math.round(targets[0] * eased),
        1: Math.round(targets[1] * eased),
        2: Math.round(targets[2] * eased),
        3: Math.round(targets[3] * eased),
      });
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  const switchRole = (r) => {
    if (r === role) return;
    setAnimating(true);
    setTimeout(() => {
      setRole(r);
      setError('');
      setSuccess('');
      setAnimating(false);
    }, 200);
  };

  const switchTab = (t) => {
    setTab(t);
    setError('');
    setSuccess('');
    setForm({ name: '', email: '', password: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (tab === 'signin') {
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (authErr) {
        setError(authErr.message);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, approved')
        .eq('id', authData.user.id)
        .single();

      if (profile?.role && profile.role !== role) {
        await supabase.auth.signOut();
        setError(`This is a ${profile.role} account. Please select "${profile.role}" role and try again.`);
        setLoading(false);
        return;
      }

      window.location.href = '/app';
    } else {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        setSuccess(role === 'candidate'
          ? 'Account created! You can now sign in.'
          : 'Request submitted. An admin will approve your account shortly.');
        switchTab('signin');
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 8,
    border: '1.5px solid #E5E5EF',
    fontSize: 14,
    background: '#FAFAFA',
    color: '#0D0D1A',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      background: '#F4F4F8',
    }}>

      {/* ===== LEFT PANEL ===== */}
      <div style={{
        width: 420,
        flexShrink: 0,
        background: '#0D0D1A',
        display: 'flex',
        flexDirection: 'column',
        padding: '36px 32px',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Ambient glow — changes with role */}
        <div style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${active.glow}, transparent 70%)`,
          top: -120,
          right: -120,
          transition: 'background 0.5s ease',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          width: 250,
          height: 250,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${active.glow}, transparent 70%)`,
          bottom: 40,
          left: -60,
          transition: 'background 0.5s ease',
          pointerEvents: 'none',
          opacity: 0.5,
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 52, position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2 3 7l9 5 9-5-9-5Zm0 7L3 14v3l9 5 9-5v-3l-9 5-9-5V9Z"/>
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-.01em' }}>Saarthi</span>
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '.1em',
            color: '#A78BFA',
            background: 'rgba(124,58,237,.2)',
            border: '1px solid rgba(124,58,237,.3)',
            padding: '2px 8px',
            borderRadius: 20,
          }}>CAMPUS</span>
        </div>

        {/* Role selector */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
          <div style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.3)',
            marginBottom: 10,
          }}>
            Select your role
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 32 }}>
            {ROLES.map((r) => (
              <button
                key={r.key}
                onClick={() => switchRole(r.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: `1px solid ${role === r.key ? r.color + '50' : 'rgba(255,255,255,.07)'}`,
                  background: role === r.key ? r.color + '18' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: r.color,
                  flexShrink: 0,
                  boxShadow: role === r.key ? `0 0 10px ${r.color}` : 'none',
                  transition: 'box-shadow 0.2s',
                }} />
                <span style={{
                  fontSize: 13,
                  fontWeight: role === r.key ? 700 : 400,
                  color: role === r.key ? '#fff' : 'rgba(255,255,255,.45)',
                  transition: 'all 0.2s',
                  flex: 1,
                }}>
                  {r.label}
                </span>
                {role === r.key && (
                  <span style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: r.color,
                    background: r.color + '20',
                    border: `1px solid ${r.color}40`,
                    padding: '2px 8px',
                    borderRadius: 20,
                    letterSpacing: '.04em',
                  }}>
                    ACTIVE
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Role info — animates on switch */}
          <div style={{
            opacity: animating ? 0 : 1,
            transform: animating ? 'translateY(6px)' : 'translateY(0)',
            transition: 'all 0.2s ease',
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: active.color,
              background: active.color + '18',
              border: `1px solid ${active.color}35`,
              display: 'inline-block',
              padding: '3px 10px',
              borderRadius: 20,
              marginBottom: 12,
              transition: 'all 0.3s',
            }}>
              {active.label} portal
            </div>

            <div style={{
              fontSize: 22,
              fontWeight: 300,
              color: '#fff',
              lineHeight: 1.3,
              letterSpacing: '-.02em',
              marginBottom: 10,
            }}>
              Smart hiring,{' '}
              <span style={{
                fontWeight: 700,
                background: `linear-gradient(90deg, ${active.color}, #67e8f9)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                zero friction.
              </span>
            </div>

            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.4)', lineHeight: 1.7, marginBottom: 20 }}>
              {active.desc}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {active.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,.55)' }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: active.color, flexShrink: 0 }} />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          borderTop: '1px solid rgba(255,255,255,.07)',
          paddingTop: 20,
          marginTop: 24,
          position: 'relative',
          zIndex: 1,
        }}>
          {STAT_ITEMS.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 16,
                fontWeight: 700,
                color: active.color,
                fontVariantNumeric: 'tabular-nums',
                transition: 'color 0.3s',
              }}>
                {i === 3 ? `${counts[i]}%` : `${counts[i]}${i === 0 ? '+' : ''}`}
              </div>
              <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== RIGHT PANEL ===== */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 32px',
      }}>
        <div style={{ width: '100%', maxWidth: 360 }}>

          {/* Tab switcher */}
          <div style={{
            display: 'flex',
            background: '#E8E8F0',
            borderRadius: 10,
            padding: 3,
            gap: 3,
            marginBottom: 32,
          }}>
            {['signin', 'register'].map(t => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: tab === t ? 700 : 500,
                  cursor: 'pointer',
                  background: tab === t ? '#fff' : 'transparent',
                  color: tab === t ? '#0D0D1A' : '#9090B0',
                  transition: 'all 0.2s',
                  boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                  fontFamily: 'inherit',
                }}
              >
                {t === 'signin' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: active.color,
              marginBottom: 8,
              transition: 'color 0.3s',
            }}>
              {active.label}
            </div>
            <h2 style={{
              fontSize: 22,
              fontWeight: 500,
              color: '#0D0D1A',
              letterSpacing: '-.025em',
              margin: 0,
              marginBottom: 5,
            }}>
              {tab === 'signin' ? 'Welcome back' : 'Create account'}
            </h2>
            <p style={{ fontSize: 13, color: '#9090B0', margin: 0 }}>
              {tab === 'signin'
                ? `Sign in as ${active.label} to continue`
                : `Register as ${active.label} to get started`}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>

              {tab === 'register' && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 6 }}>
                    Full name
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Priya Sharma"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    style={inputStyle}
                    onFocus={e => {
                      e.target.style.borderColor = active.color;
                      e.target.style.boxShadow = `0 0 0 3px ${active.color}15`;
                      e.target.style.background = '#fff';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#E5E5EF';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = '#FAFAFA';
                    }}
                  />
                </div>
              )}

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 6 }}>
                  Email address
                </div>
                <input
                  type="email"
                  required
                  placeholder="you@talentcorner.in"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={inputStyle}
                  onFocus={e => {
                    e.target.style.borderColor = active.color;
                    e.target.style.boxShadow = `0 0 0 3px ${active.color}15`;
                    e.target.style.background = '#fff';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#E5E5EF';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = '#FAFAFA';
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 6 }}>
                  Password
                </div>
                <input
                  type="password"
                  required
                  placeholder="Min. 6 characters"
                  minLength={6}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={inputStyle}
                  onFocus={e => {
                    e.target.style.borderColor = active.color;
                    e.target.style.boxShadow = `0 0 0 3px ${active.color}15`;
                    e.target.style.background = '#fff';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#E5E5EF';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = '#FAFAFA';
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={{
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 12.5,
                color: '#DC2626',
                marginBottom: 14,
                lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                background: '#D1FAE5',
                border: '1px solid #6EE7B7',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 12.5,
                color: '#059669',
                marginBottom: 14,
                lineHeight: 1.5,
              }}>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 9,
                border: 'none',
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                color: '#fff',
                background: loading
                  ? '#9CA3AF'
                  : `linear-gradient(135deg, ${active.color}, #06B6D4)`,
                letterSpacing: '.01em',
                transition: 'all 0.25s ease',
                fontFamily: 'inherit',
                boxShadow: loading ? 'none' : `0 4px 16px ${active.color}35`,
              }}
              onMouseEnter={e => { if (!loading) e.target.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; }}
            >
              {loading
                ? 'Please wait...'
                : tab === 'signin'
                ? `Sign in as ${active.label}`
                : `Create ${active.label} account`}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            margin: '20px 0',
            fontSize: 11.5,
            color: '#B0B0C8',
          }}>
            <div style={{ flex: 1, height: 1, background: '#E5E5EF' }} />
            or
            <div style={{ flex: 1, height: 1, background: '#E5E5EF' }} />
          </div>

          {/* Social row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            {['Google', 'Microsoft'].map(s => (
              <button
                key={s}
                type="button"
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: 8,
                  border: '1.5px solid #E5E5EF',
                  background: '#fff',
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: '#374151',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => {
                  e.target.style.borderColor = active.color;
                  e.target.style.color = active.color;
                }}
                onMouseLeave={e => {
                  e.target.style.borderColor = '#E5E5EF';
                  e.target.style.color = '#374151';
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Footer note */}
          <div style={{ textAlign: 'center', fontSize: 12, color: '#B0B0C8' }}>
            {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => switchTab(tab === 'signin' ? 'register' : 'signin')}
              style={{
                background: 'none',
                border: 'none',
                color: active.color,
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'color 0.2s',
              }}
            >
              {tab === 'signin' ? 'Register →' : 'Sign in →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}