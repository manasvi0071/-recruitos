import { useRef, useState, useEffect } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import MagneticButton from '../components/MagneticButton';
import AnimatedCounter from '../components/AnimatedCounter';
import { useScrollProgress, useScrollY } from '../hooks/useScrollReveal';
import logoImg from '../assets/talentcorner-logo.png';

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

const marqueeItems = ['TCS', 'Infosys', 'Wipro', 'HCL', 'Cognizant', 'Tech Mahindra', 'Capgemini', 'Accenture', 'Pharma Leaders', '900+ Clients'];

const features = [
  { icon: '⚡', title: 'Fast-Track Hiring', desc: 'Streamlined process from application to offer letter — most candidates hear back within days, not weeks.' },
  { icon: '🎯', title: 'Right-Fit Matching', desc: 'We match skills and ambition to real openings, not just keywords — so the role actually fits your career path.' },
  { icon: '🤝', title: '900+ Trusted Clients', desc: 'From growing startups to industry leaders, our client network spans every major sector in India.' },
  { icon: '📈', title: 'Real Growth Paths', desc: 'Every role comes with a visible career ladder — see exactly how you\'ll grow, not just where you\'ll start.' },
  { icon: '🎓', title: 'Campus to Corporate', desc: 'Dedicated campus recruitment drives connecting fresh graduates directly with hiring companies.' },
  { icon: '🛡️', title: '20+ Years Trusted', desc: 'Since 2002, we\'ve built our reputation on transparency, speed, and genuinely caring about outcomes.' },
];

const testimonials = [
  { quote: 'Talent Corner placed me within three weeks of graduating. The process felt personal, not transactional.', name: 'Recent Graduate', role: 'Software Engineer, Pune' },
  { quote: 'As a hiring partner, their shortlists are always relevant. It saves us weeks of screening time.', name: 'HR Manager', role: 'Mid-size IT Company' },
  { quote: 'They didn\'t just find me a job — they helped me understand the actual growth path ahead of me.', name: 'Campus Hire', role: 'Business Development' },
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
    function onMouseMove(e) { setCursorPos({ x: e.clientX, y: e.clientY }); }
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
          padding: '16px 48px', position: 'sticky', top: 0, zIndex: 100,
        }} className="glass-3d">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={logoImg} alt="Talent Corner" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <div>
              <div className="brand-name">Talent Corner</div>
              <div className="brand-sub">HR Services</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 28, fontSize: 13.5, fontWeight: 600, color: 'var(--text-secondary)', alignItems: 'center' }}>
            <a href="#about">About</a>
            <a href="#features">Why Us</a>
            <a href="#growth">Career Growth</a>
            <a href="#contact">Contact</a>
            <a href="/app" style={{ color: 'var(--text-secondary)' }}>Team Login</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <ThemeToggle />
            <button className="btn-gold" onClick={() => { window.location.href = '/app'; }}>Join Us</button>
          </div>
        </nav>

        <SplitHero scrollY={scrollY} />
        <MarqueeStrip />
        <BentoStats />
        <ScrollAbout />
        <FeatureShowcase />

        <section id="growth" style={{ padding: '60px 48px 100px', maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span className="pill section-eyebrow">Career Progression</span>
            <h2 style={{ fontSize: 32, margin: '14px 0 10px' }}>
              See <span className="gradient-text">How You'll Grow</span> With Us
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
              Select a department, then scroll through their real climb — entry level to leadership.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 56 }}>
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

          <TimelineJourney activeDept={activeDept} levels={levels} />
        </section>

        <TestimonialStrip />

        <section id="contact" style={{
          background: 'var(--gradient-brand-2)', color: 'white', padding: '90px 48px',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <div className="floating-orb orb-1" style={{ width: 340, height: 340, background: 'rgba(255,255,255,0.15)', top: -120, left: -70 }} />
          <div className="floating-orb orb-2" style={{ width: 240, height: 240, background: 'rgba(255,255,255,0.1)', bottom: -100, right: -60 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 32, marginBottom: 14, color: 'white' }}>Ready to Build Your Career With Us?</h2>
            <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.85)', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
              Whether you're a candidate looking for growth or a company looking for talent — let's talk.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <MagneticButton className="btn-outline" style={{ background: 'white', color: 'var(--brand-purple)', border: 'none', padding: '14px 32px', fontSize: 14.5, fontWeight: 700 }}>
                Get In Touch
              </MagneticButton>
              <MagneticButton className="btn-outline" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '14px 32px', fontSize: 14.5 }}>
                Explore Open Roles
              </MagneticButton>
            </div>
          </div>
        </section>

        <footer style={{ padding: 28, textAlign: 'center', fontSize: 11.5, color: 'var(--text-muted)' }}>
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
        <span key={i} className="letter-reveal" style={{
          animationDelay: `${delay + i * 0.08}s`, marginRight: '0.28em',
          ...(gradient ? {
            background: 'var(--gradient-brand-2)', WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          } : {}),
        }}>
          {word}
        </span>
      ))}
    </>
  );
}

function SplitHero({ scrollY }) {
  const fade = Math.max(0, 1 - scrollY / 500);
  const scale = Math.max(0.9, 1 - scrollY / 2500);

  return (
    <section className="animated-mesh-bg" style={{
      background: 'var(--gradient-hero)', color: 'white', minHeight: '92vh',
      display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden',
      padding: '90px 48px',
    }}>
      <div className="floating-orb orb-1" style={{ width: 460, height: 460, background: 'rgba(124,58,237,0.3)', top: -140, left: -100, transform: `translate3d(0, ${scrollY * 0.12}px, 0)` }} />
      <div className="floating-orb orb-3" style={{ width: 200, height: 200, background: 'rgba(236,72,153,0.2)', bottom: 40, left: '35%', transform: `translate3d(0, ${scrollY * 0.18}px, 0)` }} />

      <div style={{
        display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 40, alignItems: 'center',
        maxWidth: 1200, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1,
        opacity: fade, transform: `scale(${scale})`,
      }}>
        <div>
          <span className="pill badge-3d" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
            India's Leading HR Management Company
          </span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 700, margin: '22px 0 18px', lineHeight: 1.1, color: 'white', textAlign: 'left' }}>
            <RevealWords text="Connecting the" delay={0} />{' '}
            <em style={{ fontStyle: 'italic' }}><RevealWords text="Right Talent" delay={0.3} gradient /></em>{' '}
            <RevealWords text="with the Right Opportunity" delay={0.6} />
          </h1>
          <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, marginBottom: 32, textAlign: 'left', maxWidth: 460 }}>
            Since 2002, Talent Corner has grown from a team of three into one of India's leading
            HR Management companies — serving 900+ clients across 15 locations nationwide.
          </p>
          <div style={{ display: 'flex', gap: 14 }}>
            <MagneticButton className="btn-gold" style={{ padding: '14px 30px', fontSize: 14.5, boxShadow: '0 12px 32px rgba(124,58,237,0.5)' }}>
              Explore Careers
            </MagneticButton>
            <MagneticButton className="btn-outline" style={{ padding: '14px 30px', fontSize: 14.5, background: 'rgba(255,255,255,0.06)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
              Partner With Us
            </MagneticButton>
          </div>
        </div>

        <div style={{ position: 'relative', height: 560, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', width: 460, height: 460, borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.12)' }} />
          <div style={{ position: 'absolute', width: 340, height: 340, borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.1)' }} />
          <div style={{
            position: 'absolute', width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.35), transparent 70%)',
            filter: 'blur(10px)',
          }} />
          <div style={{
            position: 'absolute', width: 260, height: 260, borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(2px)',
            border: '1px solid rgba(255,255,255,0.12)',
          }} />

          <img
            src={logoImg}
            alt="Talent Corner"
            className="logo-3d-spin"
            style={{
              width: 280, height: 280, objectFit: 'contain', opacity: 1,
              position: 'relative', zIndex: 2,
              filter: 'drop-shadow(0 30px 70px rgba(124,58,237,0.6)) brightness(1.25) contrast(1.15) saturate(1.2)',
            }}
          />
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', fontSize: 22, opacity: fade, animation: 'floatBob 2s ease-in-out infinite' }}>↓</div>
    </section>
  );
}

function MarqueeStrip() {
  const doubled = [...marqueeItems, ...marqueeItems];
  return (
    <div style={{ padding: '28px 0', borderBottom: '1px solid var(--border-default)', borderTop: '1px solid var(--border-default)' }}>
      <div className="marquee-wrap">
        <div className="marquee-track">
          {doubled.map((item, i) => (
            <span key={i} style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
              {item} <span style={{ color: 'var(--brand-purple)', margin: '0 4px' }}>✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function BentoStats() {
  const [ref, progress] = useScrollProgress();
  const clamped = Math.min(1, Math.max(0, progress * 2));

  return (
    <section ref={ref} style={{ padding: '70px 48px', maxWidth: 1000, margin: '0 auto' }}>
      <div className="bento-grid" style={{ opacity: clamped, transform: `translateY(${(1 - clamped) * 30}px)`, transition: 'opacity 0.4s ease, transform 0.4s ease' }}>
        <div className="panel glass-3d bento-lg tilt-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 32 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Since</div>
          <div style={{ fontSize: 64, fontFamily: 'var(--font-display)', fontWeight: 700 }} className="shimmer-text">
            <AnimatedCounter value={stats[0].n} />
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.6 }}>
            Two decades of building trust between candidates and companies across India.
          </p>
        </div>
        {stats.slice(1).map((s) => (
          <div key={s.l} className="panel bento-sm tilt-card" style={{ textAlign: 'center', padding: '26px 20px' }}>
            <div className="num" style={{ fontSize: 30 }}><AnimatedCounter value={s.n} /></div>
            <div className="lbl">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ScrollAbout() {
  const [ref, progress] = useScrollProgress();
  const clamped = Math.min(1, Math.max(0, (progress - 0.1) * 2));

  return (
    <section id="about" style={{ padding: '60px 48px 40px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
      <div ref={ref} style={{
        transform: `translateY(${(1 - clamped) * 50}px)`, opacity: clamped, transition: 'opacity 0.3s ease',
      }}>
        <span className="pill section-eyebrow">Who We Are</span>
        <h2 style={{ fontSize: 32, margin: '18px 0' }} className="shimmer-text">Two Decades of Connecting Talent</h2>
        <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          We are a professional human resources organization providing innovative recruitment
          solutions to the corporate world. Our mission is to match the right person to the right
          job with the highest level of service — making recruitment easier, faster, and more
          transparent for every candidate and client we work with.
        </p>
      </div>
    </section>
  );
}

function FeatureShowcase() {
  return (
    <section id="features" style={{ padding: '40px 48px 90px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <span className="pill section-eyebrow">Why Talent Corner</span>
        <h2 style={{ fontSize: 32, margin: '14px 0 10px' }}>
          Built for <span className="gradient-text">Real Outcomes</span>
        </h2>
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
          Not just another recruitment agency — a partner invested in where you actually end up.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {features.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }) {
  const [ref, progress] = useScrollProgress();
  const clamped = Math.min(1, Math.max(0, (progress - index * 0.04) * 2.5));

  return (
    <div
      ref={ref}
      className="feature-card"
      style={{
        opacity: clamped,
        transform: `translateY(${(1 - clamped) * 24}px)`,
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      <div className="feature-icon">{feature.icon}</div>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--text-primary)' }}>{feature.title}</div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{feature.desc}</p>
    </div>
  );
}

function TestimonialStrip() {
  const [ref, progress] = useScrollProgress();
  const clamped = Math.min(1, Math.max(0, (progress - 0.1) * 2));

  return (
    <section style={{ padding: '20px 48px 90px', maxWidth: 1100, margin: '0 auto' }}>
      <div ref={ref} style={{ textAlign: 'center', marginBottom: 36, opacity: clamped, transition: 'opacity 0.4s ease' }}>
        <span className="pill section-eyebrow">Trusted By People Like You</span>
        <h2 style={{ fontSize: 28, margin: '14px 0 0' }}>What People Are Saying</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {testimonials.map((t, i) => (
          <div
            key={i}
            className="testimonial-card"
            style={{ opacity: clamped, transform: `translateY(${(1 - clamped) * 20}px)`, transition: `opacity 0.4s ease ${i * 0.1}s, transform 0.4s ease ${i * 0.1}s` }}
          >
            <div style={{ fontSize: 24, color: 'var(--brand-purple)', marginBottom: 10, lineHeight: 1 }}>"</div>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16, fontStyle: 'italic' }}>{t.quote}</p>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{t.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{t.role}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TimelineJourney({ activeDept, levels }) {
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
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3, rootMargin: '0px 0px -10% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const content = (
    <div
      className={isActive ? 'panel glass-3d tilt-card' : 'panel'}
      style={{
        padding: '16px 20px',
        opacity: isActive ? 1 : 0,
        transform: isActive ? 'translateX(0)' : `translateX(${left ? -40 : 40}px)`,
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>{roleText}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{lvl.label} · {lvl.sub}</div>
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