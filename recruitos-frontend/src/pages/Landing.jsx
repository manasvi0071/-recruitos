import { useRef, useState, useEffect } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import MagneticButton from '../components/MagneticButton';
import AnimatedCounter from '../components/AnimatedCounter';
import { useScrollProgress, useScrollY } from '../hooks/useScrollReveal';

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
  const scrollY = useScrollY();
  const [scrollPct, setScrollPct] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: -500, y: -500 });

  useEffect(() => {
    function onScroll() {
      const h = document.documentElement;
      const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      setScrollPct(pct || 0);
    }
    function onMouseMove(e) {
      setCursorPos({ x: e.clientX, y: e.clientY });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <>
      <div className="scroll-progress-bar" style={{ width: `${scrollPct}%` }} />
      <div className="grain-overlay" />
      <div className="cursor-glow" style={{ left: cursorPos.x, top: cursorPos.y }} />
      <div style={{ background: 'var(--bg-base)', minHeight: '100vh', overflowX: 'hidden', position: 'relative', zIndex: 2 }}>
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 48px', position: 'sticky', top: 0, zIndex: 100,
        }} className="glass-3d">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="brand-mark" style={{ boxShadow: '0 8px 24px rgba(124,58,237,0.4)' }}>TC</div>
            <div>
              <div className="brand-name">Talent Corner</div>
              <div className="brand-sub">HR Services</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 28, fontSize: 13.5, fontWeight: 600, color: 'var(--text-secondary)', alignItems: 'center' }}>
            <a href="#about">About</a>
            <a href="#growth">Career Growth</a>
            <a href="#contact">Contact</a>
            <a href="/app" style={{ color: 'var(--text-secondary)' }}>Team Login</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <ThemeToggle />
            <button className="btn-gold" onClick={() => { window.location.href = '/app'; }}>Join Us</button>
          </div>
        </nav>

        <ScrollHero scrollY={scrollY} />
        <ScrollStats />
        <ScrollAbout />

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

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 44 }}>
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

          <ScrollJourney activeDept={activeDept} levels={levels} />

          <div className="panel glass-3d" style={{ marginTop: 40 }}>
            <div className="panel-title" style={{ marginBottom: 16 }}>Typical Growth Journey</div>
            <div className="email-flow">
              <span className="email-step growth-float" style={{ animationDelay: '0s' }}>🌱 Join as Intern / Executive</span>
              <span className="email-sep">➜</span>
              <span className="email-step growth-float" style={{ animationDelay: '0.3s' }}>📖 Learn & Understand Processes</span>
              <span className="email-sep">➜</span>
              <span className="email-step growth-float" style={{ animationDelay: '0.6s' }}>🎯 Meet Targets & Improve Skills</span>
              <span className="email-sep">➜</span>
              <span className="email-step growth-float" style={{ animationDelay: '0.9s' }}>📈 Get Promoted to Senior Role</span>
              <span className="email-sep">➜</span>
              <span className="email-step growth-float" style={{ animationDelay: '1.2s' }}>👥 Lead a Team & Handle Key Clients</span>
              <span className="email-sep">➜</span>
              <span className="email-step growth-float" style={{ animationDelay: '1.5s' }}>👑 Move to Managerial & Leadership Role</span>
            </div>
          </div>
        </section>

        <section id="contact" style={{
          background: 'var(--gradient-brand-2)', color: 'white', padding: '70px 48px',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <div className="floating-orb orb-1" style={{ width: 300, height: 300, background: 'rgba(255,255,255,0.15)', top: -100, left: -50 }} />
          <div className="floating-orb orb-2" style={{ width: 200, height: 200, background: 'rgba(255,255,255,0.1)', bottom: -80, right: -40 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 28, marginBottom: 12, color: 'white' }}>Ready to Build Your Career With Us?</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 28 }}>
              Whether you're a candidate looking for growth or a company looking for talent — let's talk.
            </p>
            <MagneticButton className="btn-outline" style={{ background: 'white', color: 'var(--brand-purple)', border: 'none', padding: '13px 30px', fontSize: 14 }}>
              Get In Touch
            </MagneticButton>
          </div>
        </section>

        <footer style={{ padding: 24, textAlign: 'center', fontSize: 11.5, color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} Talent Corner HR Services. All rights reserved.
        </footer>
      </div>
    </>
  );
}

function RevealWords({ text, delay, gradient }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <span
          key={i}
          className="letter-reveal"
          style={{
            animationDelay: `${delay + i * 0.08}s`,
            marginRight: '0.28em',
            ...(gradient
              ? {
                  background: 'var(--gradient-brand-2)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }
              : {}),
          }}
        >
          {word}
        </span>
      ))}
    </>
  );
}

function ScrollHero({ scrollY }) {
  const fade = Math.max(0, 1 - scrollY / 500);
  const rise = Math.min(scrollY * 0.4, 150);
  const scale = Math.max(0.85, 1 - scrollY / 2000);

  return (
    <section
      className="scroll-3d-scene animated-mesh-bg"
      style={{
        background: 'var(--gradient-hero)', color: 'white', padding: '110px 48px 90px',
        position: 'relative', overflow: 'hidden', textAlign: 'center', minHeight: '90vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div className="floating-orb orb-1" style={{
        width: 500, height: 500, background: 'rgba(124,58,237,0.35)', top: -150, right: -100,
        transform: `translate3d(0, ${scrollY * 0.15}px, 0)`,
      }} />
      <div className="floating-orb orb-2" style={{
        width: 350, height: 350, background: 'rgba(6,182,212,0.25)', bottom: 20, left: -80,
        transform: `translate3d(0, ${-scrollY * 0.1}px, 0)`,
      }} />
      <div className="floating-orb orb-3" style={{
        width: 220, height: 220, background: 'rgba(236,72,153,0.2)', top: '40%', left: '15%',
        transform: `translate3d(0, ${scrollY * 0.2}px, 0)`,
      }} />

      <div
        className="scroll-3d-layer"
        style={{
          position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto',
          transform: `translateY(${rise}px) translateZ(0) scale(${scale})`,
          opacity: fade,
        }}
      >
        <span className="pill badge-3d" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
          India's Leading HR Management Company
        </span>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 50, fontWeight: 700,
          margin: '22px 0 16px', lineHeight: 1.15, color: 'white',
          }}>
          <RevealWords text="Connecting the" delay={0} />{' '}
          <em style={{ fontStyle: 'italic' }}>
          <RevealWords text="Right Talent" delay={0.3} gradient />
          </em>{' '}
          <RevealWords text="with the Right Opportunity" delay={0.6} />
          </h1>
        <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, marginBottom: 34 }}>
          Since 2002, Talent Corner has grown from a team of three into one of India's leading
          HR Management companies — serving 900+ clients across 15 locations nationwide.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          <MagneticButton className="btn-gold" style={{ padding: '14px 30px', fontSize: 14.5, boxShadow: '0 12px 32px rgba(124,58,237,0.5)' }}>
            Explore Careers
          </MagneticButton>
          <MagneticButton className="btn-outline" style={{ padding: '14px 30px', fontSize: 14.5, background: 'rgba(255,255,255,0.06)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
            Partner With Us
          </MagneticButton>
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        fontSize: 22, opacity: fade, animation: 'floatBob 2s ease-in-out infinite',
      }}>
        ↓
      </div>
    </section>
  );
}

function ScrollStats() {
  return (
    <section className="scroll-3d-scene" style={{ padding: '60px 48px 0', position: 'relative', zIndex: 2 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div className="stat-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
          {stats.map((s, i) => <DepthStatCard key={s.l} stat={s} index={i} />)}
        </div>
      </div>
    </section>
  );
}

function DepthStatCard({ stat, index }) {
  const [ref, progress] = useScrollProgress();
  const clamped = Math.min(1, Math.max(0, (progress - index * 0.05) * 2.5));
  const translateZ = (1 - clamped) * -300;
  const rotateX = (1 - clamped) * 40;
  const opacity = clamped;
  const [hoverStyle, setHoverStyle] = useState({});

  function handleMove(e) {
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setHoverStyle({ transform: `rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateZ(20px) scale(1.03)` });
  }

  return (
    <div
      ref={ref}
      className="stat-card tilt-card"
      style={{
        textAlign: 'center',
        transform: hoverStyle.transform || `translateZ(${translateZ}px) rotateX(${rotateX}deg)`,
        opacity,
        transition: 'opacity 0.3s ease',
        boxShadow: hoverStyle.transform ? '0 20px 40px -10px rgba(124,58,237,0.4)' : undefined,
      }}
      onMouseMove={handleMove}
      onMouseLeave={() => setHoverStyle({})}
    >
      <div className="num"><AnimatedCounter value={stat.n} /></div>
      <div className="lbl">{stat.l}</div>
    </div>
  );
}

function ScrollAbout() {
  const [ref, progress] = useScrollProgress();
  const clamped = Math.min(1, Math.max(0, (progress - 0.1) * 2));
  const translateY = (1 - clamped) * 60;
  const rotateX = (1 - clamped) * 15;

  return (
    <section id="about" className="scroll-3d-scene" style={{ padding: '110px 48px 60px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
      <div
        ref={ref}
        className="scroll-3d-layer"
        style={{
          transform: `translateY(${translateY}px) rotateX(${rotateX}deg)`,
          opacity: clamped,
          transition: 'opacity 0.3s ease',
        }}
      >
        <span className="pill">Who We Are</span>
        <h2 style={{ fontSize: 32, margin: '18px 0' }} className="shimmer-text">Two Decades of Connecting Talent</h2>
        <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          We are a professional human resources organization providing innovative recruitment
          solutions to the corporate world. As India's recruitment industry grows at record pace,
          the need for skilled manpower becomes crucial — our mission is to match the right person
          to the right job with the highest level of service. Our continuous endeavour is to make
          the recruitment process easier, faster, and more transparent, reducing the gap between
          candidate and client.
        </p>
      </div>
    </section>
  );
}

function ScrollJourney({ activeDept, levels }) {
  const [ref, progress] = useScrollProgress();

  return (
    <div ref={ref} className="scroll-3d-scene" style={{ position: 'relative', padding: '20px 0 40px' }}>
      <div style={{
        position: 'absolute', top: 44, left: '10%', right: '10%', height: 3,
        background: 'var(--border-default)', borderRadius: 4, zIndex: 0,
      }}>
        <div style={{
          height: '100%', borderRadius: 4,
          background: 'var(--gradient-brand-2)',
          width: `${Math.min(1, Math.max(0, (progress - 0.15) * 2.2)) * 100}%`,
          transition: 'width 0.2s ease',
          boxShadow: '0 0 16px rgba(124,58,237,0.6)',
        }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, position: 'relative', zIndex: 1 }}>
        {levels.map((lvl, i) => {
          const stepThreshold = 0.15 + i * 0.1;
          const stepProgress = Math.min(1, Math.max(0, (progress - stepThreshold) * 4));
          const isActive = stepProgress > 0.5;
          return (
            <ScrollLevelCard
              key={lvl.n}
              lvl={lvl}
              stepProgress={stepProgress}
              isActive={isActive}
              roleText={activeDept.path[i]}
            />
          );
        })}
      </div>
    </div>
  );
}

function ScrollLevelCard({ lvl, stepProgress, isActive, roleText }) {
  const ref = useRef(null);
  const [hoverStyle, setHoverStyle] = useState({});

  function handleMove(e) {
    if (!isActive) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setHoverStyle({ transform: `rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(8px)` });
  }

  const translateZ = (1 - stepProgress) * -200;
  const translateY = (1 - stepProgress) * 40;
  const rotateX = (1 - stepProgress) * 30;

  return (
    <div
      ref={ref}
      className="tilt-card"
      style={{
        textAlign: 'center',
        opacity: stepProgress,
        transform: hoverStyle.transform || `translateZ(${translateZ}px) translateY(${translateY}px) rotateX(${rotateX}deg)`,
        transition: 'opacity 0.2s ease',
      }}
      onMouseMove={handleMove}
      onMouseLeave={() => setHoverStyle({})}
    >
      <div
        className={isActive ? 'growth-dot-active' : ''}
        style={{
          width: 46, height: 46, borderRadius: '50%', margin: '0 auto 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 15,
          background: isActive ? 'var(--gradient-brand-2)' : 'var(--bg-surface)',
          color: isActive ? 'white' : 'var(--text-muted)',
          border: isActive ? 'none' : '2px solid var(--border-default)',
          transition: 'all 0.3s ease',
          boxShadow: isActive ? '0 10px 28px rgba(124,58,237,0.45)' : 'none',
        }}
      >
        {lvl.n}
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)', transition: 'color 0.3s ease' }}>
        {lvl.label}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{lvl.sub}</div>

      <div
        className={isActive ? 'glass-3d' : ''}
        style={{
          marginTop: 14, padding: '10px 8px', borderRadius: 'var(--radius-md)',
          fontSize: 12, fontWeight: 600, color: 'var(--text-primary)',
          minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s ease',
        }}
      >
        {roleText}
      </div>
    </div>
  );
}