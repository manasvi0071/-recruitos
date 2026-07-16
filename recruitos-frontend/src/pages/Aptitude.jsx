import { useEffect, useMemo, useState } from 'react';
import { getAptitudeResults, addAptitudeResult, getCandidates, getJobs } from '../lib/api';

function inferDifficulty(job) {
  if (!job) return 'Medium';

  const title = `${job.title || ''} ${job.level || ''} ${job.description || ''}`.toLowerCase();

  if (
    title.includes('intern') ||
    title.includes('trainee') ||
    title.includes('junior') ||
    title.includes('entry')
  ) {
    return 'Easy';
  }

  if (
    title.includes('senior') ||
    title.includes('lead') ||
    title.includes('principal') ||
    title.includes('architect') ||
    title.includes('manager') ||
    title.includes('5+') ||
    title.includes('6+') ||
    title.includes('7+') ||
    title.includes('8+')
  ) {
    return 'Hard';
  }

  return 'Medium';
}

function buildTestBlueprint(job) {
  const difficulty = inferDifficulty(job);
  const title = `${job?.title || ''}`.toLowerCase();

  let totalQuestions = 30;
  let duration = 30;
  let sections = [
    { name: 'Quantitative Aptitude', questions: 10, level: difficulty },
    { name: 'Logical Reasoning', questions: 10, level: difficulty },
    { name: 'Verbal Ability', questions: 10, level: difficulty },
  ];

  let topics = [
    'Percentages',
    'Profit and Loss',
    'Time and Work',
    'Ratio and Proportion',
    'Seating Arrangement',
    'Series and Patterns',
    'Reading Comprehension',
    'Grammar and Vocabulary',
  ];

  if (difficulty === 'Easy') {
    totalQuestions = 24;
    duration = 25;
    sections = [
      { name: 'Quantitative Aptitude', questions: 8, level: 'Easy' },
      { name: 'Logical Reasoning', questions: 8, level: 'Easy' },
      { name: 'Verbal Ability', questions: 8, level: 'Easy' },
    ];
  }

  if (difficulty === 'Medium') {
    totalQuestions = 30;
    duration = 35;
    sections = [
      { name: 'Quantitative Aptitude', questions: 10, level: 'Medium' },
      { name: 'Logical Reasoning', questions: 10, level: 'Medium' },
      { name: 'Verbal Ability', questions: 10, level: 'Medium' },
    ];
  }

  if (difficulty === 'Hard') {
    totalQuestions = 40;
    duration = 45;
    sections = [
      { name: 'Quantitative Aptitude', questions: 14, level: 'Hard' },
      { name: 'Logical Reasoning', questions: 14, level: 'Hard' },
      { name: 'Verbal Ability', questions: 12, level: 'Hard' },
    ];
  }

  if (
    title.includes('developer') ||
    title.includes('engineer') ||
    title.includes('software') ||
    title.includes('analyst') ||
    title.includes('data')
  ) {
    topics = [
      'Percentages and Data Interpretation',
      'Probability and Permutation',
      'Logical Puzzles',
      'Analytical Reasoning',
      'Critical Reasoning',
      'Reading Comprehension',
      'Basic Data Analysis',
      'Problem Solving Speed',
    ];
  }

  if (
    title.includes('sales') ||
    title.includes('marketing') ||
    title.includes('business') ||
    title.includes('hr') ||
    title.includes('recruit')
  ) {
    topics = [
      'Arithmetic Basics',
      'Logical Reasoning',
      'Decision Making',
      'Communication Comprehension',
      'Grammar and Vocabulary',
      'Situational Judgment',
      'Business Interpretation',
      'Time Management',
    ];
  }

  return {
    difficulty,
    totalQuestions,
    duration,
    sections,
    topics,
    passingMarks:
      difficulty === 'Easy' ? '40%' : difficulty === 'Medium' ? '50%' : '60%',
  };
}

export default function Aptitude() {
  const [results, setResults] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    candidate_id: '',
    job_id: '',
    score: '',
    total: '40',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function init() {
      try {
        const [r, c, j] = await Promise.all([
          getAptitudeResults(),
          getCandidates(),
          getJobs(),
        ]);

        if (!ignore) {
          setResults(r || []);
          setCandidates(c || []);
          setJobs(j || []);
          setError('');
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to load aptitude data');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      ignore = true;
    };
  }, []);

  async function refreshResults() {
    try {
      const r = await getAptitudeResults();
      setResults(r || []);
    } catch (err) {
      setError(err.message || 'Failed to refresh results');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!form.candidate_id || !form.score || !form.total) {
      setFormError('Candidate, score, and total are required');
      return;
    }

    setSaving(true);
    try {
      await addAptitudeResult({
        ...form,
        score: Number(form.score),
        total: Number(form.total),
      });

      setForm({
        candidate_id: '',
        job_id: '',
        score: '',
        total: '40',
      });
      setShowForm(false);
      await refreshResults();
    } catch (err) {
      setFormError(err.message || 'Failed to save aptitude result');
    } finally {
      setSaving(false);
    }
  }

  const selectedJob = useMemo(
    () => jobs.find((j) => String(j.id) === String(form.job_id)),
    [jobs, form.job_id]
  );

  const generatedTest = useMemo(
    () => buildTestBlueprint(selectedJob),
    [selectedJob]
  );

  const attempted = results.length;
  const passed = results.filter((r) => r.passed).length;
  const passRate = attempted ? Math.round((passed / attempted) * 100) : 0;
  const avgScore = attempted
    ? (results.reduce((sum, r) => sum + Number(r.score || 0), 0) / attempted).toFixed(1)
    : '0';
  const avgTotal = attempted ? results[0]?.total || 0 : 0;

  return (
    <div className="page active" id="page-aptitude">
      <div className="page-head">
        <div>
          <h1>Aptitude Test</h1>
          <p>Live results and AI-generated test blueprint based on the selected job profile</p>
        </div>
        <button className="btn-gold" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Create Test'}
        </button>
      </div>

      {showForm && (
        <div className="panel">
          <div className="panel-title">Create Aptitude Test / Add Result</div>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
          >
            <div className="field">
              <label>Candidate *</label>
              <select
                value={form.candidate_id}
                onChange={(e) => setForm({ ...form, candidate_id: e.target.value })}
                required
              >
                <option value="">Select candidate…</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Job Profile</label>
              <select
                value={form.job_id}
                onChange={(e) => {
                  const nextJobId = e.target.value;
                  const job = jobs.find((j) => String(j.id) === String(nextJobId));
                  const blueprint = buildTestBlueprint(job);

                  setForm({
                    ...form,
                    job_id: nextJobId,
                    total: String(blueprint.totalQuestions),
                  });
                }}
              >
                <option value="">Optional…</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.company} — {j.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Score *</label>
              <input
                type="number"
                value={form.score}
                onChange={(e) => setForm({ ...form, score: e.target.value })}
                required
              />
            </div>

            <div className="field">
              <label>Total *</label>
              <input
                type="number"
                value={form.total}
                onChange={(e) => setForm({ ...form, total: e.target.value })}
                required
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div
                className="panel"
                style={{
                  marginBottom: 10,
                  padding: 16,
                  background: 'rgba(124,58,237,0.05)',
                  border: '1px solid rgba(124,58,237,0.12)',
                }}
              >
                <div className="panel-title" style={{ marginBottom: 10 }}>
                  AI Test Blueprint
                </div>

                <div className="grid2">
                  <div>
                    <div className="resume-row" style={{ paddingTop: 0 }}>
                      <div className="resume-info">
                        <div className="name">Selected Job</div>
                      </div>
                      <strong>{selectedJob ? `${selectedJob.company} — ${selectedJob.title}` : 'General Test'}</strong>
                    </div>

                    <div className="resume-row">
                      <div className="resume-info">
                        <div className="name">Difficulty</div>
                      </div>
                      <span className={`badge ${generatedTest.difficulty === 'Hard' ? 'red' : generatedTest.difficulty === 'Medium' ? 'gold' : 'green'}`}>
                        {generatedTest.difficulty}
                      </span>
                    </div>

                    <div className="resume-row">
                      <div className="resume-info">
                        <div className="name">Questions</div>
                      </div>
                      <strong>{generatedTest.totalQuestions}</strong>
                    </div>

                    <div className="resume-row">
                      <div className="resume-info">
                        <div className="name">Duration</div>
                      </div>
                      <strong>{generatedTest.duration} min</strong>
                    </div>

                    <div className="resume-row">
                      <div className="resume-info">
                        <div className="name">Recommended Pass Mark</div>
                      </div>
                      <strong>{generatedTest.passingMarks}</strong>
                    </div>
                  </div>

                  <div>
                    <div className="panel-sub" style={{ marginBottom: 8 }}>
                      Suggested sections
                    </div>
                    {generatedTest.sections.map((section) => (
                      <div className="resume-row" key={section.name}>
                        <div className="resume-info">
                          <div className="name">{section.name}</div>
                        </div>
                        <strong>
                          {section.questions} Q • {section.level}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <div className="panel-sub" style={{ marginBottom: 8 }}>
                    Suggested topics
                  </div>
                  <div className="skills">
                    {generatedTest.topics.map((topic) => (
                      <span key={topic} className="course-chip sel" style={{ marginRight: 6, marginBottom: 6 }}>
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {formError && (
                <p style={{ color: 'var(--red, #d64545)', fontSize: 12.5, marginBottom: 8 }}>
                  {formError}
                </p>
              )}

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
              <tr>
                <th>Rank</th>
                <th>Candidate</th>
                <th>Score</th>
                <th>Result</th>
              </tr>

              {loading && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--slate-light)', padding: 24 }}>
                    Loading…
                  </td>
                </tr>
              )}

              {error && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--red, #d64545)', padding: 24 }}>
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && results.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--slate-light)', padding: 24 }}>
                    No aptitude results yet
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                results.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td>{r.candidates?.name}</td>
                    <td>
                      {r.score}/{r.total}
                    </td>
                    <td>
                      <span className={`badge ${r.passed ? 'green' : 'red'}`}>
                        {r.passed ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="panel-title">Test Summary</div>
          <div className="resume-row" style={{ paddingTop: 0 }}>
            <div className="resume-info">
              <div className="name">Attempted</div>
            </div>
            <strong>{attempted}</strong>
          </div>
          <div className="resume-row">
            <div className="resume-info">
              <div className="name">Pass Rate</div>
            </div>
            <strong>{passRate}%</strong>
          </div>
          <div className="resume-row">
            <div className="resume-info">
              <div className="name">Avg. Score</div>
            </div>
            <strong>
              {avgScore} / {avgTotal}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}