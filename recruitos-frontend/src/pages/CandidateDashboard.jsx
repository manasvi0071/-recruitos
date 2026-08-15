import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const STAGE_BADGE = {
  'Resume Review': 'gray',
  'Aptitude': 'gold',
  'GD': 'gold',
  'Interview': 'blue',
  'Selected': 'green',
  'Rejected': 'red',
};

export default function CandidateDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/my-applications`, {
          headers: { 'x-user-id': session?.user?.id || '' },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load applications');
        if (!ignore) setApplications(data);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26 }}>My Applications</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>Track your application status across all roles you've applied for</p>
        </div>
        <button className="logout-link" onClick={() => supabase.auth.signOut()}>Log out</button>
      </div>

      {loading && <div className="panel"><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div>}
      {error && <div className="panel"><p style={{ color: 'var(--danger)' }}>{error}</p></div>}

      {!loading && !error && applications.length === 0 && (
        <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)' }}>No applications yet.</p>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 8 }}>
            Apply to open roles at <a href="/apply">/apply</a>
          </p>
        </div>
      )}

      {!loading && !error && applications.map((app) => (
        <div key={app.id} className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{app.job_profiles?.title || 'Role'}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              {app.job_profiles?.company} {app.job_profiles?.location ? `· ${app.job_profiles.location}` : ''}
            </div>
            {app.resume_score != null && (
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>Resume match score: {app.resume_score}%</div>
            )}
          </div>
          <span className={`badge ${STAGE_BADGE[app.stage] || 'gray'}`}>{app.stage}</span>
        </div>
      ))}
    </div>
  );
}