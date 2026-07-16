import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';

const emptyForm = {
  title: '', company: '', location: '', salary_range: '', experience: '', skills: '',
  job_summary: '', responsibilities: '', qualification: '', employment_type: '', reporting_to: '',
};

function JobCard({ job, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="jd-card panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {job.company && <span className="co">{job.company}</span>}
        {job.employment_type && (
          <span
            style={{
              fontSize: 11, fontWeight: 600, color: '#8a6d3b', background: '#f6ecd9',
              border: '1px solid #e7d3ab', borderRadius: 999, padding: '2px 9px',
            }}
          >
            {job.employment_type}
          </span>
        )}
      </div>

      <h3 style={{ fontWeight: 700, margin: '8px 0 2px' }}>{job.title}</h3>
      {job.location && (
        <div style={{ fontSize: 13, color: '#8a8a8a' }}>{job.location}</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, margin: '10px 0' }}>
        {job.salary_range && (
          <div style={{ fontSize: 13, lineHeight: 1.4 }}>
            <span style={{ fontWeight: 600, color: '#222', marginRight: 6 }}>Salary:-</span>
            <span style={{ color: '#555' }}>{job.salary_range}</span>
          </div>
        )}
        {job.experience && (
          <div style={{ fontSize: 13, lineHeight: 1.4 }}>
            <span style={{ fontWeight: 600, color: '#222', marginRight: 6 }}>Experience:-</span>
            <span style={{ color: '#555' }}>{job.experience}</span>
          </div>
        )}
        {job.qualification && (
          <div style={{ fontSize: 13, lineHeight: 1.4 }}>
            <span style={{ fontWeight: 600, color: '#222', marginRight: 6 }}>Qualification:-</span>
            <span style={{ color: '#555' }}>{job.qualification}</span>
          </div>
        )}
        {job.reporting_to && (
          <div style={{ fontSize: 13, lineHeight: 1.4 }}>
            <span style={{ fontWeight: 600, color: '#222', marginRight: 6 }}>Reporting To:-</span>
            <span style={{ color: '#555' }}>{job.reporting_to}</span>
          </div>
        )}
      </div>

      {(job.skills ?? []).length > 0 && (
        <div className="skills">
          {job.skills.map((s) => <span key={s}>{s}</span>)}
        </div>
      )}

      {(job.job_summary || job.responsibilities) && (
        <div style={{ marginTop: 10 }}>
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontSize: 12, fontWeight: 600, color: '#8a6d3b',
            }}
          >
            {expanded ? '– Hide full description' : '+ View full description'}
          </button>

          {expanded && (
            <div style={{ marginTop: 8, fontSize: 13, color: '#444', lineHeight: 1.5 }}>
              {job.job_summary && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, color: '#222', marginBottom: 2 }}>Job Summary</div>
                  <div>{job.job_summary}</div>
                </div>
              )}
              {job.responsibilities && (
                <div>
                  <div style={{ fontWeight: 600, color: '#222', marginBottom: 4 }}>Key Responsibilities</div>
                  <ol style={{ margin: 0, paddingLeft: 20 }}>
                    {job.responsibilities.split(';').map((r) => r.trim()).filter(Boolean).map((r, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>{r}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
        <button className="btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => onEdit(job)}>Edit</button>
        <button className="btn-outline" style={{ padding: '4px 10px', fontSize: 12, color: 'crimson' }} onClick={() => onDelete(job.id, job.title)}>Delete</button>
      </div>
    </div>
  );
}

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [importRows, setImportRows] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  async function loadJobs() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('job_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load jobs:', error);
      setError('Could not load job profiles. Check your Supabase connection.');
    } else {
      setJobs(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
  let ignore = false;

  async function init() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('job_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (ignore) return;

    if (error) {
      console.error('Failed to load jobs:', error);
      setError('Could not load job profiles. Check your Supabase connection.');
    } else {
      setJobs(data ?? []);
    }
    setLoading(false);
  }

  init();
  return () => { ignore = true; };
}, []);

  function startEdit(j) {
    setEditingId(j.id);
    setForm({
      title: j.title || '',
      company: j.company || '',
      location: j.location || '',
      salary_range: j.salary_range || '',
      experience: j.experience || '',
      skills: (j.skills || []).join(', '),
      job_summary: j.job_summary || '',
      responsibilities: j.responsibilities || '',
      qualification: j.qualification || '',
      employment_type: j.employment_type || '',
      reporting_to: j.reporting_to || '',
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSaveJob(e) {
    e.preventDefault();
    setSaving(true);

    const skillsArray = form.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title: form.title,
      company: form.company,
      location: form.location,
      salary_range: form.salary_range,
      experience: form.experience,
      skills: skillsArray,
      job_summary: form.job_summary || null,
      responsibilities: form.responsibilities || null,
      qualification: form.qualification || null,
      employment_type: form.employment_type || null,
      reporting_to: form.reporting_to || null,
    };

    if (editingId) {
      const { error } = await supabase.from('job_profiles').update(payload).eq('id', editingId);
      if (error) {
        console.error('Failed to update job:', error);
        alert('Could not update job profile. Check console for details.');
      } else {
        cancelForm();
        await loadJobs();
      }
    } else {
      const { error } = await supabase.from('job_profiles').insert([payload]);
      if (error) {
        console.error('Failed to add job:', error);
        alert('Could not add job profile. Check console for details.');
      } else {
        cancelForm();
        await loadJobs();
      }
    }
    setSaving(false);
  }

  async function handleDeleteJob(id, title) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('job_profiles').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete job:', error);
      alert('Could not delete job profile. Check console for details.');
    } else {
      await loadJobs();
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const mapped = rows.map((r) => ({
        title: r.title || r.Title || r.role || r.Role || '',
        company: r.company || r.Company || '',
        location: r.location || r.Location || '',
        salary_range: r.salary_range || r['Salary Range'] || r['Salary range'] || r.salary || '',
        experience: r.experience || r.Experience || '',
        skills: r.skills || r.Skills || r['Core Skills'] || '',
        job_summary: r.job_summary || r['Job Summary'] || '',
        responsibilities: r.responsibilities || r['Key Responsibilities'] || r.Responsibilities || '',
        qualification: r.qualification || r.Qualification || '',
        employment_type: r.employment_type || r['Employment Type'] || '',
        reporting_to: r.reporting_to || r['Reporting To'] || '',
      })).filter((r) => r.title);
      setImportRows(mapped);
    };
    reader.readAsBinaryString(file);
  }

  async function handleConfirmImport() {
    if (!importRows || importRows.length === 0) return;
    setImporting(true);
    let success = 0;
    let failed = 0;
    for (const row of importRows) {
      const skillsArray = (row.skills || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const { error } = await supabase.from('job_profiles').insert([{
        title: row.title,
        company: row.company || null,
        location: row.location || null,
        salary_range: row.salary_range || null,
        experience: row.experience || null,
        skills: skillsArray,
        job_summary: row.job_summary || null,
        responsibilities: row.responsibilities || null,
        qualification: row.qualification || null,
        employment_type: row.employment_type || null,
        reporting_to: row.reporting_to || null,
      }]);
      if (error) failed += 1; else success += 1;
    }
    setImporting(false);
    setImportResult({ success, failed });
    setImportRows(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    await loadJobs();
  }

  function cancelImport() {
    setImportRows(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="page active" id="page-jobs">
      <div className="page-head">
        <div>
          <h1>Job Profiles / JD</h1>
          <p>{loading ? 'Loading…' : `${jobs.length} active job descriptions across in-house and corporate`}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <button className="btn-outline" onClick={() => fileInputRef.current.click()}>Import Excel</button>
          <button className="btn-gold" onClick={() => (showForm ? cancelForm() : setShowForm(true))}>
            {showForm ? 'Cancel' : '+ Create Job Profile'}
          </button>
        </div>
      </div>

      {error && <div className="panel" style={{ color: 'crimson' }}>{error}</div>}

      {importResult && (
        <div className="panel">
          <p>Import done: {importResult.success} added, {importResult.failed} failed.</p>
          <button className="btn-outline" onClick={() => setImportResult(null)}>Dismiss</button>
        </div>
      )}

      {importRows && (
        <div className="panel">
          <div className="panel-title">Preview — {importRows.length} rows found</div>
          <table>
            <tbody>
              <tr><th>Title</th><th>Company</th><th>Qualification</th><th>Experience</th></tr>
              {importRows.slice(0, 10).map((r, i) => (
                <tr key={i}>
                  <td>{r.title}</td><td>{r.company}</td><td>{r.qualification}</td><td>{r.experience}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {importRows.length > 10 && <p>...and {importRows.length - 10} more rows</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn-gold" onClick={handleConfirmImport} disabled={importing}>
              {importing ? 'Importing…' : `Import ${importRows.length} Job Profiles`}
            </button>
            <button className="btn-outline" onClick={cancelImport}>Cancel</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="panel">
          <div className="panel-title">{editingId ? 'Edit Job Profile' : 'Create Job Profile'}</div>
          <form onSubmit={handleSaveJob} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input
              className="search-box" placeholder="Job title" required
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <input
              className="search-box" placeholder="Company (e.g. TCS, or Talent Corner — In-house)"
              value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
            <input
              className="search-box" placeholder="Location (e.g. Pan India, Pune)"
              value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <input
              className="search-box" placeholder="Salary range (e.g. ₹3.6–4.5 LPA)"
              value={form.salary_range} onChange={(e) => setForm({ ...form, salary_range: e.target.value })}
            />
            <input
              className="search-box" placeholder="Experience (e.g. Freshers, 0–1 yrs)"
              value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })}
            />
            <input
              className="search-box" placeholder="Skills (comma separated)"
              value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })}
            />
            <input
              className="search-box" placeholder="Qualification"
              value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })}
            />
            <input
              className="search-box" placeholder="Employment Type (e.g. Full-Time)"
              value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
            />
            <input
              className="search-box" placeholder="Reporting To"
              value={form.reporting_to} onChange={(e) => setForm({ ...form, reporting_to: e.target.value })}
            />
            <textarea
              className="search-box" placeholder="Job Summary" style={{ gridColumn: '1 / -1', minHeight: 60 }}
              value={form.job_summary} onChange={(e) => setForm({ ...form, job_summary: e.target.value })}
            />
            <textarea
              className="search-box" placeholder="Key Responsibilities" style={{ gridColumn: '1 / -1', minHeight: 80 }}
              value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
            />
            <button className="btn-gold" type="submit" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Update Job Profile' : 'Save Job Profile'}
            </button>
          </form>
        </div>
      )}

      <div className="grid3">
        {loading ? (
          <div className="panel">Loading…</div>
        ) : jobs.length === 0 ? (
          <div className="panel">No job profiles found.</div>
        ) : (
          jobs.map((j) => (
            <JobCard key={j.id} job={j} onEdit={startEdit} onDelete={handleDeleteJob} />
          ))
        )}
      </div>
    </div>
  );
}