import { useEffect, useState } from 'react';
import { supabase, getUserRole } from './lib/supabaseClient';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Apply from './pages/Apply';
import GDRoom from './pages/GDRoom';

// Admin + Recruiter pages
import Dashboard from './pages/Dashboard';
import CampusDB from './pages/CampusDB';
import CorpDB from './pages/CorpDB';
import Jobs from './pages/Jobs';
import Resume from './pages/Resume';
import Aptitude from './pages/Aptitude';
import GDAdmin from './pages/GDAdmin';
import Interview from './pages/Interview';
import Offers from './pages/Offers';
import Joining from './pages/Joining';
import Comm from './pages/Comm';
import Reports from './pages/Reports';

// Candidate pages — simple versions
function CandidateDashboard() {
  return (
    <div className="page active">
      <div className="page-head">
        <div>
          <h1>Welcome back 👋</h1>
          <p>Track your recruitment journey with Talent Corner</p>
        </div>
      </div>
      <div className="stat-row">
        <div className="stat-card"><div className="num">—</div><div className="lbl">Applications Submitted</div></div>
        <div className="stat-card"><div className="num">—</div><div className="lbl">Tests Attempted</div></div>
        <div className="stat-card"><div className="num">—</div><div className="lbl">Interviews Scheduled</div></div>
        <div className="stat-card"><div className="num">—</div><div className="lbl">Offers Received</div></div>
      </div>
      <div className="panel">
        <div className="panel-title">Your Application Status</div>
        <div className="panel-sub">You will see your application stages here as you progress</div>
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
          No applications yet — browse Job Opportunities to apply
        </div>
      </div>
    </div>
  );
}

function MyProfile({ user }) {
  return (
    <div className="page active">
      <div className="page-head"><div><h1>My Profile</h1><p>Your personal information and resume</p></div></div>
      <div className="panel">
        <div className="panel-title">Account Details</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>
          <div style={{ marginBottom: 8 }}><strong>Email:</strong> {user?.email}</div>
          <div><strong>Role:</strong> Candidate</div>
        </div>
      </div>
    </div>
  );
}

function MyApplications({ user }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: candidate } = await supabase
        .from('candidates')
        .select('id')
        .eq('email', user.email)
        .single();

      if (candidate) {
        const { data } = await supabase
          .from('applications')
          .select('*, job_profiles(title, company)')
          .eq('candidate_id', candidate.id)
          .order('created_at', { ascending: false });
        setApps(data || []);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <div className="page active">
      <div className="page-head"><div><h1>My Applications</h1><p>Track your application status across all roles you've applied for</p></div></div>
      <div className="panel">
        {loading && <div style={{ color: 'var(--text-muted)', padding: 24 }}>Loading...</div>}
        {!loading && apps.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No applications yet</div>
        )}
        {!loading && apps.length > 0 && (
          <table>
            <tbody>
              <tr><th>Role</th><th>Company</th><th>Stage</th><th>Applied</th></tr>
              {apps.map(a => (
                <tr key={a.id}>
                  <td>{a.job_profiles?.title || '—'}</td>
                  <td>{a.job_profiles?.company || '—'}</td>
                  <td><span className="badge blue">{a.stage}</span></td>
                  <td>{new Date(a.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Corporate pages
function CorporateDashboard({ user }) {
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data: company } = await supabase
        .from('companies')
        .select('id, name')
        .eq('hr_email', user.email)
        .single();

      if (company) {
        const { data: j } = await supabase
          .from('job_profiles')
          .select('*')
          .eq('company', company.name);
        setJobs(j || []);

        if (j && j.length > 0) {
          const jobIds = j.map(x => x.id);
          const { data: a } = await supabase
            .from('applications')
            .select('*, candidates(name), job_profiles(title)')
            .in('job_id', jobIds);
          setApps(a || []);
        }
      }
    };
    load();
  }, [user]);

  return (
    <div className="page active">
      <div className="page-head"><div><h1>Company Dashboard</h1><p>Your job postings and applicants</p></div></div>
      <div className="stat-row">
        <div className="stat-card"><div className="num">{jobs.length}</div><div className="lbl">Active Job Postings</div></div>
        <div className="stat-card"><div className="num">{apps.length}</div><div className="lbl">Total Applications</div></div>
        <div className="stat-card"><div className="num">{apps.filter(a => a.stage === 'Selected').length}</div><div className="lbl">Selected Candidates</div></div>
        <div className="stat-card"><div className="num">{apps.filter(a => a.stage === 'Interview').length}</div><div className="lbl">In Interview Stage</div></div>
      </div>
      <div className="panel">
        <div className="panel-title">Recent Applications</div>
        {apps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No applications yet for your job postings</div>
        ) : (
          <table>
            <tbody>
              <tr><th>Candidate</th><th>Role</th><th>Stage</th></tr>
              {apps.slice(0, 10).map(a => (
                <tr key={a.id}>
                  <td>{a.candidates?.name}</td>
                  <td>{a.job_profiles?.title}</td>
                  <td><span className={`badge ${a.stage === 'Selected' ? 'green' : a.stage === 'Rejected' ? 'red' : 'blue'}`}>{a.stage}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function CorpJobs({ user }) {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data: company } = await supabase.from('companies').select('name').eq('hr_email', user.email).single();
      if (company) {
        const { data } = await supabase.from('job_profiles').select('*').eq('company', company.name);
        setJobs(data || []);
      }
    };
    load();
  }, [user]);

  return (
    <div className="page active">
      <div className="page-head"><div><h1>Job Postings</h1><p>All active roles posted by your company</p></div></div>
      <div className="grid3">
        {jobs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', padding: 24 }}>No job postings yet</div>
        ) : jobs.map(j => (
          <div className="jd-card panel" key={j.id}>
            <span className="co">{j.company}</span>
            <h3>{j.title}</h3>
            <div className="meta">{j.location} · {j.salary_range}</div>
            <div className="skills">{(j.skills || []).map(s => <span key={s}>{s}</span>)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Page routing per role
const ADMIN_PAGES = {
  dashboard: Dashboard,
  campusdb: CampusDB,
  corpdb: CorpDB,
  jobs: Jobs,
  resume: Resume,
  aptitude: Aptitude,
  gd: GDAdmin,
  interview: Interview,
  offers: Offers,
  joining: Joining,
  comm: Comm,
  reports: Reports,
};

const RECRUITER_PAGES = {
  dashboard: Dashboard,
  campusdb: CampusDB,
  jobs: Jobs,
  resume: Resume,
  aptitude: Aptitude,
  gd: GDAdmin,
  interview: Interview,
  offers: Offers,
  joining: Joining,
  comm: Comm,
  reports: Reports,
};

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) {
        const r = await getUserRole(session.user.id);
        setRole(r);
        // Set default page based on role
        if (r === 'candidate') setActivePage('candidateDashboard');
        else if (r === 'corporate') setActivePage('corporateDashboard');
        else setActivePage('dashboard');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        const r = await getUserRole(session.user.id);
        setRole(r);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Public routes
  if (window.location.pathname.startsWith('/gd/')) return <GDRoom />;
  if (window.location.pathname === '/apply') return <Apply />;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</div>
    </div>
  );

  if (!session) return <Login />;

  // Get page component based on role
  const getPageComponent = () => {
    if (role === 'candidate') {
      const candidatePages = {
        candidateDashboard: () => <CandidateDashboard user={session.user} />,
        myProfile: () => <MyProfile user={session.user} />,
        myApplications: () => <MyApplications user={session.user} />,
        jobs: Jobs,
        aptitude: Aptitude,
        gd: GDAdmin,
        interview: Interview,
        offers: Offers,
        joining: Joining,
      };
      const Comp = candidatePages[activePage];
      return Comp ? (typeof Comp === 'function' && Comp.length === 0 ? <Comp /> : <Comp />) : <CandidateDashboard user={session.user} />;
    }

    if (role === 'corporate') {
      const corpPages = {
        corporateDashboard: () => <CorporateDashboard user={session.user} />,
        corpJobs: () => <CorpJobs user={session.user} />,
        corpApplications: () => <CorporateDashboard user={session.user} />,
        corpCandidates: CampusDB,
        corpShortlisted: Resume,
        interview: Interview,
        offers: Offers,
        joining: Joining,
        reports: Reports,
      };
      const Comp = corpPages[activePage];
      return Comp ? <Comp user={session.user} /> : <CorporateDashboard user={session.user} />;
    }

    if (role === 'recruiter') {
      const Comp = RECRUITER_PAGES[activePage] || Dashboard;
      return <Comp />;
    }

    // Admin — sees everything
    const Comp = ADMIN_PAGES[activePage] || Dashboard;
    return <Comp />;
  };

  return (
    <div id="screen-app" style={{ display: 'block' }}>
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">R</div>
          <div>
            <div className="brand-name">RecruitOS</div>
            <div className="brand-sub">Campus Recruitment Platform</div>
          </div>
        </div>
        <div className="top-actions">
          <span className="pill">
            {role === 'admin' ? '🔑 Admin' : role === 'recruiter' ? '🧑‍💼 Recruiter' : role === 'corporate' ? '🏢 Corporate' : '👤 Candidate'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{session.user.email}</span>
          <span className="logout-link" onClick={() => supabase.auth.signOut()}>Log out</span>
          <div className="avatar">{session.user.email?.[0]?.toUpperCase()}</div>
        </div>
      </div>

      <div className="app">
        <Sidebar activePage={activePage} setActivePage={setActivePage} role={role || 'candidate'} />
        <div className="main">
          {getPageComponent()}
        </div>
      </div>
    </div>
  );
}