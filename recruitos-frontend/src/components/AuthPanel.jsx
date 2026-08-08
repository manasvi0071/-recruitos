import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthPanel() {
  const [mode, setMode] = useState("login"); // 'login' | 'register'

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [regForm, setRegForm] = useState({ name: "", email: "", password: "" });
  const [regStatus, setRegStatus] = useState("idle");
  const [regError, setRegError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    const { error } = await supabase.auth.signInWithPassword(loginForm);
    if (error) setLoginError(error.message);
    setLoggingIn(false);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setRegError("");
    setRegStatus("loading");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(regForm),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setRegStatus("done");
    } catch (err) {
      setRegError(err.message);
      setRegStatus("idle");
    }
  }

  return (
    <div className="auth-wrap">
      <div
        className={`auth-shell ${mode === "register" ? "show-register" : ""}`}
      >
        <div className="auth-form-panel login">
          <h2 style={{ fontFamily: "var(--font-display)", marginBottom: 6 }}>
            Welcome Back
          </h2>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 19,
              marginBottom: 24,
            }}
          >
            Log in to your workspace
          </p>
          <form onSubmit={handleLogin}>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, email: e.target.value })
                }
                required
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                required
              />
            </div>
            {loginError && (
              <p
                style={{
                  color: "var(--danger)",
                  fontSize: 12.5,
                  marginBottom: 10,
                }}
              >
                {loginError}
              </p>
            )}
            <button
              className="btn-primary"
              type="submit"
              disabled={loggingIn}
              style={{ marginTop: 8 }}
            >
              {loggingIn ? "Logging in…" : "Log In"}
            </button>
          </form>
        </div>

        <div className="auth-form-panel register">
          {regStatus === "done" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <h2
                style={{ fontFamily: "var(--font-display)", marginBottom: 8 }}
              >
                Request Submitted
              </h2>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: 13.5,
                  lineHeight: 1.6,
                }}
              >
                An admin has been notified. You'll be able to log in once
                approved.
              </p>
            </div>
          ) : (
            <>
              <h2
                style={{ fontFamily: "var(--font-display)", marginBottom: 6 }}
              >
                Request Access
              </h2>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: 19,
                  marginBottom: 24,
                }}
              >
                Submit your details for admin review.
              </p>
              <form onSubmit={handleRegister}>
                <div className="field">
                  <label>Full Name</label>
                  <input
                    value={regForm.name}
                    onChange={(e) =>
                      setRegForm({ ...regForm, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={regForm.email}
                    onChange={(e) =>
                      setRegForm({ ...regForm, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="field">
                  <label>Password</label>
                  <input
                    type="password"
                    value={regForm.password}
                    onChange={(e) =>
                      setRegForm({ ...regForm, password: e.target.value })
                    }
                    required
                    minLength={6}
                  />
                </div>
                {regError && (
                  <p
                    style={{
                      color: "var(--danger)",
                      fontSize: 12.5,
                      marginBottom: 10,
                    }}
                  >
                    {regError}
                  </p>
                )}
                <button
                  className="btn-primary"
                  type="submit"
                  disabled={regStatus === "loading"}
                  style={{ marginTop: 8 }}
                >
                  {regStatus === "loading" ? "Submitting…" : "Submit Request"}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="auth-overlay">
          <div className="auth-overlay-content">
            {mode === "login" ? (
              <>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    marginBottom: 10,
                  }}
                >
                  New here?
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    opacity: 0.85,
                    marginBottom: 22,
                    lineHeight: 1.6,
                  }}
                >
                  Request access and an admin will review your details.
                </p>
                <button
                  className="btn-outline"
                  style={{
                    background: "rgba(255,255,255,0.95)",
                    color: "#4C1D95",
                    border: "none",
                    borderRadius: 999,
                    padding: "11px 28px",
                    fontWeight: 700,
                    fontSize: 13.5,
                    letterSpacing: "0.01em",
                  }}
                  onClick={() => setMode("register")}
                >
                  Create Request
                </button>
              </>
            ) : (
              <>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    marginBottom: 10,
                  }}
                >
                  Already approved?
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    opacity: 0.85,
                    marginBottom: 22,
                    lineHeight: 1.6,
                  }}
                >
                  Log in with your existing credentials.
                </p>
                <button
                  className="btn-outline"
                  style={{
                    background: "rgba(255,255,255,0.95)",
                    color: "#4C1D95",
                    border: "none",
                    borderRadius: 999,
                    padding: "11px 28px",
                    fontWeight: 700,
                    fontSize: 13.5,
                    letterSpacing: "0.01em",
                  }}
                  onClick={() => setMode("login")}
                >
                  Log In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
