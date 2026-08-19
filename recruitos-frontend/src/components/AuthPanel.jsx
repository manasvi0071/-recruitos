import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import SaarthiLogo from "./SaarthiLogo";

export default function AuthPanel({ role = "recruiter" }) {
  const [mode, setMode] = useState("login");
  const [isFlipping, setIsFlipping] = useState(false);

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

  const roleLabel =
    role === "candidate"
      ? "Candidate"
      : role === "corporate"
        ? "Corporate"
        : role === "admin"
          ? "Admin"
          : "Recruiter";

  /*
   * This function flips the circular card slowly.
   * The state changes halfway through the animation,
   * so the new form is visible after the card reaches the back.
   */
  function changeMode(nextMode) {
    if (isFlipping || mode === nextMode) return;

    setIsFlipping(true);

    window.setTimeout(() => {
      setMode(nextMode);
      setIsFlipping(false);
    }, 700);
  }

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
        `This account is registered as "${actualRole}", not "${role}". Please use the ${actualRole} login page.`,
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

  return (
    <main className="canvas-auth-page">
      <CampusBackground />

      <section className="auth-stage">
        <div
          className={`auth-coin-wrapper ${
            mode === "register" ? "show-register" : ""
          } ${isFlipping ? "is-flipping" : ""}`}
        >
          <div className="auth-coin">
            {/* FRONT: LOGIN */}
            <section className="auth-coin-face auth-coin-front">
              <div className="auth-inner-content">
                <div className="auth-logo">
                  <SaarthiLogo size={44} />
                </div>

                <p className="auth-eyebrow">SAARTHI PLATFORM</p>

                <h1>{roleLabel} Login</h1>

                <p className="auth-description">
                  Log in to continue to your workspace.
                </p>

                <form
                  className="circle-auth-form"
                  onSubmit={handleLogin}
                >
                  <div className="circle-field">
                    <label htmlFor="login-email">Email</label>

                    <input
                      id="login-email"
                      type="email"
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

                  <div className="circle-field">
                    <label htmlFor="login-password">Password</label>

                    <input
                      id="login-password"
                      type="password"
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
                    <p className="circle-error" role="alert">
                      {loginError}
                    </p>
                  )}

                  <button
                    className="circle-login-button"
                    type="submit"
                    disabled={loggingIn || isFlipping}
                  >
                    {loggingIn ? "Logging in..." : "Log In"}
                    <span>↗</span>
                  </button>
                </form>

                <button
                  className="circle-bottom-link"
                  type="button"
                  onClick={() => changeMode("register")}
                >
                  New here? Create an account
                </button>
              </div>
            </section>

            {/* BACK: REGISTER */}
            <section className="auth-coin-face auth-coin-back">
              {regStatus === "done" ? (
                <div className="auth-inner-content registration-success">
                  <div className="success-icon">✓</div>

                  <p className="auth-eyebrow">ALL SET</p>

                  <h2>
                    {role === "candidate"
                      ? "Account Created!"
                      : "Request Submitted"}
                  </h2>

                  <p className="back-description">
                    {role === "candidate"
                      ? "You're registered. You can now log in with your email and password."
                      : "An admin has been notified. You'll be able to log in once approved."}
                  </p>

                  <button
                    className="circle-login-button"
                    type="button"
                    onClick={() => {
                      setRegStatus("idle");
                      changeMode("login");
                    }}
                  >
                    Go to Login
                    <span>↗</span>
                  </button>
                </div>
              ) : (
                <div className="auth-inner-content">
                  <div className="auth-logo">
                    <SaarthiLogo size={44} />
                  </div>

                  <p className="auth-eyebrow">GET STARTED</p>

                  <h2>{roleLabel} Sign Up</h2>

                  <p className="back-description">
                    {role === "candidate"
                      ? "Create your account to track applications."
                      : "Submit your details for admin review."}
                  </p>

                  <form
                    className="circle-auth-form"
                    onSubmit={handleRegister}
                  >
                    <div className="circle-field">
                      <label htmlFor="register-name">Full Name</label>

                      <input
                        id="register-name"
                        type="text"
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

                    <div className="circle-field">
                      <label htmlFor="register-email">Email</label>

                      <input
                        id="register-email"
                        type="email"
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

                    <div className="circle-field">
                      <label htmlFor="register-password">Password</label>

                      <input
                        id="register-password"
                        type="password"
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
                      <p className="circle-error register-error" role="alert">
                        {regError}
                      </p>
                    )}

                    <button
                      className="circle-login-button"
                      type="submit"
                      disabled={regStatus === "loading" || isFlipping}
                    >
                      {regStatus === "loading"
                        ? "Submitting..."
                        : "Create Account"}
                      <span>↗</span>
                    </button>
                  </form>

                  <button
                    className="circle-bottom-link"
                    type="button"
                    onClick={() => changeMode("login")}
                  >
                    Already have an account? Log in
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function CampusBackground() {
  return (
    <div className="campus-background" aria-hidden="true">
      <div className="canvas-grid" />
      <div className="soft-orb orb-left" />
      <div className="soft-orb orb-right" />
      <div className="campus-sun" />

      <div className="campus-hill hill-back" />
      <div className="campus-hill hill-front" />

      <div className="campus-building building-main">
        <div className="building-roof" />

        <div className="building-body">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="building-door" />
      </div>

      <div className="campus-building building-small">
        <div className="building-roof" />

        <div className="building-body">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="campus-tree tree-one">
        <div className="tree-top" />
        <div className="tree-trunk" />
      </div>

      <div className="campus-tree tree-two">
        <div className="tree-top" />
        <div className="tree-trunk" />
      </div>

      <div className="campus-path path-one" />
      <div className="campus-path path-two" />

      <div className="campus-cap">✦</div>
    </div>
  );
}