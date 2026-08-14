const ROLE_CARDS = [
  {
    key: "recruiter",
    title: "Recruiter Login",
    desc: "Access your dashboard to manage job postings, candidates and hiring pipeline",
    icon: "👤",
    color: "#7C3AED",
    colorSoft: "#EDE9FE",
    btnGradient: "linear-gradient(90deg, #7C3AED, #A78BFA)",
    features: [
      "Post & Manage Jobs",
      "Review Candidates",
      "Track Hiring Pipeline",
      "Schedule Interviews",
      "Analytics & Reports",
    ],
    path: "/login/recruiter",
  },
  {
    key: "candidate",
    title: "Candidate Login",
    desc: "Track your applications and interview progress",
    icon: "🧑",
    color: "#2563EB",
    colorSoft: "#DBEAFE",
    btnGradient: "linear-gradient(90deg, #2563EB, #60A5FA)",
    features: [
      "View Job Opportunities",
      "Track Applications",
      "Interview Updates",
      "Profile & Resume",
      "View Offers",
    ],
    path: "/login/candidate",
  },
  {
    key: "corporate",
    title: "Corporate Login",
    desc: "Manage your company profile and recruitment activities",
    icon: "🏢",
    color: "#059669",
    colorSoft: "#D1FAE5",
    btnGradient: "linear-gradient(90deg, #059669, #34D399)",
    features: [
      "Company Dashboard",
      "Manage Job Postings",
      "View Applications",
      "Team Management",
      "Reports & Analytics",
    ],
    path: "/login/corporate",
  },
  {
    key: "admin",
    title: "Admin Login",
    desc: "Manage platform users, roles and system configurations",
    icon: "🛡️",
    color: "#EA580C",
    colorSoft: "#FFEDD5",
    btnGradient: "linear-gradient(90deg, #EA580C, #FB923C)",
    features: [
      "User Management",
      "Role & Permissions",
      "System Settings",
      "Activity Logs",
      "Data & Reports",
    ],
    path: "/login/admin",
  },
];

export default function LoginSelector() {
  return (
    <>
      <style>{`
        @keyframes bgColorShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(-45deg, #0F0B2E, #2E1065, #5B21B6, #1E3A8A, #0F0B2E)",
        backgroundSize: "400% 400%",
        animation: "bgColorShift 14s ease infinite",
        padding: "56px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle radial glows */}
      <div
        style={{
          position: "absolute",
          top: -120,
          left: -100,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(220,203,255,0.5) 0%, transparent 70%)",
          filter: "blur(10px)",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -140,
          right: -100,
          width: 460,
          height: 460,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(201,226,255,0.55) 0%, transparent 70%)",
          filter: "blur(10px)",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "35%",
          right: 40,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(243,215,245,0.35) 0%, transparent 70%)",
          filter: "blur(14px)",
          zIndex: 0,
        }}
      />

      {/* Faint dotted patterns */}
      <div
        style={{
          position: "absolute",
          top: 30,
          left: 30,
          width: 90,
          height: 90,
          backgroundImage:
            "radial-gradient(circle, rgba(124,58,237,0.18) 1.2px, transparent 1.2px)",
          backgroundSize: "14px 14px",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 60,
          width: 90,
          height: 90,
          backgroundImage:
            "radial-gradient(circle, rgba(37,99,235,0.15) 1.2px, transparent 1.2px)",
          backgroundSize: "14px 14px",
          zIndex: 0,
        }}
      />

      {/* Thin curved wave line */}
      <svg
        width="420"
        height="200"
        style={{ position: "absolute", top: 0, right: 0, zIndex: 0, opacity: 0.5 }}
        viewBox="0 0 420 200"
      >
        <path
          d="M0,100 C100,20 300,180 420,60"
          fill="none"
          stroke="rgba(124,58,237,0.15)"
          strokeWidth="1.5"
        />
      </svg>
      <svg
        width="420"
        height="200"
        style={{ position: "absolute", bottom: 0, left: 0, zIndex: 0, opacity: 0.5 }}
        viewBox="0 0 420 200"
      >
        <path
          d="M0,140 C120,60 260,180 420,90"
          fill="none"
          stroke="rgba(37,99,235,0.15)"
          strokeWidth="1.5"
        />
      </svg>

      {/* Small geometric circles + plus symbols in corners */}
      <div style={{ position: "absolute", top: 60, right: 90, width: 14, height: 14, borderRadius: "50%", border: "1.5px solid rgba(124,58,237,0.25)", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: 90, right: 140, width: 10, height: 10, borderRadius: "50%", border: "1.5px solid rgba(37,99,235,0.25)", zIndex: 0 }} />
      <span style={{ position: "absolute", top: 100, left: 120, fontSize: 16, color: "rgba(124,58,237,0.25)", zIndex: 0 }}>+</span>
      <span style={{ position: "absolute", bottom: 120, right: 60, fontSize: 16, color: "rgba(37,99,235,0.25)", zIndex: 0 }}>+</span>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 44, position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 30 }}>🎓</span>
          <span style={{ fontSize: 26, fontWeight: 700, color: "#FFFFFF", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            Saarthi
          </span>
          <span style={{ fontSize: 26, fontWeight: 700, color: "#C4B5FD", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            Campus
          </span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12.5, marginBottom: 30, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 500 }}>
          Campus Recruitment Platform
        </p>

        <h1 style={{ fontSize: 36, fontWeight: 700, color: "#FFFFFF", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
          Welcome to <span style={{ color: "#C4B5FD" }}>Saarthi Campus</span>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14.5, marginTop: 10, fontWeight: 400 }}>
          Choose your login to continue
        </p>
      </div>

      {/* Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
          maxWidth: 1200,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {ROLE_CARDS.map((card) => (
          <div
            key={card.key}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-lg)",
              padding: "32px 24px",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: card.colorSoft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                marginBottom: 18,
              }}
            >
              {card.icon}
            </div>

            <h3 style={{ fontSize: 17.5, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
              {card.title}
            </h3>
            <p
              style={{
                fontSize: 12.5,
                color: "var(--text-muted)",
                marginTop: 7,
                marginBottom: 20,
                lineHeight: 1.55,
                minHeight: 36,
              }}
            >
              {card.desc}
            </p>

            <button
              onClick={() => { window.location.href = card.path; }}
              style={{
                width: "100%",
                background: card.btnGradient,
                color: "white",
                border: "none",
                padding: "11px 18px",
                borderRadius: "var(--radius-md)",
                fontWeight: 700,
                fontSize: 13.5,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              Login as {card.title.split(" ")[0]} <span>→</span>
            </button>

            <div
              style={{
                width: "100%",
                borderTop: "1px solid var(--border-default)",
                marginTop: 22,
                paddingTop: 16,
                textAlign: "left",
              }}
            >
              {card.features.map((f) => (
                <div
                  key={f}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12.5,
                    color: "var(--text-secondary)",
                    padding: "5px 0",
                  }}
                >
                  <span style={{ color: card.color, fontWeight: 700 }}>✓</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer strip */}
      <div
        style={{
          maxWidth: 700,
          margin: "40px auto 0",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          padding: "16px 22px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          position: "relative",
          zIndex: 1,
        }}
      >
        <span style={{ fontSize: 22 }}>🛡️</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--brand-purple)" }}>
            Secure • Reliable • Smart Recruitment
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Your data is protected with enterprise-grade security
          </div>
        </div>
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: 12,
          color: "rgba(255,255,255,0.6)",
          marginTop: 24,
          position: "relative",
          zIndex: 1,
        }}
      >
        © {new Date().getFullYear()} Saarthi Campus. All rights reserved.
      </p>
    </div>
    </>
  );
}