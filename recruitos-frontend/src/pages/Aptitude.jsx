import { useEffect, useState } from 'react';
import { getAptitudeResults, addAptitudeResult, getCandidates, getJobs } from '../lib/api';

export default function Aptitude() {
  const [results, setResults] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ candidate_id: '', job_id: '', score: '', total: '40' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function loadAll() {
    setLoading(true);
    try {
      const [r, c, j] = await Promise.all([getAptitudeResults(), getCandidates(), getJobs()]);
      setResults(r);
      setCandidates(c);
      setJobs(j);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function init() {
      setLoading(true);
      try {
        const [r, c, j] = await Promise.all([getAptitudeResults(), getCandidates(), getJobs()]);
        if (!ignore) {
          setResults(r);
          setCandidates(c);
          setJobs(j);
          setError('');
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load data');
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
    if (!form.candidate_id || !form.score || !form.total) {
      setFormError('Candidate, score, and total are required');
      return;
    }
    setSaving(true);
    try {
      await addAptitudeResult(form);
      setForm({ candidate_id: '', job_id: '', score: '', total: '40' });
      setShowForm(false);
      loadAll();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const attempted = results.length;
  const passed = results.filter((r) => r.passed).length;
  const passRate = attempted ? Math.round((passed / attempted) * 100) : 0;
  const avgScore = attempted
    ? (results.reduce((sum, r) => sum + r.score, 0) / attempted).toFixed(1)
    : '0';
  const avgTotal = attempted ? results[0].total : 0;

  return (
    <div className="page active" id="page-aptitude">
      <div className="page-head">
        <div><h1>Aptitude Test</h1><p>Live results across all aptitude tests</p></div>
        <button className="btn-gold" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Create Test'}
        </button>
      </div>

      {showForm && (
        <div className="panel">
          <div className="panel-title">Add Aptitude Result</div>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Candidate *</label>
              <select value={form.candidate_id} onChange={(e) => setForm({ ...form, candidate_id: e.target.value })} required>
                <option value="">Select candidate…</option>
                {candidates.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Job Profile</label>
              <select value={form.job_id} onChange={(e) => setForm({ ...form, job_id: e.target.value })}>
                <option value="">Optional…</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.company} — {j.title}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Score *</label>
              <input type="number" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} required />
            </div>
            <div className="field">
              <label>Total *</label>
              <input type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              {formError && <p style={{ color: 'var(--red, #d64545)', fontSize: 12.5, marginBottom: 8 }}>{formError}</p>}
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save Result'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid2">
        <div className="panel">
          <div className="panel-title">Leaderboard</div>
          <table>
            <tbody>
              <tr><th>Rank</th><th>Candidate</th><th>Score</th><th>Result</th></tr>
              {loading && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--slate-light)', padding: 24 }}>Loading…</td></tr>
              )}
              {error && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--red, #d64545)', padding: 24 }}>{error}</td></tr>
              )}
              {!loading && !error && results.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--slate-light)', padding: 24 }}>No aptitude results yet</td></tr>
              )}
              {!loading && !error && results.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>{r.candidates?.name}</td>
                  <td>{r.score}/{r.total}</td>
                  <td><span className={`badge ${r.passed ? 'green' : 'red'}`}>{r.passed ? 'Pass' : 'Fail'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <div className="panel-title">Test Summary</div>
          <div className="resume-row" style={{ paddingTop: 0 }}><div className="resume-info"><div className="name">Attempted</div></div><strong>{attempted}</strong></div>
          <div className="resume-row"><div className="resume-info"><div className="name">Pass Rate</div></div><strong>{passRate}%</strong></div>
          <div className="resume-row"><div className="resume-info"><div className="name">Avg. Score</div></div><strong>{avgScore} / {avgTotal}</strong></div>
        </div>
      </div>
    </div>
  );
}