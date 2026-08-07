import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';
import { sanitizePhone } from '../lib/phone';
import { isValidEmail } from '../lib/email';

const courses = [
  'All',
  'Engineering',
  'MBA',
  'BCA',
  'BSc IT',
  'MCA',
  'Pharmacy',
  'Law',
  'Commerce',
  'Arts',
  'Medical',
  'Polytechnic',
];

const statusColors = {
  Interested: {
    bg: '#0fae72',
    text: '#ffffff',
  },
  'Follow-up Due': {
    bg: '#f2b705',
    text: '#513c04',
  },
  'Not Interested': {
    bg: '#e5e7eb',
    text: '#4b5563',
  },
};

const VALID_STATUSES = [
  'Interested',
  'Follow-up Due',
  'Not Interested',
];

const emptyForm = {
  name: '',
  city: '',
  course: '',
  tpo: '',
  website: '',
  strength: '',
  last_contact: '',
  status: 'Interested',
};

const emptyCoordinatorForm = {
  name: '',
  phone: '',
  email: '',
};

export default function CampusDB() {
  const [activeCourse, setActiveCourse] = useState('All');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Status');

  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // College popup
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Excel import
  const [importRows, setImportRows] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const fileInputRef = useRef(null);

  // ---------------------------------------------------------
  // COORDINATOR STATE
  // ---------------------------------------------------------

  const [coordinatorsByCollege, setCoordinatorsByCollege] = useState({});

  const [showCoordinatorForm, setShowCoordinatorForm] =
    useState(false);

  const [coordForm, setCoordForm] = useState(
    emptyCoordinatorForm
  );

  const [loadingCoordinators, setLoadingCoordinators] =
    useState(false);

  const [savingCoordinator, setSavingCoordinator] =
    useState(false);

  // ---------------------------------------------------------
  // FETCH ALL COLLEGES
  // ---------------------------------------------------------

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

      if (error) {
        throw error;
      }

      allRows = allRows.concat(data ?? []);

      if (!data || data.length < pageSize) {
        break;
      }

      from += pageSize;
    }

    return allRows;
  }

  // ---------------------------------------------------------
  // LOAD COLLEGES
  // ---------------------------------------------------------

  async function loadColleges() {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAllColleges();
      setColleges(data);
    } catch (err) {
      console.error('Failed to load colleges:', err);

      setError(
        'Could not load colleges. Check your Supabase connection.'
      );
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
      } catch (err) {
        if (ignore) return;

        console.error(
          'Failed to load colleges:',
          err
        );

        setError(
          'Could not load colleges. Check your Supabase connection.'
        );
      }

      setLoading(false);
    }

    init();

    return () => {
      ignore = true;
    };
  }, []);

  // ---------------------------------------------------------
  // FILTER COLLEGES
  // ---------------------------------------------------------

  const filtered = colleges.filter((college) => {
    const courseValue = (
      college.course ?? ''
    )
      .toLowerCase()
      .trim();

    const coursesAvailableValue = (
      college.courses_available ?? ''
    ).toLowerCase();

    const activeCourseValue = activeCourse
      .toLowerCase()
      .trim();

    const matchCourse =
      activeCourse === 'All'
        ? true
        : courseValue.includes(activeCourseValue) ||
          coursesAvailableValue.includes(
            activeCourseValue
          );

    const q = search.toLowerCase().trim();

    const matchSearch =
      (college.name ?? '')
        .toLowerCase()
        .includes(q) ||
      (college.city ?? '')
        .toLowerCase()
        .includes(q) ||
      (college.tpo ?? '')
        .toLowerCase()
        .includes(q);

    const matchStatus =
      activeFilter === 'All Status' ||
      college.status === activeFilter;

    return (
      matchCourse &&
      matchSearch &&
      matchStatus
    );
  });

  // ---------------------------------------------------------
  // EDIT COLLEGE
  // ---------------------------------------------------------

  function startEdit(college) {
    setEditingId(college.id);

    setForm({
      name: college.name || '',
      city: college.city || '',
      course: college.course || '',
      tpo: college.tpo || '',
      website: college.website || '',
      strength: college.strength ?? '',
      last_contact:
        college.last_contact || '',
      status:
        college.status || 'Interested',
    });

    setShowCoordinatorForm(false);
    setCoordForm(emptyCoordinatorForm);

    setShowForm(true);

    // Load coordinators when editing
    loadCoordinators(college.id);
  }

  // ---------------------------------------------------------
  // ADD COLLEGE
  // ---------------------------------------------------------

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm);

    setShowCoordinatorForm(false);
    setCoordForm(emptyCoordinatorForm);

    setShowForm(true);
  }

  // ---------------------------------------------------------
  // CANCEL COLLEGE FORM
  // ---------------------------------------------------------

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);

    setForm(emptyForm);

    setShowCoordinatorForm(false);
    setCoordForm(emptyCoordinatorForm);
  }

  // ---------------------------------------------------------
  // SAVE / UPDATE COLLEGE
  // ---------------------------------------------------------

  async function handleSaveCollege(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert('Please enter college name.');
      return;
    }

    if (
      form.website &&
      !/^https?:\/\//i.test(form.website)
    ) {
      alert(
        'Website should start with http:// or https://'
      );
      return;
    }

    setSaving(true);

    const collegeData = {
      name: form.name.trim(),
      city: form.city.trim() || null,
      course: form.course || null,
      tpo: form.tpo.trim() || null,
      website:
        form.website.trim() || null,
      strength: form.strength
        ? parseInt(form.strength, 10)
        : null,
      last_contact:
        form.last_contact || null,
      status: form.status,
    };

    if (editingId) {
      const { error } = await supabase
        .from('colleges')
        .update(collegeData)
        .eq('id', editingId);

      if (error) {
        console.error(
          'Failed to update college:',
          error
        );

        alert(
          'Could not update college. Check console for details.'
        );
      } else {
        await loadColleges();
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from('colleges')
        .insert([collegeData]);

      if (error) {
        console.error(
          'Failed to add college:',
          error
        );

        alert(
          'Could not add college. Check console for details.'
        );
      } else {
        cancelForm();
        await loadColleges();
      }
    }

    setSaving(false);
  }

  // ---------------------------------------------------------
  // STATUS CHANGE
  // ---------------------------------------------------------

  async function handleStatusChange(
    id,
    newStatus
  ) {
    setColleges((prev) =>
      prev.map((college) =>
        college.id === id
          ? {
              ...college,
              status: newStatus,
            }
          : college
      )
    );

    const { error } = await supabase
      .from('colleges')
      .update({
        status: newStatus,
      })
      .eq('id', id);

    if (error) {
      console.error(
        'Failed to update status:',
        error
      );

      alert(
        'Could not update status. Check console for details.'
      );

      await loadColleges();
    }
  }

  // ---------------------------------------------------------
  // DELETE COLLEGE
  // ---------------------------------------------------------

  async function handleDeleteCollege(
    id,
    name
  ) {
    if (
      !window.confirm(
        `Delete "${name}"? This cannot be undone.`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from('colleges')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(
        'Failed to delete college:',
        error
      );

      alert(
        'Could not delete college. Check console for details.'
      );
    } else {
      await loadColleges();
    }
  }

  // ---------------------------------------------------------
  // NORMALIZE IMPORT STATUS
  // ---------------------------------------------------------

  function normalizeStatus(raw) {
    const trimmed = (raw || '')
      .toString()
      .trim();

    return VALID_STATUSES.includes(trimmed)
      ? trimmed
      : 'Interested';
  }

  // ---------------------------------------------------------
  // IMPORT EXCEL
  // ---------------------------------------------------------

  function handleFileSelect(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setImportResult(null);

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(
          evt.target.result,
          {
            type: 'binary',
          }
        );

        const firstSheetName =
          wb.SheetNames[0];

        if (!firstSheetName) {
          alert(
            'Excel file does not contain a sheet.'
          );
          return;
        }

        const sheet =
          wb.Sheets[firstSheetName];

        const rows =
          XLSX.utils.sheet_to_json(
            sheet,
            {
              defval: '',
            }
          );

        const mapped = rows
          .map((row) => ({
            name:
              row.name ||
              row.Name ||
              row.College ||
              row.college ||
              '',

            city:
              row.city ||
              row.City ||
              '',

            course:
              row.course ||
              row.Course ||
              '',

            tpo:
              row.tpo ||
              row.TPO ||
              row.Tpo ||
              '',

            strength:
              row.strength ||
              row.Strength ||
              '',

            status: normalizeStatus(
              row.status ||
                row.Status
            ),

            website:
              row.website ||
              row.Website ||
              '',

            institution_type:
              row.institution_type ||
              row['Institution Type'] ||
              '',

            courses_available:
              row.courses_available ||
              row['Courses Available'] ||
              '',
          }))
          .filter(
            (row) =>
              row.name &&
              row.name
                .toString()
                .trim()
          );

        if (mapped.length === 0) {
          alert(
            'No valid college rows found in the Excel file.'
          );
          return;
        }

        setImportRows(mapped);
      } catch (err) {
        console.error(
          'Failed to read Excel file:',
          err
        );

        alert(
          'Could not read Excel file. Please check the file format.'
        );
      }
    };

    reader.readAsBinaryString(file);
  }

  // ---------------------------------------------------------
  // CONFIRM IMPORT
  // ---------------------------------------------------------

  async function handleConfirmImport() {
    if (
      !importRows ||
      importRows.length === 0
    ) {
      return;
    }

    setImporting(true);

    let success = 0;
    let failed = 0;

    const firstErrors = [];

    const records = importRows.map(
      (row) => ({
        name: row.name
          ? row.name
              .toString()
              .trim()
          : null,

        city: row.city
          ? row.city
              .toString()
              .trim()
          : null,

        course: row.course
          ? row.course
              .toString()
              .trim()
          : null,

        tpo: row.tpo
          ? row.tpo
              .toString()
              .trim()
          : null,

        strength: row.strength
          ? parseInt(
              row.strength,
              10
            )
          : null,

        status:
          row.status ||
          'Interested',

        website: row.website
          ? row.website
              .toString()
              .trim()
          : null,

        institution_type:
          row.institution_type
            ? row.institution_type
                .toString()
                .trim()
            : null,

        courses_available:
          row.courses_available
            ? row.courses_available
                .toString()
                .trim()
            : null,
      })
    );

    // Import in chunks
    const chunkSize = 500;

    for (
      let i = 0;
      i < records.length;
      i += chunkSize
    ) {
      const chunk = records.slice(
        i,
        i + chunkSize
      );

      const { error } =
        await supabase
          .from('colleges')
          .insert(chunk);

      if (error) {
        failed += chunk.length;

        if (
          firstErrors.length < 3
        ) {
          firstErrors.push(
            error.message
          );
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
      fileInputRef.current.value =
        '';
    }

    await loadColleges();
  }

  // ---------------------------------------------------------
  // CANCEL IMPORT
  // ---------------------------------------------------------

  function cancelImport() {
    setImportRows(null);
    setImportResult(null);

    if (fileInputRef.current) {
      fileInputRef.current.value =
        '';
    }
  }

  // =========================================================
  // COORDINATORS
  // =========================================================

  // ---------------------------------------------------------
  // LOAD COORDINATORS
  // ---------------------------------------------------------

  async function loadCoordinators(
    collegeId
  ) {
    if (!collegeId) return;

    setLoadingCoordinators(true);

    const { data, error } =
      await supabase
        .from(
          'placement_coordinators'
        )
        .select('*')
        .eq(
          'college_id',
          collegeId
        )
        .order(
          'is_current',
          {
            ascending: false,
          }
        )
        .order(
          'created_at',
          {
            ascending: false,
          }
        );

    if (error) {
      console.error(
        'Failed to load coordinators:',
        error
      );

      alert(
        'Could not load coordinators. Check console for details.'
      );
    } else {
      setCoordinatorsByCollege(
        (prev) => ({
          ...prev,
          [collegeId]:
            data ?? [],
        })
      );
    }

    setLoadingCoordinators(false);
  }

  // ---------------------------------------------------------
  // OPEN ADD COORDINATOR
  // ---------------------------------------------------------

  function openAddCoordinator() {
    setCoordForm(
      emptyCoordinatorForm
    );

    setShowCoordinatorForm(true);
  }

  // ---------------------------------------------------------
  // CANCEL ADD COORDINATOR
  // ---------------------------------------------------------

  function cancelAddCoordinator() {
    setShowCoordinatorForm(false);

    setCoordForm(
      emptyCoordinatorForm
    );
  }

  // ---------------------------------------------------------
  // ADD COORDINATOR
  // ---------------------------------------------------------

  async function handleAddCoordinator(
    e
  ) {
    e.preventDefault();

    if (!editingId) {
      alert(
        'Please save the college first before adding a coordinator.'
      );
      return;
    }

    if (
      !coordForm.name.trim()
    ) {
      alert(
        'Please enter coordinator name.'
      );
      return;
    }

    if (
      coordForm.email &&
      !isValidEmail(
        coordForm.email
      )
    ) {
      alert(
        'Please enter a valid coordinator email address.'
      );
      return;
    }

    setSavingCoordinator(true);

    // Archive current coordinator
    const {
      error: archiveError,
    } = await supabase
      .from(
        'placement_coordinators'
      )
      .update({
        is_current: false,
        ended_at:
          new Date().toISOString(),
      })
      .eq(
        'college_id',
        editingId
      )
      .eq(
        'is_current',
        true
      );

    if (archiveError) {
      console.error(
        'Failed to archive previous coordinator:',
        archiveError
      );

      alert(
        'Could not update previous coordinator. Check console for details.'
      );

      setSavingCoordinator(false);
      return;
    }

    // Add new current coordinator
    const {
      error: insertError,
    } = await supabase
      .from(
        'placement_coordinators'
      )
      .insert([
        {
          college_id:
            editingId,

          name:
            coordForm.name
              .trim(),

          phone:
            coordForm.phone ||
            null,

          email:
            coordForm.email
              ? coordForm.email
                  .trim()
              : null,

          is_current: true,
        },
      ]);

    if (insertError) {
      console.error(
        'Failed to add coordinator:',
        insertError
      );

      alert(
        'Could not add coordinator. Check console for details.'
      );

      setSavingCoordinator(false);
      return;
    }

    // Also update college TPO fields
    // so existing application code can still use colleges.tpo.
    await supabase
      .from('colleges')
      .update({
        tpo:
          coordForm.name
            .trim(),
      })
      .eq(
        'id',
        editingId
      );

    setCoordForm(
      emptyCoordinatorForm
    );

    setShowCoordinatorForm(false);

    await Promise.all([
      loadCoordinators(
        editingId
      ),
      loadColleges(),
    ]);

    setSavingCoordinator(false);
  }

  // ---------------------------------------------------------
  // MARK COORDINATOR AS LEFT
  // ---------------------------------------------------------

  async function handleRetireCoordinator(
    coordinator
  ) {
    if (
      !window.confirm(
        `Mark "${coordinator.name}" as no longer the current coordinator?`
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from(
          'placement_coordinators'
        )
        .update({
          is_current: false,
          ended_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          coordinator.id
        );

    if (error) {
      console.error(
        'Failed to retire coordinator:',
        error
      );

      alert(
        'Could not update coordinator. Check console for details.'
      );
    } else {
      await loadCoordinators(
        coordinator.college_id
      );
    }
  }

  // ---------------------------------------------------------
  // DELETE COORDINATOR
  // ---------------------------------------------------------

  async function handleDeleteCoordinator(
    coordinator
  ) {
    if (
      !window.confirm(
        `Permanently delete "${coordinator.name}" from records? This cannot be undone.`
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from(
          'placement_coordinators'
        )
        .delete()
        .eq(
          'id',
          coordinator.id
        );

    if (error) {
      console.error(
        'Failed to delete coordinator:',
        error
      );

      alert(
        'Could not delete coordinator. Check console for details.'
      );
    } else {
      await loadCoordinators(
        coordinator.college_id
      );
    }
  }

  // ---------------------------------------------------------
  // CURRENT COLLEGE COORDINATORS
  // ---------------------------------------------------------

  const currentCoordinators =
    editingId
      ? (
          coordinatorsByCollege[
            editingId
          ] ?? []
        )
      : [];

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      className="page active"
      id="page-campusdb"
    >
      {/* =====================================================
          HEADER
         ===================================================== */}

      <div className="page-head">
        <div>
          <h1>
            Campus Database
          </h1>

          <p>
            {loading
              ? 'Loading…'
              : `${colleges.length} colleges`}
            {' · '}
            filter by course, city or status
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
            style={{
              display: 'none',
            }}
            onChange={
              handleFileSelect
            }
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
            + Add College
          </button>
        </div>
      </div>

      {/* =====================================================
          ERROR
         ===================================================== */}

      {error && (
        <div
          className="panel"
          style={{
            color: 'crimson',
          }}
        >
          {error}
        </div>
      )}

      {/* =====================================================
          IMPORT RESULT
         ===================================================== */}

      {importResult && (
        <div className="panel">
          <p>
            Import done:{' '}
            <b>
              {importResult.success}
            </b>{' '}
            added,{' '}
            <b>
              {importResult.failed}
            </b>{' '}
            failed.
          </p>

          {importResult.failed >
            0 &&
            importResult.firstErrors
              ?.length > 0 && (
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
                    (
                      message,
                      index
                    ) => (
                      <li
                        key={
                          index
                        }
                      >
                        {message}
                      </li>
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

      {/* =====================================================
          IMPORT PREVIEW
         ===================================================== */}

      {importRows && (
        <div className="panel">
          <div className="panel-title">
            Preview —{' '}
            {importRows.length}{' '}
            rows found
          </div>

          <table>
            <tbody>
              <tr>
                <th>
                  Name
                </th>
                <th>
                  City
                </th>
                <th>
                  Course
                </th>
                <th>
                  TPO
                </th>
                <th>
                  Strength
                </th>
                <th>
                  Status
                </th>
              </tr>

              {importRows
                .slice(0, 10)
                .map(
                  (
                    row,
                    index
                  ) => (
                    <tr
                      key={
                        index
                      }
                    >
                      <td>
                        {row.name}
                      </td>

                      <td>
                        {row.city}
                      </td>

                      <td>
                        {row.course}
                      </td>

                      <td>
                        {row.tpo}
                      </td>

                      <td>
                        {row.strength}
                      </td>

                      <td>
                        {row.status}
                      </td>
                    </tr>
                  )
                )}
            </tbody>
          </table>

          {importRows.length >
            10 && (
            <p>
              ...
              {importRows.length -
                10}{' '}
              more rows
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
              onClick={
                handleConfirmImport
              }
              disabled={
                importing
              }
            >
              {importing
                ? 'Importing…'
                : `Import ${importRows.length} Colleges`}
            </button>

            <button
              className="btn-outline"
              onClick={
                cancelImport
              }
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          FILTER PANEL
         ===================================================== */}

      <div className="panel">
        <div>
          {courses.map(
            (course) => (
              <span
                key={course}
                className={`course-chip ${
                  activeCourse ===
                  course
                    ? 'sel'
                    : ''
                }`}
                onClick={() =>
                  setActiveCourse(
                    course
                  )
                }
              >
                {course}
              </span>
            )
          )}
        </div>

        <div
          className="toolbar"
          style={{
            marginTop: 16,
          }}
        >
          <input
            className="search-box"
            placeholder="Search college, city, TPO..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

          {[
            'All Status',
            'Interested',
            'Follow-up Due',
            'Not Interested',
          ].map(
            (filter) => (
              <span
                key={filter}
                className={`filter-chip ${
                  activeFilter ===
                  filter
                    ? 'sel'
                    : ''
                }`}
                onClick={() =>
                  setActiveFilter(
                    filter
                  )
                }
              >
                {filter}
              </span>
            )
          )}
        </div>

        {/* ===================================================
            CAMPUS TABLE
            COUNTRY REMOVED
           =================================================== */}

        <div
          style={{
            overflowX: 'auto',
          }}
        >
          <table>
            <tbody>
              <tr>
                <th>
                  College
                </th>

                <th>
                  Institution Type
                </th>

                <th>
                  City
                </th>

                <th>
                  Website
                </th>

                <th>
                  Courses Available
                </th>

                <th>
                  Status
                </th>

                <th>
                  Actions
                </th>
              </tr>

              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign:
                        'center',
                      padding: 24,
                    }}
                  >
                    Loading…
                  </td>
                </tr>
              ) : filtered.length >
                0 ? (
                filtered.map(
                  (college) => (
                    <tr
                      key={
                        college.id
                      }
                    >
                      <td>
                        {college.name}
                      </td>

                      <td
                        style={{
                          fontSize: 12,
                          color:
                            'var(--text-muted)',
                        }}
                      >
                        {college.institution_type ||
                          '—'}
                      </td>

                      <td>
                        {college.city ??
                          '—'}
                      </td>

                      <td>
                        {college.website ? (
                          <a
                            href={
                              college.website
                            }
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

                      <td
                        style={{
                          maxWidth: 260,
                          fontSize: 11.5,
                          color:
                            'var(--text-muted)',
                        }}
                        title={
                          college.courses_available ||
                          ''
                        }
                      >
                        {college.courses_available
                          ? college
                              .courses_available
                              .length >
                            60
                            ? college.courses_available.slice(
                                0,
                                60
                              ) +
                              '…'
                            : college.courses_available
                          : '—'}
                      </td>

                      {/* STATUS */}

                      <td>
                        <div
                          style={{
                            position:
                              'relative',
                            display:
                              'inline-block',
                          }}
                        >
                          <select
                            value={
                              college.status ||
                              'Interested'
                            }
                            onChange={(
                              e
                            ) =>
                              handleStatusChange(
                                college.id,
                                e.target
                                  .value
                              )
                            }
                            onClick={(
                              e
                            ) =>
                              e.stopPropagation()
                            }
                            style={{
                              border:
                                'none',
                              outline:
                                'none',
                              boxShadow:
                                'none',
                              cursor:
                                'pointer',
                              fontWeight:
                                600,
                              fontSize:
                                11.5,
                              appearance:
                                'none',
                              WebkitAppearance:
                                'none',
                              MozAppearance:
                                'none',
                              borderRadius:
                                999,
                              padding:
                                '3px 16px 3px 8px',
                              lineHeight:
                                1.3,
                              backgroundColor:
                                statusColors[
                                  college
                                    .status
                                ]?.bg ??
                                statusColors
                                  .Interested
                                  .bg,
                              color:
                                statusColors[
                                  college
                                    .status
                                ]?.text ??
                                statusColors
                                  .Interested
                                  .text,
                            }}
                          >
                            <option value="Interested">
                              Interested
                            </option>

                            <option value="Follow-up Due">
                              Follow-up Due
                            </option>

                            <option value="Not Interested">
                              Not Interested
                            </option>
                          </select>

                          <span
                            style={{
                              position:
                                'absolute',
                              right: 5,
                              top: '50%',
                              transform:
                                'translateY(-55%)',
                              pointerEvents:
                                'none',
                              fontSize: 9,
                              lineHeight:
                                1,
                              opacity:
                                0.85,
                            }}
                          >
                            ▼
                          </span>
                        </div>
                      </td>

                      {/* ACTIONS */}

                      <td>
                        <div
                          style={{
                            display:
                              'flex',
                            gap: 6,
                            flexWrap:
                              'wrap',
                          }}
                        >
                          <button
                            className="btn-outline"
                            style={{
                              padding:
                                '4px 10px',
                              fontSize:
                                12,
                            }}
                            onClick={() =>
                              startEdit(
                                college
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="btn-outline"
                            style={{
                              padding:
                                '4px 10px',
                              fontSize:
                                12,
                              color:
                                'crimson',
                            }}
                            onClick={() =>
                              handleDeleteCollege(
                                college.id,
                                college.name
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign:
                        'center',
                      color:
                        'var(--slate-light)',
                      padding: 24,
                    }}
                  >
                    No colleges found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          ADD / EDIT COLLEGE POPUP
         ===================================================== */}

      {showForm && (
        <div
          onClick={cancelForm}
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
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
              maxHeight:
                '90vh',
              overflowY:
                'auto',
            }}
          >
            {/* POPUP HEADER */}

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
                marginBottom: 4,
              }}
            >
              <div
                className="panel-title"
                style={{
                  margin: 0,
                }}
              >
                {editingId
                  ? 'Edit College'
                  : 'Add New College'}
              </div>

              <button
                type="button"
                onClick={
                  cancelForm
                }
                style={{
                  background:
                    'none',
                  border:
                    'none',
                  fontSize:
                    20,
                  cursor:
                    'pointer',
                  color:
                    'var(--text-muted)',
                }}
              >
                ✕
              </button>
            </div>

            {/* =================================================
                COLLEGE FORM
               ================================================= */}

            <form
              onSubmit={
                handleSaveCollege
              }
              style={{
                display:
                  'grid',
                gridTemplateColumns:
                  '1fr 1fr',
                gap: 12,
                marginTop:
                  16,
              }}
            >
              <input
                className="search-box"
                placeholder="College name"
                required
                value={
                  form.name
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    name:
                      e.target
                        .value,
                  })
                }
              />

              <input
                className="search-box"
                placeholder="City"
                value={
                  form.city
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    city:
                      e.target
                        .value,
                  })
                }
              />

              <select
                className="search-box"
                value={
                  form.course
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    course:
                      e.target
                        .value,
                  })
                }
              >
                <option value="">
                  — No course —
                </option>

                {courses
                  .filter(
                    (course) =>
                      course !==
                      'All'
                  )
                  .map(
                    (
                      course
                    ) => (
                      <option
                        key={
                          course
                        }
                        value={
                          course
                        }
                      >
                        {
                          course
                        }
                      </option>
                    )
                  )}
              </select>

              <input
                className="search-box"
                placeholder="TPO name"
                value={
                  form.tpo
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    tpo:
                      e.target
                        .value,
                  })
                }
              />

              <input
                className="search-box"
                placeholder="Website (https://...)"
                value={
                  form.website
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    website:
                      e.target
                        .value,
                  })
                }
              />

              <input
                className="search-box"
                placeholder="Strength"
                type="number"
                min="0"
                value={
                  form.strength
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    strength:
                      e.target
                        .value,
                  })
                }
              />

              <input
                className="search-box"
                type="date"
                value={
                  form.last_contact
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    last_contact:
                      e.target
                        .value,
                  })
                }
              />

              <select
                className="search-box"
                value={
                  form.status
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    status:
                      e.target
                        .value,
                  })
                }
              >
                <option value="Interested">
                  Interested
                </option>

                <option value="Follow-up Due">
                  Follow-up Due
                </option>

                <option value="Not Interested">
                  Not Interested
                </option>
              </select>

              <div
                style={{
                  gridColumn:
                    '1 / -1',
                  display:
                    'flex',
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <button
                  className="btn-gold"
                  type="submit"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? 'Saving…'
                    : editingId
                    ? 'Update College'
                    : 'Save College'}
                </button>

                <button
                  className="btn-outline"
                  type="button"
                  onClick={
                    cancelForm
                  }
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* =================================================
                COORDINATOR SECTION
                ONLY IN EDIT POPUP
               ================================================= */}

            {editingId && (
              <div
                style={{
                  marginTop: 22,
                  borderTop:
                    '1px solid var(--border-default, #eee)',
                  paddingTop: 18,
                }}
              >
                <div
                  style={{
                    display:
                      'flex',
                    justifyContent:
                      'space-between',
                    alignItems:
                      'center',
                    marginBottom:
                      12,
                  }}
                >
                  <div>
                    <div
                      className="panel-title"
                      style={{
                        margin: 0,
                        fontSize:
                          15,
                      }}
                    >
                      Placement Coordinators
                    </div>

                    <div
                      style={{
                        fontSize:
                          12,
                        color:
                          'var(--text-muted)',
                        marginTop:
                          3,
                      }}
                    >
                      Manage current and previous coordinators
                    </div>
                  </div>

                  {!showCoordinatorForm && (
                    <button
                      type="button"
                      className="btn-gold"
                      onClick={
                        openAddCoordinator
                      }
                      style={{
                        padding:
                          '6px 12px',
                        fontSize:
                          12,
                      }}
                    >
                      + Add Coordinator
                    </button>
                  )}
                </div>

                {/* ADD COORDINATOR FORM */}

                {showCoordinatorForm && (
                  <form
                    onSubmit={
                      handleAddCoordinator
                    }
                    style={{
                      padding:
                        12,
                      border:
                        '1px dashed var(--border-default, #ddd)',
                      borderRadius:
                        8,
                      marginBottom:
                        14,
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          12,
                        fontWeight:
                          700,
                        marginBottom:
                          10,
                      }}
                    >
                      Add New Coordinator
                    </div>

                    <div
                      style={{
                        display:
                          'grid',
                        gridTemplateColumns:
                          '1fr 1fr',
                        gap: 8,
                      }}
                    >
                      <input
                        className="search-box"
                        placeholder="Coordinator Name *"
                        required
                        value={
                          coordForm.name
                        }
                        onChange={(
                          e
                        ) =>
                          setCoordForm(
                            {
                              ...coordForm,
                              name:
                                e.target
                                  .value,
                            }
                          )
                        }
                      />

                      <input
                        className="search-box"
                        placeholder="Phone"
                        value={
                          coordForm.phone
                        }
                        onChange={(
                          e
                        ) =>
                          setCoordForm(
                            {
                              ...coordForm,
                              phone:
                                sanitizePhone(
                                  e.target
                                    .value
                                ),
                            }
                          )
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
                        value={
                          coordForm.email
                        }
                        onChange={(
                          e
                        ) =>
                          setCoordForm(
                            {
                              ...coordForm,
                              email:
                                e.target
                                  .value,
                            }
                          )
                        }
                      />

                      <div
                        style={{
                          display:
                            'flex',
                          gap: 8,
                          alignItems:
                            'center',
                        }}
                      >
                        <button
                          className="btn-gold"
                          type="submit"
                          disabled={
                            savingCoordinator
                          }
                          style={{
                            padding:
                              '6px 12px',
                            fontSize:
                              12,
                          }}
                        >
                          {savingCoordinator
                            ? 'Saving…'
                            : 'Save Coordinator'}
                        </button>

                        <button
                          type="button"
                          className="btn-outline"
                          onClick={
                            cancelAddCoordinator
                          }
                          style={{
                            padding:
                              '6px 12px',
                            fontSize:
                              12,
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* COORDINATOR LIST */}

                {loadingCoordinators ? (
                  <div
                    style={{
                      fontSize:
                        13,
                      color:
                        'var(--text-muted)',
                    }}
                  >
                    Loading coordinators…
                  </div>
                ) : currentCoordinators.length ===
                  0 ? (
                  <div
                    style={{
                      padding:
                        12,
                      background:
                        'var(--bg-soft, #FAFAFC)',
                      border:
                        '1px solid var(--border-default, #eee)',
                      borderRadius:
                        8,
                      fontSize:
                        12.5,
                      color:
                        'var(--text-muted)',
                    }}
                  >
                    No coordinators added yet.
                    Click{' '}
                    <b>
                      + Add Coordinator
                    </b>{' '}
                    to add one.
                  </div>
                ) : (
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
                            Phone
                          </th>

                          <th>
                            Email
                          </th>

                          <th>
                            Status
                          </th>

                          <th>
                            Actions
                          </th>
                        </tr>

                        {currentCoordinators.map(
                          (
                            coordinator
                          ) => (
                            <tr
                              key={
                                coordinator.id
                              }
                            >
                              <td>
                                <b>
                                  {
                                    coordinator.name
                                  }
                                </b>
                              </td>

                              <td>
                                {coordinator.phone ||
                                  '—'}
                              </td>

                              <td>
                                {coordinator.email ||
                                  '—'}
                              </td>

                              <td>
                                {coordinator.is_current ? (
                                  <span
                                    className="badge green"
                                  >
                                    Current
                                  </span>
                                ) : (
                                  <span
                                    className="badge gray"
                                  >
                                    Past
                                  </span>
                                )}
                              </td>

                              <td>
                                <div
                                  style={{
                                    display:
                                      'flex',
                                    gap: 6,
                                    flexWrap:
                                      'wrap',
                                  }}
                                >
                                  {coordinator.is_current && (
                                    <button
                                      type="button"
                                      className="btn-outline"
                                      style={{
                                        padding:
                                          '3px 8px',
                                        fontSize:
                                          11.5,
                                      }}
                                      onClick={() =>
                                        handleRetireCoordinator(
                                          coordinator
                                        )
                                      }
                                    >
                                      Mark as Left
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    className="btn-outline"
                                    style={{
                                      padding:
                                        '3px 8px',
                                      fontSize:
                                        11.5,
                                      color:
                                        'crimson',
                                    }}
                                    onClick={() =>
                                      handleDeleteCoordinator(
                                        coordinator
                                      )
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}