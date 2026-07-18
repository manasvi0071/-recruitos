import { useState } from 'react';

const departments = [
  { icon: '🎯', name: 'Talent Acquisition (Recruitment)', color: '#10B981', path: ['HR Intern / Recruitment Trainee', 'Talent Acquisition Executive', 'Senior Talent Acquisition Executive', 'Team Leader – Recruitment', 'Recruitment Manager'] },
  { icon: '📈', name: 'Business Development / Sales', color: '#0891B2', path: ['Business Development Executive', 'Senior Business Development Executive', 'Assistant Manager – Business Development', 'Business Development Manager', 'Senior Business Development Manager'] },
  { icon: '🤝', name: 'Client Servicing / Key Account Management', color: '#14B8A6', path: ['Client Servicing Executive', 'Senior Client Servicing Executive', 'Key Account Manager', 'Senior Key Account Manager', 'Client Servicing Head'] },
  { icon: '⚙️', name: 'Operations', color: '#F59E0B', path: ['Operations Executive', 'Senior Operations Executive', 'Operations Team Leader', 'Assistant Operations Manager', 'Operations Manager'] },
  { icon: '👥', name: 'Human Resources (Internal HR)', color: '#7C3AED', path: ['HR Intern', 'HR Executive', 'Senior HR Executive', 'Assistant HR Manager', 'HR Manager'] },
  { icon: '💰', name: 'Finance & Accounts', color: '#10B981', path: ['Accounts Assistant', 'Accounts Executive', 'Senior Accounts Executive', 'Assistant Finance Manager', 'Finance Manager'] },
  { icon: '📣', name: 'Marketing', color: '#EC4899', path: ['Marketing Intern', 'Digital Marketing Executive', 'Senior Marketing Executive', 'Assistant Marketing Manager', 'Marketing Manager'] },
  { icon: '🗂️', name: 'Administration', color: '#6366F1', path: ['Admin Assistant', 'Admin Executive', 'Senior Admin Executive', 'Administration Manager', 'Senior Administration Manager'] },
  { icon: '🎓', name: 'Training & Learning (L&D)', color: '#14B8A6', path: ['Training Coordinator', 'L&D Executive', 'Senior L&D Executive', 'Training Manager', 'Head – Learning & Development'] },
  { icon: '💻', name: 'IT / Technical Support', color: '#7C3AED', path: ['IT Support Executive', 'System Administrator', 'Senior IT Executive', 'IT Manager', 'Head – IT Operations'] },
];

const levels = [
  { n: '1', label: 'Entry Level', sub: '0–1 Year' },
  { n: '2', label: 'Executive Level', sub: '1–3 Years' },
  { n: '3', label: 'Senior Level', sub: '3–5 Years' },
  { n: '4', label: 'Leadership Level', sub: '5–8 Years' },
  { n: '5', label: 'Management Level', sub: '8+ Years' },
];

const stats = [
  { n: '2002', l: 'Founded' },
  { n: '200+', l: 'Team Members' },
  { n: '15', l: 'Locations in India' },
  { n: '900+', l: 'Clients Served' },
];

export default function Landing() {
  const [activeDept, setActiveDept] = useState(departments[0]);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      {/* ===== NAV ===== */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 48px', position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-default)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="brand-mark">TC</div>
          <div>
            <div className="brand-name">Talent Corner</div>
            <div className="brand-sub">HR Services</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 28, fontSize: 13.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
          <a href="#about">About</a>
          <a href="#growth">Career Growth</a>
          <a href="#contact">Contact</a>
        </div>
        <button className="btn-gold">Join Us</button>
      </nav>

      {/* ===== HERO ===== */}
      <section style={{
        background: 'var(--gradient-hero)', color: 'white', padding: '90px 48px 70px',
        position: 'relative', overflow: 'hidden', textAlign: 'center',
      }}>
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.3), transparent 70%)',
          top: -200, left: '50%', transform: 'translateX(-50%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 780, margin: '0 auto' }}>
          <span className="pill" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
            India's Leading HR Management Company
          </span>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 46, fontWeight: 700,
            margin: '20px 0 16px', lineHeight: 1.15, color: 'white',
          }}>
            Connecting the <em style={{
              fontStyle: 'italic', background: 'var(--gradient-brand-2)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Right Talent</em> with the Right Opportunity
          </h1>
          <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 32 }}>
            Since 2002, Talent Corner has grown from a team of three into one of India's leading
            HR Management companies — serving 900+ clients across 15 locations nationwide.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
            <button className="btn-gold" style={{ padding: '13px 28px', fontSize: 14 }}>Explore Careers</button>
            <button className="btn-outline" style={{ padding: '13px 28px', fontSize: 14, background: 'transparent', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
              Partner With Us
            </button>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section style={{ padding: '0 48px', marginTop: -40, position: 'relative', zIndex: 2 }}>
        <div className="stat-row" style={{ maxWidth: 1000, margin: '0 auto', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {stats.map((s) => (
            <div className="stat-card" key={s.l} style={{ textAlign: 'center' }}>
              <div className="num">{s.n}</div>
              <div className="lbl">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section id="about" style={{ padding: '90px 48px 60px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 30, marginBottom: 18 }}>Who We Are</h2>
        <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          We are a professional human resources organization providing innovative recruitment
          solutions to the corporate world. As India's recruitment industry grows at record pace,
          the need for skilled manpower becomes crucial — our mission is to match the right person
          to the right job with the highest level of service. Our continuous endeavour is to make
          the recruitment process easier, faster, and more transparent, reducing the gap between
          candidate and client.
        </p>
      </section>

      {/* ===== CAREER GROWTH ===== */}
      <section id="growth" style={{ padding: '40px 48px 100px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span className="pill">Career Progression</span>
          <h2 style={{ fontSize: 30, margin: '14px 0 10px' }}>
            See <span className="gradient-text">How You'll Grow</span> With Us
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
            Select a department to see the exact path from entry level to leadership.
          </p>
        </div>

        {/* Department picker */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 36 }}>
          {departments.map((d) => (
            <span
              key={d.name}
              className={`course-chip ${activeDept.name === d.name ? 'sel' : ''}`}
              onClick={() => setActiveDept(d)}
              style={{ cursor: 'pointer' }}
            >
              {d.icon} {d.name}
            </span>
          ))}
        </div>

        {/* Level headers */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)' }}>
            {levels.map((lvl, i) => (
              <div key={lvl.n} style={{
                padding: '16px 14px', textAlign: 'center',
                background: i % 2 === 0 ? 'var(--bg-surface-2)' : 'var(--bg-surface)',
                borderRight: i < 4 ? '1px solid var(--border-default)' : 'none',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', margin: '0 auto 8px',
                  background: 'var(--gradient-brand-2)', color: 'white', fontWeight: 800,
                  fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{lvl.n}</div>
                <div style={{ fontWeight: 700, fontSize: 12.5 }}>{lvl.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{lvl.sub}</div>
              </div>
            ))}
          </div>

          {/* Role path for selected department */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)' }}>
            {activeDept.path.map((role, i) => (
              <div key={role} style={{
                padding: '20px 14px', textAlign: 'center', position: 'relative',
                borderRight: i < 4 ? '1px solid var(--border-default)' : 'none',
                borderTop: '1px solid var(--border-default)',
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', margin: '0 auto 12px',
                  background: activeDept.color,
                }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {role}
                </div>
                {i < 4 && (
                  <div style={{
                    position: 'absolute', top: '50%', right: -10, transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', fontSize: 14, zIndex: 2,
                  }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Typical growth journey strip */}
        <div className="panel" style={{ marginTop: 24 }}>
          <div className="panel-title" style={{ marginBottom: 16 }}>Typical Growth Journey</div>
          <div className="email-flow">
            <span className="email-step">🌱 Join as Intern / Executive</span>
            <span className="email-sep">➜</span>
            <span className="email-step">📖 Learn & Understand Processes</span>
            <span className="email-sep">➜</span>
            <span className="email-step">🎯 Meet Targets & Improve Skills</span>
            <span className="email-sep">➜</span>
            <span className="email-step">📈 Get Promoted to Senior Role</span>
            <span className="email-sep">➜</span>
            <span className="email-step">👥 Lead a Team & Handle Key Clients</span>
            <span className="email-sep">➜</span>
            <span className="email-step">👑 Move to Managerial & Leadership Role</span>
          </div>
        </div>
      </section>

      {/* ===== CTA / CONTACT ===== */}
      <section id="contact" style={{
        background: 'var(--gradient-brand-2)', color: 'white', padding: '70px 48px',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: 28, marginBottom: 12, color: 'white' }}>Ready to Build Your Career With Us?</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 28 }}>
          Whether you're a candidate looking for growth or a company looking for talent — let's talk.
        </p>
        <button className="btn-outline" style={{ background: 'white', color: 'var(--brand-purple)', border: 'none', padding: '13px 30px', fontSize: 14 }}>
          Get In Touch
        </button>
      </section>

      <footer style={{ padding: 24, textAlign: 'center', fontSize: 11.5, color: 'var(--text-muted)' }}>
        © {new Date().getFullYear()} Talent Corner HR Services. All rights reserved.
      </footer>
    </div>
  );
}