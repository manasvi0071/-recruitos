import { useEffect, useMemo, useState } from 'react';
import { getAllApplications, getJobs, updateApplicationStage } from '../lib/api';
 
const STAGES = ['Resume Review', 'Aptitude', 'GD', 'Interview', 'Selected', 'Rejected'];
 
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
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());
 
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
 
  // Stage -> candidate -> [applications]. This is the key change: within a
  // single stage column, every application from the same candidate is
  // collapsed into one card instead of repeating as separate cards.
  const byStageGrouped = useMemo(() => {
    const result = {};
    STAGES.forEach((stage) => {
      const inStage = filtered.filter((a) => a.stage === stage);
      const map = new Map();
      inStage.forEach((a) => {
        const key = a.candidates?.id || a.candidate_id || a.id;
        if (!map.has(key)) {
          map.set(key, { key, candidate: a.candidates, applications: [] });
        }
        map.get(key).applications.push(a);
      });
      result[stage] = Array.from(map.values());
    });
    return result;
  }, [filtered]);
 
  function toggleGroup(stage, key) {
    const gKey = `${stage}:${key}`;
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(gKey)) next.delete(gKey); else next.add(gKey);
      return next;
    });
  }
 
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
 
  async function moveGroup(applications, toStage) {
    setMovingId('group');
    try {
      await Promise.all(
        applications.filter((a) => a.stage !== toStage).map((a) => updateApplicationStage(a.id, toStage))
      );
      const ids = new Set(applications.map((a) => a.id));
      setApps((prev) => prev.map((a) => (ids.has(a.id) ? { ...a, stage: toStage } : a)));
    } catch (err) {
      alert('Could not move all applications: ' + err.message);
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
          <p>Drag a card between columns, or use quick actions · candidates with multiple applications are grouped</p>
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
            const groups = byStageGrouped[stage];
            const totalCount = groups.reduce((sum, g) => sum + g.applications.length, 0);
            const next = nextStage(stage);
 
            return (
              <div
                key={stage}
                style={{ minWidth: 260, flex: '0 0 260px' }}
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
                    {totalCount}
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
                  {groups.length === 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '28px 0', border: '1.5px dashed var(--border)', borderRadius: 10 }}>
                      {isDragOver ? 'Drop here' : 'No candidates'}
                    </div>
                  )}
 
                  {groups.map((g) => {
                    const single = g.applications.length === 1;
                    const gKey = `${stage}:${g.key}`;
                    const isOpen = expandedGroups.has(gKey);
                    const isGroupMoving = movingId === 'group';
 
                    return (
                      <div key={g.key} style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        boxShadow: 'var(--shadow-sm)',
                        overflow: 'hidden',
                      }}>
 
                        {/* Candidate header — always shown */}
                        <div
                          draggable={single}
                          onDragStart={single ? (e) => handleDragStart(e, g.applications[0]) : undefined}
                          onDragEnd={single ? handleDragEnd : undefined}
                          onClick={() => !single && toggleGroup(stage, g.key)}
                          style={{
                            padding: 12,
                            cursor: single ? 'grab' : 'pointer',
                            opacity: draggedId === g.applications[0]?.id ? 0.4 : 1,
                            display: 'flex', alignItems: 'center', gap: 8,
                          }}
                        >
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: 10.5, cursor: 'default', flexShrink: 0 }}>
                            {initials(g.candidate?.name)}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {g.candidate?.name}
                            </div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {single ? g.applications[0].job_profiles?.title : `${g.applications.length} applications in this stage`}
                            </div>
                          </div>
                          {single && g.applications[0].resume_score != null && (
                            <div className={`score-ring ${ringClass(g.applications[0].resume_score)}`} style={{ width: 30, height: 30, fontSize: 10.5, flexShrink: 0 }}>
                              {g.applications[0].resume_score}
                            </div>
                          )}
                          {!single && (
                            <>
                              <span className="pill" style={{ flexShrink: 0 }}>{g.applications.length}</span>
                              <span style={{ fontSize: 14, color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>⌄</span>
                            </>
                          )}
                        </div>
 
                        {single && (
                          <div style={{ padding: '0 12px 12px' }}>
                            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 10 }}>
                              {g.candidate?.colleges?.name || 'College not set'}
                            </div>
                            <CardActions app={g.applications[0]} stage={stage} next={next} movingId={movingId} moveCard={moveCard} />
                          </div>
                        )}
 
                        {/* Bulk actions + expanded job list, only for grouped (multi-application) candidates */}
                        {!single && (
                          <>
                            {stage !== 'Selected' && stage !== 'Rejected' && (
                              <div style={{ display: 'flex', gap: 6, padding: '0 12px 12px' }}>
                                {next && (
                                  <button disabled={isGroupMoving} onClick={() => moveGroup(g.applications, next)} className="btn-outline" style={{ flex: 1, fontSize: 10.5, padding: '5px 6px' }}>
                                    {isGroupMoving ? '···' : `→ Move all to ${next}`}
                                  </button>
                                )}
                              </div>
                            )}
 
                            {isOpen && (
                              <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)', padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {g.applications.map((app) => (
                                  <div
                                    key={app.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, app)}
                                    onDragEnd={handleDragEnd}
                                    style={{
                                      background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: 10,
                                      cursor: 'grab', opacity: draggedId === app.id ? 0.4 : movingId === app.id ? 0.6 : 1,
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                      <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {app.job_profiles?.title} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>· {app.job_profiles?.company}</span>
                                      </div>
                                      {app.resume_score != null && (
                                        <div className={`score-ring ${ringClass(app.resume_score)}`} style={{ width: 26, height: 26, fontSize: 9.5, flexShrink: 0 }}>
                                          {app.resume_score}
                                        </div>
                                      )}
                                    </div>
                                    <CardActions app={app} stage={stage} next={next} movingId={movingId} moveCard={moveCard} compact />
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
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
 
function CardActions({ app, stage, next, movingId, moveCard, compact }) {
  const isMoving = movingId === app.id;
  const size = compact ? { fontSize: 10, padding: '4px 6px' } : { fontSize: 10.5, padding: '5px 6px' };
 
  if (stage === 'Selected' || stage === 'Rejected') {
    return (
      <button disabled={isMoving} onClick={() => moveCard(app, 'Resume Review')} className="btn-outline" style={{ width: '100%', ...size }}>
        ↺ Move back to review
      </button>
    );
  }
 
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {next && (
        <button disabled={isMoving} onClick={() => moveCard(app, next)} className="btn-outline" style={{ flex: 1, ...size }}>
          {isMoving ? '···' : `→ ${next}`}
        </button>
      )}
      {stage === 'Interview' && (
        <button disabled={isMoving} onClick={() => moveCard(app, 'Selected')} className="btn-gold" style={{ flex: 1, ...size, background: 'var(--green)', boxShadow: 'none' }}>
          ✓ Select
        </button>
      )}
      <button
        disabled={isMoving}
        onClick={() => moveCard(app, 'Rejected')}
        style={{ ...size, borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--red)', background: 'white', color: 'var(--red)', cursor: 'pointer', fontWeight: 600 }}
      >
        ✕
      </button>
    </div>
  );
}