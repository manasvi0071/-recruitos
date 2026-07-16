import { useEffect, useMemo, useState } from 'react';
import { getAllApplications, getJobs, updateApplicationStage } from '../lib/api';

const STAGES = ['Resume Review', 'Aptitude', 'GD', 'Interview', 'Selected', 'Rejected'];

const STAGE_COLOR = {
  'Resume Review': '#9a9a9a',
  'Aptitude': '#b8894a',
  'GD': '#b8894a',
  'Interview': '#4a7fb8',
  'Selected': '#4aa876',
  'Rejected': '#c0504d',
};

function nextStage(current) {
  const idx = STAGES.indexOf(current);
  if (idx === -1 || idx >= STAGES.length - 2) return null;
  return STAGES[idx + 1];
}

export default function Pipeline() {
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobFilter, setJobFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [movingId, setMovingId] = useState(null);

  function loadAll() {
    setLoading(true);
    Promise.all([getAllApplications(), getJobs()])
      .then(([a, j]) => { setApps(a); setJobs(j); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadAll(); }, []);

  const filtered = useMemo(() => {
    if (!jobFilter) return apps;
    return apps.filter((a) => a.job_profiles?.id === jobFilter);
  }, [apps, jobFilter]);

  const byStage = useMemo(() => {
    const grouped = {};
    STAGES.forEach((s) => { grouped[s] = []; });
    filtered.forEach((a) => {
      if (grouped[a.stage]) grouped[a.stage].push(a);
    });
    return grouped;
  }, [filtered]);

  async function moveCard(app, toStage) {
    setMovingId(app.id);
    try {
      await updateApplicationStage(app.id, toStage);
      setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, stage: toStage } : a)));
    } catch (err) {
      alert('Could not move candidate: ' + err.message);
    } finally {
      setMovingId(null);
    }
  }

  return (
    <div className="page active" id="page-pipeline">
      <div className="page-head">
        <div><h1>Hiring Pipeline</h1><p>Move candidates forward through each stage</p></div>
        <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line, #e5e5e5)' }}>
          <option value="">All Jobs</option>
          {jobs.map((j) => <option key={j.id} value={j.id}>{j.company} — {j.title}</option>)}
        </select>
      </div>

      {loading && <div className="panel"><p style={{ color: 'var(--slate-light)' }}>Loading…</p></div>}
      {error && <div className="panel"><p style={{ color: 'var(--red, #d64545)' }}>{error}</p></div>}

      {!loading && !error && (
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
          {STAGES.map((stage) => (
            <div key={stage} style={{ minWidth: 240, flex: '0 0 240px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', borderRadius: '8px 8px 0 0',
                background: STAGE_COLOR[stage], color: 'white', fontSize: 12.5, fontWeight: 600,
              }}>
                <span>{stage}</span>
                <span>{byStage[stage].length}</span>
              </div>
              <div style={{ background: 'var(--cream, #f7f5f0)', border: '1px solid var(--line, #e5e5e5)', borderTop: 'none', borderRadius: '0 0 8px 8px', minHeight: 200, padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {byStage[stage].length === 0 && (
                  <p style={{ fontSize: 11.5, color: 'var(--slate-light)', textAlign: 'center', padding: '12px 0' }}>Empty</p>
                )}
                {byStage[stage].map((app) => {
                  const next = nextStage(stage);
                  const isMoving = movingId === app.id;
                  return (
                    <div key={app.id} style={{ background: 'white', border: '1px solid var(--line, #e5e5e5)', borderRadius: 8, padding: 10 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{app.candidates?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--slate-light)', marginBottom: 6 }}>
                        {app.candidates?.colleges?.name || '—'} · {app.job_profiles?.title}
                      </div>
                      {app.resume_score != null && (
                        <div style={{ fontSize: 11, marginBottom: 6 }}>Score: <b>{app.resume_score}</b></div>
                      )}
                      <div style={{ display: 'flex', gap: 6 }}>
                        {stage !== 'Selected' && stage !== 'Rejected' && (
                          <>
                            {next && (
                              <button
                                disabled={isMoving}
                                onClick={() => moveCard(app, next)}
                                style={{ flex: 1, fontSize: 10.5, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--line, #e5e5e5)', background: 'white', cursor: 'pointer' }}
                              >
                                {isMoving ? '…' : `→ ${next}`}
                              </button>
                            )}
                            {stage === 'Interview' && (
                              <button
                                disabled={isMoving}
                                onClick={() => moveCard(app, 'Selected')}
                                style={{ flex: 1, fontSize: 10.5, padding: '4px 6px', borderRadius: 6, border: 'none', background: '#4aa876', color: 'white', cursor: 'pointer' }}
                              >
                                Select
                              </button>
                            )}
                            <button
                              disabled={isMoving}
                              onClick={() => moveCard(app, 'Rejected')}
                              style={{ fontSize: 10.5, padding: '4px 6px', borderRadius: 6, border: '1px solid #c0504d', background: 'white', color: '#c0504d', cursor: 'pointer' }}
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}