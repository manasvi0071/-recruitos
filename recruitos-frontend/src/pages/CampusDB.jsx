import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';

const courses = ['All', 'Engineering', 'MBA', 'BCA', 'BSc IT', 'MCA', 'Pharmacy', 'Law', 'Commerce', 'Arts', 'Medical', 'Polytechnic'];

const badgeForStatus = {
  'Interested': 'green',
  'Follow-up Due': 'gold',
  'Not Interested': 'gray',
};

const emptyForm = {
  name: '', city: '', course: '', tpo: '', website: '',
  strength: '', last_contact: '', status: 'Interested',
};

export default function CampusDB() {
  const [activeCourse, setActiveCourse] = useState('All');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Status');

  const [colleges, setColleges] = useState([]);
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

  // Placement coordinators: a college can have multiple (current + past).
  // Keyed by college_id -> array of coordinator rows for that college.
  const [expandedCollegeId, setExpandedCollegeId] = useState(null);
  const [coordinatorsByCollege, setCoordinatorsByCollege] = useState({});
  const [loadingCoordinators, setLoadingCoordinators] = useState(false);
  const [coordForm, setCoordForm] = useState({ name: '', phone: '', email: '' });
  const [savingCoord, setSavingCoord] = useState(false);

  // Fetches ALL rows, paging through Supabase's per-request row cap (default 1000)
  // instead of stopping at a single hardcoded range. Without this, no matter how
  // many colleges get imported, only the first page would ever be shown.
  async function fetchAllColleges() {
    const pageSize = 1000;
    let from = 0;
    let allRows = [];
    while (true) {
      const { data, error } = await supabase
        .from('colleges')
        .select('*')
        .order('name', { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) throw error;
      allRows = allRows.concat(data ?? []);
      if (!data || data.length < pageSize) break;
      from += pageSize;
    }
    return allRows;
  }

  async function loadColleges() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllColleges();
      setColleges(data);
    } catch (error) {
      console.error('Failed to load colleges:', error);
      setError('Could not load colleges. Check your Supabase connection.');
    }
    setLoading(false);
  }

  useEffect(() => {
    let ignore = false;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAllColleges();
        if (ignore) return;
        setColleges(data);
      } catch (error) {
        if (ignore) return;
        console.error('Failed to load colleges:', error);
        setError('Could not load colleges. Check your Supabase connection.');
      }
      setLoading(false);
    }

    init();
    return () => { ignore = true; };
  }, []);

const filtered = colleges.filter((c) => {
  const courseValue = (c.course ?? '').toLowerCase().trim();
  const coursesAvailableValue = (c.courses_available ?? '').toLowerCase();
  const activeCourseValue = activeCourse.toLowerCase().trim();

  const matchCourse =
  activeCourse === 'All'
    ? true
    : courseValue.includes(activeCourseValue) || coursesAvailableValue.includes(activeCourseValue);

    const q = search.toLowerCase().trim();
    const matchSearch =
      (c.name ?? '').toLowerCase().includes(q) ||
      (c.city ?? '').toLowerCase().includes(q) ||
      (c.tpo ?? '').toLowerCase().includes(q);

    const matchStatus = activeFilter === 'All Status' || c.status === activeFilter;

    return matchCourse && matchSearch && matchStatus;
  });

  function startEdit(c) {
    setEditingId(c.id);
    setForm({
      name: c.name || '',
      city: c.city || '',
      // FIX 3: don't silently default an empty course to 'Engineering'
      course: c.course || '',
      tpo: c.tpo || '',
      website: c.website || '',
      strength: c.strength ?? '',
      last_contact: c.last_contact || '',
      status: c.status || 'Interested',
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSaveCollege(e) {
    e.preventDefault();
    setSaving(true);

    if (editingId) {
      const { error } = await supabase.from('colleges').update({
        name: form.name,
        city: form.city,
        course: form.course || null,
        tpo: form.tpo,
        website: form.website || null,
        strength: form.strength ? parseInt(form.strength, 10) : null,
        last_contact: form.last_contact || null,
        status: form.status,
      }).eq('id', editingId);

      if (error) {
        console.error('Failed to update college:', error);
        alert('Could not update college. Check console for details.');
      } else {
        cancelForm();
        await loadColleges();
      }
    } else {
      const { error } = await supabase.from('colleges').insert([{
        name: form.name,
        city: form.city,
        course: form.course || null,
        tpo: form.tpo,
        website: form.website || null,
        strength: form.strength ? parseInt(form.strength, 10) : null,
        last_contact: form.last_contact || null,
        status: form.status,
      }]);

      if (error) {
        console.error('Failed to add college:', error);
        alert('Could not add college. Check console for details.');
      } else {
        cancelForm();
        await loadColleges();
      }
    }
    setSaving(false);
  }

  async function handleDeleteCollege(id, name) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('colleges').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete college:', error);
      alert('Could not delete college. Check console for details.');
    } else {
      await loadColleges();
    }
  }

  // The colleges table only allows these 3 status values (DB check constraint).
  // Imported files often have different status labels (e.g. "Active"), so
  // anything that doesn't match gets mapped to a safe default instead of
  // failing the insert.
  const VALID_STATUSES = ['Interested', 'Follow-up Due', 'Not Interested'];
  function normalizeStatus(raw) {
    const trimmed = (raw || '').toString().trim();
    return VALID_STATUSES.includes(trimmed) ? trimmed : 'Interested';
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
  name: r.name || r.Name || r.College || r.college || '',
  city: r.city || r.City || '',
  course: r.course || r.Course || '',
  tpo: r.tpo || r.TPO || r.Tpo || '',
  strength: r.strength || r.Strength || '',
  status: normalizeStatus(r.status || r.Status),
  country: r.country || r.Country || '',
  state: r.state || r.State || '',
  website: r.website || r.Website || '',
  institution_type: r.institution_type || r['Institution Type'] || '',
  courses_available: r.courses_available || r['Courses Available'] || '',
})).filter((r) => r.name);
      setImportRows(mapped);
    };
    reader.readAsBinaryString(file);
  }

  async function handleConfirmImport() {
    if (!importRows || importRows.length === 0) return;
    setImporting(true);
    let success = 0;
    let failed = 0;
    const firstErrors = [];

    const records = importRows.map((row) => ({
      name: row.name,
      city: row.city || null,
      course: row.course || null,
      tpo: row.tpo || null,
      strength: row.strength ? parseInt(row.strength, 10) : null,
      status: row.status || 'Interested',
      country: row.country || null,
      institution_type: row.institution_type || null,
      courses_available: row.courses_available || null,
      state: row.state || null,
      website: row.website || null,
    }));

    // Insert in chunks instead of one row per request - far fewer network
    // round-trips, so 70,000 rows imports in seconds/minutes instead of
    // potentially timing out the browser tab.
    const chunkSize = 500;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      const { error } = await supabase.from('colleges').insert(chunk);
      if (error) {
        failed += chunk.length;
        if (firstErrors.length < 3) firstErrors.push(error.message);
        console.error('Failed to import chunk:', error);
      } else {
        success += chunk.length;
      }
    }

    setImporting(false);
    setImportResult({ success, failed, firstErrors });
    setImportRows(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    await loadColleges();
  }

  async function toggleCoordinators(collegeId) {
    if (expandedCollegeId === collegeId) {
      setExpandedCollegeId(null);
      return;
    }
    setExpandedCollegeId(collegeId);
    setCoordForm({ name: '', phone: '', email: '' });
    if (!coordinatorsByCollege[collegeId]) {
      setLoadingCoordinators(true);
      const { data, error } = await supabase
        .from('placement_coordinators')
        .select('*')
        .eq('college_id', collegeId)
        .order('is_current', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Failed to load coordinators:', error);
        alert('Could not load placement coordinators. Check console for details.');
      } else {
        setCoordinatorsByCollege((prev) => ({ ...prev, [collegeId]: data ?? [] }));
      }
      setLoadingCoordinators(false);
    }
  }

  async function reloadCoordinators(collegeId) {
    const { data, error } = await supabase
      .from('placement_coordinators')
      .select('*')
      .eq('college_id', collegeId)
      .order('is_current', { ascending: false })
      .order('created_at', { ascending: false });
    if (!error) {
      setCoordinatorsByCollege((prev) => ({ ...prev, [collegeId]: data ?? [] }));
    }
  }

  async function handleAddCoordinator(e, collegeId) {
    e.preventDefault();
    if (!coordForm.name.trim()) return;
    setSavingCoord(true);
    const { error } = await supabase.from('placement_coordinators').insert([{
      college_id: collegeId,
      name: coordForm.name.trim(),
      phone: coordForm.phone || null,
      email: coordForm.email || null,
      is_current: true,
    }]);
    if (error) {
      console.error('Failed to add coordinator:', error);
      alert('Could not add placement coordinator. Check console for details.');
    } else {
      setCoordForm({ name: '', phone: '', email: '' });
      await reloadCoordinators(collegeId);
    }
    setSavingCoord(false);
  }

  // Marks a coordinator as no longer current (e.g. they left) instead of
  // deleting them, so the full history of who covered a college is preserved.
  async function handleRetireCoordinator(coord) {
    if (!window.confirm(`Mark "${coord.name}" as no longer the current coordinator?`)) return;
    const { error } = await supabase.from('placement_coordinators').update({
      is_current: false,
      ended_at: new Date().toISOString(),
    }).eq('id', coord.id);
    if (error) {
      console.error('Failed to retire coordinator:', error);
      alert('Could not update coordinator. Check console for details.');
    } else {
      await reloadCoordinators(coord.college_id);
    }
  }

  async function handleDeleteCoordinator(coord) {
    if (!window.confirm(`Permanently delete "${coord.name}" from records? This cannot be undone.`)) return;
    const { error } = await supabase.from('placement_coordinators').delete().eq('id', coord.id);
    if (error) {
      console.error('Failed to delete coordinator:', error);
      alert('Could not delete coordinator. Check console for details.');
    } else {
      await reloadCoordinators(coord.college_id);
    }
  }

  function cancelImport() {
    setImportRows(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="page active" id="page-campusdb">
      <div className="page-head">
        <div>
          <h1>Campus Database</h1>
          <p>{loading ? 'Loading…' : `${colleges.length} colleges`} · filter by course, city or status</p>
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
            {showForm ? 'Cancel' : '+ Add College'}
          </button>
        </div>
      </div>

      {error && <div className="panel" style={{ color: 'crimson' }}>{error}</div>}

      {importResult && (
        <div className="panel">
          <p>Import done: {importResult.success} added, {importResult.failed} failed.</p>
          {importResult.failed > 0 && importResult.firstErrors?.length > 0 && (
            <div style={{ color: 'crimson', fontSize: 13, marginTop: 8 }}>
              <p>Error details (likely a Supabase permissions/RLS issue):</p>
              <ul>
                {importResult.firstErrors.map((msg, i) => <li key={i}>{msg}</li>)}
              </ul>
            </div>
          )}
          <button className="btn-outline" onClick={() => setImportResult(null)}>Dismiss</button>
        </div>
      )}

      {importRows && (
        <div className="panel">
          <div className="panel-title">Preview — {importRows.length} rows found</div>
          <table>
            <tbody>
              <tr><th>Name</th><th>City</th><th>Course</th><th>TPO</th><th>Strength</th><th>Status</th></tr>
              {importRows.slice(0, 10).map((r, i) => (
                <tr key={i}>
                  <td>{r.name}</td><td>{r.city}</td><td>{r.course}</td><td>{r.tpo}</td><td>{r.strength}</td><td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {importRows.length > 10 && <p>...and {importRows.length - 10} more rows</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn-gold" onClick={handleConfirmImport} disabled={importing}>
              {importing ? 'Importing…' : `Import ${importRows.length} Colleges`}
            </button>
            <button className="btn-outline" onClick={cancelImport}>Cancel</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="panel">
          <div className="panel-title">{editingId ? 'Edit College' : 'Add New College'}</div>
          <form onSubmit={handleSaveCollege} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input
              className="search-box" placeholder="College name" required
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="search-box" placeholder="City"
              value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <select
              className="search-box"
              value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}
            >
              <option value="">— No course —</option>
              {courses.filter((c) => c !== 'Unassigned').map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              className="search-box" placeholder="TPO name"
              value={form.tpo} onChange={(e) => setForm({ ...form, tpo: e.target.value })}
            />
            <input
              className="search-box" placeholder="Website (https://...)"
              value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
            <input
              className="search-box" placeholder="Strength" type="number"
              value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })}
            />
            <input
              className="search-box" type="date"
              value={form.last_contact} onChange={(e) => setForm({ ...form, last_contact: e.target.value })}
            />
            <select
              className="search-box"
              value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="Interested">Interested</option>
              <option value="Follow-up Due">Follow-up Due</option>
              <option value="Not Interested">Not Interested</option>
            </select>
            <button className="btn-gold" type="submit" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Update College' : 'Save College'}
            </button>
          </form>
        </div>
      )}

      <div className="panel">
        <div>
          {courses.map((c) => (
            <span
              key={c}
              className={`course-chip ${activeCourse === c ? 'sel' : ''}`}
              onClick={() => setActiveCourse(c)}
            >
              {c}
            </span>
          ))}
        </div>
        <div className="toolbar" style={{ marginTop: 16 }}>
          <input
            className="search-box"
            placeholder="Search college, city, TPO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {['All Status', 'Interested', 'Follow-up Due', 'Not Interested'].map((f) => (
            <span
              key={f}
              className={`filter-chip ${activeFilter === f ? 'sel' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </span>
          ))}
        </div>

        <table>
          <tbody>
            <tr><th>College</th><th>Institution Type</th><th>City</th><th>Country</th><th>Website</th><th>Courses Available</th><th>Status</th><th>Actions</th></tr>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24 }}>Loading…</td></tr>
            ) : filtered.length > 0 ? (
              filtered.map((c) => (
<React.Fragment key={c.id}>
<tr>
  <td>{c.name}</td>
  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.institution_type || '—'}</td>
  <td>{c.city ?? '—'}</td>
  <td>{c.country ?? '—'}</td>
  <td>
    {c.website ? <a href={c.website} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Visit ↗</a> : '—'}
  </td>
  <td style={{ maxWidth: 260, fontSize: 11.5, color: 'var(--text-muted)' }} title={c.courses_available}>
    {c.courses_available ? (c.courses_available.length > 60 ? c.courses_available.slice(0, 60) + '…' : c.courses_available) : '—'}
  </td>
  <td><span className={`badge ${badgeForStatus[c.status] ?? 'gray'}`}>{c.status}</span></td>
  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => startEdit(c)}>Edit</button>
                    <button className="btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => toggleCoordinators(c.id)}>
                      {expandedCollegeId === c.id ? 'Hide Coordinators' : 'Coordinators'}
                    </button>
                    <button className="btn-outline" style={{ padding: '4px 10px', fontSize: 12, color: 'crimson' }} onClick={() => handleDeleteCollege(c.id, c.name)}>Delete</button>
                  </td>
                </tr>
                {expandedCollegeId === c.id && (
                  <tr>
                    <td colSpan={8} style={{ background: 'var(--bg-soft, #FAFAFC)', padding: 16 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>
                        Placement Coordinators — {c.name}
                      </div>

                      {loadingCoordinators ? (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
                      ) : (
                        <>
                          {(coordinatorsByCollege[c.id] ?? []).length === 0 ? (
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                              No coordinators added yet.
                            </div>
                          ) : (
                            <table style={{ marginBottom: 12 }}>
                              <tbody>
                                <tr><th>Name</th><th>Phone</th><th>Email</th><th>Status</th><th>Actions</th></tr>
                                {(coordinatorsByCollege[c.id] ?? []).map((coord) => (
                                  <tr key={coord.id}>
                                    <td>{coord.name}</td>
                                    <td>{coord.phone || '—'}</td>
                                    <td>{coord.email || '—'}</td>
                                    <td>
                                      {coord.is_current ? (
                                        <span className="badge green">Current</span>
                                      ) : (
                                        <span className="badge gray">Past</span>
                                      )}
                                    </td>
                                    <td style={{ display: 'flex', gap: 6 }}>
                                      {coord.is_current && (
                                        <button
                                          className="btn-outline"
                                          style={{ padding: '3px 8px', fontSize: 11.5 }}
                                          onClick={() => handleRetireCoordinator(coord)}
                                        >
                                          Mark as Left
                                        </button>
                                      )}
                                      <button
                                        className="btn-outline"
                                        style={{ padding: '3px 8px', fontSize: 11.5, color: 'crimson' }}
                                        onClick={() => handleDeleteCoordinator(coord)}
                                      >
                                        Delete
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}

                          <form
                            onSubmit={(e) => handleAddCoordinator(e, c.id)}
                            style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}
                          >
                            <input
                              className="search-box" placeholder="Name" required style={{ maxWidth: 180 }}
                              value={coordForm.name} onChange={(e) => setCoordForm({ ...coordForm, name: e.target.value })}
                            />
                            <input
                              className="search-box" placeholder="Phone" style={{ maxWidth: 160 }}
                              value={coordForm.phone} onChange={(e) => setCoordForm({ ...coordForm, phone: e.target.value })}
                            />
                            <input
                              className="search-box" placeholder="Email" type="email" style={{ maxWidth: 220 }}
                              value={coordForm.email} onChange={(e) => setCoordForm({ ...coordForm, email: e.target.value })}
                            />
                            <button className="btn-gold" type="submit" disabled={savingCoord} style={{ padding: '6px 14px', fontSize: 13 }}>
                              {savingCoord ? 'Adding…' : '+ Add Coordinator'}
                            </button>
                          </form>
                        </>
                      )}
                    </td>
                  </tr>
                )}
</React.Fragment>
              ))
            ) : (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--slate-light)', padding: 24 }}>No colleges found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}