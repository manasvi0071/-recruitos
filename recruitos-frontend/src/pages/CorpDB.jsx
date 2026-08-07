import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';
import { sanitizePhone } from '../lib/phone';
import { isValidEmail } from '../lib/email';

const emptyForm = {
  name: '', sector: '', hr_name: '', hq_location: '', hiring_status: 'Active',
  city: '', hr_phone: '', hr_email: '', website: '', gst_no: '', industry: '', sub_industry: '',
};

function formatDate(d) {
  if (!d) return 'Present';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CorpDB() {
  const [companies, setCompanies] = useState([]);
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

  // HR history — current + past HR reps per company, expanded inline
  // per card (mirrors the Placement Coordinators pattern on Campus DB).
  const [hrHistoryByCompany, setHrHistoryByCompany] = useState({});
  const [loadingHr, setLoadingHr] = useState(false);
  const [expandedHrCompanyId, setExpandedHrCompanyId] = useState(null);
  const [addingHrFor, setAddingHrFor] = useState(null);
  const [hrForm, setHrForm] = useState({ name: '', title: '', phone: '', email: '' });
  const [savingHr, setSavingHr] = useState(false);

  async function loadCompanies() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Failed to load companies:', error);
      setError('Could not load companies. Check your Supabase connection.');
    } else {
      setCompanies(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
  let ignore = false;

  async function init() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true });

    if (ignore) return;

    if (error) {
      console.error('Failed to load companies:', error);
      setError('Could not load companies. Check your Supabase connection.');
    } else {
      setCompanies(data ?? []);
    }
    setLoading(false);
  }

  init();
  return () => { ignore = true; };
}, []);

  function startEdit(c) {
    setEditingId(c.id);
    setForm({
      name: c.name || '',
      sector: c.sector || '',
      hr_name: c.hr_name || '',
      hq_location: c.hq_location || '',
      hiring_status: c.hiring_status || 'Active',
      city: c.city || '',
      hr_phone: c.hr_phone || '',
      hr_email: c.hr_email || '',
      website: c.website || '',
      gst_no: c.gst_no || '',
      industry: c.industry || '',
      sub_industry: c.sub_industry || '',
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSaveCompany(e) {
    e.preventDefault();
    if (form.hr_email && !isValidEmail(form.hr_email)) {
      alert('Please enter a valid HR email address.');
      return;
    }
    setSaving(true);

    if (editingId) {
      const { error } = await supabase.from('companies').update({
        name: form.name,
        sector: form.sector,
        hr_name: form.hr_name,
        hq_location: form.hq_location,
        hiring_status: form.hiring_status,
        city: form.city || null,
        hr_phone: form.hr_phone || null,
        hr_email: form.hr_email || null,
        website: form.website || null,
        gst_no: form.gst_no || null,
        industry: form.industry || null,
        sub_industry: form.sub_industry || null,
      }).eq('id', editingId);

      if (error) {
        console.error('Failed to update company:', error);
        alert('Could not update company. Check console for details.');
      } else {
        cancelForm();
        await loadCompanies();
      }
    } else {
      const { error } = await supabase.from('companies').insert([{
        name: form.name,
        sector: form.sector,
        hr_name: form.hr_name,
        hq_location: form.hq_location,
        hiring_status: form.hiring_status,
        city: form.city || null,
        hr_phone: form.hr_phone || null,
        hr_email: form.hr_email || null,
        website: form.website || null,
        gst_no: form.gst_no || null,
        industry: form.industry || null,
        sub_industry: form.sub_industry || null,
      }]);

      if (error) {
        console.error('Failed to add company:', error);
        alert('Could not add company. Check console for details.');
      } else {
        cancelForm();
        await loadCompanies();
      }
    }
    setSaving(false);
  }

  async function handleDeleteCompany(id, name) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete company:', error);
      alert('Could not delete company. Check console for details.');
    } else {
      await loadCompanies();
    }
  }

  async function loadHrHistory(companyId) {
    const { data, error } = await supabase
      .from('company_hr_contacts')
      .select('*')
      .eq('company_id', companyId)
      .order('is_current', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load HR history:', error);
      alert('Could not load HR history. Check console for details.');
      return;
    }
    setHrHistoryByCompany((prev) => ({ ...prev, [companyId]: data ?? [] }));
  }

  async function toggleHrHistory(companyId) {
    if (expandedHrCompanyId === companyId) {
      setExpandedHrCompanyId(null);
      setAddingHrFor(null);
      return;
    }
    setExpandedHrCompanyId(companyId);
    setAddingHrFor(null);
    if (!hrHistoryByCompany[companyId]) {
      setLoadingHr(true);
      await loadHrHistory(companyId);
      setLoadingHr(false);
    }
  }

  function openAddHr(companyId) {
    setExpandedHrCompanyId(companyId);
    setAddingHrFor(companyId);
    setHrForm({ name: '', title: '', phone: '', email: '' });
    if (!hrHistoryByCompany[companyId]) loadHrHistory(companyId);
  }

  // Adding a new HR rep archives whoever is currently active for this
  // company into history, then makes the new one current — and mirrors
  // the new contact onto companies.hr_name/hr_phone/hr_email so the rest
  // of the app (e.g. selection emails) keeps working off those columns.
  async function handleAddHr(e, companyId) {
    e.preventDefault();
    if (!hrForm.name.trim()) return;
    if (hrForm.email && !isValidEmail(hrForm.email)) {
      alert('Please enter a valid HR email address.');
      return;
    }
    setSavingHr(true);

    const { error: archiveErr } = await supabase
      .from('company_hr_contacts')
      .update({ is_current: false, ended_at: new Date().toISOString() })
      .eq('company_id', companyId)
      .eq('is_current', true);
    if (archiveErr) {
      console.error('Failed to archive previous HR:', archiveErr);
      alert('Could not archive previous HR. Check console for details.');
      setSavingHr(false);
      return;
    }

    const { error: insertErr } = await supabase.from('company_hr_contacts').insert([{
      company_id: companyId,
      name: hrForm.name.trim(),
      title: hrForm.title.trim() || null,
      phone: hrForm.phone || null,
      email: hrForm.email || null,
      is_current: true,
    }]);
    if (insertErr) {
      console.error('Failed to add HR contact:', insertErr);
      alert('Could not add new HR. Check console for details.');
      setSavingHr(false);
      return;
    }

    await supabase.from('companies').update({
      hr_name: hrForm.name.trim(),
      hr_phone: hrForm.phone || null,
      hr_email: hrForm.email || null,
    }).eq('id', companyId);

    setHrForm({ name: '', title: '', phone: '', email: '' });
    setAddingHrFor(null);
    await Promise.all([loadHrHistory(companyId), loadCompanies()]);
    setSavingHr(false);
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
        name: r.name || r.Name || r.Company || r.company || '',
        sector: r.sector || r.Sector || '',
        hr_name: r.hr_name || r['HR Name'] || r.hr || '',
        hq_location: r.hq_location || r['HQ Location'] || r.hq || '',
        hiring_status: r.hiring_status || r['Hiring Status'] || 'Active',
        city: r.city || r.City || '',
        hr_phone: r.hr_phone || r['HR Phone'] || r['Mobile No'] || r.mobile || '',
        hr_email: r.hr_email || r['HR Email'] || r.email || '',
        website: r.website || r.Website || '',
        gst_no: r.gst_no || r['GST No'] || r.GST || '',
        industry: r.industry || r.Industry || '',
        sub_industry: r.sub_industry || r['Sub Industry'] || '',
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
    for (const row of importRows) {
      const { error } = await supabase.from('companies').insert([{
        name: row.name,
        sector: row.sector || null,
        hr_name: row.hr_name || null,
        hq_location: row.hq_location || null,
        hiring_status: row.hiring_status || 'Active',
        city: row.city || null,
        hr_phone: row.hr_phone || null,
        hr_email: row.hr_email || null,
        website: row.website || null,
        gst_no: row.gst_no || null,
        industry: row.industry || null,
        sub_industry: row.sub_industry || null,
      }]);
      if (error) failed += 1; else success += 1;
    }
    setImporting(false);
    setImportResult({ success, failed });
    setImportRows(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    await loadCompanies();
  }

  function cancelImport() {
    setImportRows(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="page active" id="page-corpdb">
      <div className="page-head">
        <div>
          <h1>Corporate Database</h1>
          <p>{loading ? 'Loading…' : `${companies.length} active client companies`}</p>
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
            {showForm ? 'Cancel' : '+ Add Company'}
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
              <tr><th>Name</th><th>Sector</th><th>HR Name</th><th>HQ</th><th>Status</th></tr>
              {importRows.slice(0, 10).map((r, i) => (
                <tr key={i}>
                  <td>{r.name}</td><td>{r.sector}</td><td>{r.hr_name}</td><td>{r.hq_location}</td><td>{r.hiring_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {importRows.length > 10 && <p>...and {importRows.length - 10} more rows</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn-gold" onClick={handleConfirmImport} disabled={importing}>
              {importing ? 'Importing…' : `Import ${importRows.length} Companies`}
            </button>
            <button className="btn-outline" onClick={cancelImport}>Cancel</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="panel">
          <div className="panel-title">{editingId ? 'Edit Company' : 'Add New Company'}</div>
          <form onSubmit={handleSaveCompany} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input
              className="search-box" placeholder="Company name" required
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="search-box" placeholder="Sector (e.g. IT Services)"
              value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })}
            />
            <input
              className="search-box" placeholder="Industry"
              value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
            />
            <input
              className="search-box" placeholder="Sub Industry"
              value={form.sub_industry} onChange={(e) => setForm({ ...form, sub_industry: e.target.value })}
            />
            <input
              className="search-box" placeholder="City"
              value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <input
              className="search-box" placeholder="HQ location"
              value={form.hq_location} onChange={(e) => setForm({ ...form, hq_location: e.target.value })}
            />
            <input
              className="search-box" placeholder="HR Manager name"
              value={form.hr_name} onChange={(e) => setForm({ ...form, hr_name: e.target.value })}
            />
            <input
              className="search-box" placeholder="HR mobile no."
              value={form.hr_phone} onChange={(e) => setForm({ ...form, hr_phone: sanitizePhone(e.target.value) })}
              inputMode="numeric" maxLength={10}
            />
            <input
              className="search-box" placeholder="HR email ID" type="email"
              value={form.hr_email} onChange={(e) => setForm({ ...form, hr_email: e.target.value })}
            />
            <input
              className="search-box" placeholder="Website (https://...)"
              value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
            <input
              className="search-box" placeholder="GST No."
              value={form.gst_no} onChange={(e) => setForm({ ...form, gst_no: e.target.value })}
            />
            <select
              className="search-box"
              value={form.hiring_status} onChange={(e) => setForm({ ...form, hiring_status: e.target.value })}
            >
              <option value="Active">Hiring: Active</option>
              <option value="Paused">Hiring: Paused</option>
            </select>
            <button className="btn-gold" type="submit" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Update Company' : 'Save Company'}
            </button>
          </form>
        </div>
      )}

      <div className="grid3">
        {loading ? (
          <div className="panel">Loading…</div>
        ) : companies.length === 0 ? (
          <div className="panel">No companies found.</div>
        ) : (
          companies.map((c) => {
            const history = hrHistoryByCompany[c.id];
            const currentHr = history?.find((h) => h.is_current);
            const pastHr = (history ?? []).filter((h) => !h.is_current);
            const isExpanded = expandedHrCompanyId === c.id;
            const isAdding = addingHrFor === c.id;

            return (
            <div className="panel" key={c.id}>
              <div className="jd-card" style={{ border: 'none', padding: 0 }}>
                <span className="co">{c.sector ?? '—'}</span>
                <h3>{c.name}</h3>
                <div className="meta">
                  {c.city || c.hq_location ? [c.city, c.hq_location].filter(Boolean).join(', ') : '—'}
                </div>

                {/* Current HR */}
                <div style={{ margin: '10px 0 6px', padding: '10px 12px', borderRadius: 8, background: 'var(--bg-soft, #FAFAFC)', border: '1px solid var(--border-default, #eee)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>
                        Current HR
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                        {currentHr?.name || c.hr_name || 'Not assigned'}
                        {(currentHr?.title) && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> · {currentHr.title}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {(currentHr?.phone || c.hr_phone) && <div>📞 {currentHr?.phone || c.hr_phone}</div>}
                        {(currentHr?.email || c.hr_email) && <div>✉️ {currentHr?.email || c.hr_email}</div>}
                      </div>
                    </div>
                    <button
                      className="btn-gold"
                      title="Add new HR"
                      onClick={() => openAddHr(c.id)}
                      style={{ padding: '4px 10px', fontSize: 12, lineHeight: 1, flexShrink: 0 }}
                    >
                      + Add HR
                    </button>
                  </div>
                </div>

                <button
                  className="btn-outline"
                  style={{ padding: '4px 10px', fontSize: 11.5, marginBottom: 6 }}
                  onClick={() => toggleHrHistory(c.id)}
                >
                  {isExpanded ? 'Hide Past HR' : `Past HR${pastHr.length ? ` (${pastHr.length})` : ''}`}
                </button>

                {isExpanded && (
                  <div style={{ marginBottom: 10 }}>
                    {isAdding && (
                      <form
                        onSubmit={(e) => handleAddHr(e, c.id)}
                        style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10, padding: 10, borderRadius: 8, border: '1px dashed var(--border-default, #ddd)' }}
                      >
                        <input
                          className="search-box" placeholder="Name *" required
                          value={hrForm.name} onChange={(e) => setHrForm({ ...hrForm, name: e.target.value })}
                        />
                        <input
                          className="search-box" placeholder="Title (e.g. HR Manager)"
                          value={hrForm.title} onChange={(e) => setHrForm({ ...hrForm, title: e.target.value })}
                        />
                        <input
                          className="search-box" placeholder="Phone"
                          value={hrForm.phone} onChange={(e) => setHrForm({ ...hrForm, phone: sanitizePhone(e.target.value) })}
                          inputMode="numeric" maxLength={10}
                        />
                        <input
                          className="search-box" placeholder="Email" type="email"
                          value={hrForm.email} onChange={(e) => setHrForm({ ...hrForm, email: e.target.value })}
                        />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-gold" type="submit" disabled={savingHr} style={{ padding: '6px 12px', fontSize: 12.5 }}>
                            {savingHr ? 'Saving…' : 'Save New HR'}
                          </button>
                          <button type="button" className="btn-outline" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={() => setAddingHrFor(null)}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                      Past HR
                    </div>
                    {loadingHr ? (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading…</div>
                    ) : pastHr.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No past HR on record.</div>
                    ) : (
                      pastHr.map((h) => (
                        <div key={h.id} style={{ opacity: 0.65, borderLeft: '2px solid var(--border-default, #ddd)', paddingLeft: 10, marginBottom: 8 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                            {h.name}{h.title && <span style={{ fontWeight: 400 }}> · {h.title}</span>}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                            {[h.phone, h.email].filter(Boolean).join(' · ') || '—'}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>
                            {formatDate(h.created_at)} – {formatDate(h.ended_at)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, margin: '8px 0', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  {c.website && (
                    <div>
                      <a href={c.website} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Visit website ↗</a>
                    </div>
                  )}
                  {(c.industry || c.sub_industry) && (
                    <div>Industry: {[c.industry, c.sub_industry].filter(Boolean).join(' / ')}</div>
                  )}
                  {c.gst_no && <div>GST: {c.gst_no}</div>}
                </div>
                <div className="skills">
                  <span>Hiring: {c.hiring_status ?? '—'}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button className="btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => startEdit(c)}>Edit</button>
                  <button className="btn-outline" style={{ padding: '4px 10px', fontSize: 12, color: 'crimson' }} onClick={() => handleDeleteCompany(c.id, c.name)}>Delete</button>
                </div>
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}