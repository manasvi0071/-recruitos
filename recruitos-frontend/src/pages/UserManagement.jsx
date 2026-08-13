import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const ROLES = ["admin", "recruiter", "candidate", "corporate"];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState(null);
  const [pendingRole, setPendingRole] = useState({});
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id);
    });
  }, []);

  const load = useCallback(async () => {
    if (!userId) return;
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/auth/users`,
      { headers: { "x-user-id": userId } },
    );
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function onRoleChange(id, role) {
    setPendingRole((prev) => ({ ...prev, [id]: role }));
  }

  async function saveRole(id) {
    const role = pendingRole[id];
    if (!role) return;
    setSavingId(id);
    await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/auth/users/${id}/role`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ role }),
      },
    );
    setSavingId(null);
    setPendingRole((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    load();
  }

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [u.name, u.email].join(" ").toLowerCase().includes(q);
  });

  return (
    <div className="page active">
      <div className="page-head">
        <div>
          <h1>User Management</h1>
          <p>Manage roles and access for existing users</p>
        </div>
        <button className="btn-outline" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          style={{
            width: "100%",
            border: "1px solid var(--border-default)",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 13.5,
          }}
        />
      </div>

      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ minWidth: "700px", width: "100%" }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                    No users match "{search}".
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const selectedRole = pendingRole[u.id] ?? u.role ?? "recruiter";
                  const isDirty = pendingRole[u.id] && pendingRole[u.id] !== u.role;
                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 700 }}>{u.name}</td>
                      <td style={{ color: "var(--text-muted)" }}>{u.email}</td>
                      <td>
                        <select
                          value={selectedRole}
                          onChange={(e) => onRoleChange(u.id, e.target.value)}
                          style={{ padding: "5px 8px", borderRadius: 6, fontSize: 13 }}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r.charAt(0).toUpperCase() + r.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 12,
                            padding: "3px 10px",
                            borderRadius: 20,
                            fontWeight: 700,
                            background: u.approved ? "#dcfce7" : "#fef3c7",
                            color: u.approved ? "#16653f" : "#92400e",
                          }}
                        >
                          {u.approved ? "Active" : "Pending"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-gold"
                          style={{ padding: "5px 14px", fontSize: 12.5 }}
                          disabled={!isDirty || savingId === u.id}
                          onClick={() => saveRole(u.id)}
                        >
                          {savingId === u.id ? "Saving…" : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}