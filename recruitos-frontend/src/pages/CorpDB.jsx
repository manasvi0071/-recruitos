import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import * as XLSX from "xlsx";
import { sanitizePhone } from "../lib/phone";
import { isValidEmail } from "../lib/email";

const emptyForm = {
  name: "",
  sector: "",
  hr_name: "",
  hq_location: "",
  hiring_status: "Active",
  city: "",
  hr_phone: "",
  hr_email: "",
  website: "",
  gst_no: "",
  industry: "",
  sub_industry: "",
};

const emptyHrForm = {
  name: "",
  title: "",
  phone: "",
  email: "",
};

export default function CorpDB() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Company form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Add HR
  const [showHrForm, setShowHrForm] = useState(false);
  const [hrForm, setHrForm] = useState(emptyHrForm);
  const [savingHr, setSavingHr] = useState(false);

  // Excel import
  const [importRows, setImportRows] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  // --------------------------------------------------
  // LOAD COMPANIES
  // --------------------------------------------------

  async function loadCompanies() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to load companies:", error);
      setError(
        "Could not load companies. Check your Supabase connection."
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
        .from("companies")
        .select("*")
        .order("name", { ascending: true });

      if (ignore) return;

      if (error) {
        console.error("Failed to load companies:", error);
        setError(
          "Could not load companies. Check your Supabase connection."
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

  // --------------------------------------------------
  // EDIT COMPANY
  // --------------------------------------------------

  function startEdit(company) {
    setEditingId(company.id);

    setForm({
      name: company.name || "",
      sector: company.sector || "",
      hr_name: company.hr_name || "",
      hq_location: company.hq_location || "",
      hiring_status: company.hiring_status || "Active",
      city: company.city || "",
      hr_phone: company.hr_phone || "",
      hr_email: company.hr_email || "",
      website: company.website || "",
      gst_no: company.gst_no || "",
      industry: company.industry || "",
      sub_industry: company.sub_industry || "",
    });

    setShowHrForm(false);
    setHrForm(emptyHrForm);
    setShowForm(true);
  }

  function startAddCompany() {
    setEditingId(null);
    setForm(emptyForm);
    setShowHrForm(false);
    setHrForm(emptyHrForm);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);

    setShowHrForm(false);
    setHrForm(emptyHrForm);
  }

  // --------------------------------------------------
  // SAVE COMPANY
  // --------------------------------------------------

  async function handleSaveCompany(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Please enter company name.");
      return;
    }

    if (form.hr_email && !isValidEmail(form.hr_email)) {
      alert("Please enter a valid HR email address.");
      return;
    }

    setSaving(true);

    const companyData = {
      name: form.name.trim(),
      sector: form.sector.trim() || null,
      hr_name: form.hr_name.trim() || null,
      hq_location: form.hq_location.trim() || null,
      hiring_status: form.hiring_status || "Active",
      city: form.city.trim() || null,
      hr_phone: form.hr_phone || null,
      hr_email: form.hr_email.trim() || null,
      website: form.website.trim() || null,
      gst_no: form.gst_no.trim() || null,
      industry: form.industry.trim() || null,
      sub_industry: form.sub_industry.trim() || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("companies")
        .update(companyData)
        .eq("id", editingId);

      if (error) {
        console.error("Failed to update company:", error);
        alert(
          `Could not update company.\n\n${error.message || "Unknown error"}`
        );
      } else {
        cancelForm();
        await loadCompanies();
      }
    } else {
      const { error } = await supabase
        .from("companies")
        .insert([companyData]);

      if (error) {
        console.error("Failed to add company:", error);
        alert(
          `Could not add company.\n\n${error.message || "Unknown error"}`
        );
      } else {
        cancelForm();
        await loadCompanies();
      }
    }

    setSaving(false);
  }

  // --------------------------------------------------
  // DELETE COMPANY
  // --------------------------------------------------

  async function handleDeleteCompany(id, name) {
    const confirmed = window.confirm(
      `Delete "${name}"?\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete company:", error);

      alert(
        `Could not delete company.\n\n${error.message || "Unknown error"}`
      );
    } else {
      await loadCompanies();
    }
  }

  // --------------------------------------------------
  // OPEN ADD HR
  // --------------------------------------------------

  function openAddHr() {
    if (!editingId) {
      alert("Please save the company first before adding an HR.");
      return;
    }

    setHrForm({
      name: form.hr_name || "",
      title: "",
      phone: form.hr_phone || "",
      email: form.hr_email || "",
    });

    setShowHrForm(true);
  }

  function cancelAddHr() {
    setShowHrForm(false);
    setHrForm(emptyHrForm);
  }

  // --------------------------------------------------
  // SAVE HR
  // --------------------------------------------------

  async function handleAddHr(e) {
    e.preventDefault();

    if (!editingId) {
      alert("Company ID not found.");
      return;
    }

    if (!hrForm.name.trim()) {
      alert("Please enter HR name.");
      return;
    }

    if (hrForm.email && !isValidEmail(hrForm.email)) {
      alert("Please enter a valid HR email address.");
      return;
    }

    setSavingHr(true);

    /*
     * Update the company's current HR information.
     *
     * The Corporate Database UI no longer shows HR history.
     * The HR information is simply stored against the company.
     */
    const { error } = await supabase
      .from("companies")
      .update({
        hr_name: hrForm.name.trim(),
        hr_phone: hrForm.phone || null,
        hr_email: hrForm.email.trim() || null,
      })
      .eq("id", editingId);

    if (error) {
      console.error("Failed to save HR:", error);

      alert(
        `Could not save HR.\n\n${error.message || "Unknown error"}`
      );
    } else {
      setForm((prev) => ({
        ...prev,
        hr_name: hrForm.name.trim(),
        hr_phone: hrForm.phone || "",
        hr_email: hrForm.email.trim() || "",
      }));

      setShowHrForm(false);
      setHrForm(emptyHrForm);

      await loadCompanies();

      alert("HR added successfully.");
    }

    setSavingHr(false);
  }

  // --------------------------------------------------
  // EXCEL FILE SELECT
  // --------------------------------------------------

  function handleFileSelect(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setImportResult(null);

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, {
          type: "binary",
        });

        const firstSheetName = wb.SheetNames[0];

        if (!firstSheetName) {
          alert("No worksheet found in the Excel file.");
          return;
        }

        const sheet = wb.Sheets[firstSheetName];

        const rows = XLSX.utils.sheet_to_json(sheet, {
          defval: "",
        });

        const mapped = rows
          .map((r) => ({
            name:
              r.name ||
              r.Name ||
              r.Company ||
              r.company ||
              "",

            sector:
              r.sector ||
              r.Sector ||
              "",

            hr_name:
              r.hr_name ||
              r["HR Name"] ||
              r.hr ||
              "",

            hq_location:
              r.hq_location ||
              r["HQ Location"] ||
              r.hq ||
              "",

            hiring_status:
              r.hiring_status ||
              r["Hiring Status"] ||
              "Active",

            city:
              r.city ||
              r.City ||
              "",

            hr_phone:
              r.hr_phone ||
              r["HR Phone"] ||
              r["Mobile No"] ||
              r.mobile ||
              "",

            hr_email:
              r.hr_email ||
              r["HR Email"] ||
              r.email ||
              "",

            website:
              r.website ||
              r.Website ||
              "",

            gst_no:
              r.gst_no ||
              r["GST No"] ||
              r.GST ||
              "",

            industry:
              r.industry ||
              r.Industry ||
              "",

            sub_industry:
              r.sub_industry ||
              r["Sub Industry"] ||
              "",
          }))
          .filter((r) => r.name);

        setImportRows(mapped);
      } catch (err) {
        console.error("Excel read error:", err);
        alert("Could not read the Excel file.");
      }
    };

    reader.readAsBinaryString(file);
  }

  // --------------------------------------------------
  // CONFIRM EXCEL IMPORT
  // --------------------------------------------------

  async function handleConfirmImport() {
    if (!importRows || importRows.length === 0) return;

    setImporting(true);

    let success = 0;
    let failed = 0;

    /*
     * Batch insert instead of inserting one row at a time.
     * This is much faster for large Excel files.
     */
    const rowsToInsert = importRows.map((row) => ({
      name: row.name?.trim() || null,
      sector: row.sector?.trim() || null,
      hr_name: row.hr_name?.trim() || null,
      hq_location: row.hq_location?.trim() || null,
      hiring_status: row.hiring_status || "Active",
      city: row.city?.trim() || null,
      hr_phone: row.hr_phone || null,
      hr_email: row.hr_email?.trim() || null,
      website: row.website?.trim() || null,
      gst_no: row.gst_no?.trim() || null,
      industry: row.industry?.trim() || null,
      sub_industry: row.sub_industry?.trim() || null,
    }));

    /*
     * Insert in batches of 500.
     * This avoids request-size problems with very large Excel files.
     */
    const batchSize = 500;

    for (let i = 0; i < rowsToInsert.length; i += batchSize) {
      const batch = rowsToInsert.slice(i, i + batchSize);

      const { error } = await supabase
        .from("companies")
        .insert(batch);

      if (error) {
        console.error("Excel import batch failed:", error);
        failed += batch.length;
      } else {
        success += batch.length;
      }
    }

    setImporting(false);

    setImportResult({
      success,
      failed,
    });

    setImportRows(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    await loadCompanies();
  }

  // --------------------------------------------------
  // CANCEL IMPORT
  // --------------------------------------------------

  function cancelImport() {
    setImportRows(null);
    setImportResult(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="page active" id="page-corpdb">

      {/* ================================================
          PAGE HEADER
      ================================================= */}

      <div className="page-head">
        <div>
          <h1>Corporate Database</h1>

          <p>
            {loading
              ? "Loading…"
              : `${companies.length} active client companies`}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
          }}
        >
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />

          <button
            className="btn-outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Import Excel
          </button>

          <button
            className="btn-gold"
            onClick={() => {
              if (showForm) {
                cancelForm();
              } else {
                startAddCompany();
              }
            }}
          >
            {showForm ? "Cancel" : "+ Add Company"}
          </button>
        </div>
      </div>

      {/* ================================================
          ERROR
      ================================================= */}

      {error && (
        <div
          className="panel"
          style={{
            color: "crimson",
            marginBottom: 15,
          }}
        >
          {error}
        </div>
      )}

      {/* ================================================
          IMPORT RESULT
      ================================================= */}

      {importResult && (
        <div
          className="panel"
          style={{
            marginBottom: 15,
          }}
        >
          <p>
            Import done:{" "}
            <b>{importResult.success}</b> added,{" "}
            <b>{importResult.failed}</b> failed.
          </p>

          <button
            className="btn-outline"
            onClick={() => setImportResult(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ================================================
          EXCEL PREVIEW
      ================================================= */}

      {importRows && (
        <div
          className="panel"
          style={{
            marginBottom: 15,
          }}
        >
          <div className="panel-title">
            Preview — {importRows.length} rows found
          </div>

          <div
            style={{
              overflowX: "auto",
              marginTop: 10,
            }}
          >
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Sector</th>
                  <th>HR Name</th>
                  <th>HQ</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {importRows.slice(0, 10).map((r, i) => (
                  <tr key={i}>
                    <td>{r.name}</td>
                    <td>{r.sector || "—"}</td>
                    <td>{r.hr_name || "—"}</td>
                    <td>{r.hq_location || "—"}</td>
                    <td>{r.hiring_status || "Active"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {importRows.length > 10 && (
            <p>
              ...and {importRows.length - 10} more rows
            </p>
          )}

          <div
            style={{
              display: "flex",
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
                ? "Importing…"
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

      {/* ================================================
          ADD / EDIT COMPANY FORM
      ================================================= */}

      {showForm && (
        <div className="panel">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <div className="panel-title">
              {editingId
                ? "Edit Company"
                : "Add New Company"}
            </div>

            <button
              className="btn-outline"
              onClick={cancelForm}
            >
              ✕
            </button>
          </div>

          <form
            onSubmit={handleSaveCompany}
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: 12,
            }}
          >

            {/* COMPANY NAME */}

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

            {/* SECTOR */}

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

            {/* INDUSTRY */}

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

            {/* SUB INDUSTRY */}

            <input
              className="search-box"
              placeholder="Sub Industry"
              value={form.sub_industry}
              onChange={(e) =>
                setForm({
                  ...form,
                  sub_industry: e.target.value,
                })
              }
            />

            {/* CITY */}

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

            {/* HQ */}

            <input
              className="search-box"
              placeholder="HQ location"
              value={form.hq_location}
              onChange={(e) =>
                setForm({
                  ...form,
                  hq_location: e.target.value,
                })
              }
            />

            {/* HR NAME */}

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

            {/* HR PHONE */}

            <input
              className="search-box"
              placeholder="HR mobile no."
              value={form.hr_phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  hr_phone: sanitizePhone(
                    e.target.value
                  ),
                })
              }
              inputMode="numeric"
              maxLength={10}
            />

            {/* HR EMAIL */}

            <input
              className="search-box"
              placeholder="HR email ID"
              type="email"
              value={form.hr_email}
              onChange={(e) =>
                setForm({
                  ...form,
                  hr_email: e.target.value,
                })
              }
            />

            {/* WEBSITE */}

            <input
              className="search-box"
              placeholder="Website (https://...)"
              value={form.website}
              onChange={(e) =>
                setForm({
                  ...form,
                  website: e.target.value,
                })
              }
            />

            {/* GST */}

            <input
              className="search-box"
              placeholder="GST No."
              value={form.gst_no}
              onChange={(e) =>
                setForm({
                  ...form,
                  gst_no: e.target.value,
                })
              }
            />

            {/* STATUS */}

            <select
              className="search-box"
              value={form.hiring_status}
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

            {/* SAVE COMPANY */}

            <button
              className="btn-gold"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving…"
                : editingId
                ? "Update Company"
                : "Save Company"}
            </button>
          </form>

          {/* ============================================
              ADD HR BUTTON
          ============================================= */}

          {editingId && (
            <div
              style={{
                marginTop: 18,
                paddingTop: 16,
                borderTop:
                  "1px solid var(--border-default, #eee)",
              }}
            >
              <button
                type="button"
                className="btn-gold"
                onClick={openAddHr}
                style={{
                  padding: "8px 14px",
                }}
              >
                + Add HR
              </button>

              <span
                style={{
                  marginLeft: 10,
                  fontSize: 12,
                  color:
                    "var(--text-muted, #777)",
                }}
              >
                Add or update HR contact for this
                company
              </span>
            </div>
          )}

          {/* ============================================
              ADD HR FORM
          ============================================= */}

          {showHrForm && editingId && (
            <div
              style={{
                marginTop: 15,
                padding: 15,
                borderRadius: 10,
                border:
                  "1px solid var(--border-default, #ddd)",
                background:
                  "var(--bg-soft, #fafafa)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  Add HR Contact
                </div>

                <button
                  type="button"
                  className="btn-outline"
                  onClick={cancelAddHr}
                  style={{
                    padding: "4px 9px",
                    fontSize: 12,
                  }}
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={handleAddHr}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: 10,
                }}
              >
                {/* HR NAME */}

                <input
                  className="search-box"
                  placeholder="HR Name *"
                  required
                  value={hrForm.name}
                  onChange={(e) =>
                    setHrForm({
                      ...hrForm,
                      name: e.target.value,
                    })
                  }
                />

                {/* HR TITLE */}

                <input
                  className="search-box"
                  placeholder="Title (e.g. HR Manager)"
                  value={hrForm.title}
                  onChange={(e) =>
                    setHrForm({
                      ...hrForm,
                      title: e.target.value,
                    })
                  }
                />

                {/* PHONE */}

                <input
                  className="search-box"
                  placeholder="HR Phone"
                  value={hrForm.phone}
                  onChange={(e) =>
                    setHrForm({
                      ...hrForm,
                      phone: sanitizePhone(
                        e.target.value
                      ),
                    })
                  }
                  inputMode="numeric"
                  maxLength={10}
                />

                {/* EMAIL */}

                <input
                  className="search-box"
                  placeholder="HR Email"
                  type="email"
                  value={hrForm.email}
                  onChange={(e) =>
                    setHrForm({
                      ...hrForm,
                      email: e.target.value,
                    })
                  }
                />

                {/* BUTTONS */}

                <div
                  style={{
                    gridColumn: "1 / -1",
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <button
                    className="btn-gold"
                    type="submit"
                    disabled={savingHr}
                  >
                    {savingHr
                      ? "Saving…"
                      : "Save HR"}
                  </button>

                  <button
                    type="button"
                    className="btn-outline"
                    onClick={cancelAddHr}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ================================================
          COMPANY CARDS
      ================================================= */}

      <div className="grid3">
        {loading ? (
          <div className="panel">
            Loading…
          </div>
        ) : companies.length === 0 ? (
          <div className="panel">
            No companies found.
          </div>
        ) : (
          companies.map((c) => (
            <div
              className="panel"
              key={c.id}
            >
              <div
                className="jd-card"
                style={{
                  border: "none",
                  padding: 0,
                }}
              >
                {/* SECTOR */}

                <span className="co">
                  {c.sector || "—"}
                </span>

                {/* COMPANY */}

                <h3>{c.name}</h3>

                {/* LOCATION */}

                <div className="meta">
                  {c.city || c.hq_location
                    ? [
                        c.city,
                        c.hq_location,
                      ]
                        .filter(Boolean)
                        .join(", ")
                    : "—"}
                </div>

                {/* HR INFORMATION */}

                {(c.hr_name ||
                  c.hr_phone ||
                  c.hr_email) && (
                  <div
                    style={{
                      margin:
                        "10px 0 8px",
                      padding:
                        "9px 11px",
                      borderRadius: 8,
                      background:
                        "var(--bg-soft, #FAFAFC)",
                      border:
                        "1px solid var(--border-default, #eee)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color:
                          "var(--text-muted)",
                        textTransform:
                          "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      HR Contact
                    </div>

                    {c.hr_name && (
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        {c.hr_name}
                      </div>
                    )}

                    {c.hr_phone && (
                      <div
                        style={{
                          fontSize: 12,
                          color:
                            "var(--text-secondary)",
                        }}
                      >
                        📞 {c.hr_phone}
                      </div>
                    )}

                    {c.hr_email && (
                      <div
                        style={{
                          fontSize: 12,
                          color:
                            "var(--text-secondary)",
                        }}
                      >
                        ✉️ {c.hr_email}
                      </div>
                    )}
                  </div>
                )}

                {/* COMPANY DETAILS */}

                <div
                  style={{
                    display: "flex",
                    flexDirection:
                      "column",
                    gap: 3,
                    margin: "8px 0",
                    fontSize: 12.5,
                    color:
                      "var(--text-secondary)",
                  }}
                >
                  {/* WEBSITE */}

                  {c.website && (
                    <div>
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color:
                            "var(--primary)",
                        }}
                      >
                        Visit website ↗
                      </a>
                    </div>
                  )}

                  {/* INDUSTRY */}

                  {(c.industry ||
                    c.sub_industry) && (
                    <div>
                      Industry:{" "}
                      {[
                        c.industry,
                        c.sub_industry,
                      ]
                        .filter(Boolean)
                        .join(" / ")}
                    </div>
                  )}

                  {/* GST */}

                  {c.gst_no && (
                    <div>
                      GST: {c.gst_no}
                    </div>
                  )}
                </div>

                {/* HIRING STATUS */}

                <div className="skills">
                  <span>
                    Hiring:{" "}
                    {c.hiring_status ||
                      "—"}
                  </span>
                </div>

                {/* ACTION BUTTONS */}

                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    marginTop: 10,
                  }}
                >
                  <button
                    className="btn-outline"
                    style={{
                      padding:
                        "4px 10px",
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
                        "4px 10px",
                      fontSize: 12,
                      color: "crimson",
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
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}