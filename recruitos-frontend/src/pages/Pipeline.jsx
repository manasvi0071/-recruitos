import { useEffect, useMemo, useState } from 'react';
import { getAllApplications, getJobs, updateApplicationStage } from '../lib/api';
 
const STAGES = ['Resume Review', 'Aptitude', 'GD', 'Interview', 'Selected', 'Rejected'];
 
// Each stage's accent color, drawn from the app's existing palette (index.css vars)
const STAGE_ACCENT = {
  'Resume Review': 'var(--text-muted)',
  'Aptitude': 'var(--gold)',
  'GD': 'var(--gold)',
  'Interview': 'var(--blue)',
  'Selected': 'var(--green)',
  'Rejected': 'var(--red)',
};
 
function nextStage(current) {
  const idx = STAGES.indexOf(current);
  if (idx === -1 || idx >= STAGES.length - 2) return null;
  return STAGES[idx + 1];
}
 
function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
 
function ringClass(score) {
  if (score >= 85) return 'high';
  if (score >= 70) return 'mid';
  return 'low';
}
 
export default function Pipeline() {
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobFilter, setJobFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [movingId, setMovingId] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
 
  useEffect(() => {
    let ignore = false;
 
    async function fetchData() {
      try {
        const [a, j] = await Promise.all([getAllApplications(), getJobs()]);
        if (ignore) return;
        setApps(a);
        setJobs(j);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
 
    fetchData();
    return () => { ignore = true; };
  }, []);
 
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
    if (app.stage === toStage) return;
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
 
  function handleDragStart(e, app) {
    setDraggedId(app.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', app.id);
  }
 
  function handleDragEnd() {
    setDraggedId(null);
    setDragOverStage(null);
  }
 
  function handleDragOver(e, stage) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stage) setDragOverStage(stage);
  }
 
  function handleDrop(e, stage) {
    e.preventDefault();
    setDragOverStage(null);
    const app = apps.find((a) => a.id === draggedId);
    setDraggedId(null);
    if (app) moveCard(app, stage);
  }
 
  return (
    <div className="page active" id="page-pipeline">
      <div className="page-head">
        <div>
          <h1>Hiring Pipeline</h1>
          <p>Drag a candidate card between columns, or use the quick actions</p>
        </div>
        <select
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
          className="search-box"
          style={{ width: 'auto', minWidth: 200 }}
        >
          <option value="">All Jobs</option>
          {jobs.map((j) => <option key={j.id} value={j.id}>{j.company} — {j.title}</option>)}
        </select>
      </div>
 
      {loading && <div className="panel"><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div>}
      {error && <div className="panel"><p style={{ color: 'var(--red)' }}>{error}</p></div>}
 
      {!loading && !error && (
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 12 }}>
          {STAGES.map((stage) => {
            const isDragOver = dragOverStage === stage;
            const cards = byStage[stage];
 
            return (
              <div
                key={stage}
                style={{ minWidth: 250, flex: '0 0 250px' }}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragLeave={() => setDragOverStage((s) => (s === stage ? null : s))}
                onDrop={(e) => handleDrop(e, stage)}
              >
                {/* Column header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', borderRadius: 'var(--radius) var(--radius) 0 0',
                  background: STAGE_ACCENT[stage], color: 'white', fontSize: 12.5, fontWeight: 700,
                  letterSpacing: '0.02em',
                }}>
                  <span>{stage}</span>
                  <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 20, padding: '1px 9px', fontSize: 11.5 }}>
                    {cards.length}
                  </span>
                </div>
 
                {/* Column body — drop target */}
                <div style={{
                  background: isDragOver ? 'var(--primary-soft)' : 'var(--surface-2)',
                  border: isDragOver ? '2px dashed var(--primary)' : '1px solid var(--border)',
                  borderTop: 'none',
                  borderRadius: '0 0 var(--radius) var(--radius)',
                  minHeight: 220,
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  transition: 'background 0.15s, border-color 0.15s',
                }}>
                  {cards.length === 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '28px 0', border: '1.5px dashed var(--border)', borderRadius: 10 }}>
                      {isDragOver ? 'Drop here' : 'No candidates'}
                    </div>
                  )}
 
                  {cards.map((app) => {
                    const next = nextStage(stage);
                    const isMoving = movingId === app.id;
                    const isDragging = draggedId === app.id;
                    const score = app.resume_score ?? app.ai_score ?? null;
 
                    return (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app)}
                        onDragEnd={handleDragEnd}
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: 12,
                          cursor: 'grab',
                          opacity: isDragging ? 0.4 : isMoving ? 0.6 : 1,
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'opacity 0.15s, box-shadow 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: 10.5, cursor: 'default', flexShrink: 0 }}>
                            {initials(app.candidates?.name)}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {app.candidates?.name}
                            </div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {app.job_profiles?.title}
                            </div>
                          </div>
                          {score != null && (
                            <div className={`score-ring ${ringClass(score)}`} style={{ width: 30, height: 30, fontSize: 10.5, flexShrink: 0 }}>
                              {score}
                            </div>
                          )}
                        </div>
 
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 10 }}>
                          {app.candidates?.colleges?.name || 'College not set'}
                        </div>
 
                        {stage !== 'Selected' && stage !== 'Rejected' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            {next && (
                              <button
                                disabled={isMoving}
                                onClick={() => moveCard(app, next)}
                                className="btn-outline"
                                style={{ flex: 1, fontSize: 10.5, padding: '5px 6px' }}
                              >
                                {isMoving ? '···' : `→ ${next}`}
                              </button>
                            )}
                            {stage === 'Interview' && (
                              <button
                                disabled={isMoving}
                                onClick={() => moveCard(app, 'Selected')}
                                className="btn-gold"
                                style={{ flex: 1, fontSize: 10.5, padding: '5px 6px', background: 'var(--green)', boxShadow: 'none' }}
                              >
                                ✓ Select
                              </button>
                            )}
                            <button
                              disabled={isMoving}
                              onClick={() => moveCard(app, 'Rejected')}
                              style={{ fontSize: 10.5, padding: '5px 8px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--red)', background: 'white', color: 'var(--red)', cursor: 'pointer', fontWeight: 600 }}
                            >
                              ✕
                            </button>
                          </div>
                        )}
 
                        {(stage === 'Selected' || stage === 'Rejected') && (
                          <button
                            disabled={isMoving}
                            onClick={() => moveCard(app, 'Resume Review')}
                            className="btn-outline"
                            style={{ width: '100%', fontSize: 10.5, padding: '5px 6px' }}
                          >
                            ↺ Move back to review
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}