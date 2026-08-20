import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

/* ============================================================================
   SCHEMA REQUIREMENTS FOR FULL FEATURE PARITY
   ----------------------------------------------------------------------------
   Your current schema (profiles, candidates, job_profiles, applications) is
   enough for: stat cards, stage donut, trend line, top companies, top jobs,
   recent activity, pending approvals.

   To match every panel in the screenshot, add these (SQL below). Everything
   in this file is written to DEGRADE GRACEFULLY (shows 0 / "No data") if a
   column/table doesn't exist yet, so you can ship this now and backfill
   later.

   -- 1) Recruitment Funnel (Applied > Shortlisted > Interview > Offered > Hired)
   --    Already derivable from applications.stage — no schema change needed.

   -- 2) Candidates by Backlogs
   alter table candidates add column if not exists backlog_count int default 0;
   -- "With Backlogs" = backlog_count > 0, "No Backlogs" = backlog_count = 0

   -- 3) Candidates by Source
   alter table candidates add column if not exists source text default 'Other';
   -- expected values: 'Campus', 'Referral', 'Job Portal', 'Walk-in', 'Other'

   -- 4) Upcoming Interviews (candidate/role/interviewer/scheduled time)
   alter table applications add column if not exists interviewer_name text;
   alter table applications add column if not exists interview_scheduled_at timestamptz;

   -- 5) Offer Acceptance Rate + Avg Time to Hire
   alter table applications add column if not exists offer_status text; -- 'accepted' | 'declined' | null
   alter table applications add column if not exists hired_at timestamptz;
   -- Avg Time to Hire = avg(hired_at - created_at) over hired applications

   -- 6) Profile Completion %
   alter table candidates add column if not exists profile_completion int default 0; -- 0-100

   -- 7) Alerts & Notifications (system-generated, admin-facing)
   create table if not exists admin_alerts (
     id uuid primary key default gen_random_uuid(),
     severity text not null default 'info', -- 'critical' | 'warning' | 'info' | 'success'
     message text not null,
     action_label text,
     action_href text,
     created_at timestamptz default now()
   );

   -- 8) Activity Summary (weekly counters) — derived in-app from applications
   --    + candidates created_at timestamps (no schema change needed), OR
   --    maintain a rollup table if volume is high:
   create table if not exists activity_daily_counts (
     day date primary key,
     new_applications int default 0,
     shortlisted int default 0,
     interviews_scheduled int default 0,
     offers_made int default 0,
     hired int default 0
   );
============================================================================ */

const STAGE_COLORS = {
  Applied: "#7657E8",
  Shortlisted: "#12A7C7",
  Interview: "#EC6E9B",
  Offered: "#E59A21",
  Selected: "#15A878",
  Hired: "#15A878",
  Rejected: "#B4B2A9",
};

const SOURCE_COLORS = {
  Campus: "#F5A623",
  Referral: "#12A7C7",
  "Job Portal": "#7657E8",
  "Walk-in": "#EC6E9B",
  Other: "#B4B2A9",
};

const SEVERITY_STYLE = {
  critical: { bg: "#FDECEC", icon: "⚠️", color: "#C0392B" },
  warning: { bg: "#FFF6E5", icon: "⏰", color: "#B8860B" },
  info: { bg: "#EAF3FF", icon: "ℹ️", color: "#2563EB" },
  success: { bg: "#E9F9F0", icon: "✅", color: "#15A878" },
};

const FUNNEL_ORDER = ["Applied", "Shortlisted", "Interview", "Offered", "Hired"];
const FUNNEL_COLORS = ["#7657E8", "#3E8FD0", "#EC6E9B", "#E59A21", "#15A878"];

// Set to false once your Supabase schema (see comment block above) is ready
// and you want to load real data instead of this canned demo dataset.
// Set to true only for offline/demo preview. Set to false (default) to load
// real data from Supabase.
const DEMO_MODE = true;

const DEMO_DATA = {
  stats: { companies: 12, recruiters: 18, candidates: 156, admins: 3, openJobs: 28 },
  pendingUsers: [
    { id: "p1", email: "hr@brightpath.com", role: "corporate", created_at: "2026-08-18T10:00:00Z" },
    { id: "p2", email: "arjun.mehta@gmail.com", role: "recruiter", created_at: "2026-08-19T14:30:00Z" },
    { id: "p3", email: "contact@novacore.io", role: "corporate", created_at: "2026-08-20T09:15:00Z" },
  ],
  stageBreakdown: [
    { name: "Applied", value: 62 },
    { name: "Shortlisted", value: 34 },
    { name: "Interview", value: 21 },
    { name: "Offered", value: 12 },
    { name: "Hired", value: 8 },
    { name: "Rejected", value: 19 },
  ],
  funnel: [
    { stage: "Applied", count: 62, pct: 100 },
    { stage: "Shortlisted", count: 34, pct: 55 },
    { stage: "Interview", count: 21, pct: 34 },
    { stage: "Offered", count: 12, pct: 19 },
    { stage: "Hired", count: 8, pct: 13 },
  ],
  backlogBreakdown: [
    { name: "With Backlogs", value: 41 },
    { name: "No Backlogs", value: 115 },
  ],
  sourceBreakdown: [
    { name: "Campus", value: 78 },
    { name: "Referral", value: 39 },
    { name: "Job Portal", value: 27 },
    { name: "Walk-in", value: 12 },
  ],
  trend: [
    { date: "15 Aug", count: 6 },
    { date: "16 Aug", count: 9 },
    { date: "17 Aug", count: 4 },
    { date: "18 Aug", count: 11 },
    { date: "19 Aug", count: 8 },
    { date: "20 Aug", count: 13 },
    { date: "21 Aug", count: 7 },
  ],
  topCompanies: [
    { name: "Tech Solutions Inc.", jobs: 6 },
    { name: "BrightPath Labs", jobs: 4 },
    { name: "Novacore", jobs: 3 },
    { name: "Quantum Retail", jobs: 3 },
    { name: "Meridian Finance", jobs: 2 },
  ],
  topJobs: [
    { title: "Software Engineer", count: 9 },
    { title: "Data Analyst", count: 6 },
    { title: "HR Executive", count: 4 },
    { title: "Sales Executive", count: 3 },
    { title: "UI/UX Designer", count: 2 },
  ],
  recentActivity: [
    { id: "a1", text: "New candidate application received from John Doe", time: "2026-08-21T09:50:00Z" },
    { id: "a2", text: "Aptitude test completed by Jane Smith", time: "2026-08-21T08:40:00Z" },
    { id: "a3", text: "Interview scheduled with Michael Brown", time: "2026-08-21T07:30:00Z" },
    { id: "a4", text: "Offer letter generated for Emily Davis", time: "2026-08-20T15:20:00Z" },
    { id: "a5", text: "New company registered: Tech Solutions Inc.", time: "2026-08-20T11:05:00Z" },
  ],
  upcomingInterviews: [
    { id: "i1", candidate: "John Doe", role: "Software Engineer", interviewer: "Sarah Johnson", scheduledAt: "2026-08-24T10:30:00Z" },
    { id: "i2", candidate: "Ali Smith", role: "Data Analyst", interviewer: "Michael Brown", scheduledAt: "2026-08-25T14:00:00Z" },
    { id: "i3", candidate: "Riya Kapoor", role: "HR Executive", interviewer: "Emily Davis", scheduledAt: "2026-08-27T11:00:00Z" },
  ],
  activitySummary: { newApplications: 24, shortlisted: 11, interviewsScheduled: 7, offersMade: 4, hired: 2 },
  alerts: [
    { id: "al1", severity: "warning", message: "3 candidates with high backlogs applied this week", actionLabel: "Review Now", time: "2026-08-21T09:40:00Z" },
    { id: "al2", severity: "info", message: 'Job "Data Analyst" has 0 applications in 15 days', actionLabel: "Take Action", time: "2026-08-21T08:30:00Z" },
    { id: "al3", severity: "warning", message: "2 interviews are pending feedback", actionLabel: "Give Feedback", time: "2026-08-21T06:10:00Z" },
    { id: "al4", severity: "success", message: "Offer accepted by Ali Smith for Software Engineer", actionLabel: "View Details", time: "2026-08-20T12:00:00Z" },
  ],
  systemInsights: {
    profileCompletion: 84,
    avgTimeToHire: 2.4,
    offerAcceptanceRate: 75,
    activeCompanies: 12,
    totalJobPostings: 28,
    registeredCandidates: 156,
  },
  avgCgpa: 7.85,
  avgResumeScore: 68,
};

// Matches the page keys in App.jsx's `pages` object — clicking a Quick
// Action calls setActivePage(key) to switch the visible page, same as the
// sidebar does.
const QUICK_ACTIONS = [
  { icon: "🏢", label: "Add New Company", color: "#7657E8", page: "corpdb" },
  { icon: "📋", label: "Post New Job", color: "#12A7C7", page: "jobs" },
  { icon: "⬆️", label: "Upload Candidates", color: "#E59A21", page: "candidatedb" },
  { icon: "📅", label: "Schedule Interview", color: "#EC6E9B", page: "interview" },
  { icon: "📄", label: "Generate Offer Letter", color: "#15A878", page: "offers" },
];

export default function AdminDashboard({ setActivePage }) {
  const [stats, setStats] = useState({
    companies: 0,
    recruiters: 0,
    candidates: 0,
    admins: 0,
    openJobs: 0,
  });
  const [pendingUsers, setPendingUsers] = useState([]);
  const [stageBreakdown, setStageBreakdown] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [backlogBreakdown, setBacklogBreakdown] = useState([]);
  const [sourceBreakdown, setSourceBreakdown] = useState([]);
  const [trend, setTrend] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [topJobs, setTopJobs] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [activitySummary, setActivitySummary] = useState({
    newApplications: 0,
    shortlisted: 0,
    interviewsScheduled: 0,
    offersMade: 0,
    hired: 0,
  });
  const [alerts, setAlerts] = useState([]);
  const [systemInsights, setSystemInsights] = useState({
    profileCompletion: 0,
    avgTimeToHire: 0,
    offerAcceptanceRate: 0,
    activeCompanies: 0,
    totalJobPostings: 0,
    registeredCandidates: 0,
  });
  const [avgCgpa, setAvgCgpa] = useState(0);
  const [avgResumeScore, setAvgResumeScore] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);
  const [showApprovalsSummary, setShowApprovalsSummary] = useState(false);

  // Helper: run a query but never blow up the whole dashboard if a
  // column/table referenced doesn't exist yet (schema not migrated).
  async function safeQuery(promise, fallback) {
    try {
      const { data, error } = await promise;
      if (error) throw error;
      return data ?? fallback;
    } catch (e) {
      console.warn("Dashboard query skipped (schema may be missing):", e?.message);
      return fallback;
    }
  }

  function loadDemoData() {
    setLoading(true);
    setError("");
    setStats(DEMO_DATA.stats);
    setPendingUsers(DEMO_DATA.pendingUsers);
    setStageBreakdown(DEMO_DATA.stageBreakdown);
    setFunnel(DEMO_DATA.funnel);
    setBacklogBreakdown(DEMO_DATA.backlogBreakdown);
    setSourceBreakdown(DEMO_DATA.sourceBreakdown);
    setTrend(DEMO_DATA.trend);
    setTopCompanies(DEMO_DATA.topCompanies);
    setTopJobs(DEMO_DATA.topJobs);
    setRecentActivity(DEMO_DATA.recentActivity);
    setUpcomingInterviews(DEMO_DATA.upcomingInterviews);
    setActivitySummary(DEMO_DATA.activitySummary);
    setAlerts(DEMO_DATA.alerts);
    setSystemInsights(DEMO_DATA.systemInsights);
    setAvgCgpa(DEMO_DATA.avgCgpa);
    setAvgResumeScore(DEMO_DATA.avgResumeScore);
    setLoading(false);
  }

  async function loadDashboard() {
    if (DEMO_MODE) {
      loadDemoData();
      return;
    }
    setLoading(true);
    setError("");

    try {
      const [
        { count: companiesCount },
        { count: recruitersCount },
        { count: candidatesCount },
        { count: adminsCount },
        { count: openJobsCount },
        pending,
        allApplications,
        companiesData,
        jobsData,
        recentCandidates,
        candidatesForBacklog,
        candidatesForSource,
        candidatesForCgpa,
        interviewsData,
        alertsData,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "corporate"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "recruiter"),
        supabase.from("candidates").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "admin"),
        supabase.from("job_profiles").select("*", { count: "exact", head: true }),
        safeQuery(
          supabase
            .from("profiles")
            .select("id, email, role, created_at")
            .eq("approved", false)
            .order("created_at", { ascending: false }),
          []
        ),
        safeQuery(
          supabase.from("applications").select("id, stage, created_at, offer_status, hired_at"),
          []
        ),
        safeQuery(supabase.from("job_profiles").select("company, id"), []),
        safeQuery(supabase.from("job_profiles").select("id, title"), []),
        safeQuery(
          supabase
            .from("candidates")
            .select("id, name, created_at")
            .order("created_at", { ascending: false })
            .limit(5),
          []
        ),
        safeQuery(supabase.from("candidates").select("id, backlog_count"), []),
        safeQuery(supabase.from("candidates").select("id, source"), []),
        safeQuery(supabase.from("candidates").select("cgpa, resume_score, profile_completion"), []),
        safeQuery(
          supabase
            .from("applications")
            .select("id, candidate_name, role, interviewer_name, interview_scheduled_at")
            .not("interview_scheduled_at", "is", null)
            .order("interview_scheduled_at", { ascending: true })
            .limit(5),
          []
        ),
        safeQuery(
          supabase.from("admin_alerts").select("*").order("created_at", { ascending: false }).limit(6),
          []
        ),
      ]);

      // ---- Stage breakdown (donut) ----
      const stages = {};
      (allApplications || []).forEach((a) => {
        const s = a.stage || "Applied";
        stages[s] = (stages[s] || 0) + 1;
      });
      setStageBreakdown(Object.entries(stages).map(([name, value]) => ({ name, value })));

      // ---- Recruitment funnel (cumulative drop-off through stages) ----
      const stageIndex = (s) => FUNNEL_ORDER.indexOf(s);
      const funnelCounts = FUNNEL_ORDER.map((stageName, idx) => {
        const count = (allApplications || []).filter((a) => stageIndex(a.stage) >= idx).length;
        return { stage: stageName, count };
      });
      const funnelTotal = funnelCounts[0]?.count || 0;
      setFunnel(
        funnelCounts.map((f) => ({
          ...f,
          pct: funnelTotal ? Math.round((f.count / funnelTotal) * 100) : 0,
        }))
      );

      // ---- Trend (last 7 days) ----
      const days = {};
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
        days[key] = 0;
      }
      (allApplications || []).forEach((a) => {
        const d = new Date(a.created_at);
        const key = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
        if (key in days) days[key] += 1;
      });
      setTrend(Object.entries(days).map(([date, count]) => ({ date, count })));

      // ---- Backlogs ----
      const withBacklog = (candidatesForBacklog || []).filter((c) => (c.backlog_count || 0) > 0).length;
      const noBacklog = (candidatesForBacklog || []).length - withBacklog;
      setBacklogBreakdown(
        (candidatesForBacklog || []).length
          ? [
              { name: "With Backlogs", value: withBacklog },
              { name: "No Backlogs", value: noBacklog },
            ]
          : []
      );

      // ---- Source ----
      const sourceCounts = {};
      (candidatesForSource || []).forEach((c) => {
        const s = c.source || "Other";
        sourceCounts[s] = (sourceCounts[s] || 0) + 1;
      });
      setSourceBreakdown(Object.entries(sourceCounts).map(([name, value]) => ({ name, value })));

      // ---- Avg CGPA / resume score / profile completion ----
      const cgpaVals = (candidatesForCgpa || []).map((c) => c.cgpa).filter((v) => typeof v === "number");
      const resumeVals = (candidatesForCgpa || [])
        .map((c) => c.resume_score)
        .filter((v) => typeof v === "number");
      const completionVals = (candidatesForCgpa || [])
        .map((c) => c.profile_completion)
        .filter((v) => typeof v === "number");
      setAvgCgpa(cgpaVals.length ? (cgpaVals.reduce((a, b) => a + b, 0) / cgpaVals.length).toFixed(2) : 0);
      setAvgResumeScore(
        resumeVals.length ? Math.round(resumeVals.reduce((a, b) => a + b, 0) / resumeVals.length) : 0
      );

      // ---- Top companies ----
      const companyCounts = {};
      (companiesData || []).forEach((j) => {
        const name = j.company || "Unknown";
        companyCounts[name] = (companyCounts[name] || 0) + 1;
      });
      setTopCompanies(
        Object.entries(companyCounts)
          .map(([name, jobs]) => ({ name, jobs }))
          .sort((a, b) => b.jobs - a.jobs)
          .slice(0, 5)
      );

      // ---- Top job profiles ----
      const jobCounts = {};
      (jobsData || []).forEach((j) => {
        const title = j.title || "Untitled";
        jobCounts[title] = (jobCounts[title] || 0) + 1;
      });
      setTopJobs(
        Object.entries(jobCounts)
          .map(([title, count]) => ({ title, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      );

      // ---- Recent activity ----
      setRecentActivity(
        (recentCandidates || []).map((c) => ({
          id: c.id,
          text: `New candidate added: ${c.name}`,
          time: c.created_at,
        }))
      );

      // ---- Upcoming interviews ----
      setUpcomingInterviews(
        (interviewsData || []).map((i) => ({
          id: i.id,
          candidate: i.candidate_name || "—",
          role: i.role || "—",
          interviewer: i.interviewer_name || "—",
          scheduledAt: i.interview_scheduled_at,
        }))
      );

      // ---- Activity summary (this week, derived from applications) ----
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const thisWeekApps = (allApplications || []).filter((a) => new Date(a.created_at) >= weekAgo);
      setActivitySummary({
        newApplications: thisWeekApps.length,
        shortlisted: thisWeekApps.filter((a) => a.stage === "Shortlisted").length,
        interviewsScheduled: thisWeekApps.filter((a) => a.stage === "Interview").length,
        offersMade: thisWeekApps.filter((a) => a.stage === "Offered").length,
        hired: thisWeekApps.filter((a) => a.stage === "Hired" || a.stage === "Selected").length,
      });

      // ---- Alerts ----
      setAlerts(
        (alertsData || []).map((a) => ({
          id: a.id,
          severity: a.severity || "info",
          message: a.message,
          actionLabel: a.action_label,
          time: a.created_at,
        }))
      );

      // ---- System insights ----
      const hiredApps = (allApplications || []).filter((a) => a.hired_at);
      const avgTimeToHire = hiredApps.length
        ? (
            hiredApps.reduce((sum, a) => {
              const created = new Date(a.created_at);
              const hired = new Date(a.hired_at);
              return sum + (hired - created) / (1000 * 60 * 60 * 24);
            }, 0) / hiredApps.length
          ).toFixed(1)
        : 0;
      const offeredApps = (allApplications || []).filter((a) => a.offer_status);
      const acceptedApps = offeredApps.filter((a) => a.offer_status === "accepted");
      const offerAcceptanceRate = offeredApps.length
        ? Math.round((acceptedApps.length / offeredApps.length) * 100)
        : 0;
      setSystemInsights({
        profileCompletion: completionVals.length
          ? Math.round(completionVals.reduce((a, b) => a + b, 0) / completionVals.length)
          : 0,
        avgTimeToHire,
        offerAcceptanceRate,
        activeCompanies: companiesCount ?? 0,
        totalJobPostings: openJobsCount ?? 0,
        registeredCandidates: candidatesCount ?? 0,
      });

      setStats({
        companies: companiesCount ?? 0,
        recruiters: recruitersCount ?? 0,
        candidates: candidatesCount ?? 0,
        admins: adminsCount ?? 0,
        openJobs: openJobsCount ?? 0,
      });
      setPendingUsers(pending || []);
    } catch (err) {
      console.error("Admin dashboard load error:", err);
      setError(err?.message || "Could not load admin dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleApprove(id) {
    setActingId(id);
    if (DEMO_MODE) {
      setPendingUsers((prev) => prev.filter((u) => u.id !== id));
      setActingId(null);
      return;
    }
    const { error } = await supabase.from("profiles").update({ approved: true }).eq("id", id);
    if (error) alert("Could not approve user.");
    else await loadDashboard();
    setActingId(null);
  }

  async function handleReject(id) {
    if (!window.confirm("Reject this pending request?")) return;
    setActingId(id);
    if (DEMO_MODE) {
      setPendingUsers((prev) => prev.filter((u) => u.id !== id));
      setActingId(null);
      return;
    }
    const { error } = await supabase.from("profiles").update({ approved: false, role: "rejected" }).eq("id", id);
    if (error) alert("Could not reject user.");
    else await loadDashboard();
    setActingId(null);
  }

  const totalStageCount = stageBreakdown.reduce((sum, s) => sum + s.value, 0);
  const dateRangeLabel = (() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay()); // Sunday
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${fmt(start)} - ${fmt(end)}, ${end.getFullYear()}`;
  })();
  const totalBacklogCount = backlogBreakdown.reduce((sum, s) => sum + s.value, 0);
  const totalSourceCount = sourceBreakdown.reduce((sum, s) => sum + s.value, 0);
  const totalPendingApprovals = pendingUsers.length;
  const approvedCount = 0; // pending list is only unapproved users; wire real approvals if tracked separately

  return (
    <div className="page active" id="page-admin-dashboard">
      <div className="page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>Admin Dashboard</h1>
          <p>Platform-wide overview · manage companies, recruiters, and approvals</p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 10,
            background: "#fff",
            border: "1px solid var(--border-default, #e5e5e5)",
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--text-default, #333)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          📅 {dateRangeLabel}
        </div>
      </div>

      {error && (
        <div className="panel" style={{ color: "crimson" }}>
          {error}
        </div>
      )}

      {/* STAT CARDS + APPROVALS ROW (left) with QUICK ACTIONS spanning both rows (right) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 12, marginTop: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ ...gridStyle(150), marginTop: 0 }}>
            <StatCard icon="🏢" color="#7657E8" label="Companies" value={loading ? "—" : stats.companies} trend="↑ 100% vs last 30 days" />
            <StatCard icon="👤" color="#12A7C7" label="Recruiters" value={loading ? "—" : stats.recruiters} trend="↑ 100% vs last 30 days" />
            <StatCard icon="💼" color="#15A878" label="Candidates" value={loading ? "—" : stats.candidates} trend="↑ 50% vs last 30 days" />
            <StatCard icon="🛡️" color="#E59A21" label="Admins" value={loading ? "—" : stats.admins} trend="↑ 50% vs last 30 days" />
            <StatCard icon="💳" color="#3E8FD0" label="Active Job Postings" value={loading ? "—" : stats.openJobs} trend="— No change" />
          </div>

          <div style={{ ...gridStyle(240), marginTop: 0 }}>
            <div
              className="panel"
              onClick={() => setShowApprovalsSummary(true)}
              style={{ cursor: "pointer", position: "relative" }}
            >
              <PanelTitle>Approvals Overview</PanelTitle>
              {totalPendingApprovals === 0 && !loading ? (
                <EmptyState message="No pending approvals." />
              ) : (
                <DonutWithLegend
                  data={[
                    { name: "Approved", value: approvedCount, color: "#7657E8" },
                    { name: "Pending", value: totalPendingApprovals, color: "#EC6E9B" },
                  ]}
                  total={totalPendingApprovals + approvedCount}
                />
              )}
            </div>

            <div className="panel">
              <PanelTitle>Recruitment Funnel</PanelTitle>
              {funnel.every((f) => f.count === 0) && !loading ? (
                <EmptyState message="No application data yet." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {funnel.map((f, i) => (
                    <FunnelRow key={f.stage} label={f.stage} count={f.count} pct={f.pct} color={FUNNEL_COLORS[i]} widthPct={f.pct} />
                  ))}
                </div>
              )}
            </div>

            <div className="panel">
              <PanelTitle>Candidates by Backlogs</PanelTitle>
              {backlogBreakdown.length === 0 && !loading ? (
                <EmptyState message="Backlog data not available." />
              ) : (
                <DonutWithLegend
                  data={backlogBreakdown.map((b) => ({
                    ...b,
                    color: b.name === "With Backlogs" ? "#EC6E9B" : "#15A878",
                  }))}
                  total={totalBacklogCount}
                />
              )}
            </div>

            <div className="panel">
              <PanelTitle>Candidates by Source</PanelTitle>
              {sourceBreakdown.length === 0 && !loading ? (
                <EmptyState message="Source data not available." />
              ) : (
                <DonutWithLegend
                  data={sourceBreakdown.map((s) => ({ ...s, color: SOURCE_COLORS[s.name] || "#8A75DB" }))}
                  total={totalSourceCount}
                />
              )}
            </div>
          </div>
        </div>

        <div className="panel" style={{ padding: "14px 12px" }}>
          <PanelTitle>Quick Actions</PanelTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {QUICK_ACTIONS.map((qa) => (
              <QuickActionButton
                key={qa.label}
                icon={qa.icon}
                label={qa.label}
                color={qa.color}
                onClick={() => setActivePage && setActivePage(qa.page)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* AVG CGPA / RESUME SCORE + TOP COMPANIES + TOP JOBS + ACTIVITY SUMMARY */}
      <div style={gridStyle(260)}>
        <div className="panel" style={{ padding: "10px 10px", display: "flex", flexDirection: "column" }}>
          <PanelTitle>Average CGPA / Resume Score</PanelTitle>
          <div style={{ display: "flex", gap: 10, flex: 1, alignItems: "center" }}>
            <MiniStat label="Avg. CGPA" value={loading ? "—" : avgCgpa} />
            <MiniStat label="Avg Resume Score" value={loading ? "—" : `${avgResumeScore}/100`} />
          </div>
        </div>

        <div className="panel" style={{ padding: "10px 10px" }}>
          <PanelTitle>Top Companies</PanelTitle>
          {topCompanies.length === 0 && !loading ? (
            <EmptyState message="No companies yet." />
          ) : (
            <SimpleTable
              headers={["Company", "Open Positions"]}
              rows={topCompanies.map((c) => [c.name, c.jobs])}
            />
          )}
        </div>

        <div className="panel" style={{ padding: "10px 10px" }}>
          <PanelTitle>Top Job Profiles</PanelTitle>
          {topJobs.length === 0 && !loading ? (
            <EmptyState message="No job profiles yet." />
          ) : (
            <SimpleTable
              headers={["Job Profile", "Postings"]}
              rows={topJobs.map((j) => [j.title, j.count])}
            />
          )}
        </div>

        <div className="panel" style={{ padding: "10px 10px" }}>
          <PanelTitle>Activity Summary (This Week)</PanelTitle>
          <ActivityRow label="New Applications" value={activitySummary.newApplications} icon="📥" />
          <ActivityRow label="Shortlisted" value={activitySummary.shortlisted} icon="👤" />
          <ActivityRow label="Interviews Scheduled" value={activitySummary.interviewsScheduled} icon="🗓️" />
          <ActivityRow label="Offers Made" value={activitySummary.offersMade} icon="📄" />
          <ActivityRow label="Hired" value={activitySummary.hired} icon="🏆" />
        </div>
      </div>
      <style>{`.data-table th, .data-table td { padding: 4px 6px; }`}</style>

      {/* UPCOMING INTERVIEWS + RECENT ACTIVITY + ALERTS */}
      <div style={gridStyle(300)}>
        <div className="panel">
          <PanelTitle>Upcoming Interviews</PanelTitle>
          {upcomingInterviews.length === 0 && !loading ? (
            <EmptyState message="No interviews scheduled." />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table" style={{ width: "100%", minWidth: 420 }}>
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Role</th>
                    <th>Interviewer</th>
                    <th>Scheduled On</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingInterviews.map((i) => (
                    <tr key={i.id}>
                      <td>{i.candidate}</td>
                      <td>{i.role}</td>
                      <td>{i.interviewer}</td>
                      <td>
                        {i.scheduledAt
                          ? new Date(i.scheduledAt).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel">
          <PanelTitle>Recent Activity</PanelTitle>
          {recentActivity.length === 0 && !loading ? (
            <EmptyState message="No recent activity." />
          ) : (
            <div>
              {recentActivity.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid var(--border-default, #eee)",
                    fontSize: 12.5,
                  }}
                >
                  <span>{a.text}</span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {a.time ? new Date(a.time).toLocaleDateString("en-GB") : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <PanelTitle>Alerts &amp; Notifications</PanelTitle>
          {alerts.length === 0 && !loading ? (
            <EmptyState message="No alerts." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {alerts.map((a) => {
                const s = SEVERITY_STYLE[a.severity] || SEVERITY_STYLE.info;
                return (
                  <div
                    key={a.id}
                    style={{
                      background: s.bg,
                      borderRadius: 8,
                      padding: "8px 10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 12.5, color: s.color }}>
                      {s.icon} {a.message}
                    </span>
                    {a.actionLabel && (
                      <button
                        className="btn-outline"
                        style={{ padding: "3px 8px", fontSize: 11, whiteSpace: "nowrap" }}
                      >
                        {a.actionLabel}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SYSTEM INSIGHTS */}
      <div className="panel" style={{ marginTop: 20 }}>
        <PanelTitle>System Insights</PanelTitle>
        <div style={gridStyle(150)}>
          <MiniStat icon="🛡️" color="#7657E8" label="Profile Completion" value={loading ? "—" : `${systemInsights.profileCompletion}%`} trend="↑ 8% vs last month" />
          <MiniStat icon="⏱️" color="#12A7C7" label="Avg. Time to Hire" value={loading ? "—" : `${systemInsights.avgTimeToHire} days`} trend="↓ 0.6 days vs last month" />
          <MiniStat icon="🛡️" color="#15A878" label="Offer Acceptance Rate" value={loading ? "—" : `${systemInsights.offerAcceptanceRate}%`} trend="↑ 5% vs last month" />
          <MiniStat icon="👥" color="#E59A21" label="Active Companies" value={loading ? "—" : systemInsights.activeCompanies} trend="↑ 1 vs last month" />
          <MiniStat icon="📄" color="#3E8FD0" label="Total Job Postings" value={loading ? "—" : systemInsights.totalJobPostings} trend="↑ 3 vs last month" />
          <MiniStat icon="👤" color="#EC6E9B" label="Registered Candidates" value={loading ? "—" : systemInsights.registeredCandidates} trend="↑ 14 vs last month" />
        </div>
      </div>

      {showApprovalsSummary && (
        <ApprovalsSummaryModal
          approved={approvedCount}
          pending={totalPendingApprovals}
          pendingUsers={pendingUsers}
          onClose={() => setShowApprovalsSummary(false)}
          onGoToUserManagement={() => {
            setShowApprovalsSummary(false);
            setActivePage && setActivePage("usermanagement");
          }}
        />
      )}
    </div>
  );
}

/* ---------------------------- shared UI bits ---------------------------- */

function ApprovalsSummaryModal({ approved, pending, pendingUsers, onClose, onGoToUserManagement }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel"
        style={{ width: 340, maxWidth: "90vw", padding: 18 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <PanelTitle>Approvals Summary</PanelTitle>
          <button
            onClick={onClose}
            style={{ border: "none", background: "none", fontSize: 16, cursor: "pointer", color: "var(--text-muted)" }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <MiniStat label="Approved" value={approved} />
          <MiniStat label="Pending" value={pending} />
        </div>

        {pending > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>
              Awaiting approval
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto" }}>
              {pendingUsers.slice(0, 5).map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    padding: "4px 0",
                    borderBottom: "1px solid var(--border-default, #eee)",
                  }}
                >
                  <span>{u.email}</span>
                  <span style={{ textTransform: "capitalize", color: "var(--text-muted)" }}>{u.role}</span>
                </div>
              ))}
              {pendingUsers.length > 5 && (
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>+{pendingUsers.length - 5} more</div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={onGoToUserManagement}
          style={{
            width: "100%",
            padding: "9px 12px",
            borderRadius: 8,
            border: "none",
            background: "#7657E8",
            color: "#fff",
            fontWeight: 600,
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          Go to User Management
        </button>
      </div>
    </div>
  );
}

function gridStyle(minWidth) {
  return {
    display: "grid",
    gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
    gap: 12,
    marginTop: 14,
  };
}

function PanelTitle({ children }) {
  return <div className="panel-title" style={{ marginBottom: 8, fontSize: 13.5 }}>{children}</div>;
}

function StatCard({ icon, color = "#7657E8", label, value, trend }) {
  const isDown = trend?.startsWith("↓");
  const isFlat = trend?.startsWith("—");
  const trendColor = isFlat ? "var(--text-muted)" : isDown ? "#C0392B" : "#15A878";
  return (
    <div
      className="panel"
      style={{
        position: "relative",
        padding: "18px 16px 14px",
        overflow: "hidden",
        borderTop: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${color}, ${color}55)`,
        }}
      />
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      <div
        style={{
          fontSize: 10.5,
          color: "var(--text-muted)",
          marginTop: 6,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      {trend && (
        <div style={{ fontSize: 10.5, color: trendColor, fontWeight: 600, marginTop: 8 }}>{trend}</div>
      )}
    </div>
  );
}

function MiniStat({ icon, color = "#7657E8", label, value, trend }) {
  if (!icon) {
    return (
      <div className="panel" style={{ textAlign: "center", padding: "10px 8px", flex: 1 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "var(--primary)" }}>{value}</div>
        <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
      </div>
    );
  }
  const isDown = trend?.startsWith("↓");
  const isFlat = trend?.startsWith("—");
  const trendColor = isFlat ? "var(--text-muted)" : isDown ? "#C0392B" : "#15A878";
  return (
    <div className="panel" style={{ padding: "12px 14px", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: 10,
            background: `${color}18`,
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-default, #222)", lineHeight: 1.1 }}>{value}</div>
          <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
        </div>
      </div>
      {trend && <div style={{ fontSize: 10, color: trendColor, fontWeight: 600, marginTop: 8 }}>{trend}</div>}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 12.5 }}>
      {message}
    </div>
  );
}

function DonutWithLegend({ data, total }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 120, height: 120, position: "relative", flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={35} outerRadius={58} paddingAngle={2}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800 }}>{total}</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Total</div>
        </div>
      </div>
      <div style={{ flex: 1, fontSize: 12.5, minWidth: 0 }}>
        {data.map((s) => (
          <div key={s.name} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              {s.name}
            </span>
            <span style={{ fontWeight: 600 }}>
              {s.value} ({total ? Math.round((s.value / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FunnelRow({ label, count, pct, widthPct, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 78, fontSize: 11.5, color: "var(--text-muted)" }}>{label}</div>
      <div style={{ flex: 1, background: "#f1f1f1", borderRadius: 6, height: 22, position: "relative" }}>
        <div
          style={{
            width: `${Math.max(widthPct, 4)}%`,
            height: "100%",
            background: color,
            borderRadius: 6,
            transition: "width 0.3s",
          }}
        />
      </div>
      <div style={{ width: 76, fontSize: 11.5, fontWeight: 600, textAlign: "right" }}>
        {count} ({pct}%)
      </div>
    </div>
  );
}

function SimpleTable({ headers, rows }) {
  return (
    <table className="data-table" style={{ width: "100%", fontSize: 12 }}>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} style={{ padding: "4px 6px" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} style={{ padding: "3px 6px" }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ActivityRow({ label, value, icon }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12 }}>
      <span>
        {icon} {label}
      </span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function QuickActionButton({ icon, label, color = "#7657E8", onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        fontSize: 12.5,
        fontWeight: 600,
        textAlign: "left",
        borderRadius: 10,
        width: "100%",
        border: `1px solid ${hover ? color : "var(--border-default, #e5e5e5)"}`,
        background: hover ? `${color}12` : "#fff",
        color: hover ? color : "var(--text-default, #333)",
        cursor: "pointer",
        transition: "all 0.15s ease",
        boxShadow: hover ? `0 2px 8px ${color}22` : "none",
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 26,
          height: 26,
          borderRadius: 8,
          background: `${color}18`,
          fontSize: 13,
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      <span
        style={{
          fontSize: 13,
          color,
          opacity: hover ? 1 : 0.4,
          transform: hover ? "translateX(2px)" : "translateX(0)",
          transition: "all 0.15s ease",
        }}
      >
        →
      </span>
    </button>
  );
}