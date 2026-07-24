import { useEffect, useState } from 'react';
import { getAptitudeResults, addAptitudeResult, getCandidates, getJobs, generateAptitudeTest } from '../lib/api';

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

  const [showGenForm, setShowGenForm] = useState(false);
  const [genJobId, setGenJobId] = useState('');
  const [genDifficulty, setGenDifficulty] = useState('auto');
  const [genQCount, setGenQCount] = useState(20);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [generatedTest, setGeneratedTest] = useState(null);

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

  async function handleGenerate(e) {
    e.preventDefault();
    setGenError('');
    setGeneratedTest(null);
    setGenerating(true);
    try {
      const test = await generateAptitudeTest({
        job_id: genJobId || null,
        difficulty: genDifficulty,
        question_count: genQCount,
      });
      setGeneratedTest(test);
      if (genJobId) {
        setForm((f) => ({ ...f, job_id: genJobId, total: String(test.total) }));
      }
    } catch (err) {
      setGenError(err.message);
    } finally {
      setGenerating(false);
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
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" onClick={() => setShowGenForm((v) => !v)}>
            {showGenForm ? 'Cancel' : '✨ Generate AI Test'}
          </button>
          <button className="btn-gold" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : '+ Add Result'}
          </button>
        </div>
      </div>

      {showGenForm && (
        <div className="panel">
          <div className="panel-title">Generate AI-Tailored Aptitude Test</div>
          <p className="panel-sub">
            Pick a job so the AI matches question difficulty and topics to that role's level and skills —
            or leave it blank for a general fresher-level test.
          </p>
          <form onSubmit={handleGenerate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, alignItems: 'end' }}>
            <div className="field">
              <label>Job Profile</label>
              <select value={genJobId} onChange={(e) => setGenJobId(e.target.value)}>
                <option value="">General / no specific job</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.company} — {j.title}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Difficulty</label>
              <select value={genDifficulty} onChange={(e) => setGenDifficulty(e.target.value)}>
                <option value="auto">Auto (match job level)</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="field">
              <label># Questions</label>
              <input type="number" min={5} max={50} value={genQCount} onChange={(e) => setGenQCount(Number(e.target.value))} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              {genError && <p style={{ color: 'var(--danger)', fontSize: 12.5, marginBottom: 8 }}>{genError}</p>}
              <button className="btn-primary" type="submit" disabled={generating}>
                {generating ? 'Generating…' : 'Generate Test'}
              </button>
            </div>
          </form>

          {generatedTest && (
            <div style={{ marginTop: 20 }}>
              <div className="panel-title" style={{ fontSize: 14 }}>
                Preview — {generatedTest.questions.length} questions ({generatedTest.difficulty} level)
              </div>
              <div style={{ maxHeight: 380, overflowY: 'auto', marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {generatedTest.questions.map((q, i) => (
                  <div key={i} style={{ padding: '12px 14px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{i + 1}. {q.q}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      {q.options.map((opt, oi) => (
                        <div key={oi} style={{ color: opt === q.answer ? 'var(--success)' : 'var(--text-secondary)', fontWeight: opt === q.answer ? 700 : 400 }}>
                          {String.fromCharCode(65 + oi)}. {opt} {opt === q.answer ? '✓' : ''}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 6 }}>
                      Topic: {q.topic} · Difficulty: {q.difficulty}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
              {formError && <p style={{ color: 'var(--danger)', fontSize: 12.5, marginBottom: 8 }}>{formError}</p>}
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
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>Loading…</td></tr>
              )}
              {error && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--danger)', padding: 24 }}>{error}</td></tr>
              )}
              {!loading && !error && results.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No aptitude results yet</td></tr>
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