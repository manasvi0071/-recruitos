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

    const email = loginForm.email.trim();

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password: loginForm.password,
      });

    if (authError) {
      console.error("Supabase login error:", authError);
      setLoginError(authError.message);
      setLoggingIn(false);
      return;
    }

    if (!authData?.user) {
      setLoginError("Login failed. No user session was returned.");
      setLoggingIn(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, approved")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile error:", profileError);
      await supabase.auth.signOut();
      setLoginError(`Profile error: ${profileError.message}`);
      setLoggingIn(false);
      return;
    }

    if (!profile) {
      await supabase.auth.signOut();
      setLoginError(
        "Login succeeded, but no profile was found for this account.",
      );
      setLoggingIn(false);
      return;
    }

    if (profile.role && profile.role !== role) {
      await supabase.auth.signOut();
      setLoginError(
        `This account is registered as "${profile.role}". Please use the correct login page.`,
      );
      setLoggingIn(false);
      return;
    }

    window.location.replace("/app");
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
      console.error("Registration error:", error);
      setRegError(error.message || "Registration failed");
      setRegStatus("idle");
    }
  }

  function resetRegistration() {
    setRegStatus("idle");
    setRegError("");
    setRegForm({
      name: "",
      email: "",
      password: "",
    });
    setMode("login");
  }

  return (
    <main className="canvas-auth-page">
      <CampusBackground />

      <section className="auth-stage">
        <div className="auth-simple-card">
          {mode === "login" && (
            <div className="auth-inner-content">
              <div className="auth-logo">
                <SaarthiLogo size={44} />
              </div>

              <p className="auth-eyebrow">SAARTHI PLATFORM</p>

              <h1>{roleLabel} Login</h1>

              <p className="auth-description">
                Log in to continue to your workspace.
              </p>

              <form className="circle-auth-form" onSubmit={handleLogin}>
                <div className="circle-field">
                  <label htmlFor="login-email">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="name@example.com"
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
                    placeholder="Your password"
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
                  disabled={loggingIn}
                >
                  {loggingIn ? "Checking..." : "Log In"}
                  <span>↗</span>
                </button>
              </form>

              <button
                className="circle-bottom-link"
                type="button"
                onClick={() => setMode("register")}
              >
                New here? Create an account
              </button>
            </div>
          )}

          {mode === "register" && (
            <div className="auth-inner-content">
              {regStatus === "done" ? (
                <div className="registration-success">
                  <div className="success-icon">✓</div>

                  <p className="auth-eyebrow">ALL SET</p>

                  <h2>
                    {role === "candidate"
                      ? "Account Created!"
                      : "Request Submitted"}
                  </h2>

                  <p className="back-description">
                    {role === "candidate"
                      ? "You're registered. You can now log in."
                      : "An admin has been notified. You'll be able to log in once approved."}
                  </p>

                  <button
                    className="circle-login-button"
                    type="button"
                    onClick={resetRegistration}
                  >
                    Go to Login
                    <span>↗</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="auth-logo">
                    <SaarthiLogo size={44} />
                  </div>

                  <p className="auth-eyebrow">GET STARTED</p>

                  <h2>{roleLabel} Sign Up</h2>

                  <p className="back-description">
                    Submit your details for admin review.
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

                    <div className="circle-field">
                      <label htmlFor="register-email">Email</label>
                      <input
                        id="register-email"
                        type="email"
                        placeholder="name@example.com"
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
                      <p className="circle-error" role="alert">
                        {regError}
                      </p>
                    )}

                    <button
                      className="circle-login-button"
                      type="submit"
                      disabled={regStatus === "loading"}
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
                    onClick={() => setMode("login")}
                  >
                    Already have an account? Log in
                  </button>
                </>
              )}
            </div>
          )}
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
      <div className="campus-cap">
        <span>✦</span>
      </div>

      <div className="campus-network">
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}