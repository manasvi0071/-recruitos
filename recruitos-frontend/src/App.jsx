import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CampusDB from './pages/CampusDB';
import CorpDB from './pages/CorpDB';
import Jobs from './pages/Jobs';
import Resume from './pages/Resume';
import Aptitude from './pages/Aptitude';
import Interview from './pages/Interview';
import Offers from './pages/Offers';
import Joining from './pages/Joining';
import Comm from './pages/Comm';
import Reports from './pages/Reports';
import Apply from './pages/Apply';
import Pipeline from './pages/Pipeline';
import GDAdmin from './pages/GDAdmin';
import GDRoom from './pages/GDRoom';
import AIInterview from './pages/AIInterview';
import Landing from './pages/Landing';

const pages = {
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
  pipeline: Pipeline,
  gdadmin: GDAdmin,
  gdroom: GDRoom,
};

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // GD Room — public, students access via email link
  if (window.location.pathname.startsWith('/gd/')) {
    return <GDRoom />;
  }

  if (window.location.pathname === '/apply') {
    return <Apply />;
  }

  if (window.location.pathname.startsWith('/interview/')) {
  return <AIInterview />;
}

  const isAppRoute = window.location.pathname.startsWith('/app');

  if (window.location.pathname === '/') {
    return <Landing />;
  }

  if (isAppRoute) {
    if (loading) {
      return null;
    }

    if (!session) {
      return <Login />;
    }

    const PageComponent = pages[activePage];

    return (
      <div id="screen-app" style={{ display: 'block' }}>
        <div className="topbar">
          <div className="brand">
            <div className="brand-mark">R</div>
            <div><div className="brand-name">RecruitOS</div><div className="brand-sub">Campus Recruitment Platform</div></div>
          </div>
          <div className="top-actions">
            <span className="pill">Talent Corner Workspace</span>
            <span>{session.user.email}</span>
            <span className="logout-link" onClick={() => supabase.auth.signOut()}>Log out</span>
            <div className="avatar">TC</div>
          </div>
        </div>

        <div className="app">
          <Sidebar activePage={activePage} setActivePage={setActivePage} />
          <div className="main">
            <PageComponent />
          </div>
        </div>
      </div>
    );
  }

  // Fallback — unknown path
  return <Landing />;
}