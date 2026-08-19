import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import SaarthiLogo from "./SaarthiLogo";
import "./AuthPanel.css";

export default function AuthPanel({ role = "recruiter" }) {
  const [mode, setMode] = useState("login");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [regStatus, setRegStatus] = useState("idle");
  const [regError, setRegError] = useState("");

  const [coinSide, setCoinSide] = useState("front");
  const [isFlipping, setIsFlipping] = useState(false);
  const [coinResult, setCoinResult] = useState("");

  const roleLabel =
    role === "candidate"
      ? "Candidate"
      : role === "corporate"
        ? "Corporate"
        : role === "admin"
          ? "Admin"
          : "Recruiter";

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError("");
    setLoggingIn(true);

    const { data: authData, error } =
      await supabase.auth.signInWithPassword(loginForm);

    if (error) {
      setLoginError(error.message);
      setLoggingIn(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    const actualRole = profile?.role;

    if (actualRole && actualRole !== role) {
      await supabase.auth.signOut();

      setLoginError(
        `This account is registered as "${actualRole}", not "${role}". Please log in from the ${actualRole} login page instead.`,
      );

      setLoggingIn(false);
      return;
    }

    window.location.href = "/app";
  }

  async function handleRegister(event) {
    event.preventDefault();
    setRegError("");
    setRegStatus("loading");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...regForm,
            role,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setRegStatus("done");
    } catch (error) {
      setRegError(error.message);
      setRegStatus("idle");
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setLoginError("");
    setRegError("");
  }

  function flipCoin() {
    if (isFlipping) return;

    const nextSide = Math.random() > 0.5 ? "front" : "back";

    setIsFlipping(true);
    setCoinResult("");

    window.setTimeout(() => {
      setCoinSide(nextSide);
      setIsFlipping(false);
      setCoinResult(
        nextSide === "front"
          ? "A fresh opportunity is waiting."
          : "Keep moving forward.",
      );
    }, 900);
  }

  return (
    <main className="auth-page">
      <div className="campus-orbit campus-orbit-one" />
      <div className="campus-orbit campus-orbit-two" />

      <div className="campus-dots dots-one" />
      <div className="campus-dots dots-two" />

      <div className="campus-building building-one">
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="campus-building building-two">
        <span />
        <span />
        <span />
      </div>

      <section
        className={`auth-shell ${
          mode === "register" ? "auth-shell-register" : ""
        }`}
      >
        <div className="auth-form-area">
          <div className="form-track">
            <section className="auth-form-panel login-panel">
              <div className="brand-mark">
                <SaarthiLogo size={46} />
                <span>SAARTHI</span>
              </div>

              <div className="form-heading">
                <p className="eyebrow">WELCOME BACK</p>
                <h1>{roleLabel} Login</h1>
                <p>Log in to continue to your workspace.</p>
              </div>

              <form onSubmit={handleLogin} className="auth-form">
                <div className="field">
                  <label htmlFor="login-email">Email address</label>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="name@company.com"
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm({
                        ...loginForm,
                        email: event.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="login-password">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm({
                        ...loginForm,
                        password: event.target.value,
                      })
                    }
                    required
                  />
                </div>

                {loginError && (
                  <p className="form-error" role="alert">
                    {loginError}
                  </p>
                )}

                <button
                  className="primary-button"
                  type="submit"
                  disabled={loggingIn}
                >
                  {loggingIn ? "Logging in..." : "Log in"}
                  <span aria-hidden="true">↗</span>
                </button>
              </form>

              <div className="form-switch">
                <span>New here?</span>
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                >
                  Create an account
                </button>
              </div>
            </section>

            <section className="auth-form-panel register-panel">
              {regStatus === "done" ? (
                <div className="registration-success">
                  <div className="success-icon">✓</div>
                  <p className="eyebrow">ALL SET</p>
                  <h1>
                    {role === "candidate"
                      ? "Account created"
                      : "Request submitted"}
                  </h1>
                  <p>
                    {role === "candidate"
                      ? "Your account is ready. You can now log in with your credentials."
                      : "An admin has been notified. You can log in once your account is approved."}
                  </p>

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => switchMode("login")}
                  >
                    Return to login
                  </button>
                </div>
              ) : (
                <>
                  <div className="brand-mark">
                    <SaarthiLogo size={46} />
                    <span>SAARTHI</span>
                  </div>

                  <div className="form-heading">
                    <p className="eyebrow">GET STARTED</p>
                    <h1>{roleLabel} Sign Up</h1>
                    <p>
                      {role === "candidate"
                        ? "Create an account to track your applications."
                        : "Submit your details for admin review."}
                    </p>
                  </div>

                  <form onSubmit={handleRegister} className="auth-form">
                    <div className="field">
                      <label htmlFor="register-name">Full name</label>
                      <input
                        id="register-name"
                        type="text"
                        placeholder="Your full name"
                        value={regForm.name}
                        onChange={(event) =>
                          setRegForm({
                            ...regForm,
                            name: event.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="register-email">Email address</label>
                      <input
                        id="register-email"
                        type="email"
                        placeholder="name@company.com"
                        value={regForm.email}
                        onChange={(event) =>
                          setRegForm({
                            ...regForm,
                            email: event.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="register-password">Password</label>
                      <input
                        id="register-password"
                        type="password"
                        placeholder="Minimum 6 characters"
                        minLength={6}
                        value={regForm.password}
                        onChange={(event) =>
                          setRegForm({
                            ...regForm,
                            password: event.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    {regError && (
                      <p className="form-error" role="alert">
                        {regError}
                      </p>
                    )}

                    <button
                      className="primary-button"
                      type="submit"
                      disabled={regStatus === "loading"}
                    >
                      {regStatus === "loading" ? "Submitting..." : "Submit"}
                      <span aria-hidden="true">↗</span>
                    </button>
                  </form>

                  <div className="form-switch">
                    <span>Already registered?</span>
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                    >
                      Log in
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>

        <aside className="campus-panel">
          <div className="panel-glow glow-one" />
          <div className="panel-glow glow-two" />

          <div className="campus-content">
            <div className="panel-topline">
              <span className="live-dot" />
              <span>Campus to career</span>
            </div>

            <div className="campus-copy">
              <p className="eyebrow panel-eyebrow">ONE PLATFORM</p>
              <h2>
                Build your
                <br />
                <span>next chapter.</span>
              </h2>
              <p>
                Connect students, recruiters and meaningful opportunities in
                one focused workspace.
              </p>
            </div>

            <div className="career-visual" aria-hidden="true">
              <div className="visual-line line-one" />
              <div className="visual-line line-two" />
              <div className="visual-node node-one">
                <span>✦</span>
              </div>
              <div className="visual-node node-two">
                <span>⌁</span>
              </div>
              <div className="visual-node node-three">
                <span>↗</span>
              </div>

              <div className="visual-card profile-card">
                <div className="avatar">M</div>
                <div>
                  <strong>Student profile</strong>
                  <small>Ready for opportunity</small>
                </div>
              </div>

              <div className="visual-card job-card">
                <div className="job-icon">✦</div>
                <div>
                  <strong>New opportunity</strong>
                  <small>Frontend Developer</small>
                </div>
              </div>
            </div>

            <div className="coin-section">
              <div className="coin-heading">
                <div>
                  <p className="eyebrow panel-eyebrow">CAMPUS COIN</p>
                  <span>Flip your luck</span>
                </div>
                <span className="coin-sparkle">✦</span>
              </div>

              <div className="coin-scene">
                <button
                  type="button"
                  className={`coin ${coinSide === "back" ? "coin-back" : ""} ${
                    isFlipping ? "coin-flipping" : ""
                  }`}
                  onClick={flipCoin}
                  aria-label="Flip campus coin"
                  disabled={isFlipping}
                >
                  <span className="coin-face coin-front">
                    <span className="coin-symbol">S</span>
                    <span className="coin-label">SAARTHI</span>
                  </span>

                  <span className="coin-face coin-back-face">
                    <span className="coin-symbol">✦</span>
                    <span className="coin-label">CAMPUS</span>
                  </span>
                </button>
              </div>

              <button
                type="button"
                className="coin-button"
                onClick={flipCoin}
                disabled={isFlipping}
              >
                {isFlipping ? "Flipping..." : "Flip the coin"}
                <span aria-hidden="true">↗</span>
              </button>

              <p className="coin-result" aria-live="polite">
                {coinResult || "A little luck never hurts."}
              </p>
            </div>
          </div>

          <div className="panel-footer">
            <span>SAARTHI PLATFORM</span>
            <span>2026</span>
          </div>
        </aside>
      </section>
    </main>
  );
}