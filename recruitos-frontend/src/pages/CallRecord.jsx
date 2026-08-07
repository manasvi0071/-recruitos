import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Plus,
  Search,
  Calendar,
  Clock,
  Building2,
  User,
  X,
  Pencil,
  Trash2,
  PhoneCall,
  PhoneMissed,
  CalendarClock,
} from "lucide-react";

/**
 * CallRecord.jsx
 * -----------------------------------------------------------------------
 * Call Records / Communication CRM module for RecruitOS-style dashboards.
 *
 * This file is self-contained and uses local React state so it can be
 * dropped in and previewed immediately. Swap the four functions marked
 * "// SUPABASE:" for real Supabase calls to wire up persistence — the
 * shape of the data and the CRUD surface (fetchCalls / createCall /
 * updateCall / deleteCall) is already lined up with the `call_records`
 * table described in the brief.
 * -----------------------------------------------------------------------
 */

const ENTITY_TYPES = ["College", "Company", "Candidate"];
const STATUSES = ["Completed", "Follow Up", "Not Interested"];

const STATUS_STYLES = {
  Completed: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  "Follow Up": "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  "Not Interested": "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
};

const ENTITY_STYLES = {
  College: "bg-[#EEEDFE] text-[#3C3489]",
  Company: "bg-[#E6F1FB] text-[#0C447C]",
  Candidate: "bg-[#FBEAF0] text-[#72243E]",
};

const SEED_DATA = [
  {
    id: "1",
    contact_name: "Rahul Sharma",
    organization: "MIT College Pune",
    phone: "9876543210",
    entity_type: "College",
    call_date: "2026-08-07",
    duration: "05:20 mins",
    status: "Completed",
    notes: "Discussed campus placement drive and shared available student profiles.",
  },
  {
    id: "2",
    contact_name: "Priya Patil",
    organization: "TCS",
    phone: "9123456780",
    entity_type: "Company",
    call_date: "2026-08-07",
    duration: "03:10 mins",
    status: "Follow Up",
    notes: "Awaiting confirmation on JD for SDE-1 role.",
  },
  {
    id: "3",
    contact_name: "Amit Deshmukh",
    organization: "VIT",
    phone: "9988776655",
    entity_type: "College",
    call_date: "2026-08-06",
    duration: "07:45 mins",
    status: "Completed",
    notes: "Finalized drive date for last week of August.",
  },
  {
    id: "4",
    contact_name: "Sneha Kulkarni",
    organization: "Infosys",
    phone: "9012345678",
    entity_type: "Company",
    call_date: "2026-08-05",
    duration: "02:05 mins",
    status: "Not Interested",
    notes: "No open roles for this quarter.",
  },
];

const emptyForm = {
  contact_name: "",
  organization: "",
  phone: "",
  entity_type: "College",
  call_date: new Date().toISOString().slice(0, 10),
  duration: "",
  status: "Completed",
  notes: "",
};

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function StatCard({ label, value, barClass }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className={`absolute inset-x-0 top-0 h-1.5 ${barClass}`} />
      <div className="px-6 py-5">
        <p className="font-serif text-3xl font-bold text-[#3C3489]">{value}</p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </p>
      </div>
    </div>
  );
}

export default function CallRecord() {
  const [calls, setCalls] = useState(SEED_DATA);
  const [query, setQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  // SUPABASE: replace with `supabase.from('call_records').select('*').order('call_date', { ascending: false })`
  const fetchCalls = async () => calls;

  // SUPABASE: replace with `supabase.from('call_records').insert([payload])`
  const createCall = async (payload) => {
    setCalls((prev) => [{ ...payload, id: crypto.randomUUID() }, ...prev]);
  };

  // SUPABASE: replace with `supabase.from('call_records').update(payload).eq('id', id)`
  const updateCall = async (id, payload) => {
    setCalls((prev) => prev.map((c) => (c.id === id ? { ...c, ...payload } : c)));
  };

  // SUPABASE: replace with `supabase.from('call_records').delete().eq('id', id)`
  const deleteCall = async (id) => {
    setCalls((prev) => prev.filter((c) => c.id !== id));
  };

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: calls.length,
      completed: calls.filter((c) => c.status === "Completed").length,
      followUp: calls.filter((c) => c.status === "Follow Up").length,
      today: calls.filter((c) => c.call_date === today).length,
    };
  }, [calls]);

  const filtered = useMemo(() => {
    return calls.filter((c) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        c.contact_name.toLowerCase().includes(q) ||
        c.organization.toLowerCase().includes(q) ||
        c.phone.includes(q);
      const matchesEntity = entityFilter === "All" || c.entity_type === entityFilter;
      const matchesStatus = statusFilter === "All" || c.status === statusFilter;
      return matchesQuery && matchesEntity && matchesStatus;
    });
  }, [calls, query, entityFilter, statusFilter]);

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingId(record.id);
    setForm({
      contact_name: record.contact_name,
      organization: record.organization,
      phone: record.phone,
      entity_type: record.entity_type,
      call_date: record.call_date,
      duration: record.duration,
      status: record.status,
      notes: record.notes || "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.contact_name || !form.organization || !form.phone || !form.entity_type) return;
    setLoading(true);
    try {
      if (editingId) {
        await updateCall(editingId, form);
      } else {
        await createCall(form);
      }
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    await deleteCall(id);
  }

  return (
    <div className="min-h-screen w-full bg-[#F1EEFA] p-6 lg:p-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#2B2350]">Call Records</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track every call with colleges, companies and candidates
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#DB2777] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 transition hover:opacity-90"
        >
          <Plus size={16} />
          Add Call Record
        </button>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Calls" value={stats.total} barClass="bg-gradient-to-r from-[#38BDF8] to-[#22D3EE]" />
        <StatCard label="Completed Calls" value={stats.completed} barClass="bg-gradient-to-r from-[#F472B6] to-[#FB923C]" />
        <StatCard label="Follow Ups Pending" value={stats.followUp} barClass="bg-gradient-to-r from-[#A855F7] to-[#EC4899]" />
        <StatCard label="Today's Calls" value={stats.today} barClass="bg-gradient-to-r from-[#2DD4BF] to-[#22D3EE]" />
      </div>

      {/* Search + filters */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, organization or phone number"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
          />
        </div>
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#7C3AED]"
        >
          <option value="All">All entity types</option>
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#7C3AED]"
        >
          <option value="All">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EEEDFE]">
              <PhoneMissed className="text-[#7C3AED]" size={26} />
            </div>
            <p className="text-sm font-medium text-gray-600">No call records found</p>
            <button
              onClick={openAddModal}
              className="mt-1 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#DB2777] px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus size={15} />
              Add your first call
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3 font-semibold">S.No</th>
                  <th className="px-5 py-3 font-semibold">Contact Person</th>
                  <th className="px-5 py-3 font-semibold">Organization</th>
                  <th className="px-5 py-3 font-semibold">Phone Number</th>
                  <th className="px-5 py-3 font-semibold">Entity Type</th>
                  <th className="px-5 py-3 font-semibold">Call Date</th>
                  <th className="px-5 py-3 font-semibold">Duration</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-[#FAF9FE]">
                    <td className="px-5 py-3.5 text-gray-400">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 font-medium text-gray-800">
                        <User size={14} className="text-gray-400" />
                        {c.contact_name}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-gray-400" />
                        {c.organization}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-400" />
                        {c.phone}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ENTITY_STYLES[c.entity_type]}`}>
                        {c.entity_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(c.call_date)}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        {c.duration || "—"}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(c)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#7C3AED]"
                          aria-label="Edit call record"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-500"
                          aria-label="Delete call record"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <PhoneCall size={18} className="text-[#7C3AED]" />
                  <h2 className="font-serif text-lg font-bold text-[#2B2350]">
                    {editingId ? "Edit Call Record" : "Add Call Record"}
                  </h2>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">Contact Person *</label>
                  <input
                    value={form.contact_name}
                    onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">Organization *</label>
                  <input
                    value={form.organization}
                    onChange={(e) => setForm({ ...form, organization: e.target.value })}
                    placeholder="e.g. MIT College Pune"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">Phone Number *</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-500">Entity Type *</label>
                    <select
                      value={form.entity_type}
                      onChange={(e) => setForm({ ...form, entity_type: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED]"
                    >
                      {ENTITY_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-500">Call Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED]"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-500">Call Date</label>
                    <input
                      type="date"
                      value={form.call_date}
                      onChange={(e) => setForm({ ...form, call_date: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-500">Call Duration</label>
                    <input
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      placeholder="e.g. 05:20 mins"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    placeholder="Discussed campus placement drive and shared available student profiles"
                    className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#DB2777] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <CalendarClock size={15} />
                  {loading ? "Saving..." : "Save Call Record"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}