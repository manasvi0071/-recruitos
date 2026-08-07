import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';
import { sanitizePhone } from '../lib/phone';
import { isValidEmail } from '../lib/email';

const emptyForm = {
  name: '',
  sector: '',
  hr_name: '',
  hq_location: '',
  hiring_status: 'Active',
  city: '',
  hr_phone: '',
  hr_email: '',
  website: '',
  gst_no: '',
  industry: '',
  sub_industry: '',
};

const hiringStatusColors = {
  Active: { bg: '#0fae72', text: '#ffffff' },
  Paused: { bg: '#e5e7eb', text: '#4b5563' },
};

function formatDate(d) {
  if (!d) return 'Present';

  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function CorpDB() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search + filters
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Status');

  // Company form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Excel import
  const [importRows, setImportRows] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  // HR history
  const [hrHistoryByCompany, setHrHistoryByCompany] = useState({});
  const [loadingHr, setLoadingHr] = useState(false);
  const [expandedHrCompanyId, setExpandedHrCompanyId] = useState(null);
  const [addingHrFor, setAddingHrFor] = useState(null);
  const [hrForm, setHrForm] = useState({
    name: '',
    title: '',
    phone: '',
    email: '',
  });
  const [savingHr, setSavingHr] = useState(false);

  // ------------------------------------------------------------
  // LOAD COMPANIES
  // ------------------------------------------------------------

  async function loadCompanies() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Failed to load companies:', error);
      setError(
        'Could not load companies. Check your Supabase connection.'
      );
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
        setError(
          'Could not load companies. Check your Supabase connection.'
        );
      } else {
        setCompanies(data ?? []);
      }

      setLoading(false);
    }

    init();

    return () => {
      ignore = true;
    };
  }, []);

  // ------------------------------------------------------------
  // SEARCH + FILTER
  // ------------------------------------------------------------

  const filteredCompanies = companies.filter((c) => {
    const q = search.toLowerCase().trim();

    const matchSearch =
      !q ||
      (c.name ?? '').toLowerCase().includes(q) ||
      (c.city ?? '').toLowerCase().includes(q) ||
      (c.hq_location ?? '').toLowerCase().includes(q) ||
      (c.sector ?? '').toLowerCase().includes(q) ||
      (c.hr_name ?? '').toLowerCase().includes(q) ||
      (c.industry ?? '').toLowerCase().includes(q) ||
      (c.sub_industry ?? '').toLowerCase().includes(q);

    const matchStatus =
      activeFilter === 'All Status' ||
      c.hiring_status === activeFilter;

    return matchSearch && matchStatus;
  });

  // ------------------------------------------------------------
  // COMPANY FORM
  // ------------------------------------------------------------

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

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

    if (!form.name.trim()) {
      alert('Please enter company name.');
      return;
    }

    if (form.hr_email && !isValidEmail(form.hr_email)) {
      alert('Please enter a valid HR email address.');
      return;
    }

    setSaving(true);

    const companyData = {
      name: form.name.trim(),
      sector: form.sector || null,
      hr_name: form.hr_name || null,
      hq_location: form.hq_location || null,
      hiring_status: form.hiring_status || 'Active',
      city: form.city || null,
      hr_phone: form.hr_phone || null,
      hr_email: form.hr_email || null,
      website: form.website || null,
      gst_no: form.gst_no || null,
      industry: form.industry || null,
      sub_industry: form.sub_industry || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from('companies')
        .update(companyData)
        .eq('id', editingId);

      if (error) {
        console.error('Failed to update company:', error);
        alert(
          'Could not update company. Check console for details.'
        );
      } else {
        cancelForm();
        await loadCompanies();
      }
    } else {
      const { error } = await supabase
        .from('companies')
        .insert([companyData]);

      if (error) {
        console.error('Failed to add company:', error);
        alert(
          'Could not add company. Check console for details.'
        );
      } else {
        cancelForm();
        await loadCompanies();
      }
    }

    setSaving(false);
  }

  // ------------------------------------------------------------
  // DELETE COMPANY
  // ------------------------------------------------------------

  async function handleDeleteCompany(id, name) {
    if (
      !window.confirm(
        `Delete "${name}"? This cannot be undone.`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete company:', error);
      alert(
        'Could not delete company. Check console for details.'
      );
    } else {
      await loadCompanies();
    }
  }

  // ------------------------------------------------------------
  // HR HISTORY
  // ------------------------------------------------------------

  async function loadHrHistory(companyId) {
    const { data, error } = await supabase
      .from('company_hr_contacts')
      .select('*')
      .eq('company_id', companyId)
      .order('is_current', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load HR history:', error);

      alert(
        'Could not load HR history. Check console for details.'
      );

      return;
    }

    setHrHistoryByCompany((prev) => ({
      ...prev,
      [companyId]: data ?? [],
    }));
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

    setHrForm({
      name: '',
      title: '',
      phone: '',
      email: '',
    });

    if (!hrHistoryByCompany[companyId]) {
      loadHrHistory(companyId);
    }
  }

  async function handleAddHr(e, companyId) {
    e.preventDefault();

    if (!hrForm.name.trim()) {
      alert('Please enter HR name.');
      return;
    }

    if (hrForm.email && !isValidEmail(hrForm.email)) {
      alert('Please enter a valid HR email address.');
      return;
    }

    setSavingHr(true);

    // Archive current HR
    const { error: archiveErr } = await supabase
      .from('company_hr_contacts')
      .update({
        is_current: false,
        ended_at: new Date().toISOString(),
      })
      .eq('company_id', companyId)
      .eq('is_current', true);

    if (archiveErr) {
      console.error(
        'Failed to archive previous HR:',
        archiveErr
      );

      alert(
        'Could not archive previous HR. Check console for details.'
      );

      setSavingHr(false);
      return;
    }

    // Insert new HR
    const { error: insertErr } = await supabase
      .from('company_hr_contacts')
      .insert([
        {
          company_id: companyId,
          name: hrForm.name.trim(),
          title: hrForm.title.trim() || null,
          phone: hrForm.phone || null,
          email: hrForm.email || null,
          is_current: true,
        },
      ]);

    if (insertErr) {
      console.error(
        'Failed to add HR contact:',
        insertErr
      );

      alert(
        'Could not add new HR. Check console for details.'
      );

      setSavingHr(false);
      return;
    }

    // Update company main HR fields
    const { error: companyUpdateError } = await supabase
      .from('companies')
      .update({
        hr_name: hrForm.name.trim(),
        hr_phone: hrForm.phone || null,
        hr_email: hrForm.email || null,
      })
      .eq('id', companyId);

    if (companyUpdateError) {
      console.error(
        'Failed to update company HR fields:',
        companyUpdateError
      );
    }

    setHrForm({
      name: '',
      title: '',
      phone: '',
      email: '',
    });

    setAddingHrFor(null);

    await Promise.all([
      loadHrHistory(companyId),
      loadCompanies(),
    ]);

    setSavingHr(false);
  }

  // ------------------------------------------------------------
  // EXCEL IMPORT
  // ------------------------------------------------------------

  function normalizeHiringStatus(raw) {
    const value = String(raw || '').trim().toLowerCase();

    if (value === 'paused' || value === 'pause') {
      return 'Paused';
    }

    return 'Active';
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setImportResult(null);

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, {
          type: 'binary',
        });

        const sheet = wb.Sheets[wb.SheetNames[0]];

        const rows = XLSX.utils.sheet_to_json(sheet, {
          defval: '',
        });

        const mapped = rows
          .map((r) => ({
            name:
              r.name ||
              r.Name ||
              r.Company ||
              r.company ||
              '',

            sector:
              r.sector ||
              r.Sector ||
              '',

            hr_name:
              r.hr_name ||
              r['HR Name'] ||
              r.hr ||
              '',

            hq_location:
              r.hq_location ||
              r['HQ Location'] ||
              r.hq ||
              '',

            hiring_status: normalizeHiringStatus(
              r.hiring_status ||
                r['Hiring Status'] ||
                r.Status ||
                r.status
            ),

            city:
              r.city ||
              r.City ||
              '',

            hr_phone:
              r.hr_phone ||
              r['HR Phone'] ||
              r['Mobile No'] ||
              r.mobile ||
              '',

            hr_email:
              r.hr_email ||
              r['HR Email'] ||
              r.email ||
              '',

            website:
              r.website ||
              r.Website ||
              '',

            gst_no:
              r.gst_no ||
              r['GST No'] ||
              r.GST ||
              '',

            industry:
              r.industry ||
              r.Industry ||
              '',

            sub_industry:
              r.sub_industry ||
              r['Sub Industry'] ||
              '',
          }))
          .filter((r) => r.name);

        setImportRows(mapped);
      } catch (err) {
        console.error('Failed to read Excel file:', err);

        alert(
          'Could not read the Excel file. Please check the file format.'
        );
      }
    };

    reader.readAsBinaryString(file);
  }

  async function handleConfirmImport() {
    if (!importRows || importRows.length === 0) {
      return;
    }

    setImporting(true);

    let success = 0;
    let failed = 0;
    const firstErrors = [];

    const records = importRows.map((row) => ({
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
    }));

    // Batch insert
    const chunkSize = 500;

    for (
      let i = 0;
      i < records.length;
      i += chunkSize
    ) {
      const chunk = records.slice(i, i + chunkSize);

      const { error } = await supabase
        .from('companies')
        .insert(chunk);

      if (error) {
        failed += chunk.length;

        if (firstErrors.length < 3) {
          firstErrors.push(error.message);
        }

        console.error(
          'Failed to import chunk:',
          error
        );
      } else {
        success += chunk.length;
      }
    }

    setImporting(false);

    setImportResult({
      success,
      failed,
      firstErrors,
    });

    setImportRows(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    await loadCompanies();
  }

  function cancelImport() {
    setImportRows(null);
    setImportResult(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------

  return (
    <div className="page active" id="page-corpdb">

      {/* HEADER */}
      <div className="page-head">
        <div>
          <h1>Corporate Database</h1>

          <p>
            {loading
              ? 'Loading…'
              : `${companies.length} client companies`}
            {' · '}
            search by company, city, HR or sector
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
          }}
        >
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          <button
            className="btn-outline"
            onClick={() =>
              fileInputRef.current?.click()
            }
          >
            Import Excel
          </button>

          <button
            className="btn-gold"
            onClick={startAdd}
          >
            + Add Company
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div
          className="panel"
          style={{ color: 'crimson' }}
        >
          {error}
        </div>
      )}

      {/* IMPORT RESULT */}
      {importResult && (
        <div className="panel">
          <p>
            Import done:{' '}
            <strong>{importResult.success}</strong>{' '}
            added,{' '}
            <strong>{importResult.failed}</strong>{' '}
            failed.
          </p>

          {importResult.failed > 0 &&
            importResult.firstErrors?.length > 0 && (
              <div
                style={{
                  color: 'crimson',
                  fontSize: 13,
                  marginTop: 8,
                }}
              >
                <p>
                  Error details:
                </p>

                <ul>
                  {importResult.firstErrors.map(
                    (msg, i) => (
                      <li key={i}>{msg}</li>
                    )
                  )}
                </ul>
              </div>
            )}

          <button
            className="btn-outline"
            onClick={() =>
              setImportResult(null)
            }
          >
            Dismiss
          </button>
        </div>
      )}

      {/* EXCEL PREVIEW */}
      {importRows && (
        <div className="panel">
          <div className="panel-title">
            Preview — {importRows.length} rows found
          </div>

          <div
            style={{
              overflowX: 'auto',
            }}
          >
            <table>
              <tbody>
                <tr>
                  <th>Name</th>
                  <th>Sector</th>
                  <th>Industry</th>
                  <th>HR Name</th>
                  <th>City</th>
                  <th>HQ</th>
                  <th>Status</th>
                </tr>

                {importRows
                  .slice(0, 10)
                  .map((r, i) => (
                    <tr key={i}>
                      <td>{r.name}</td>
                      <td>{r.sector || '—'}</td>
                      <td>{r.industry || '—'}</td>
                      <td>{r.hr_name || '—'}</td>
                      <td>{r.city || '—'}</td>
                      <td>
                        {r.hq_location || '—'}
                      </td>
                      <td>
                        {r.hiring_status}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {importRows.length > 10 && (
            <p>
              ...and {importRows.length - 10} more
              rows
            </p>
          )}

          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 12,
            }}
          >
            <button
              className="btn-gold"
              onClick={handleConfirmImport}
              disabled={importing}
            >
              {importing
                ? 'Importing…'
                : `Import ${importRows.length} Companies`}
            </button>

            <button
              className="btn-outline"
              onClick={cancelImport}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* SEARCH + STATUS FILTER */}
      <div className="panel">
        <div
          className="toolbar"
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <input
            className="search-box"
            placeholder="Search company, city, HR, sector..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {[
            'All Status',
            'Active',
            'Paused',
          ].map((f) => (
            <span
              key={f}
              className={`filter-chip ${
                activeFilter === f
                  ? 'sel'
                  : ''
              }`}
              onClick={() =>
                setActiveFilter(f)
              }
            >
              {f}
            </span>
          ))}
        </div>

        {/* CORPORATE TABLE */}
        <div
          style={{
            overflowX: 'auto',
            marginTop: 16,
          }}
        >
          <table>
            <tbody>
              <tr>
                <th>Company</th>
                <th>Sector</th>
                <th>Industry</th>
                <th>City / HQ</th>
                <th>Current HR</th>
                <th>HR Contact</th>
                <th>Website</th>
                <th>Hiring Status</th>
                <th>Actions</th>
              </tr>

              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: 'center',
                      padding: 24,
                    }}
                  >
                    Loading…
                  </td>
                </tr>
              ) : filteredCompanies.length > 0 ? (
                filteredCompanies.map((c) => {
                  const history =
                    hrHistoryByCompany[c.id];

                  const currentHr =
                    history?.find(
                      (h) => h.is_current
                    );

                  const pastHr =
                    (history ?? []).filter(
                      (h) => !h.is_current
                    );

                  const isExpanded =
                    expandedHrCompanyId ===
                    c.id;

                  const isAdding =
                    addingHrFor === c.id;

                  const hrName =
                    currentHr?.name ||
                    c.hr_name ||
                    'Not assigned';

                  const hrPhone =
                    currentHr?.phone ||
                    c.hr_phone;

                  const hrEmail =
                    currentHr?.email ||
                    c.hr_email;

                  return (
                    <>
                      {/* MAIN COMPANY ROW */}
                      <tr key={c.id}>

                        {/* COMPANY */}
                        <td>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 13,
                            }}
                          >
                            {c.name}
                          </div>

                          {c.gst_no && (
                            <div
                              style={{
                                fontSize: 10.5,
                                color:
                                  'var(--text-muted)',
                                marginTop: 3,
                              }}
                            >
                              GST: {c.gst_no}
                            </div>
                          )}
                        </td>

                        {/* SECTOR */}
                        <td>
                          {c.sector || '—'}
                        </td>

                        {/* INDUSTRY */}
                        <td>
                          <div>
                            {c.industry || '—'}
                          </div>

                          {c.sub_industry && (
                            <div
                              style={{
                                fontSize: 11,
                                color:
                                  'var(--text-muted)',
                                marginTop: 2,
                              }}
                            >
                              {
                                c.sub_industry
                              }
                            </div>
                          )}
                        </td>

                        {/* CITY / HQ */}
                        <td>
                          {c.city ||
                          c.hq_location
                            ? [
                                c.city,
                                c.hq_location,
                              ]
                                .filter(Boolean)
                                .join(', ')
                            : '—'}
                        </td>

                        {/* CURRENT HR */}
                        <td>
                          <div
                            style={{
                              fontWeight: 600,
                            }}
                          >
                            {hrName}
                          </div>

                          {currentHr?.title && (
                            <div
                              style={{
                                fontSize: 11,
                                color:
                                  'var(--text-muted)',
                                marginTop: 2,
                              }}
                            >
                              {
                                currentHr.title
                              }
                            </div>
                          )}
                        </td>

                        {/* HR CONTACT */}
                        <td>
                          {hrPhone && (
                            <div
                              style={{
                                fontSize: 12,
                              }}
                            >
                              📞 {hrPhone}
                            </div>
                          )}

                          {hrEmail && (
                            <div
                              style={{
                                fontSize: 11,
                                color:
                                  'var(--text-secondary)',
                                wordBreak:
                                  'break-word',
                                marginTop: 2,
                              }}
                            >
                              ✉️ {hrEmail}
                            </div>
                          )}

                          {!hrPhone &&
                            !hrEmail &&
                            '—'}
                        </td>

                        {/* WEBSITE */}
                        <td>
                          {c.website ? (
                            <a
                              href={c.website}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color:
                                  'var(--primary)',
                              }}
                            >
                              Visit ↗
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* HIRING STATUS */}
                        <td>
                          <span
                            style={{
                              display:
                                'inline-block',
                              borderRadius: 999,
                              padding:
                                '4px 10px',
                              fontSize: 11.5,
                              fontWeight: 600,
                              backgroundColor:
                                hiringStatusColors[
                                  c.hiring_status
                                ]?.bg ??
                                hiringStatusColors
                                  .Active.bg,
                              color:
                                hiringStatusColors[
                                  c.hiring_status
                                ]?.text ??
                                hiringStatusColors
                                  .Active.text,
                            }}
                          >
                            {c.hiring_status ||
                              'Active'}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td>
                          <div
                            style={{
                              display: 'flex',
                              gap: 6,
                              flexWrap: 'wrap',
                            }}
                          >
                            <button
                              className="btn-outline"
                              style={{
                                padding:
                                  '4px 10px',
                                fontSize: 12,
                              }}
                              onClick={() =>
                                startEdit(c)
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="btn-outline"
                              style={{
                                padding:
                                  '4px 10px',
                                fontSize: 12,
                              }}
                              onClick={() =>
                                toggleHrHistory(
                                  c.id
                                )
                              }
                            >
                              {isExpanded
                                ? 'Hide HR'
                                : `HR History${
                                    pastHr.length
                                      ? ` (${pastHr.length})`
                                      : ''
                                  }`}
                            </button>

                            <button
                              className="btn-outline"
                              style={{
                                padding:
                                  '4px 10px',
                                fontSize: 12,
                                color:
                                  'crimson',
                              }}
                              onClick={() =>
                                handleDeleteCompany(
                                  c.id,
                                  c.name
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* HR EXPANDED ROW */}
                      {isExpanded && (
                        <tr
                          key={`${c.id}-hr`}
                        >
                          <td
                            colSpan={9}
                            style={{
                              background:
                                'var(--bg-surface-2)',
                              padding: 16,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent:
                                  'space-between',
                                alignItems:
                                  'center',
                                marginBottom: 10,
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: 13,
                                }}
                              >
                                HR History —{' '}
                                {c.name}
                              </div>

                              {!isAdding && (
                                <button
                                  className="btn-gold"
                                  onClick={() =>
                                    openAddHr(
                                      c.id
                                    )
                                  }
                                  style={{
                                    padding:
                                      '5px 12px',
                                    fontSize: 12,
                                  }}
                                >
                                  + Add HR
                                </button>
                              )}
                            </div>

                            {loadingHr ? (
                              <div
                                style={{
                                  fontSize: 13,
                                  color:
                                    'var(--text-muted)',
                                }}
                              >
                                Loading…
                              </div>
                            ) : (
                              <>
                                {/* ADD HR FORM */}
                                {isAdding && (
                                  <form
                                    onSubmit={(e) =>
                                      handleAddHr(
                                        e,
                                        c.id
                                      )
                                    }
                                    style={{
                                      display:
                                        'flex',
                                      gap: 8,
                                      flexWrap:
                                        'wrap',
                                      alignItems:
                                        'center',
                                      marginBottom: 14,
                                      padding: 12,
                                      border:
                                        '1px dashed var(--border-default, #ddd)',
                                      borderRadius:
                                        8,
                                    }}
                                  >
                                    <input
                                      className="search-box"
                                      placeholder="Name *"
                                      required
                                      style={{
                                        maxWidth:
                                          180,
                                      }}
                                      value={
                                        hrForm.name
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        setHrForm({
                                          ...hrForm,
                                          name: e
                                            .target
                                            .value,
                                        })
                                      }
                                    />

                                    <input
                                      className="search-box"
                                      placeholder="Title"
                                      style={{
                                        maxWidth:
                                          180,
                                      }}
                                      value={
                                        hrForm.title
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        setHrForm({
                                          ...hrForm,
                                          title: e
                                            .target
                                            .value,
                                        })
                                      }
                                    />

                                    <input
                                      className="search-box"
                                      placeholder="Phone"
                                      style={{
                                        maxWidth:
                                          160,
                                      }}
                                      value={
                                        hrForm.phone
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        setHrForm({
                                          ...hrForm,
                                          phone: sanitizePhone(
                                            e.target
                                              .value
                                          ),
                                        })
                                      }
                                      inputMode="numeric"
                                      maxLength={
                                        10
                                      }
                                    />

                                    <input
                                      className="search-box"
                                      placeholder="Email"
                                      type="email"
                                      style={{
                                        maxWidth:
                                          220,
                                      }}
                                      value={
                                        hrForm.email
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        setHrForm({
                                          ...hrForm,
                                          email: e
                                            .target
                                            .value,
                                        })
                                      }
                                    />

                                    <button
                                      className="btn-gold"
                                      type="submit"
                                      disabled={
                                        savingHr
                                      }
                                      style={{
                                        padding:
                                          '6px 14px',
                                        fontSize:
                                          13,
                                      }}
                                    >
                                      {savingHr
                                        ? 'Saving…'
                                        : 'Save New HR'}
                                    </button>

                                    <button
                                      type="button"
                                      className="btn-outline"
                                      onClick={() =>
                                        setAddingHrFor(
                                          null
                                        )
                                      }
                                      style={{
                                        padding:
                                          '6px 14px',
                                        fontSize:
                                          13,
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </form>
                                )}

                                {/* CURRENT HR SUMMARY */}
                                <div
                                  style={{
                                    marginBottom: 12,
                                    fontSize: 12,
                                    color:
                                      'var(--text-muted)',
                                  }}
                                >
                                  Current HR:{' '}
                                  <strong>
                                    {currentHr?.name ||
                                      c.hr_name ||
                                      'Not assigned'}
                                  </strong>

                                  {currentHr?.title && (
                                    <>
                                      {' · '}
                                      {
                                        currentHr.title
                                      }
                                    </>
                                  )}
                                </div>

                                {/* PAST HR TABLE */}
                                {pastHr.length >
                                0 ? (
                                  <div
                                    style={{
                                      overflowX:
                                        'auto',
                                    }}
                                  >
                                    <table>
                                      <tbody>
                                        <tr>
                                          <th>
                                            Name
                                          </th>
                                          <th>
                                            Title
                                          </th>
                                          <th>
                                            Phone
                                          </th>
                                          <th>
                                            Email
                                          </th>
                                          <th>
                                            Period
                                          </th>
                                        </tr>

                                        {pastHr.map(
                                          (h) => (
                                            <tr
                                              key={
                                                h.id
                                              }
                                            >
                                              <td>
                                                {
                                                  h.name
                                                }
                                              </td>

                                              <td>
                                                {h.title ||
                                                  '—'}
                                              </td>

                                              <td>
                                                {h.phone ||
                                                  '—'}
                                              </td>

                                              <td
                                                style={{
                                                  wordBreak:
                                                    'break-word',
                                                }}
                                              >
                                                {h.email ||
                                                  '—'}
                                              </td>

                                              <td>
                                                {formatDate(
                                                  h.created_at
                                                )}
                                                {' – '}
                                                {formatDate(
                                                  h.ended_at
                                                )}
                                              </td>
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color:
                                        'var(--text-muted)',
                                    }}
                                  >
                                    No past HR on
                                    record.
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: 'center',
                      color:
                        'var(--slate-light)',
                      padding: 24,
                    }}
                  >
                    No companies found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================
          ADD / EDIT COMPANY MODAL
          ====================================================== */}

      {showForm && (
        <div
          onClick={cancelForm}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            className="panel"
            style={{
              maxWidth: 700,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <div
                className="panel-title"
                style={{ margin: 0 }}
              >
                {editingId
                  ? 'Edit Company'
                  : 'Add New Company'}
              </div>

              <button
                onClick={cancelForm}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  color:
                    'var(--text-muted)',
                }}
              >
                ✕
              </button>
            </div>

            {/* COMPANY FORM */}
            <form
              onSubmit={handleSaveCompany}
              style={{
                display: 'grid',
                gridTemplateColumns:
                  '1fr 1fr',
                gap: 12,
                marginTop: 16,
              }}
            >
              <input
                className="search-box"
                placeholder="Company name"
                required
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />

              <input
                className="search-box"
                placeholder="Sector (e.g. IT Services)"
                value={form.sector}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sector: e.target.value,
                  })
                }
              />

              <input
                className="search-box"
                placeholder="Industry"
                value={form.industry}
                onChange={(e) =>
                  setForm({
                    ...form,
                    industry: e.target.value,
                  })
                }
              />

              <input
                className="search-box"
                placeholder="Sub Industry"
                value={form.sub_industry}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sub_industry:
                      e.target.value,
                  })
                }
              />

              <input
                className="search-box"
                placeholder="City"
                value={form.city}
                onChange={(e) =>
                  setForm({
                    ...form,
                    city: e.target.value,
                  })
                }
              />

              <input
                className="search-box"
                placeholder="HQ location"
                value={form.hq_location}
                onChange={(e) =>
                  setForm({
                    ...form,
                    hq_location:
                      e.target.value,
                  })
                }
              />

              <input
                className="search-box"
                placeholder="HR Manager name"
                value={form.hr_name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    hr_name: e.target.value,
                  })
                }
              />

              <input
                className="search-box"
                placeholder="HR mobile no."
                value={form.hr_phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    hr_phone:
                      sanitizePhone(
                        e.target.value
                      ),
                  })
                }
                inputMode="numeric"
                maxLength={10}
              />

              <input
                className="search-box"
                placeholder="HR email ID"
                type="email"
                value={form.hr_email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    hr_email:
                      e.target.value,
                  })
                }
              />

              <input
                className="search-box"
                placeholder="Website (https://...)"
                value={form.website}
                onChange={(e) =>
                  setForm({
                    ...form,
                    website:
                      e.target.value,
                  })
                }
              />

              <input
                className="search-box"
                placeholder="GST No."
                value={form.gst_no}
                onChange={(e) =>
                  setForm({
                    ...form,
                    gst_no:
                      e.target.value,
                  })
                }
              />

              <select
                className="search-box"
                value={
                  form.hiring_status
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    hiring_status:
                      e.target.value,
                  })
                }
              >
                <option value="Active">
                  Hiring: Active
                </option>

                <option value="Paused">
                  Hiring: Paused
                </option>
              </select>

              {/* BUTTONS */}
              <div
                style={{
                  gridColumn:
                    '1 / -1',
                  display: 'flex',
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <button
                  className="btn-gold"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving…'
                    : editingId
                    ? 'Update Company'
                    : 'Save Company'}
                </button>

                <button
                  className="btn-outline"
                  type="button"
                  onClick={cancelForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}