import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import SaarthiLogo from "./SaarthiLogo";
import "./AuthPanel.css";

export default function AuthPanel({ role = "recruiter" }) {
  const [side, setSide] = useState("login");
  const [isFlipping, setIsFlipping] = useState(false);
  const [loginResult, setLoginResult] = useState("");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const roleLabel =
    role === "candidate"
      ? "Candidate"
      : role === "corporate"
        ? "Corporate"
        : role === "admin"
          ? "Admin"
          : "Recruiter";

  function flipPanel(nextSide) {
    if (isFlipping) return;

    setIsFlipping(true);

    window.setTimeout(() => {
      setSide(nextSide);
      setIsFlipping(false);
    }, 650);
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
        `This account is registered as "${actualRole}", not "${role}".`,
      );

      setLoggingIn(false);
      return;
    }

    setLoginResult("Login successful");
    setLoggingIn(false);

    // Flip the circle to the success side.
    flipPanel("result");
  }

  function handleLoginAgain() {
    setLoginResult("");
    setLoginError("");
    flipPanel("login");
  }

  return (
    <main className="canvas-auth-page">
      <CampusBackground />

      <section className="auth-stage">
        <div
          className={`auth-coin-wrapper ${
            isFlipping ? "auth-coin-is-flipping" : ""
          } ${side === "result" ? "auth-coin-result" : ""}`}
        >
          <div className="auth-coin">
            <section className="auth-coin-face auth-coin-front">
              <div className="auth-inner-content">
                <div className="auth-logo">
                  <SaarthiLogo size={42} />
                </div>

                <p className="auth-eyebrow">SAARTHI PLATFORM</p>

                <h1>{roleLabel} Login</h1>

                <p className="auth-description">
                  Log in to continue to your workspace.
                </p>

                <form className="circle-auth-form" onSubmit={handleLogin}>
                  <div className="circle-field">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
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
                    <label htmlFor="password">Password</label>
                    <input
                      id="password"
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
                    disabled={loggingIn || isFlipping}
                  >
                    {loggingIn ? "Checking..." : "Log in"}
                    <span>↗</span>
                  </button>
                </form>

                <button
                  className="circle-bottom-link"
                  type="button"
                  onClick={() => flipPanel("register")}
                >
                  Create an account
                </button>
              </div>
            </section>

            <section className="auth-coin-face auth-coin-back">
              <div className="result-content">
                <div className="result-symbol">✓</div>

                <p className="auth-eyebrow">WELCOME ABOARD</p>

                <h2>{loginResult || "Ready to begin?"}</h2>

                <p>
                  Your Saarthi workspace is ready. Keep building your next
                  chapter.
                </p>

                <button
                  className="circle-login-button"
                  type="button"
                  onClick={handleLoginAgain}
                  disabled={isFlipping}
                >
                  Log in again
                  <span>↻</span>
                </button>

                <button
                  className="circle-bottom-link"
                  type="button"
                  onClick={() => flipPanel("login")}
                >
                  Return to login
                </button>
              </div>
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