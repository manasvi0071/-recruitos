import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getUpcomingDrives, addDrive, deleteDrive, getColleges } from '../lib/api';

export default function Dashboard() {
  const [mode, setMode] = useState('inhouse');
  const isInhouse = mode === 'inhouse';

  const [stats, setStats] = useState({ colleges: 0, resumes: 0, selections: 0, joined: 0 });
  const [corpStats, setCorpStats] = useState({
    companies: 0, companyNames: [], positions: 0, selections: 0, selectionsThisWeek: 0, joined: 0, conversion: 0,
  });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [drives, setDrives] = useState([]);
  const [drivesLoading, setDrivesLoading] = useState(true);
  const [showDriveForm, setShowDriveForm] = useState(false);
  const [driveForm, setDriveForm] = useState({ title: '', type: 'Aptitude Test', scheduled_at: '', college_id: '', notes: '' });
  const [colleges, setColleges] = useState([]);
  const [savingDrive, setSavingDrive] = useState(false);
  const [driveError, setDriveError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const [minDateTime] = useState(() =>
  new Date(
    Date.now() - new Date().getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 16)
);

  function loadDrives() {
    setDrivesLoading(true);
    getUpcomingDrives()
      .then(setDrives)
      .catch(() => {})
      .finally(() => setDrivesLoading(false));
  }

  async function handleAddDrive(e) {
    e.preventDefault();
    setDriveError('');

    if (!driveForm.title || !driveForm.scheduled_at) {
      setDriveError('Title and date/time are required');
      return;
    }

    const chosen = new Date(driveForm.scheduled_at);
    if (chosen.getTime() < Date.now()) {
      setDriveError('Date & time cannot be in the past');
      return;
    }

    setSavingDrive(true);
    try {
      await addDrive(driveForm);
      setDriveForm({ title: '', type: 'Aptitude Test', scheduled_at: '', college_id: '', notes: '' });
      setShowDriveForm(false);
      loadDrives();
    } catch (err) {
      setDriveError(err.message);
    } finally {
      setSavingDrive(false);
    }
  }

  async function handleDeleteDrive(id) {
    if (!window.confirm('Cancel this drive?')) return;
    setDeletingId(id);
    try {
      await deleteDrive(id);
      setDrives((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error('Delete drive error:', err);
      alert('Could not cancel the drive. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

useEffect(() => {
  let ignore = false;

  async function loadDashboardData() {
    setLoading(true);
    setError(null);
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const [
        { count: collegesCount, error: collegesErr },
        { count: resumesCount, error: resumesErr },
        { count: selectionsCount, error: selectionsErr },
        { count: joinedCount, error: joinedErr },
        { data: recentApps, error: appsErr },
        { count: companiesCount, error: companiesErr },
        { data: companyRows, error: companyRowsErr },
        { count: positionsCount, error: positionsErr },
        { count: selectionsThisWeekCount, error: selectionsWeekErr },
      ] = await Promise.all([
        supabase.from('colleges').select('*', { count: 'exact', head: true }),
        supabase.from('candidates').select('*', { count: 'exact', head: true }),
        supabase.from('applications').select('*', { count: 'exact', head: true }).eq('stage', 'Selected'),
        supabase.from('joining').select('*', { count: 'exact', head: true }).eq('status', 'Joined'),
        supabase
          .from('applications')
          .select('id, stage, resume_score, candidates(name, colleges(name)), job_profiles(title)')
          .order('created_at', { ascending: false })
          .limit(4),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('name').order('created_at', { ascending: false }).limit(2),
        supabase.from('job_profiles').select('*', { count: 'exact', head: true }),
        supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('stage', 'Selected')
          .gte('created_at', oneWeekAgo.toISOString()),
      ]);

      if (collegesErr || resumesErr || selectionsErr || joinedErr || appsErr
        || companiesErr || companyRowsErr || positionsErr || selectionsWeekErr) {
        throw collegesErr || resumesErr || selectionsErr || joinedErr || appsErr
          || companiesErr || companyRowsErr || positionsErr || selectionsWeekErr;
      }

      if (ignore) return;

      setStats({
        colleges: collegesCount ?? 0,
        resumes: resumesCount ?? 0,
        selections: selectionsCount ?? 0,
        joined: joinedCount ?? 0,
      });
      setApplications(recentApps ?? []);

      const totalSelections = selectionsCount ?? 0;
      const totalJoined = joinedCount ?? 0;
      const conversion = totalSelections > 0 ? Math.round((totalJoined / totalSelections) * 100) : 0;

      setCorpStats({
        companies: companiesCount ?? 0,
        companyNames: (companyRows ?? []).map((c) => c.name),
        positions: positionsCount ?? 0,
        selections: totalSelections,
        selectionsThisWeek: selectionsThisWeekCount ?? 0,
        joined: totalJoined,
        conversion,
      });
    } catch (err) {
      console.error('Dashboard load error:', err);
      if (!ignore) setError('Could not load dashboard data. Check your Supabase connection.');
    } finally {
      if (!ignore) setLoading(false);
    }
  }

  async function init() {
    setDrivesLoading(true);
    try {
      const d = await getUpcomingDrives();
      if (!ignore) setDrives(d);
    } catch {
      // ignore drive load errors, same as before
    } finally {
      if (!ignore) setDrivesLoading(false);
    }

    try {
      const c = await getColleges();
      if (!ignore) setColleges(c);
    } catch {
      // ignore college load errors, same as before
    }
  }

  loadDashboardData();
  init();

  return () => { ignore = true; };
}, []);

  const stageBadgeClass = {
    'Resume Review': 'gray',
    'Aptitude': 'gold',
    'GD': 'gold',
    'Interview': 'blue',
    'Selected': 'green',
    'Rejected': 'gray',
  };

  return (
    <div className="page active" id="page-dashboard">
      <div className="page-head">
        <div>
          <h1>Recruitment Dashboard</h1>
          <p>Track campus & corporate drives end-to-end, from job posting to joining.</p>
        </div>
        <div className="mode-toggle">
          <button className={`mode-btn ${isInhouse ? 'active' : ''}`} onClick={() => setMode('inhouse')}>In-house</button>
          <button className={`mode-btn ${!isInhouse ? 'active' : ''}`} onClick={() => setMode('corporate')}>Corporate</button>
        </div>
      </div>

      {error && <div className="panel" style={{ color: 'crimson' }}>{error}</div>}

      {isInhouse ? (
        <div className="stat-row">
          <div className="stat-card">
            <div className="num">{loading ? '—' : stats.colleges}</div>
            <div className="lbl">Colleges Engaged</div>
          </div>
          <div className="stat-card">
            <div className="num">{loading ? '—' : stats.resumes}</div>
            <div className="lbl">Resumes Received</div>
          </div>
          <div className="stat-card">
            <div className="num">{loading ? '—' : stats.selections}</div>
            <div className="lbl">Final Selections</div>
          </div>
          <div className="stat-card">
            <div className="num">{loading ? '—' : stats.joined}</div>
            <div className="lbl">Joined</div>
          </div>
        </div>
      ) : (
        <div className="stat-row">
          <div className="stat-card">
            <div className="num">{loading ? '—' : corpStats.companies}</div>
            <div className="lbl">Active Companies</div>
            <div className="delta up">{loading ? '—' : (corpStats.companyNames.join(', ') || '—')}</div>
          </div>
          <div className="stat-card">
            <div className="num">{loading ? '—' : corpStats.positions}</div>
            <div className="lbl">Open Positions</div>
            <div className="delta flat">{loading ? '—' : `Across ${corpStats.positions} JDs`}</div>
          </div>
          <div className="stat-card">
            <div className="num">{loading ? '—' : corpStats.selections}</div>
            <div className="lbl">Final Selections</div>
            <div className="delta up">{loading ? '—' : `▲ ${corpStats.selectionsThisWeek} this week`}</div>
          </div>
          <div className="stat-card">
            <div className="num">{loading ? '—' : corpStats.joined}</div>
            <div className="lbl">Joined</div>
            <div className="delta up">{loading ? '—' : `${corpStats.conversion}% conversion`}</div>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-title">{isInhouse ? 'In-house Recruitment Pipeline' : 'Corporate Recruitment Pipeline'}</div>
        <div className="panel-sub">Campus DB → Requirements → JD → College Email → Resumes → Analysis → Assessments → Interviews → Selection → Offer → Joining → Report</div>
      </div>

      <div className="grid2">
        <div className="panel">
          <div className="panel-title">Recent Applications</div>
          <table>
            <tbody>
              <tr><th>Candidate</th><th>Campus</th><th>Applied For</th><th>Stage</th><th>Score</th></tr>
              {loading ? (
                <tr><td colSpan={5}>Loading...</td></tr>
              ) : applications.length === 0 ? (
                <tr><td colSpan={5}>No applications yet.</td></tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id}>
                    <td>{app.candidates?.name ?? '—'}</td>
                    <td>{app.candidates?.colleges?.name ?? '—'}</td>
                    <td>{app.job_profiles?.title ?? '—'}</td>
                    <td><span className={`badge ${stageBadgeClass[app.stage] ?? 'gray'}`}>{app.stage}</span></td>
                    <td>{app.resume_score ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="panel" style={{ boxSizing: 'border-box', width: '100%', overflow: 'hidden' }}>
          <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Upcoming Drives
            <button className="btn-outline" style={{ fontSize: 11.5, padding: '4px 10px' }} onClick={() => setShowDriveForm((v) => !v)}>
              {showDriveForm ? 'Cancel' : '+ Schedule Drive'}
            </button>
          </div>

          {showDriveForm && (
            <form
              onSubmit={handleAddDrive}
              style={{
                marginBottom: 16,
                display: 'grid',
                gap: 10,
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div className="field" style={{ width: '100%', boxSizing: 'border-box' }}>
                <label>Title *</label>
                <input
                  value={driveForm.title}
                  onChange={(e) => setDriveForm({ ...driveForm, title: e.target.value })}
                  placeholder="e.g. SVCE Campus Drive"
                  required
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <div className="field" style={{ width: '100%', boxSizing: 'border-box' }}>
                <label>Type *</label>
                <select
                  value={driveForm.type}
                  onChange={(e) => setDriveForm({ ...driveForm, type: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  <option value="Aptitude Test">Aptitude Test</option>
                  <option value="GD Round">GD Round</option>
                  <option value="Interview">Interview</option>
                  <option value="Offer Rollout">Offer Rollout</option>
                  <option value="Campus Visit">Campus Visit</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="field" style={{ width: '100%', boxSizing: 'border-box' }}>
                <label>Date & Time *</label>
                <input
                  type="datetime-local"
                  value={driveForm.scheduled_at}
                  min={minDateTime}
                  onChange={(e) => setDriveForm({ ...driveForm, scheduled_at: e.target.value })}
                  required
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <div className="field" style={{ width: '100%', boxSizing: 'border-box' }}>
                <label>College</label>
                <select
                  value={driveForm.college_id}
                  onChange={(e) => setDriveForm({ ...driveForm, college_id: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  <option value="">Optional…</option>
                  {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field" style={{ width: '100%', boxSizing: 'border-box' }}>
                <label>Notes</label>
                <textarea
                  rows={2}
                  value={driveForm.notes}
                  onChange={(e) => setDriveForm({ ...driveForm, notes: e.target.value })}
                  placeholder="Optional details for the team…"
                  style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
              {driveError && <p style={{ color: 'var(--red, #d64545)', fontSize: 12.5 }}>{driveError}</p>}
              <button className="btn-primary" type="submit" disabled={savingDrive} style={{ width: '100%', boxSizing: 'border-box' }}>
                {savingDrive ? 'Saving…' : 'Save Drive'}
              </button>
            </form>
          )}

          {drivesLoading ? (
            <p style={{ color: 'var(--slate-light)' }}>Loading…</p>
          ) : drives.length === 0 ? (
            <p style={{ color: 'var(--slate-light)' }}>No upcoming drives scheduled</p>
          ) : (
            drives.map((d) => (
              <div className="timeline-item" key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="timeline-dot"></div>
                  <div>
                    <div className="t">{d.title} — {d.type}{d.colleges?.name ? ` · ${d.colleges.name}` : ''}</div>
                    <div className="d">
                      {new Date(d.scheduled_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' · '}
                      {new Date(d.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {d.notes && <div className="d" style={{ marginTop: 2, fontStyle: 'italic' }}>{d.notes}</div>}
                  </div>
                </div>
                <button
                  className="btn-outline"
                  style={{ fontSize: 11, padding: '3px 8px', flexShrink: 0 }}
                  onClick={() => handleDeleteDrive(d.id)}
                  disabled={deletingId === d.id}
                >
                  {deletingId === d.id ? '…' : 'Cancel'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}