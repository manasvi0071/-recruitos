import { useEffect, useState } from "react";

export default function PendingApprovals() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/pending`
      );

      if (!res.ok) {
        throw new Error("Failed to load pending approvals");
      }

      const data = await res.json();
      setPending(data);
    } catch (error) {
      console.error("Error loading pending approvals:", error);
      setPending([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialPending() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/auth/pending`
        );

        if (!res.ok) {
          throw new Error("Failed to load pending approvals");
        }

        const data = await res.json();

        if (!cancelled) {
          setPending(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading pending approvals:", error);

        if (!cancelled) {
          setPending([]);
          setLoading(false);
        }
      }
    }

    loadInitialPending();

    return () => {
      cancelled = true;
    };
  }, []);

  async function approve(id) {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/approve/${id}`,
        {
          method: "POST",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to approve user");
      }

      await load();
    } catch (error) {
      console.error("Approval error:", error);
    }
  }

  async function reject(id) {
    if (!window.confirm("Reject and delete this request?")) {
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/reject/${id}`,
        {
          method: "POST",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to reject user");
      }

      await load();
    } catch (error) {
      console.error("Rejection error:", error);
    }
  }

  return (
    <div className="page active">
      <div className="page-head">
        <div>
          <h1>Pending Approvals</h1>
          <p>Review and approve new access requests</p>
        </div>
      </div>

      <div className="panel">
        {loading ? (
          <p>Loading...</p>
        ) : pending.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            No pending requests
          </p>
        ) : (
          pending.map((p) => (
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
              <div>
                <div style={{ fontWeight: 700 }}>{p.name}</div>

                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                  }}
                >
                  {p.email}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn-gold"
                  onClick={() => approve(p.id)}
                >
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
          ))
        )}
      </div>
    </div>
  );
}