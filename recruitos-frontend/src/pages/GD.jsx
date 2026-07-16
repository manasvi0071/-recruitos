import { useEffect, useState } from 'react';
import { getGdRatings, addGdRating, getCandidates } from '../lib/api';

const categories = [
  { key: 'confidence', label: 'Confidence' },
  { key: 'communication', label: 'Communication' },
  { key: 'leadership', label: 'Leadership' },
  { key: 'participation', label: 'Participation' },
  { key: 'knowledge', label: 'Knowledge' },
  { key: 'teamwork', label: 'Teamwork' },
];

function stars(n) {
  const full = Math.round(n);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

export default function GD() {
  const [ratings, setRatings] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    candidate_id: '', confidence: 3, communication: 3, leadership: 3, participation: 3, knowledge: 3, teamwork: 3,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  function loadAll() {
    setLoading(true);
    Promise.all([getGdRatings(), getCandidates()])
      .then(([r, c]) => {
        setRatings(r);
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
      const [r, c] = await Promise.all([getGdRatings(), getCandidates()]);
      if (!ignore) {
        setRatings(r);
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
      await addGdRating(form);
      setForm({ candidate_id: '', confidence: 3, communication: 3, leadership: 3, participation: 3, knowledge: 3, teamwork: 3 });
      setShowForm(false);
      loadAll();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page active" id="page-gd">
      <div className="page-head">
        <div><h1>Group Discussion</h1><p>Live ratings across all GD sessions</p></div>
        <button className="btn-gold" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ New GD Topic'}
        </button>
      </div>

      {showForm && (
        <div className="panel">
          <div className="panel-title">Add GD Rating</div>
          <form onSubmit={handleSubmit}>
            <div className="field" style={{ marginBottom: 12 }}>
              <label>Candidate *</label>
              <select value={form.candidate_id} onChange={(e) => setForm({ ...form, candidate_id: e.target.value })} required>
                <option value="">Select candidate…</option>
                {candidates.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {categories.map((cat) => (
                <div className="field" key={cat.key}>
                  <label>{cat.label} (1-5)</label>
                  <input
                    type="number" min="1" max="5"
                    value={form[cat.key]}
                    onChange={(e) => setForm({ ...form, [cat.key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              {formError && <p style={{ color: 'var(--red, #d64545)', fontSize: 12.5, marginBottom: 8 }}>{formError}</p>}
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save Rating'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className="panel"><p style={{ color: 'var(--slate-light)' }}>Loading…</p></div>}
      {error && <div className="panel"><p style={{ color: 'var(--red, #d64545)' }}>{error}</p></div>}
      {!loading && !error && ratings.length === 0 && (
        <div className="panel"><p style={{ color: 'var(--slate-light)' }}>No GD ratings yet</p></div>
      )}
      {!loading && !error && ratings.map((r) => (
        <div className="panel" key={r.id}>
          <div className="panel-title">{r.candidates?.name} — Rating</div>
          {categories.map((cat) => (
            <div className="rating-row" key={cat.key}>
              <span>{cat.label}</span>
              <span className="stars">{stars(r[cat.key])}</span>
            </div>
          ))}
          <div className="rating-row"><strong>Overall Rating</strong><strong style={{ color: 'var(--gold)' }}>{r.overall} / 5</strong></div>
        </div>
      ))}
    </div>
  );
}