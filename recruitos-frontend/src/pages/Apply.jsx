import { useEffect, useState } from 'react';
import { getJobs, getColleges, uploadResume, createCandidate, applyToJob, updateApplicationScore } from '../lib/api';
import { extractPdfText, scoreResume } from '../lib/resumeScoring';

export default function Apply() {
  const [step, setStep] = useState(1);
  const [colleges, setColleges] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [candidateId, setCandidateId] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [resumeExtractFailed, setResumeExtractFailed] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [scoringJobIds, setScoringJobIds] = useState([]);

  const [form, setForm] = useState({ name: '', email: '', phone: '', college_id: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applyingJobId, setApplyingJobId] = useState(null);

  useEffect(() => {
    getColleges().then(setColleges).catch(() => {});
    getJobs().then(setJobs).catch(() => {});
  }, []);

  async function handleFormSubmit(e) {
    e.preventDefault();
    setError('');
    if (!file) { setError('Please upload your resume (PDF).'); return; }
    setLoading(true);
    try {
      const resume_url = await uploadResume(file);
      const candidate = await createCandidate({ ...form, resume_url });
      setCandidateId(candidate.id);

      try {
        const text = await extractPdfText(file);
        setResumeText(text);
      } catch (extractErr) {
        console.warn('Could not extract resume text, AI scoring will be skipped:', extractErr);
        setResumeExtractFailed(true);
      }

      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApply(job) {
    setApplyingJobId(job.id);
    try {
      const application = await applyToJob({ candidate_id: candidateId, job_id: job.id });
      setAppliedJobIds((prev) => [...prev, job.id]);

      if (resumeText) {
        setScoringJobIds((prev) => [...prev, job.id]);
        // Fire-and-forget, but ALWAYS resolve the ai_status either way.
        scoreResume(resumeText, job.skills, job.title)
          .then((result) =>
            updateApplicationScore(application.id, {
              resume_score: result.score,
              matched_skills: result.matched_skills,
              missing_skills: result.missing_skills,
              ai_status: 'Done',
            })
          )
          .catch((scoreErr) => {
            console.warn('AI scoring failed:', scoreErr);
            // Critical fix: mark it Failed instead of leaving it Pending forever.
            updateApplicationScore(application.id, {
              ai_status: 'Failed',
              ai_feedback: `Automated scoring failed: ${scoreErr.message}`,
            }).catch((e2) => console.error('Could not even update ai_status to Failed:', e2));
          })
          .finally(() => setScoringJobIds((prev) => prev.filter((id) => id !== job.id)));
      } else if (resumeExtractFailed) {
        // We know upfront scoring can't run — record that immediately instead of leaving "Pending".
        updateApplicationScore(application.id, {
          ai_status: 'Failed',
          ai_feedback: 'Could not extract text from resume PDF (may be scanned/image-only).',
        }).catch((e) => console.error(e));
      }
    } catch (err) {
      alert('Could not apply: ' + err.message);
    } finally {
      setApplyingJobId(null);
    }
  }

  const pageStyle = {
    minHeight: '100vh',
    background: 'var(--cream, #f7f5f0)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  };

  const cardStyle = {
    background: 'white',
    borderRadius: 16,
    padding: '40px 38px',
    width: '100%',
    maxWidth: step === 2 ? 720 : 480,
    border: '1px solid var(--line, #e5e5e5)',
    boxShadow: '0 8px 32px -8px rgba(10,12,18,0.12)',
  };

  if (step === 1) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div className="brand-mark">R</div>
            <div>
              <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 17, color: 'var(--navy-deep)' }}>RecruitOS</div>
              <div style={{ fontSize: 10, color: 'var(--slate-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Candidate Application</div>
            </div>
          </div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, marginBottom: 4 }}>Apply for a Role</h2>
          <p style={{ fontSize: 12.5, color: 'var(--slate-light)', marginBottom: 24 }}>Fill in your details and upload your resume to get started.</p>

          <form onSubmit={handleFormSubmit}>
            <div className="field">
              <label>Full Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="field">
              <label>Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="field">
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="field">
              <label>College</label>
              <select value={form.college_id} onChange={(e) => setForm({ ...form, college_id: e.target.value })}>
                <option value="">Select your college…</option>
                {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Resume (PDF) *</label>
              <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} required />
            </div>

            {error && <p style={{ color: 'var(--red, #d64545)', fontSize: 12.5, marginBottom: 12 }}>{error}</p>}

            <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Submitting…' : 'Continue to Job Openings'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div className="brand-mark">R</div>
          <div>
            <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 17, color: 'var(--navy-deep)' }}>RecruitOS</div>
            <div style={{ fontSize: 10, color: 'var(--slate-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Open Positions</div>
          </div>
        </div>
        <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, marginBottom: 4 }}>Welcome, {form.name.split(' ')[0]}!</h2>
        <p style={{ fontSize: 12.5, color: 'var(--slate-light)', marginBottom: 20 }}>Browse open roles and apply directly.</p>

        <div style={{ display: 'grid', gap: 12 }}>
          {jobs.map((j) => {
            const applied = appliedJobIds.includes(j.id);
            const scoring = scoringJobIds.includes(j.id);
            return (
              <div key={j.id} style={{ border: '1px solid var(--line, #e5e5e5)', borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{j.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--slate-light)' }}>{j.company} · {j.location} · {j.salary_range}</div>
                  {scoring && <div style={{ fontSize: 11, color: 'var(--gold, #b8894a)', marginTop: 4 }}>Analyzing your resume…</div>}
                </div>
                <button
                  className={applied ? 'btn-outline' : 'btn-primary'}
                  disabled={applied || applyingJobId === j.id}
                  onClick={() => handleApply(j)}
                  style={{ minWidth: 100 }}
                >
                  {applied ? 'Applied ✓' : applyingJobId === j.id ? 'Applying…' : 'Apply'}
                </button>
              </div>
            );
          })}
          {jobs.length === 0 && <p style={{ color: 'var(--slate-light)' }}>No open positions right now — check back later.</p>}
        </div>
      </div>
    </div>
  );
}