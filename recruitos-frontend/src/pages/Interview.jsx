import { useEffect, useState } from 'react';
import { getInterviews, addInterview, getCandidates, getAllApplications } from '../lib/api';

export default function Interview() {
  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    candidate_id: '', type: 'Mock', confidence: '', technical: '', communication: '', notes: '', recommendation: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [showLinks, setShowLinks] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // 'inhouse' = campus candidates (has a college linked), 'corporate' = client hiring (no college)
  const [viewMode, setViewMode] = useState('inhouse');

  function loadAll() {
    setLoading(true);
    Promise.all([getInterviews(), getCandidates(), getAllApplications()])
      .then(([i, c, a]) => {
        setInterviews(i);
        setCandidates(c);
        setApplications(a);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    let ignore = false;

    async function init() {
      setLoading(true);
      try {
        const [i, c, a] = await Promise.all([getInterviews(), getCandidates(), getAllApplications()]);
        if (!ignore) {
          setInterviews(i);
          setCandidates(c);
          setApplications(a);
          setError('');
        }
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    init();
    return () => { ignore = true; };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!form.candidate_id) { setFormError('Candidate is required'); return; }
    setSaving(true);
    try {
      await addInterview(form);
      setForm({ candidate_id: '', type: 'Mock', confidence: '', technical: '', communication: '', notes: '', recommendation: '' });
      setShowForm(false);
      loadAll();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function copyInterviewLink(app) {
    const candId = app.candidates?.id;
    const jobId = app.job_profiles?.id;
    if (!candId || !jobId) return;
    const link = `${window.location.origin}/interview/${candId}/${jobId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(app.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  // A candidate counts as "in-house" (campus) if they have a college linked.
  // No college on file means the hire is treated as corporate/client-side.
  function isInHouse(interview) {
    return Boolean(interview.candidates?.college_id || interview.candidates?.colleges?.name);
  }

  const inScope = interviews.filter((i) => (viewMode === 'inhouse' ? isInHouse(i) : !isInHouse(i)));
  const mockInterviews = inScope.filter((i) => i.type === 'Mock');
  const personalInterviews = inScope.filter((i) => i.type === 'HR');

  const inHouseCount = interviews.filter(isInHouse).length;
  const corporateCount = interviews.length - inHouseCount;

  return (
    <div className="page active" id="page-interview">
      <div className="page-head">
        <div><h1>Interviews</h1><p>Mock Interview (AI) and Personal Interview (HR) stages</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" onClick={() => setShowLinks((v) => !v)}>
            {showLinks ? 'Hide' : '🔗'} AI Interview Links
          </button>
          <button className="btn-gold" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : '+ Add Interview'}
          </button>
        </div>
      </div>

      {/* In-house vs Corporate toggle */}
      <div className="mode-toggle" style={{ marginBottom: 20 }}>
        <button
          className={`mode-btn ${viewMode === 'inhouse' ? 'active' : ''}`}
          onClick={() => setViewMode('inhouse')}
        >
          🎓 In-house (Campus) · {inHouseCount}
        </button>
        <button
          className={`mode-btn ${viewMode === 'corporate' ? 'active' : ''}`}
          onClick={() => setViewMode('corporate')}
        >
          🏢 Corporate (Client) · {corporateCount}
        </button>
      </div>

      {showLinks && (
        <div className="panel">
          <div className="panel-title">🤖 Send AI Interview</div>
          <div className="panel-sub">Copy a candidate's personal interview link and share it with them (email, WhatsApp, etc.)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {applications.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No applications yet.</p>}
            {applications.map((app) => (
              <div key={app.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-2)',
              }}>
                <div style={{ fontSize: 13 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{app.candidates?.name}</strong>
                  <span style={{ color: 'var(--text-muted)' }}> — {app.job_profiles?.title} at {app.job_profiles?.company || 'N/A'}</span>
                </div>
                <button className="btn-outline" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => copyInterviewLink(app)}>
                  {copiedId === app.id ? '✓ Copied' : '📋 Copy Link'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="panel">
          <div className="panel-title">Add Interview Record (manual entry)</div>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Candidate *</label>
              <select value={form.candidate_id} onChange={(e) => setForm({ ...form, candidate_id: e.target.value })} required>
                <option value="">Select candidate…</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.colleges?.name ? `— ${c.colleges.name} (In-house)` : '(Corporate)'}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Type *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="Mock">Mock Interview (AI)</option>
                <option value="HR">Personal Interview (HR)</option>
              </select>
            </div>

            {form.type === 'Mock' ? (
              <>
                <div className="field">
                  <label>Confidence (0-10)</label>
                  <input type="number" step="0.1" value={form.confidence} onChange={(e) => setForm({ ...form, confidence: e.target.value })} />
                </div>
                <div className="field">
                  <label>Technical Knowledge (0-10)</label>
                  <input type="number" step="0.1" value={form.technical} onChange={(e) => setForm({ ...form, technical: e.target.value })} />
                </div>
                <div className="field">
                  <label>Grammar & Communication (0-10)</label>
                  <input type="number" step="0.1" value={form.communication} onChange={(e) => setForm({ ...form, communication: e.target.value })} />
                </div>
              </>
            ) : (
              <>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>HR Notes</label>
                  <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div className="field">
                  <label>Recommendation</label>
                  <select value={form.recommendation} onChange={(e) => setForm({ ...form, recommendation: e.target.value })}>
                    <option value="">Select…</option>
                    <option value="Recommended">Recommended</option>
                    <option value="Not Recommended">Not Recommended</option>
                  </select>
                </div>
              </>
            )}

            <div style={{ gridColumn: '1 / -1' }}>
              {formError && <p style={{ color: 'var(--red)', fontSize: 12.5, marginBottom: 8 }}>{formError}</p>}
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save Interview'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className="panel"><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div>}
      {error && <div className="panel"><p style={{ color: 'var(--red)' }}>{error}</p></div>}

      <div className="grid2">
        <div className="panel">
          <div className="panel-title">Mock Interview — AI Evaluation</div>
          <div className="panel-sub">{viewMode === 'inhouse' ? 'In-house / campus candidates' : 'Corporate / client hiring'}</div>
          {!loading && mockInterviews.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No mock interviews yet</p>}
          {mockInterviews.map((i) => (
            <div key={i.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Candidate: {i.candidates?.name}
                {i.candidates?.colleges?.name && (
                  <span style={{ color: 'var(--text-muted)' }}> · {i.candidates.colleges.name}</span>
                )}
              </p>
              <div className="rating-row"><span>Confidence</span><strong>{i.confidence} / 10</strong></div>
              <div className="rating-row"><span>Technical Knowledge</span><strong>{i.technical} / 10</strong></div>
              <div className="rating-row"><span>Grammar & Communication</span><strong>{i.communication} / 10</strong></div>
              <div className="rating-row"><strong>Overall Score</strong><strong style={{ color: 'var(--gold)' }}>{i.overall} / 10</strong></div>
              {i.notes && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>{i.notes}</p>}
              {i.recommendation && (
                <span className={`badge ${i.recommendation === 'Recommended' ? 'green' : 'red'}`} style={{ marginTop: 8, display: 'inline-block' }}>
                  {i.recommendation}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="panel">
          <div className="panel-title">Personal Interview — HR Notes</div>
          <div className="panel-sub">{viewMode === 'inhouse' ? 'In-house / campus candidates' : 'Corporate / client hiring'}</div>
          {!loading && personalInterviews.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No personal interviews yet</p>}
          {personalInterviews.map((i) => (
            <div key={i.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 10 }}>
                Candidate: {i.candidates?.name}
                {i.candidates?.colleges?.name && (
                  <span style={{ color: 'var(--text-muted)' }}> · {i.candidates.colleges.name}</span>
                )}
              </p>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 14 }}>{i.notes}</p>
              {i.recommendation && (
                <span className={`badge ${i.recommendation === 'Recommended' ? 'green' : 'red'}`}>{i.recommendation}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}