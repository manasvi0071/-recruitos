import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function PendingApprovals() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id);
    });
  }, []);

  const load = useCallback(async () => {
    if (!userId) return;
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/auth/pending`,
      {
        headers: { "x-user-id": userId },
      },
    );
    const data = await res.json();
    setPending(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    let ignore = false;

    async function init() {
      if (!userId) return;
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/pending`,
        {
          headers: { "x-user-id": userId },
        },
      );
      const data = await res.json();
      if (!ignore) {
        setPending(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    }

    init();

    const channel = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          if (!ignore) load();
        },
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, [userId, load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function approve(id) {
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/approve/${id}`, {
      method: "POST",
      headers: { "x-user-id": userId },
    });
    load();
  }

  async function reject(id) {
    if (!window.confirm("Deny this request?")) return;
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/reject/${id}`, {
      method: "POST",
      headers: { "x-user-id": userId },
    });
    load();
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === pending.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pending.map((p) => p.id)));
    }
  }

  async function bulkApprove() {
    if (selected.size === 0) return;
    setBulkWorking(true);
    await Promise.all(
      Array.from(selected).map((id) =>
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/approve/${id}`, {
          method: "POST",
          headers: { "x-user-id": userId },
        }),
      ),
    );
    setSelected(new Set());
    setBulkWorking(false);
    load();
  }

  async function bulkReject() {
    if (selected.size === 0) return;
    if (!window.confirm(`Reject and delete ${selected.size} request(s)?`))
      return;
    setBulkWorking(true);
    await Promise.all(
      Array.from(selected).map((id) =>
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/reject/${id}`, {
          method: "POST",
          headers: { "x-user-id": userId },
        }),
      ),
    );
    setSelected(new Set());
    setBulkWorking(false);
    load();
  }

  return (
    <div className="page active">
      <div className="page-head">
        <div>
          <h1>Pending Approvals</h1>
          <p>Review and approve new access requests</p>
        </div>
        <button
          className="btn-outline"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      <div className="panel">
        {loading ? (
          <p style={{ color: "var(--text-muted)" }}>Loading…</p>
        ) : pending.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No pending requests</p>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
                paddingBottom: 12,
                borderBottom: "1px solid var(--border-default)",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={
                    selected.size === pending.length && pending.length > 0
                  }
                  onChange={toggleSelectAll}
                />
                Select all ({pending.length})
              </label>
              {selected.size > 0 && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn-gold"
                    onClick={bulkApprove}
                    disabled={bulkWorking}
                    style={{ padding: "6px 14px", fontSize: 12.5 }}
                  >
                    {bulkWorking ? "…" : `Approve ${selected.size} Selected`}
                  </button>
                  <button
                    className="btn-outline"
                    onClick={bulkReject}
                    disabled={bulkWorking}
                    style={{
                      padding: "6px 14px",
                      fontSize: 12.5,
                      color: "var(--danger)",
                    }}
                  >
                    Reject Selected
                  </button>
                </div>
              )}
            </div>

            {pending.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border-default)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                  />
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {p.email}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      Requested {timeAgo(p.created_at)}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-gold" onClick={() => approve(p.id)}>
                    Approve
                  </button>
                  <button
                    className="btn-outline"
                    style={{ color: "var(--danger)" }}
                    onClick={() => reject(p.id)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
