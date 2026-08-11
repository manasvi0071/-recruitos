import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import CampusDB from "./pages/CampusDB";
import CorpDB from "./pages/CorpDB";
import Jobs from "./pages/Jobs";
import Resume from "./pages/Resume";
import Aptitude from "./pages/Aptitude";
import Interview from "./pages/Interview";
import Offers from "./pages/Offers";
import Joining from "./pages/Joining";
import Comm from "./pages/Comm";
import Reports from "./pages/Reports";
import Apply from "./pages/Apply";
import Pipeline from "./pages/Pipeline";
import GDAdmin from "./pages/GDAdmin";
import GDRoom from "./pages/GDRoom";
import AIInterview from "./pages/AIInterview";
import Landing from "./pages/Landing";
import ThemeToggle from "./components/ThemeToggle";
import AptitudeTest from "./pages/Aptitude";
import PendingApprovals from "./pages/PendingApprovals";
import AuthPanel from "./components/AuthPanel";
import CallRecord from "./pages/CallRecord";
import SaarthiLogo from "./components/SaarthiLogo";
import LoginSelect from "./pages/LoginSelect";

const pages = {
  dashboard: Dashboard,
  campusdb: CampusDB,
  corpdb: CorpDB,
  jobs: Jobs,
  resume: Resume,
  aptitude: Aptitude,
  gd: GDAdmin,
  interview: Interview,
  offers: Offers,
  joining: Joining,
  comm: Comm,
  reports: Reports,
  pipeline: Pipeline,
  gdadmin: GDAdmin,
  gdroom: GDRoom,
  pendingapprovals: PendingApprovals,
  callrecords: CallRecord,
};

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileApproved, setProfileApproved] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const checkApproval = async () => {
      if (!session) {
        setProfileApproved(null);
        setUserRole(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("approved, role")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Could not check approval status:", error.message);
        setProfileApproved(false);
        setUserRole(null);
        return;
      }

      setProfileApproved(data?.approved === true);
      setUserRole(data?.role || "user");
    };

    checkApproval();
  }, [session]);

  // GD Room — public, students access via email link
  if (window.location.pathname.startsWith("/gd/")) {
    return <GDRoom />;
  }

  if (window.location.pathname === "/apply") {
    return <Apply />;
  }

  if (window.location.pathname.startsWith("/interview/")) {
    return <AIInterview />;
  }

  if (window.location.pathname.startsWith("/aptitude-test/")) {
    return <AptitudeTest />;
  }

 if (window.location.pathname === "/login") {
  return <LoginSelect />;
}
if (window.location.pathname === "/login/recruiter") {
  return <AuthPanel role="recruiter" />;
}
if (window.location.pathname === "/login/candidate") {
  return <AuthPanel role="candidate" />;
}
if (window.location.pathname === "/login/corporate") {
  return <AuthPanel role="corporate" />;
}

  const isAppRoute = window.location.pathname.startsWith("/app");

  if (window.location.pathname === "/") {
    return <Landing />;
  }

  if (isAppRoute) {
    if (loading) {
      return null;
    }

    if (!session) {
  return <LoginSelect />;
}

    if (profileApproved === null) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Checking approval status...
        </div>
      );
    }

    if (profileApproved === false) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 24,
          }}
        >
          <div>
            <h2>Awaiting Approval</h2>

            <p style={{ color: "var(--text-muted)" }}>
              Your account is pending admin approval.
            </p>

            <button
              className="logout-link"
              onClick={() => supabase.auth.signOut()}
            >
              Log out
            </button>
          </div>
        </div>
      );
    }

    if (userRole === "candidate") {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
      <div>
        <h2>Candidate Dashboard</h2>
        <p style={{ color: "var(--text-muted)" }}>Coming soon — your applications will appear here.</p>
        <button className="logout-link" onClick={() => supabase.auth.signOut()}>Log out</button>
      </div>
    </div>
  );
}

if (userRole === "corporate") {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
      <div>
        <h2>Corporate Dashboard</h2>
        <p style={{ color: "var(--text-muted)" }}>Coming soon — your job postings will appear here.</p>
        <button className="logout-link" onClick={() => supabase.auth.signOut()}>Log out</button>
      </div>
    </div>
  );
}

    const PageComponent = pages[activePage];

    return (
      <div id="screen-app" style={{ display: "block" }}>
        <div className="topbar">
          <div
            className="brand"
            style={{
              display: "flex",
              alignItems: "center",
              height: "150%",
              minWidth: 170,
            }}
          >
            <SaarthiLogo
              size={75}
              className="theme-adaptive-logo"
              style={{
                transform: "scale(1.2)",
                transformOrigin: "left center",
              }}
            />
          </div>
          <div className="top-actions">
            <ThemeToggle />
            <span className="pill">Talent Corner Workspace</span>
            <span>{session.user.email}</span>
            <span
              className="logout-link"
              onClick={() => supabase.auth.signOut()}
            >
              Log out
            </span>
            <div className="avatar">SC</div>
          </div>
        </div>
        <div className="app">
          <Sidebar
            activePage={activePage}
            setActivePage={setActivePage}
            isAdmin={userRole === "admin"}
          />
          <div className="main">
            <PageComponent />
          </div>
        </div>
      </div>
    );
  }

  // Fallback — unknown path
  return <Landing />;
}
