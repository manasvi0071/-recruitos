export default function CallRecords() {
  return (
    <div className="page active">
      <div className="page-head">
        <div>
          <h1>Call Records</h1>
          <p>All college and company calls — logged and tracked</p>
        </div>

        <button className="btn-gold">
          + Log Call
        </button>
      </div>

      <div className="panel">
        <p style={{ color: "var(--text-muted)" }}>
          No call records logged yet.
        </p>
      </div>
    </div>
  );
}