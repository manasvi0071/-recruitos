import { useEffect, useState, useMemo } from 'react';
import { getJobs, getColleges, uploadResume, createCandidate, applyToJob, updateApplicationScore } from '../lib/api';
import { extractPdfText, scoreResume } from '../lib/resumeScoring';
import CollegeAutocomplete from './CollegeAutocomplete';

// Employment type values in the data are inconsistently entered
// (e.g. "Full-Time", "internship", "Internship Full-Time", "Full-Time / Training Role").
// Normalize them into a small set of clean categories for the filter dropdown.
function normalizeEmploymentType(raw) {
  if (!raw) return null;
  const t = raw.toLowerCase();
  if (t.includes('intern')) return 'Internship';
  if (t.includes('part')) return 'Part-Time';
  if (t.includes('contract')) return 'Contract';
  if (t.includes('full')) return 'Full-Time';
  return raw.trim();
}

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

  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedJobId, setExpandedJobId] = useState(null);

  useEffect(() => {
    getColleges().then(setColleges).catch(() => {});
    getJobs().then(setJobs).catch(() => {});
  }, []);

  const locationOptions = useMemo(
    () => ['all', ...new Set(jobs.map((j) => j.location).filter(Boolean))],
    [jobs]
  );
  const typeOptions = useMemo(
    () => ['all', ...new Set(jobs.map((j) => normalizeEmploymentType(j.employment_type)).filter(Boolean))],
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchesSearch = !q || j.title?.toLowerCase().includes(q);
      const matchesLocation = locationFilter === 'all' || j.location === locationFilter;
      const matchesExperience = experienceFilter === 'all' || (j.experience || '').toLowerCase().includes(experienceFilter);
      const matchesType = typeFilter === 'all' || normalizeEmploymentType(j.employment_type) === typeFilter;
      return matchesSearch && matchesLocation && matchesExperience && matchesType;
    });
  }, [jobs, search, locationFilter, experienceFilter, typeFilter]);

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
            updateApplicationScore(application.id, {
              ai_status: 'Failed',
              ai_feedback: `Automated scoring failed: ${scoreErr.message}`,
            }).catch((e2) => console.error('Could not even update ai_status to Failed:', e2));
          })
          .finally(() => setScoringJobIds((prev) => prev.filter((id) => id !== job.id)));
      } else if (resumeExtractFailed) {
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

  const filterSelectStyle = {
    padding: '7px 10px',
    borderRadius: 8,
    border: '1px solid var(--line, #e5e5e5)',
    fontSize: 12,
    color: '#444',
    background: 'white',
    cursor: 'pointer',
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
              <CollegeAutocomplete
                colleges={colleges}
                value={form.college_id}
                onChange={(id) => setForm({ ...form, college_id: id })}
              />
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
        <p style={{ fontSize: 12.5, color: 'var(--slate-light)', marginBottom: 18 }}>Browse open roles and apply directly.</p>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by role title…"
          style={{ width: '100%', padding: '10px 13px', borderRadius: 8, border: '1px solid var(--line, #e5e5e5)', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }}
        />

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={filterSelectStyle}>
            {locationOptions.map((l) => <option key={l} value={l}>{l === 'all' ? 'All locations' : l}</option>)}
          </select>
          <select value={experienceFilter} onChange={(e) => setExperienceFilter(e.target.value)} style={filterSelectStyle}>
            <option value="all">All experience</option>
            <option value="fresher">Freshers</option>
            <option value="1">1+ yrs</option>
            <option value="3">3+ yrs</option>
            <option value="5">5+ yrs</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={filterSelectStyle}>
            {typeOptions.map((t) => <option key={t} value={t}>{t === 'all' ? 'All types' : t}</option>)}
          </select>
        </div>

        <p style={{ fontSize: 11.5, color: 'var(--slate-light)', marginBottom: 10 }}>
          {filteredJobs.length} role{filteredJobs.length !== 1 ? 's' : ''} found
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredJobs.map((j) => {
            const applied = appliedJobIds.includes(j.id);
            const scoring = scoringJobIds.includes(j.id);
            const isExpanded = expandedJobId === j.id;
            const responsibilities = (j.responsibilities || '').split(';').map((r) => r.trim()).filter(Boolean);
            const hasDetails = j.job_summary || responsibilities.length > 0 || j.qualification || (j.skills || []).length > 0;
            const isBusy = applyingJobId === j.id;

            return (
              <div key={j.id} style={{ border: '1px solid #EEE', borderRadius: 12, padding: '16px 18px', background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#111', lineHeight: 1.3 }}>{j.title}</div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4, lineHeight: 1.6 }}>
                      {j.company}{j.location ? ` · ${j.location}` : ''}{j.salary_range ? ` · ${j.salary_range}` : ''}
                    </div>
                    {scoring && <div style={{ fontSize: 11, color: '#B8894A', marginTop: 4 }}>Analyzing your resume…</div>}
                    {hasDetails && (
                      <button
                        type="button"
                        onClick={() => setExpandedJobId(isExpanded ? null : j.id)}
                        style={{ marginTop: 8, fontSize: 11.5, fontWeight: 600, color: '#8B5CF6', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <span style={{ display: 'inline-block', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▾</span>
                        {isExpanded ? 'Hide details' : 'View details'}
                      </button>
                    )}
                  </div>

                  <div style={{ flex: '0 0 auto' }}>
                    <button
                      type="button"
                      disabled={applied || isBusy}
                      onClick={() => handleApply(j)}
                      style={{
                        width: 120,
                        padding: '10px 0',
                        borderRadius: 10,
                        border: applied ? '1px solid #EEE' : 'none',
                        background: applied ? '#FAFAFA' : 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                        color: applied ? '#AAA' : '#fff',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: applied || isBusy ? 'default' : 'pointer',
                        boxShadow: applied ? 'none' : '0 4px 14px rgba(139,92,246,0.3)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {applied ? 'Applied ✓' : isBusy ? 'Applying…' : 'Apply'}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #F0F0F0' }}>
                    {j.job_summary && <p style={{ fontSize: 12.5, color: '#444', lineHeight: 1.6, marginBottom: 10 }}>{j.job_summary}</p>}
                    {responsibilities.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Key responsibilities</div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#444', lineHeight: 1.6 }}>
                          {responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    )}
                    {j.qualification && (
                      <div style={{ fontSize: 12, color: '#444', marginBottom: 8 }}><strong>Qualification: </strong>{j.qualification}</div>
                    )}
                    {(j.skills || []).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {j.skills.map((s) => (
                          <span key={s} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: '#F5F0FF', color: '#8B5CF6', fontWeight: 600 }}>{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {jobs.length === 0 && <p style={{ color: '#999', textAlign: 'center', padding: '32px 0' }}>No open positions right now — check back later.</p>}
          {jobs.length > 0 && filteredJobs.length === 0 && <p style={{ color: '#999', textAlign: 'center', padding: '32px 0' }}>No roles match your filters.</p>}
        </div>
      </div>
    </div>
  );
}