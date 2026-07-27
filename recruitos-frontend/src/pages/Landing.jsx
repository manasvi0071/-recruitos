import { useRef, useState, useEffect } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import MagneticButton from '../components/MagneticButton';
import AnimatedCounter from '../components/AnimatedCounter';
import { useScrollProgress, useScrollY } from '../hooks/useScrollReveal';
import logoImg from '../assets/talentcorner-logo.png';

const departments = [
  { icon: '🎯', name: 'Talent Acquisition', path: ['HR Intern / Recruitment Trainee', 'Talent Acquisition Executive', 'Senior Talent Acquisition Executive', 'Team Leader – Recruitment', 'Recruitment Manager'] },
  { icon: '📈', name: 'Business Development', path: ['Business Development Executive', 'Senior Business Development Executive', 'Assistant Manager – BD', 'Business Development Manager', 'Senior BD Manager'] },
  { icon: '🤝', name: 'Client Servicing', path: ['Client Servicing Executive', 'Senior Client Servicing Executive', 'Key Account Manager', 'Senior Key Account Manager', 'Client Servicing Head'] },
  { icon: '⚙️', name: 'Operations', path: ['Operations Executive', 'Senior Operations Executive', 'Operations Team Leader', 'Assistant Operations Manager', 'Operations Manager'] },
  { icon: '👥', name: 'Human Resources', path: ['HR Intern', 'HR Executive', 'Senior HR Executive', 'Assistant HR Manager', 'HR Manager'] },
  { icon: '💰', name: 'Finance & Accounts', path: ['Accounts Assistant', 'Accounts Executive', 'Senior Accounts Executive', 'Assistant Finance Manager', 'Finance Manager'] },
  { icon: '📣', name: 'Marketing', path: ['Marketing Intern', 'Digital Marketing Executive', 'Senior Marketing Executive', 'Assistant Marketing Manager', 'Marketing Manager'] },
  { icon: '🗂️', name: 'Administration', path: ['Admin Assistant', 'Admin Executive', 'Senior Admin Executive', 'Administration Manager', 'Senior Admin Manager'] },
  { icon: '🎓', name: 'Training & L&D', path: ['Training Coordinator', 'L&D Executive', 'Senior L&D Executive', 'Training Manager', 'Head – Learning & Development'] },
  { icon: '💻', name: 'IT / Tech Support', path: ['IT Support Executive', 'System Administrator', 'Senior IT Executive', 'IT Manager', 'Head – IT Operations'] },
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

const marqueeItems = ['TCS', 'Infosys', 'Wipro', 'HCL', 'Cognizant', 'Tech Mahindra', 'Capgemini', 'Accenture', 'Pharma Leaders', '900+ Clients'];

const features = [
  { title: 'Fast-Track Hiring', desc: 'Streamlined process from application to offer letter — most candidates hear back within days, not weeks.' },
  { title: 'Right-Fit Matching', desc: 'We match skills and ambition to real openings, not just keywords — so the role actually fits your career path.' },
  { title: '900+ Trusted Clients', desc: 'From growing startups to industry leaders, our client network spans every major sector in India.' },
  { title: 'Real Growth Paths', desc: 'Every role comes with a visible career ladder — see exactly how you\'ll grow, not just where you\'ll start.' },
  { title: 'Campus to Corporate', desc: 'Dedicated campus recruitment drives connecting fresh graduates directly with hiring companies.' },
  { title: '20+ Years Trusted', desc: 'Since 2002, we\'ve built our reputation on transparency, speed, and genuinely caring about outcomes.' },
];

const testimonials = [
  { quote: 'Talent Corner placed me within three weeks of graduating. The process felt personal, not transactional.', name: 'Recent Graduate', role: 'Software Engineer, Pune' },
  { quote: 'As a hiring partner, their shortlists are always relevant. It saves us weeks of screening time.', name: 'HR Manager', role: 'Mid-size IT Company' },
  { quote: 'They didn\'t just find me a job — they helped me understand the actual growth path ahead of me.', name: 'Campus Hire', role: 'Business Development' },
];

function Reveal({ children, delay = 0, style = {}, className = '' }) {
  const [ref, progress] = useScrollProgress();
  const clamped = Math.min(1, Math.max(0, (progress - delay * 0.3) * 2.5));
  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: clamped,
        transform: `translateY(${(1 - clamped) * 26}px)`,
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      {children}
    </div>
  );
}

function MaskLine({ children, delay }) {
  return (
    <span className="mask-line-outer">
      <span className="mask-line-inner" style={{ animationDelay: `${delay}s` }}>{children}</span>
    </span>
  );
}

export default function Landing() {
  const [activeDept, setActiveDept] = useState(departments[0]);
  const scrollY = useScrollY();
  const [scrollPct, setScrollPct] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: -600, y: -600 });

  useEffect(() => {
    function onScroll() {
      const h = document.documentElement;
      setScrollPct((h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 || 0);
    }
    function onMove(e) { setCursorPos({ x: e.clientX, y: e.clientY }); }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <>
      <div className="scroll-progress-bar" style={{ width: `${scrollPct}%` }} />
      <div className="grain-overlay" />
      <div className="cursor-glow" style={{ left: cursorPos.x, top: cursorPos.y }} />
      <div style={{ background: 'var(--bg-base)', minHeight: '100vh', overflowX: 'hidden', position: 'relative', zIndex: 2 }}>

        <nav className="glass-3d" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px clamp(20px,4vw,48px)', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={logoImg} alt="Talent Corner" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <div>
              <div className="brand-name">Talent Corner</div>
              <div className="brand-sub">HR Services</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 30, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', alignItems: 'center' }}>
            <a href="#about">About</a>
            <a href="#features">Why Us</a>
            <a href="#growth">Career Growth</a>
            <a href="#contact">Contact</a>
            <a href="/app">Team Login</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ThemeToggle />
            <button className="btn-gold" onClick={() => { window.location.href = '/app'; }}>Join Us</button>
          </div>
        </nav>

        <SplitHero scrollY={scrollY} />
        <MarqueeStrip />
        <BentoStats />
        <ScrollAbout />
        <FeatureShowcase />

        <section id="growth" style={{ padding: '60px clamp(20px,4vw,48px) 110px', maxWidth: 960, margin: '0 auto' }}>
          <Reveal style={{ textAlign: 'center', marginBottom: 40 }}>
            <span className="eyebrow">— Career Progression</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(30px,4.5vw,48px)', margin: '14px 0 12px', lineHeight: 1.1 }}>
              See <em className="gradient-text" style={{ fontStyle: 'italic' }}>How You'll Grow</em> With Us
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto' }}>
              Select a department, then scroll through their real climb — entry level to leadership.
            </p>
          </Reveal>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 60 }}>
            {departments.map((d) => (
              <button
                key={d.name}
                className={`course-chip ${activeDept.name === d.name ? 'sel' : ''}`}
                onClick={() => setActiveDept(d)}
                style={{ cursor: 'pointer' }}
              >
                {d.icon} {d.name}
              </button>
            ))}
          </div>

          <TimelineJourney activeDept={activeDept} />
        </section>

        <TestimonialStrip />
        <ContactCTA />

        <footer style={{ borderTop: '1px solid var(--border-default)', padding: '60px clamp(20px,4vw,48px) 30px', overflow: 'hidden' }}>
          <div className="gradient-text" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(52px,13vw,190px)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.02em', textAlign: 'center', opacity: 0.9 }}>
            TALENT CORNER
          </div>
          <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 24 }}>
            © {new Date().getFullYear()} Talent Corner HR Services · Since 2002 · 15 Locations across India
          </div>
        </footer>
      </div>
    </>
  );
}

function SplitHero({ scrollY }) {
  const fade = Math.max(0, 1 - scrollY / 500);
  const scale = Math.max(0.92, 1 - scrollY / 3000);

  return (
    <section className="animated-mesh-bg" style={{
      background: 'var(--gradient-hero)', minHeight: '94vh', display: 'flex', alignItems: 'center',
      position: 'relative', overflow: 'hidden', padding: '80px clamp(20px,4vw,48px)',
    }}>
      <div className="floating-orb" style={{ width: 480, height: 480, background: 'rgba(124,58,237,0.28)', top: -150, left: -110, transform: `translate3d(0, ${scrollY * 0.12}px, 0)` }} />
      <div className="floating-orb" style={{ width: 260, height: 260, background: 'rgba(6,182,212,0.2)', bottom: 20, left: '34%', transform: `translate3d(0, ${scrollY * 0.18}px, 0)` }} />

      <div className="split-hero-grid" style={{
        display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 48, alignItems: 'center',
        maxWidth: 1200, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1,
        opacity: fade, transform: `scale(${scale})`,
      }}>
        <div>
          <span className="pill badge-3d" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
            India's Leading HR Management Company
          </span>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,6vw,68px)', fontWeight: 600, margin: '22px 0 20px', lineHeight: 1.05, color: 'white' }}>
            <MaskLine delay={0.15}>Connecting the</MaskLine>
            <MaskLine delay={0.3}><em className="gradient-text" style={{ fontStyle: 'italic' }}>Right Talent</em></MaskLine>
            <MaskLine delay={0.45}>with the Right</MaskLine>
            <MaskLine delay={0.6}>Opportunity.</MaskLine>
          </h1>

          <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.75, marginBottom: 34, maxWidth: 480 }}>
            Since 2002, Talent Corner has grown from a team of three into one of India's leading
            HR Management companies — serving 900+ clients across 15 locations nationwide.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <MagneticButton className="btn-gold" style={{ padding: '14px 30px', fontSize: 14.5, boxShadow: '0 12px 32px rgba(124,58,237,0.5)' }}>
              Explore Careers →
            </MagneticButton>
            <MagneticButton className="btn-outline" style={{ padding: '14px 30px', fontSize: 14.5, background: 'rgba(255,255,255,0.06)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
              Partner With Us
            </MagneticButton>
          </div>
        </div>

        <div style={{ position: 'relative', height: 540, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="orbit-ring-dotted" style={{ width: 460, height: 460 }} />
          <div className="orbit-ring-dotted" style={{ width: 340, height: 340 }} />
          <div style={{
            position: 'absolute', width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.35), transparent 70%)', filter: 'blur(14px)',
          }} />

          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="dot-orbit-spin" style={{ width: 460, height: 460, animationDuration: `${26 + i * 6}s` }}>
              <div
                className="orbit-dot"
                style={{
                  top: '4%', left: '50%',
                  background: i % 2 ? 'var(--brand-purple)' : '#F59E0B',
                  color: i % 2 ? 'var(--brand-purple)' : '#F59E0B',
                  transform: `rotate(${i * 90}deg) translateX(0px)`,
                }}
              />
            </div>
          ))}

          <img
            src={logoImg}
            alt="Talent Corner"
            className="logo-3d-spin"
            style={{
              width: 240, height: 240, objectFit: 'contain', opacity: 1,
              position: 'relative', zIndex: 2,
              filter: 'drop-shadow(0 30px 70px rgba(124,58,237,0.6)) brightness(1.25) contrast(1.15) saturate(1.2)',
            }}
          />
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 26, left: '50%', transform: 'translateX(-50%)', opacity: fade, color: '#F59E0B', fontSize: 22, animation: 'floatBob 2s ease-in-out infinite' }}>↓</div>
    </section>
  );
}

function MarqueeStrip() {
  const doubled = [...marqueeItems, ...marqueeItems];
  return (
    <div style={{ padding: '34px 0', borderTop: '1px solid var(--border-default)', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
      <div className="marquee-wrap">
        <div className="marquee-track">
          {doubled.map((item, i) => (
            <span key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontStyle: 'italic', fontWeight: 500, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 48, whiteSpace: 'nowrap' }}>
              {item} <span style={{ color: '#F59E0B', fontSize: 15 }}>✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function BentoStats() {
  return (
    <section style={{ padding: '90px clamp(20px,4vw,48px)', maxWidth: 1040, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }} className="bento-grid">
        <Reveal className="panel glass-3d tilt-card" style={{ gridColumn: 'span 2', gridRow: 'span 2', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 36 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Since</div>
          <div className="gradient-text" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(60px,9vw,96px)', fontWeight: 700, lineHeight: 1 }}>
            <AnimatedCounter value={stats[0].n} />
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 16, lineHeight: 1.7, maxWidth: 320 }}>
            Two decades of building trust between candidates and companies across India.
          </p>
        </Reveal>
        {stats.slice(1).map((s, i) => (
          <Reveal key={s.l} delay={i * 0.08} className="panel tilt-card" style={{ gridColumn: 'span 2', padding: '30px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="gradient-text" style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 700, lineHeight: 1 }}><AnimatedCounter value={s.n} /></div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, fontWeight: 600, letterSpacing: '0.04em' }}>{s.l}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ScrollAbout() {
  return (
    <section id="about" style={{ padding: '40px clamp(20px,4vw,48px) 90px', maxWidth: 900, margin: '0 auto' }}>
      <Reveal>
        <span className="chapter-num" style={{ fontSize: 60 }}>01</span>
        <span className="eyebrow" style={{ display: 'block', marginTop: 8 }}>— Who We Are</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(30px,4.5vw,50px)', margin: '16px 0 22px', lineHeight: 1.08, textAlign: 'center' }}>
          Two Decades of <em className="gradient-text" style={{ fontStyle: 'italic' }}>Connecting Talent</em>
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.85, textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
          We are a professional human resources organization providing innovative recruitment
          solutions to the corporate world. Our mission is to match the right person to the right
          job with the highest level of service — making recruitment easier, faster, and more
          transparent for every candidate and client we work with.
        </p>
      </Reveal>
    </section>
  );
}

function FeatureShowcase() {
  return (
    <section id="features" style={{ padding: '40px clamp(20px,4vw,48px) 100px', maxWidth: 1200, margin: '0 auto' }}>
      <Reveal style={{ marginBottom: 50, maxWidth: 560 }}>
        <span className="chapter-num" style={{ fontSize: 60 }}>02</span>
        <span className="eyebrow" style={{ display: 'block', marginTop: 8 }}>— Why Talent Corner</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(30px,4.5vw,50px)', margin: '14px 0 12px', lineHeight: 1.08 }}>
          Built for <em className="gradient-text" style={{ fontStyle: 'italic' }}>Real Outcomes</em>
        </h2>
        <p style={{ fontSize: 14.5, color: 'var(--text-muted)' }}>
          Not just another recruitment agency — a partner invested in where you actually end up.
        </p>
      </Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }} className="feature-grid">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 0.08} className="panel tilt-card" style={{ padding: '30px 26px' }}>
            <div className="feature-num">{String(i + 1).padStart(2, '0')}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 21, marginBottom: 10, color: 'var(--text-primary)' }}>{f.title}</div>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.desc}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function TimelineJourney({ activeDept }) {
  return (
    <div className="timeline-rail">
      <div className="timeline-spine" />
      {levels.map((lvl, i) => (
        <TimelineStep key={lvl.n} lvl={lvl} left={i % 2 === 0} roleText={activeDept.path[i]} />
      ))}
    </div>
  );
}

function TimelineStep({ lvl, left, roleText }) {
  const ref = useRef(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsActive(true); observer.disconnect(); } },
      { threshold: 0.3, rootMargin: '0px 0px -10% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const content = (
    <div
      className={isActive ? 'panel glass-3d tilt-card' : 'panel'}
      style={{
        padding: '18px 22px',
        opacity: isActive ? 1 : 0,
        transform: isActive ? 'translateX(0)' : `translateX(${left ? -40 : 40}px)`,
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>{roleText}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.02em' }}>{lvl.label} · {lvl.sub}</div>
    </div>
  );

  return (
    <div ref={ref} className="timeline-row">
      {left ? content : <div />}
      <div
        className={`timeline-node ${isActive ? 'growth-dot-active' : ''}`}
        style={{
          background: isActive ? 'var(--gradient-brand-2)' : 'var(--bg-surface)',
          color: isActive ? 'white' : 'var(--text-muted)',
          border: isActive ? 'none' : '2px solid var(--border-default)',
          boxShadow: isActive ? '0 10px 28px rgba(124,58,237,0.45)' : 'none',
          transform: isActive ? 'scale(1)' : 'scale(0.75)',
          transition: 'all 0.4s ease',
        }}
      >
        {lvl.n}
      </div>
      {!left ? content : <div />}
    </div>
  );
}

function TestimonialStrip() {
  return (
    <section style={{ padding: '10px clamp(20px,4vw,48px) 100px', maxWidth: 1200, margin: '0 auto' }}>
      <Reveal style={{ textAlign: 'center', marginBottom: 44 }}>
        <span className="eyebrow">— Trusted By People Like You</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,42px)', margin: '12px 0 0' }}>What People Are Saying</h2>
      </Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }} className="feature-grid">
        {testimonials.map((t, i) => (
          <Reveal key={i} delay={i * 0.1} className="panel tilt-card" style={{ padding: '30px 28px' }}>
            <div style={{ fontSize: 30, color: '#F59E0B', marginBottom: 10, fontFamily: 'var(--font-display)' }}>"</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 20, fontStyle: 'italic' }}>{t.quote}</p>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{t.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.role}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ContactCTA() {
  return (
    <section id="contact" style={{ background: 'var(--gradient-brand-2)', color: 'white', padding: '110px clamp(20px,4vw,48px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div className="floating-orb" style={{ width: 360, height: 360, background: 'rgba(255,255,255,0.18)', top: -130, left: -70 }} />
      <div className="floating-orb" style={{ width: 260, height: 260, background: 'rgba(255,255,255,0.12)', bottom: -110, right: -70 }} />
      <Reveal style={{ position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,58px)', marginBottom: 16, color: 'white', lineHeight: 1.05 }}>
          Ready to Build Your <em style={{ fontStyle: 'italic' }}>Career</em> With Us?
        </h2>
        <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.85)', marginBottom: 36, maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
          Whether you're a candidate looking for growth or a company looking for talent — let's talk.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <MagneticButton style={{ background: 'white', color: 'var(--brand-purple)', border: 'none', padding: '15px 34px', fontSize: 14.5, fontWeight: 700, borderRadius: 999 }}>
            Get In Touch
          </MagneticButton>
          <MagneticButton
            onClick={() => { window.location.href = '/app'; }}
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.35)', padding: '15px 34px', fontSize: 14.5, fontWeight: 600, borderRadius: 999 }}
          >
            Explore Open Roles
          </MagneticButton>
        </div>
      </Reveal>
    </section>
  );
}