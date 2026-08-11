export default function LoginSelect() {
  const options = [
    { label: "Recruiter Login", desc: "Internal team access to manage hiring", path: "/login/recruiter" },
    { label: "Candidate Login", desc: "Track your applications and interviews", path: "/login/candidate" },
    { label: "Corporate Login", desc: "Post jobs and manage your hiring pipeline", path: "/login/corporate" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--gradient-hero)", padding: 24 }}>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", maxWidth: 900 }}>
        {options.map((o) => (
          <div
            key={o.path}
            className="panel"
            style={{ width: 260, cursor: "pointer", textAlign: "center", padding: "36px 24px" }}
            onClick={() => { window.location.href = o.path; }}
          >
            <div className="panel-title">{o.label}</div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>{o.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}