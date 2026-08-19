import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  getUpcomingDrives,
  addDrive,
  deleteDrive,
  getColleges,
} from "../lib/api";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import "./Dashboard.css";

const CHART_COLORS = [
  "#7657E8",
  "#12A7C7",
  "#E59A21",
  "#EC6E9B",
  "#15A878",
  "#8A75DB",
];

const stageBadgeClass = {
  "Resume Review": "gray",
  Aptitude: "gold",
  GD: "gold",
  Interview: "blue",
  Selected: "green",
  Rejected: "gray",
};

export default function Dashboard() {
  const [mode, setMode] = useState("inhouse");
  const isInhouse = mode === "inhouse";

  const [stats, setStats] = useState({
    colleges: 0,
    resumes: 0,
    selections: 0,
    joined: 0,
  });

  const [corpStats, setCorpStats] = useState({
    companies: 0,
    companyNames: [],
    positions: 0,
    selections: 0,
    selectionsThisWeek: 0,
    joined: 0,
    conversion: 0,
  });

  const [applications, setApplications] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [stageBreakdown, setStageBreakdown] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [drives, setDrives] = useState([]);
  const [drivesLoading, setDrivesLoading] = useState(true);
  const [showDriveForm, setShowDriveForm] = useState(false);

  const [driveForm, setDriveForm] = useState({
    title: "",
    type: "Aptitude Test",
    scheduled_at: "",
    college_id: "",
    notes: "",
  });

  const [colleges, setColleges] = useState([]);
  const [savingDrive, setSavingDrive] = useState(false);
  const [driveError, setDriveError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const [minDateTime] = useState(() =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16),
  );

  async function loadDrives() {
    setDrivesLoading(true);

    try {
      const data = await getUpcomingDrives();
      setDrives(data);
    } catch (err) {
      console.error("Load drives error:", err);
    } finally {
      setDrivesLoading(false);
    }
  }

  async function handleAddDrive(event) {
    event.preventDefault();
    setDriveError("");

    if (!driveForm.title || !driveForm.scheduled_at) {
      setDriveError("Title and date/time are required.");
      return;
    }

    const selectedDate = new Date(driveForm.scheduled_at);

    if (selectedDate.getTime() < Date.now()) {
      setDriveError("Date and time cannot be in the past.");
      return;
    }

    setSavingDrive(true);

    try {
      await addDrive(driveForm);

      setDriveForm({
        title: "",
        type: "Aptitude Test",
        scheduled_at: "",
        college_id: "",
        notes: "",
      });

      setShowDriveForm(false);
      await loadDrives();
    } catch (err) {
      setDriveError(err.message || "Could not save the drive.");
    } finally {
      setSavingDrive(false);
    }
  }

  async function handleDeleteDrive(id) {
    if (!window.confirm("Cancel this drive?")) return;

    setDeletingId(id);

    try {
      await deleteDrive(id);
      setDrives((previous) => previous.filter((drive) => drive.id !== id));
    } catch (err) {
      console.error("Delete drive error:", err);
      window.alert("Could not cancel the drive. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function loadDashboardData() {
      setLoading(true);
      setError("");

      try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const [
          { count: collegesCount, error: collegesError },
          { count: resumesCount, error: resumesError },
          { count: selectionsCount, error: selectionsError },
          { count: joinedCount, error: joinedError },
          { data: recentApplications, error: applicationsError },
          { count: companiesCount, error: companiesError },
          { data: companyRows, error: companyRowsError },
          { count: positionsCount, error: positionsError },
          {
            count: selectionsThisWeekCount,
            error: selectionsThisWeekError,
          },
        ] = await Promise.all([
          supabase.from("colleges").select("*", {
            count: "exact",
            head: true,
          }),

          supabase.from("candidates").select("*", {
            count: "exact",
            head: true,
          }),

          supabase
            .from("applications")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("stage", "Selected"),

          supabase
            .from("joining")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("status", "Joined"),

          supabase
            .from("applications")
            .select(
              "id, stage, resume_score, candidates(name, colleges(name)), job_profiles(title)",
            )
            .order("created_at", { ascending: false })
            .limit(4),

          supabase.from("companies").select("*", {
            count: "exact",
            head: true,
          }),

          supabase
            .from("companies")
            .select("name")
            .order("created_at", { ascending: false })
            .limit(2),

          supabase.from("job_profiles").select("*", {
            count: "exact",
            head: true,
          }),

          supabase
            .from("applications")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("stage", "Selected")
            .gte("created_at", oneWeekAgo.toISOString()),
        ]);

        const { data: allApplications, error: allApplicationsError } =
          await supabase
            .from("applications")
            .select("created_at, stage")
            .order("created_at", { ascending: true });

        if (
          collegesError ||
          resumesError ||
          selectionsError ||
          joinedError ||
          applicationsError ||
          companiesError ||
          companyRowsError ||
          positionsError ||
          selectionsThisWeekError ||
          allApplicationsError
        ) {
          throw (
            collegesError ||
            resumesError ||
            selectionsError ||
            joinedError ||
            applicationsError ||
            companiesError ||
            companyRowsError ||
            positionsError ||
            selectionsThisWeekError ||
            allApplicationsError
          );
        }

        if (ignore) return;

        const weeks = {};
        const stages = {};

        (allApplications || []).forEach((application) => {
          const date = new Date(application.created_at);
          const weekStart = new Date(date);

          weekStart.setDate(date.getDate() - date.getDay());

          const weekKey = weekStart.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
          });

          weeks[weekKey] = (weeks[weekKey] || 0) + 1;

          const stage = application.stage || "Unknown";
          stages[stage] = (stages[stage] || 0) + 1;
        });

        setGrowthData(
          Object.entries(weeks)
            .slice(-8)
            .map(([week, count]) => ({
              week,
              count,
            })),
        );

        setStageBreakdown(
          Object.entries(stages).map(([name, value]) => ({
            name,
            value,
          })),
        );

        const totalSelections = selectionsCount ?? 0;
        const totalJoined = joinedCount ?? 0;

        const conversion =
          totalSelections > 0
            ? Math.round((totalJoined / totalSelections) * 100)
            : 0;

        setStats({
          colleges: collegesCount ?? 0,
          resumes: resumesCount ?? 0,
          selections: totalSelections,
          joined: totalJoined,
        });

        setApplications(recentApplications ?? []);

        setCorpStats({
          companies: companiesCount ?? 0,
          companyNames: (companyRows ?? []).map((company) => company.name),
          positions: positionsCount ?? 0,
          selections: totalSelections,
          selectionsThisWeek: selectionsThisWeekCount ?? 0,
          joined: totalJoined,
          conversion,
        });
      } catch (err) {
        console.error("Dashboard load error:", err);

        if (!ignore) {
          setError(
            "Could not load dashboard data. Check your Supabase connection.",
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    async function initDashboard() {
      setDrivesLoading(true);

      try {
        const upcomingDrives = await getUpcomingDrives();

        if (!ignore) {
          setDrives(upcomingDrives);
        }
      } catch (err) {
        console.error("Upcoming drives error:", err);
      } finally {
        if (!ignore) {
          setDrivesLoading(false);
        }
      }

      try {
        const collegeRows = await getColleges();

        if (!ignore) {
          setColleges(collegeRows);
        }
      } catch (err) {
        console.error("Colleges error:", err);
      }
    }

    loadDashboardData();
    initDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="dashboard-page" id="page-dashboard">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-kicker">SAARTHI ANALYTICS</p>

          <h1>Recruitment Dashboard</h1>

          <p>
            Track campus and corporate drives from job posting to joining.
          </p>
        </div>

        <div className="mode-toggle" aria-label="Dashboard mode">
          <button
            className={`mode-btn ${isInhouse ? "active" : ""}`}
            onClick={() => setMode("inhouse")}
          >
            In-house
          </button>

          <button
            className={`mode-btn ${!isInhouse ? "active" : ""}`}
            onClick={() => setMode("corporate")}
          >
            Corporate
          </button>
        </div>
      </header>

      {error && <div className="dashboard-error">{error}</div>}

      {isInhouse ? (
        <div className="dashboard-stat-grid">
          <StatCard
            value={loading ? "—" : stats.colleges}
            label="Colleges Engaged"
            tone="purple"
          />

          <StatCard
            value={loading ? "—" : stats.resumes}
            label="Resumes Received"
            tone="cyan"
          />

          <StatCard
            value={loading ? "—" : stats.selections}
            label="Final Selections"
            tone="orange"
          />

          <StatCard
            value={loading ? "—" : stats.joined}
            label="Joined"
            tone="green"
          />
        </div>
      ) : (
        <div className="dashboard-stat-grid">
          <StatCard
            value={loading ? "—" : corpStats.companies}
            label="Active Companies"
            helper={
              loading
                ? "Loading..."
                : corpStats.companyNames.join(", ") || "No companies yet"
            }
            tone="purple"
          />

          <StatCard
            value={loading ? "—" : corpStats.positions}
            label="Open Positions"
            helper={
              loading ? "Loading..." : `Across ${corpStats.positions} JDs`
            }
            tone="cyan"
          />

          <StatCard
            value={loading ? "—" : corpStats.selections}
            label="Final Selections"
            helper={
              loading
                ? "Loading..."
                : `▲ ${corpStats.selectionsThisWeek} this week`
            }
            tone="orange"
          />

          <StatCard
            value={loading ? "—" : corpStats.joined}
            label="Joined"
            helper={
              loading ? "Loading..." : `${corpStats.conversion}% conversion`
            }
            tone="green"
          />
        </div>
      )}

      <section className="dashboard-panel pipeline-panel">
        <div className="dashboard-panel-title">
          {isInhouse
            ? "In-house Recruitment Pipeline"
            : "Corporate Recruitment Pipeline"}
        </div>

        <div className="dashboard-panel-subtitle">
          {isInhouse
            ? "Campus DB → Requirements → JD → College Email → Resumes → Analysis → Assessments → Interviews → Selection → Offer → Joining → Report"
            : "Client Requirement → Sourcing → Screening → Client Submission → Interview → Selection → Offer → Joining → Report"}
        </div>

        <div className="pipeline-track">
          {(isInhouse
            ? [
                "Campus DB",
                "Requirements",
                "JD",
                "Resumes",
                "Assessments",
                "Interview",
                "Selection",
                "Joining",
              ]
            : [
                "Requirement",
                "Sourcing",
                "Screening",
                "Submission",
                "Interview",
                "Selection",
                "Offer",
                "Joining",
              ]
          ).map((stage, index) => (
            <div className="pipeline-step" key={stage}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{stage}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-chart-card growth-card">
        <div className="chart-heading">
          <div>
            <div className="dashboard-panel-title">
              Applications Growth
            </div>
            <div className="chart-caption">
              Applications received by week
            </div>
          </div>

          <span className="chart-chip">Last 8 weeks</span>
        </div>

        <div className="growth-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={growthData}
              margin={{
                top: 10,
                right: 15,
                left: -20,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--dash-border)"
              />

              <XAxis
                dataKey="week"
                tick={{
                  fontSize: 10,
                  fill: "var(--dash-muted)",
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{
                  fontSize: 10,
                  fill: "var(--dash-muted)",
                }}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip content={<DashboardTooltip />} />

              <Line
                type="monotone"
                dataKey="count"
                name="Applications"
                stroke="#7657E8"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: "#7657E8",
                  stroke: "var(--dash-surface)",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="dashboard-grid-two">
        <div className="dashboard-chart-card mini-chart-card">
          <div className="chart-heading">
            <div>
              <div className="dashboard-panel-title">
                Candidates by Stage
              </div>
              <div className="chart-caption">
                Current recruitment pipeline
              </div>
            </div>
          </div>

          <div className="mini-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stageBreakdown}
                margin={{
                  top: 10,
                  right: 10,
                  left: -20,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--dash-border)"
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 9,
                    fill: "var(--dash-muted)",
                  }}
                  angle={-15}
                  textAnchor="end"
                  height={48}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{
                    fontSize: 10,
                    fill: "var(--dash-muted)",
                  }}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip content={<DashboardTooltip />} />

                <Bar dataKey="value" name="Candidates" radius={[7, 7, 0, 0]}>
                  {stageBreakdown.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-chart-card mini-chart-card">
          <div className="chart-heading">
            <div>
              <div className="dashboard-panel-title">
                Stage Distribution
              </div>
              <div className="chart-caption">
                Share of all applications
              </div>
            </div>
          </div>

          <div className="mini-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stageBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={76}
                  innerRadius={42}
                  paddingAngle={3}
                  label={false}
                >
                  {stageBreakdown.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip content={<DashboardTooltip />} />

                <Legend
                  wrapperStyle={{
                    fontSize: 10,
                    color: "var(--dash-muted)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="dashboard-grid-two dashboard-bottom-grid">
        <div className="dashboard-panel applications-panel">
          <div className="dashboard-section-heading">
            <div>
              <div className="dashboard-panel-title">
                Recent Applications
              </div>

              <div className="chart-caption">
                Latest candidate activity
              </div>
            </div>

            <span className="section-icon">↗</span>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Campus</th>
                  <th>Applied For</th>
                  <th>Stage</th>
                  <th>Score</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5}>Loading...</td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No applications yet.</td>
                  </tr>
                ) : (
                  applications.map((application) => (
                    <tr key={application.id}>
                      <td>
                        <div className="candidate-cell">
                          <span className="candidate-avatar">
                            {(application.candidates?.name || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </span>

                          <span>
                            {application.candidates?.name || "—"}
                          </span>
                        </div>
                      </td>

                      <td>
                        {application.candidates?.colleges?.name || "—"}
                      </td>

                      <td>{application.job_profiles?.title || "—"}</td>

                      <td>
                        <span
                          className={`badge ${
                            stageBadgeClass[application.stage] || "gray"
                          }`}
                        >
                          {application.stage}
                        </span>
                      </td>

                      <td>{application.resume_score ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-panel drives-panel">
          <div className="dashboard-section-heading">
            <div>
              <div className="dashboard-panel-title">
                Upcoming Drives
              </div>

              <div className="chart-caption">
                Schedule and manage recruitment events
              </div>
            </div>

            <button
              className="btn-outline"
              onClick={() => setShowDriveForm((value) => !value)}
            >
              {showDriveForm ? "Cancel" : "+ Schedule"}
            </button>
          </div>

          {showDriveForm && (
            <form className="drive-form" onSubmit={handleAddDrive}>
              <div className="field">
                <label>Title *</label>
                <input
                  value={driveForm.title}
                  onChange={(event) =>
                    setDriveForm({
                      ...driveForm,
                      title: event.target.value,
                    })
                  }
                  placeholder="e.g. SVCE Campus Drive"
                  required
                />
              </div>

              <div className="field">
                <label>Type *</label>
                <select
                  value={driveForm.type}
                  onChange={(event) =>
                    setDriveForm({
                      ...driveForm,
                      type: event.target.value,
                    })
                  }
                >
                  <option value="Aptitude Test">Aptitude Test</option>
                  <option value="GD Round">GD Round</option>
                  <option value="Interview">Interview</option>
                  <option value="Offer Rollout">Offer Rollout</option>
                  <option value="Campus Visit">Campus Visit</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="field">
                <label>Date & Time *</label>
                <input
                  type="datetime-local"
                  value={driveForm.scheduled_at}
                  min={minDateTime}
                  onChange={(event) =>
                    setDriveForm({
                      ...driveForm,
                      scheduled_at: event.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="field">
                <label>College</label>
                <select
                  value={driveForm.college_id}
                  onChange={(event) =>
                    setDriveForm({
                      ...driveForm,
                      college_id: event.target.value,
                    })
                  }
                >
                  <option value="">Optional...</option>

                  {colleges.map((college) => (
                    <option key={college.id} value={college.id}>
                      {college.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Notes</label>
                <textarea
                  rows={2}
                  value={driveForm.notes}
                  onChange={(event) =>
                    setDriveForm({
                      ...driveForm,
                      notes: event.target.value,
                    })
                  }
                  placeholder="Optional details for the team..."
                />
              </div>

              {driveError && (
                <p className="drive-error">{driveError}</p>
              )}

              <button
                className="btn-primary"
                type="submit"
                disabled={savingDrive}
              >
                {savingDrive ? "Saving..." : "Save Drive"}
              </button>
            </form>
          )}

          <div className="drive-list">
            {drivesLoading ? (
              <p className="empty-state">Loading drives...</p>
            ) : drives.length === 0 ? (
              <p className="empty-state">No upcoming drives scheduled.</p>
            ) : (
              drives.map((drive) => (
                <div className="timeline-item" key={drive.id}>
                  <div className="timeline-marker">
                    <span className="timeline-dot" />
                    <span className="timeline-line" />
                  </div>

                  <div className="timeline-content">
                    <div className="timeline-top">
                      <div>
                        <div className="timeline-title">
                          {drive.title}
                        </div>

                        <div className="timeline-meta">
                          {drive.type}
                          {drive.colleges?.name
                            ? ` · ${drive.colleges.name}`
                            : ""}
                        </div>
                      </div>

                      <button
                        className="cancel-drive-button"
                        onClick={() => handleDeleteDrive(drive.id)}
                        disabled={deletingId === drive.id}
                      >
                        {deletingId === drive.id ? "..." : "Cancel"}
                      </button>
                    </div>

                    <div className="timeline-date">
                      {new Date(
                        drive.scheduled_at,
                      ).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}

                      {" · "}

                      {new Date(
                        drive.scheduled_at,
                      ).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>

                    {drive.notes && (
                      <div className="timeline-notes">
                        {drive.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ value, label, helper, tone = "purple" }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-decoration" />

      <div className="stat-icon">
        {tone === "purple"
          ? "✦"
          : tone === "cyan"
            ? "↗"
            : tone === "orange"
              ? "◈"
              : "✓"}
      </div>

      <div className="num">{value}</div>
      <div className="lbl">{label}</div>

      {helper && <div className="delta">{helper}</div>}
    </article>
  );
}

function DashboardTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="dashboard-tooltip">
      <div className="tooltip-label">{label}</div>
      <div className="tooltip-value">
        {payload[0].name}: {payload[0].value}
      </div>
    </div>
  );
}