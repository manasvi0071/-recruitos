import { useEffect, useState } from 'react';
import { getInterviews, addInterview, getCandidates } from '../lib/api';

export default function Interview() {
  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    candidate_id: '', type: 'Mock', confidence: '', technical: '', communication: '', notes: '', recommendation: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  function loadAll() {
    setLoading(true);
    Promise.all([getInterviews(), getCandidates()])
      .then(([i, c]) => {
        setInterviews(i);
        setCandidates(c);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
  let ignore = false;

  async function init() {
    setLoading(true);
    try {
      const [i, c] = await Promise.all([getInterviews(), getCandidates()]);
      if (!ignore) {
        setInterviews(i);
        setCandidates(c);
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

  const mockInterviews = interviews.filter((i) => i.type === 'Mock');
  const personalInterviews = interviews.filter((i) => i.type === 'HR');

  return (
    <div className="page active" id="page-interview">
      <div className="page-head">
        <div><h1>Interviews</h1><p>Mock Interview (AI) and Personal Interview (HR) stages</p></div>
        <button className="btn-gold" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Add Interview'}
        </button>
      </div>

      {showForm && (
        <div className="panel">
          <div className="panel-title">Add Interview Record</div>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Candidate *</label>
              <select value={form.candidate_id} onChange={(e) => setForm({ ...form, candidate_id: e.target.value })} required>
                <option value="">Select candidate…</option>
                {candidates.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
              {formError && <p style={{ color: 'var(--red, #d64545)', fontSize: 12.5, marginBottom: 8 }}>{formError}</p>}
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save Interview'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className="panel"><p style={{ color: 'var(--slate-light)' }}>Loading…</p></div>}
      {error && <div className="panel"><p style={{ color: 'var(--red, #d64545)' }}>{error}</p></div>}

      <div className="grid2">
        <div className="panel">
          <div className="panel-title">Mock Interview — AI Evaluation</div>
          {!loading && mockInterviews.length === 0 && <p style={{ color: 'var(--slate-light)' }}>No mock interviews yet</p>}
          {mockInterviews.map((i) => (
            <div key={i.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border, #e5e5e5)' }}>
              <p style={{ fontSize: 12.5, color: 'var(--slate)', marginBottom: 8 }}>Candidate: {i.candidates?.name}</p>
              <div className="rating-row"><span>Confidence</span><strong>{i.confidence} / 10</strong></div>
              <div className="rating-row"><span>Technical Knowledge</span><strong>{i.technical} / 10</strong></div>
              <div className="rating-row"><span>Grammar & Communication</span><strong>{i.communication} / 10</strong></div>
              <div className="rating-row"><strong>Overall Score</strong><strong style={{ color: 'var(--gold)' }}>{i.overall} / 10</strong></div>
            </div>
          ))}
        </div>
        <div className="panel">
          <div className="panel-title">Personal Interview — HR Notes</div>
          {!loading && personalInterviews.length === 0 && <p style={{ color: 'var(--slate-light)' }}>No personal interviews yet</p>}
          {personalInterviews.map((i) => (
            <div key={i.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border, #e5e5e5)' }}>
              <p style={{ fontSize: 12.5, color: 'var(--slate)', marginBottom: 10 }}>Candidate: {i.candidates?.name}</p>
              <p style={{ fontSize: 12.5, color: 'var(--slate-light)', marginBottom: 14 }}>{i.notes}</p>
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