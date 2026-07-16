import { useEffect, useState, useCallback } from 'react';
import { updateApplicationScore } from '../lib/api';
import { supabase } from '../lib/supabaseClient';

function badgeColor(score) {
  if (score >= 85) return { badge: 'green', label: 'Strong Match' };
  if (score >= 70) return { badge: 'gold', label: 'Moderate Match' };
  return { badge: 'red', label: 'Weak Match' };
}

export default function Resume() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ resume_score: '', matched_skills: '', missing_skills: '' });
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const loadResumes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('applications')
        .select(`
          id, resume_score, matched_skills, missing_skills,
          ai_score, ai_status, match_label, ai_feedback,
          candidates ( name, resume_url, colleges ( name ) ),
          job_profiles ( title, company )
        `)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setRows(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => { await loadResumes(); };
    init();
  }, [loadResumes]);

  function startEdit(r) {
    setEditingId(r.id);
    setExpandedId(r.id);
    setEditForm({
      resume_score: r.resume_score ?? r.ai_score ?? '',
      matched_skills: (r.matched_skills || []).join(', '),
      missing_skills: (r.missing_skills || []).join(', '),
    });
  }

  async function saveEdit(id) {
    setSaving(true);
    try {
      await updateApplicationScore(id, {
        resume_score: Number(editForm.resume_score),
        matched_skills: editForm.matched_skills.split(',').map((s) => s.trim()).filter(Boolean),
        missing_skills: editForm.missing_skills.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setEditingId(null);
      await loadResumes();
    } catch (err) {
      alert('Could not save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function getScore(r) {
    if (r.resume_score != null) return { score: r.resume_score, isAI: false };
    if (r.ai_score != null) return { score: r.ai_score, isAI: true };
    return { score: null, isAI: false };
  }

  if (loading) return (
    <div className="page active">
      <div className="page-head"><div><h1>Resume Analyzer (AI)</h1><p>Loading...</p></div></div>
      <div className="panel" style={{ textAlign: 'center', padding: 60, color: 'var(--slate-light)' }}>
        Loading resumes...
      </div>
    </div>
  );

  return (
    <div className="page active" id="page-resume">
      <div className="page-head">
        <div>
          <h1>Resume Analyzer (AI)</h1>
          <p>{rows.length} resumes · AI auto-scores against job requirements</p>
        </div>
        <button className="btn-outline" onClick={loadResumes}>↻ Refresh</button>
      </div>

      {error && (
        <div style={{ background: '#F4E3DB', border: '1px solid var(--red)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: 'var(--red)', fontSize: 13 }}>
          Error: {error}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <div style={{ color: 'var(--slate-light)', fontSize: 14, marginBottom: 12 }}>No resumes yet.</div>
          <div style={{ background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 20px', display: 'inline-block', fontSize: 13, color: 'var(--navy-deep)', fontWeight: 600 }}>
            Share this link → {window.location.origin}/apply
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {rows.map((r) => {
            const { score, isAI } = getScore(r);
            const hasScore = score != null;
            const matched = r.matched_skills || [];
            const missing = r.missing_skills || [];
            const isEditing = editingId === r.id;
            const isExpanded = expandedId === r.id;

            return (
              <div key={r.id} style={{
                background: 'white',
                border: '1px solid var(--line)',
                borderRadius: 14,
                overflow: 'hidden',
                boxShadow: '0 2px 12px -4px rgba(10,12,18,0.08)',
              }}>

                {/* Top row — always visible */}
                <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>

                  {/* Big score circle */}
                  <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid',
                    borderColor: hasScore ? (score >= 85 ? 'var(--green)' : score >= 70 ? 'var(--gold)' : 'var(--red)') : 'var(--line)',
                    background: hasScore ? (score >= 85 ? '#E1ECE6' : score >= 70 ? 'var(--gold-soft)' : '#F4E3DB') : 'var(--cream)',
                  }}>
                    <div style={{
                      fontSize: hasScore ? 22 : 13,
                      fontWeight: 700,
                      fontFamily: 'Fraunces, serif',
                      color: hasScore ? (score >= 85 ? 'var(--green)' : score >= 70 ? '#7A5D24' : 'var(--red)') : 'var(--slate-light)',
                    }}>
                      {hasScore ? score : r.ai_status === 'Pending' ? '...' : '—'}
                    </div>
                    {hasScore && <div style={{ fontSize: 9, color: 'var(--slate-light)', marginTop: 1 }}>/ 100</div>}
                  </div>

                  {/* Candidate info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy-deep)', marginBottom: 4 }}>
                      {r.candidates?.name}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--slate-light)', marginBottom: 6 }}>
                      {r.candidates?.colleges?.name || 'College not set'} · Applying for <strong style={{ color: 'var(--navy-deep)' }}>{r.job_profiles?.title}</strong> at {r.job_profiles?.company}
                    </div>
                    {isAI && hasScore && (
                      <div style={{ fontSize: 11, color: 'var(--blue)', background: '#E2E9F4', borderRadius: 5, padding: '2px 8px', display: 'inline-block' }}>
                        🤖 AI Scored
                      </div>
                    )}
                    {!hasScore && r.ai_status !== 'Pending' && (
                      <div style={{ fontSize: 11.5, color: 'var(--slate-light)' }}>Not scored yet — click Add Score</div>
                    )}
                    {r.ai_status === 'Pending' && (
                      <div style={{ fontSize: 11.5, color: 'var(--gold)', background: 'var(--gold-soft)', borderRadius: 5, padding: '2px 8px', display: 'inline-block' }}>
                        ⏳ AI analyzing...
                      </div>
                    )}
                  </div>

                  {/* Right side actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    {hasScore && (
                      <span className={`badge ${badgeColor(score).badge}`} style={{ fontSize: 12, padding: '4px 12px' }}>
                        {r.match_label || badgeColor(score).label}
                      </span>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {r.candidates?.resume_url && (
                        <button
                          className="btn-outline"
                          style={{ fontSize: 12, padding: '6px 12px' }}
                          onClick={() => window.open(r.candidates.resume_url, '_blank')}
                        >
                          📎 View PDF
                        </button>
                      )}
                      <button
                        className="btn-outline"
                        style={{ fontSize: 12, padding: '6px 12px' }}
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      >
                        {isExpanded ? '▲ Hide' : '▼ Details'}
                      </button>
                      <button
                        className="btn-gold"
                        style={{ fontSize: 12, padding: '6px 14px' }}
                        onClick={() => startEdit(r)}
                      >
                        {hasScore ? '✏️ Edit Score' : '+ Add Score'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress bar — always visible if scored */}
                {hasScore && (
                  <div style={{ padding: '0 24px 4px' }}>
                    <div style={{ height: 6, background: 'var(--line)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${score}%`, background: score >= 85 ? 'var(--green)' : score >= 70 ? 'var(--gold)' : 'var(--red)', borderRadius: 4, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )}

                {/* Expanded details section */}
                {isExpanded && !isEditing && (
                  <div style={{ padding: '20px 24px', borderTop: '1px solid var(--line)', background: 'var(--cream)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: hasScore ? 16 : 0 }}>

                      {/* Matched skills */}
                      <div style={{ background: 'white', borderRadius: 10, padding: '14px 16px', border: '1px solid #E1ECE6' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                          ✅ Matched Skills
                        </div>
                        {matched.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {matched.map((s) => (
                              <span key={s} style={{ background: '#E1ECE6', color: 'var(--green)', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 500 }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12.5, color: 'var(--slate-light)' }}>No matched skills recorded</div>
                        )}
                      </div>

                      {/* Missing skills */}
                      <div style={{ background: 'white', borderRadius: 10, padding: '14px 16px', border: '1px solid #F4E3DB' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                          ❌ Missing Skills
                        </div>
                        {missing.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {missing.map((s) => (
                              <span key={s} style={{ background: '#F4E3DB', color: 'var(--red)', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 500 }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12.5, color: 'var(--slate-light)' }}>No missing skills recorded</div>
                        )}
                      </div>
                    </div>

                    {/* AI Feedback */}
                    {r.ai_feedback && (
                      <div style={{ background: 'white', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--line)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                          🤖 AI Feedback
                        </div>
                        <div style={{ fontSize: 13.5, color: 'var(--slate)', lineHeight: 1.7 }}>
                          {r.ai_feedback}
                        </div>
                      </div>
                    )}

                    {!hasScore && !r.ai_feedback && (
                      <div style={{ textAlign: 'center', color: 'var(--slate-light)', fontSize: 13, padding: '8px 0' }}>
                        No analysis yet. Click "+ Add Score" to manually score this resume.
                      </div>
                    )}
                  </div>
                )}

                {/* Edit form */}
                {isEditing && (
                  <div style={{ padding: '20px 24px', borderTop: '1px solid var(--line)', background: 'var(--cream)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy-deep)', marginBottom: 16 }}>
                      Edit Score for {r.candidates?.name}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 12, marginBottom: 14 }}>
                      <div>
                        <label style={{ fontSize: 11.5, color: 'var(--slate-light)', display: 'block', marginBottom: 5 }}>Score (0–100)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editForm.resume_score}
                          onChange={(e) => setEditForm({ ...editForm, resume_score: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 7, fontSize: 14, fontWeight: 700, color: 'var(--navy-deep)', background: 'white' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11.5, color: 'var(--slate-light)', display: 'block', marginBottom: 5 }}>Matched Skills (comma separated)</label>
                        <input
                          value={editForm.matched_skills}
                          onChange={(e) => setEditForm({ ...editForm, matched_skills: e.target.value })}
                          placeholder="e.g. Java, SQL, Problem Solving"
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 7, fontSize: 13, background: 'white' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11.5, color: 'var(--slate-light)', display: 'block', marginBottom: 5 }}>Missing Skills (comma separated)</label>
                        <input
                          value={editForm.missing_skills}
                          onChange={(e) => setEditForm({ ...editForm, missing_skills: e.target.value })}
                          placeholder="e.g. AWS, Docker"
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 7, fontSize: 13, background: 'white' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn-gold" disabled={saving} onClick={() => saveEdit(r.id)} style={{ padding: '9px 20px' }}>
                        {saving ? 'Saving...' : '✓ Save Score'}
                      </button>
                      <button className="btn-outline" onClick={() => { setEditingId(null); setExpandedId(null); }} style={{ padding: '9px 16px' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}