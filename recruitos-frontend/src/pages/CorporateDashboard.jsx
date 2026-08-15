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

export default function CorporateDashboard() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('jobs');

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = { 'x-user-id': session?.user?.id || '' };

        const [jobsRes, appsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_BACKEND_URL}/api/my-company-jobs`, { headers }),
          fetch(`${import.meta.env.VITE_BACKEND_URL}/api/my-company-applications`, { headers }),
        ]);
        const jobsData = await jobsRes.json();
        const appsData = await appsRes.json();
        if (!jobsRes.ok) throw new Error(jobsData.error || 'Failed to load jobs');
        if (!appsRes.ok) throw new Error(appsData.error || 'Failed to load applications');

        if (!ignore) {
          setJobs(jobsData);
          setApplications(appsData);
        }
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
    <div style={{ minHeight: '100vh', padding: '32px 24px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26 }}>Company Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>Your job postings and applicants</p>
        </div>
        <button className="logout-link" onClick={() => supabase.auth.signOut()}>Log out</button>
      </div>

      <div className="mode-toggle" style={{ marginBottom: 20 }}>
        <button className={`mode-btn ${tab === 'jobs' ? 'active' : ''}`} onClick={() => setTab('jobs')}>
          Job Postings ({jobs.length})
        </button>
        <button className={`mode-btn ${tab === 'applicants' ? 'active' : ''}`} onClick={() => setTab('applicants')}>
          Applicants ({applications.length})
        </button>
      </div>

      {loading && <div className="panel"><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div>}
      {error && <div className="panel"><p style={{ color: 'var(--danger)' }}>{error}</p></div>}

      {!loading && !error && tab === 'jobs' && (
        jobs.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: 'var(--text-muted)' }}>No job postings linked to your company yet.</p>
          </div>
        ) : (
          jobs.map((j) => (
            <div key={j.id} className="panel">
              <div style={{ fontWeight: 700, fontSize: 15 }}>{j.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
                {j.location} {j.salary_range ? `· ${j.salary_range}` : ''} {j.experience ? `· ${j.experience}` : ''}
              </div>
              {j.job_summary && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 10 }}>{j.job_summary}</p>}
            </div>
          ))
        )
      )}

      {!loading && !error && tab === 'applicants' && (
        applications.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: 'var(--text-muted)' }}>No applicants yet.</p>
          </div>
        ) : (
          <div className="panel">
            <table>
              <tbody>
                <tr><th>Candidate</th><th>Applied For</th><th>Score</th><th>Stage</th></tr>
                {applications.map((a) => (
                  <tr key={a.id}>
                    <td>{a.candidates?.name}</td>
                    <td>{a.job_profiles?.title}</td>
                    <td>{a.resume_score ?? '—'}</td>
                    <td><span className={`badge ${STAGE_BADGE[a.stage] || 'gray'}`}>{a.stage}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}