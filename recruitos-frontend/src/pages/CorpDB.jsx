import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';

const emptyForm = {
  name: '', sector: '', hr_name: '', hq_location: '', hiring_status: 'Active',
  city: '', hr_phone: '', hr_email: '', website: '', gst_no: '', industry: '', sub_industry: '',
};

export default function CorpDB() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [importRows, setImportRows] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

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

  const filtered = companies.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name ?? '').toLowerCase().includes(q) ||
      (c.sector ?? '').toLowerCase().includes(q) ||
      (c.city ?? '').toLowerCase().includes(q) ||
      (c.hr_name ?? '').toLowerCase().includes(q) ||
      (c.industry ?? '').toLowerCase().includes(q)
    );
  });

  function startEdit(c) {
    setEditingId(c.id);
    setForm({
      name: c.name || '', sector: c.sector || '', hr_name: c.hr_name || '',
      hq_location: c.hq_location || '', hiring_status: c.hiring_status || 'Active',
      city: c.city || '', hr_phone: c.hr_phone || '', hr_email: c.hr_email || '',
      website: c.website || '', gst_no: c.gst_no || '', industry: c.industry || '', sub_industry: c.sub_industry || '',
    });
    setShowForm(true);
  }

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSaveCompany(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name, sector: form.sector, hr_name: form.hr_name, hq_location: form.hq_location,
      hiring_status: form.hiring_status, city: form.city || null, hr_phone: form.hr_phone || null,
      hr_email: form.hr_email || null, website: form.website || null, gst_no: form.gst_no || null,
      industry: form.industry || null, sub_industry: form.sub_industry || null,
    };

    if (editingId) {
      const { error } = await supabase.from('companies').update(payload).eq('id', editingId);
      if (error) { console.error(error); alert('Could not update company.'); }
      else { cancelForm(); await loadCompanies(); }
    } else {
      const { error } = await supabase.from('companies').insert([payload]);
      if (error) { console.error(error); alert('Could not add company.'); }
      else { cancelForm(); await loadCompanies(); }
    }
    setSaving(false);
  }

  async function handleDeleteCompany(id, name) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) { console.error(error); alert('Could not delete company.'); }
    else await loadCompanies();
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
    let success = 0, failed = 0;
    for (const row of importRows) {
      const { error } = await supabase.from('companies').insert([{
        name: row.name, sector: row.sector || null, hr_name: row.hr_name || null,
        hq_location: row.hq_location || null, hiring_status: row.hiring_status || 'Active',
        city: row.city || null, hr_phone: row.hr_phone || null, hr_email: row.hr_email || null,
        website: row.website || null, gst_no: row.gst_no || null,
        industry: row.industry || null, sub_industry: row.sub_industry || null,
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
          <input type="file" accept=".xlsx,.xls,.csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
          <button className="btn-outline" onClick={() => fileInputRef.current.click()}>Import Excel</button>
          <button className="btn-gold" onClick={startAdd}>+ Add Company</button>
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
                <tr key={i}><td>{r.name}</td><td>{r.sector}</td><td>{r.hr_name}</td><td>{r.hq_location}</td><td>{r.hiring_status}</td></tr>
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

      <div className="panel">
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <input
            className="search-box"
            placeholder="Search company, sector, city, HR name, industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="panel">
        <table>
          <tbody>
            <tr>
              <th>Company</th><th>Sector</th><th>City / HQ</th><th>HR Contact</th>
              <th>Website</th><th>Industry</th><th>Status</th><th>Actions</th>
            </tr>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24 }}>Loading…</td></tr>
            ) : filtered.length > 0 ? (
              filtered.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700 }}>{c.name}</td>
                  <td>{c.sector ?? '—'}</td>
                  <td>{[c.city, c.hq_location].filter(Boolean).join(', ') || '—'}</td>
                  <td>
                    <div>{c.hr_name ?? '—'}</div>
                    {c.hr_phone && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>📞 {c.hr_phone}</div>}
                    {c.hr_email && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>✉️ {c.hr_email}</div>}
                  </td>
                  <td>{c.website ? <a href={c.website} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-purple)' }}>Visit ↗</a> : '—'}</td>
                  <td style={{ fontSize: 12 }}>{[c.industry, c.sub_industry].filter(Boolean).join(' / ') || '—'}</td>
                  <td><span className={`badge ${c.hiring_status === 'Active' ? 'green' : 'gray'}`}>{c.hiring_status ?? '—'}</span></td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => startEdit(c)}>Edit</button>
                    <button className="btn-outline" style={{ padding: '4px 10px', fontSize: 12, color: 'crimson' }} onClick={() => handleDeleteCompany(c.id, c.name)}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No companies found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div
          onClick={cancelForm}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="panel"
            style={{ maxWidth: 640, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div className="panel-title" style={{ margin: 0 }}>{editingId ? 'Edit Company' : 'Add New Company'}</div>
              <button onClick={cancelForm} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleSaveCompany} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              <input className="search-box" placeholder="Company name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="search-box" placeholder="Sector (e.g. IT Services)" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
              <input className="search-box" placeholder="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
              <input className="search-box" placeholder="Sub Industry" value={form.sub_industry} onChange={(e) => setForm({ ...form, sub_industry: e.target.value })} />
              <input className="search-box" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <input className="search-box" placeholder="HQ location" value={form.hq_location} onChange={(e) => setForm({ ...form, hq_location: e.target.value })} />
              <input className="search-box" placeholder="HR Manager name" value={form.hr_name} onChange={(e) => setForm({ ...form, hr_name: e.target.value })} />
              <input className="search-box" placeholder="HR mobile no." value={form.hr_phone} onChange={(e) => setForm({ ...form, hr_phone: e.target.value })} />
              <input className="search-box" placeholder="HR email ID" type="email" value={form.hr_email} onChange={(e) => setForm({ ...form, hr_email: e.target.value })} />
              <input className="search-box" placeholder="Website (https://...)" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              <input className="search-box" placeholder="GST No." value={form.gst_no} onChange={(e) => setForm({ ...form, gst_no: e.target.value })} />
              <select className="search-box" value={form.hiring_status} onChange={(e) => setForm({ ...form, hiring_status: e.target.value })}>
                <option value="Active">Hiring: Active</option>
                <option value="Paused">Hiring: Paused</option>
              </select>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, marginTop: 8 }}>
                <button className="btn-gold" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Update Company' : 'Save Company'}
                </button>
                <button className="btn-outline" type="button" onClick={cancelForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}