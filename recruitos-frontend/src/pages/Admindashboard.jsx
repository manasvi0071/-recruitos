import { useMemo, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import "./AdminDashboard.css";

function AdminDashboard() {
  // State Management
  const [profileFilter, setProfileFilter] = useState("All Profiles");
  const [collegeFilter, setCollegeFilter] = useState("All Colleges");
  const [companyFilter, setCompanyFilter] = useState("All Corporates");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [view, setView] = useState("college");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data State
  const [candidates, setCandidates] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch candidates
        const { data: candidatesData, error: candidatesError } = await supabase
          .from("candidates")
          .select("*");

        if (candidatesError) throw candidatesError;

        // Fetch requirements
        const { data: requirementsData, error: requirementsError } = await supabase
          .from("requirements")
          .select("*");

        if (requirementsError) throw requirementsError;

        // Fetch monthly data
        const { data: monthlyDataPoints, error: monthlyError } = await supabase
          .from("monthly_recruitment")
          .select("*")
          .order("month_order", { ascending: true });

        if (monthlyError) throw monthlyError;

        setCandidates(candidatesData || []);
        setRequirements(requirementsData || []);
        setMonthlyData(monthlyDataPoints || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Computed values
  const profiles = useMemo(
    () => [...new Set(candidates.map((item) => item.profile).filter(Boolean))],
    [candidates]
  );

  const colleges = useMemo(
    () => [...new Set(candidates.map((item) => item.college).filter(Boolean))],
    [candidates]
  );

  const companies = useMemo(
    () => [...new Set(requirements.map((item) => item.company).filter(Boolean))],
    [requirements]
  );

  const statuses = ["Joined", "Selected", "Interview", "Shortlisted"];

  // Filtering logic
  const filteredCandidates = candidates.filter((candidate) => {
    const profileMatch =
      profileFilter === "All Profiles" || candidate.profile === profileFilter;
    const collegeMatch =
      collegeFilter === "All Colleges" || candidate.college === collegeFilter;
    const statusMatch =
      statusFilter === "All Status" || candidate.status === statusFilter;

    return profileMatch && collegeMatch && statusMatch;
  });

  const filteredRequirements = requirements.filter((requirement) => {
    const profileMatch =
      profileFilter === "All Profiles" || requirement.profile === profileFilter;
    const companyMatch =
      companyFilter === "All Corporates" || requirement.company === companyFilter;

    return profileMatch && companyMatch;
  });

  // KPI Calculations
  const totalCandidates = filteredCandidates.length;
  const selectedCandidates = filteredCandidates.filter(
    (item) => item.status === "Selected"
  ).length;
  const joinedCandidates = filteredCandidates.filter(
    (item) => item.status === "Joined"
  ).length;
  const shortlistedCandidates = filteredCandidates.filter(
    (item) => item.status === "Shortlisted"
  ).length;
  const interviewCandidates = filteredCandidates.filter(
    (item) => item.status === "Interview"
  ).length;

  const activeRequirements = filteredRequirements.filter(
    (item) => item.status === "Active"
  ).length;

  const fulfilledRequirements = filteredRequirements.filter(
    (item) => item.status === "Fulfilled"
  ).length;

  const pendingRequirements = filteredRequirements.filter(
    (item) => item.status === "Pending"
  ).length;

  const totalShared = filteredRequirements.reduce(
    (sum, item) => sum + (item.candidates_shared || 0),
    0
  );

  const totalCorporateSelected = filteredRequirements.reduce(
    (sum, item) => sum + (item.selected || 0),
    0
  );

  // Helper functions
  const resetFilters = () => {
    setProfileFilter("All Profiles");
    setCollegeFilter("All Colleges");
    setCompanyFilter("All Corporates");
    setStatusFilter("All Status");
  };

  const maxMonthlyValue = monthlyData.length
    ? Math.max(
        ...monthlyData.map((item) => (item.college || 0) + (item.shared || 0))
      )
    : 1;

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div style={{ padding: "40px", textAlign: "center", color: "#7c8595" }}>
          Loading dashboard data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div style={{ padding: "40px", textAlign: "center", color: "#d32f2f" }}>
          Error loading data: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* HEADER */}
      <header className="header">
        <div>
          <h1>Saarthi Admin Dashboard</h1>
          <p>Complete recruitment and corporate overview</p>
        </div>

        <div className="admin-info">
          <div className="live">
            <span></span>
            Live
          </div>

          <div className="admin-user">
            <div className="avatar">A</div>
            <div>
              <strong>Admin</strong>
              <small>Administrator</small>
            </div>
          </div>
        </div>
      </header>

      {/* FILTERS */}
      <section className="filters">
        <div className="filter">
          <label>Job Profile</label>
          <select
            value={profileFilter}
            onChange={(e) => setProfileFilter(e.target.value)}
          >
            <option>All Profiles</option>
            {profiles.map((profile) => (
              <option key={profile}>{profile}</option>
            ))}
          </select>
        </div>

        <div className="filter">
          <label>College</label>
          <select
            value={collegeFilter}
            onChange={(e) => setCollegeFilter(e.target.value)}
          >
            <option>All Colleges</option>
            {colleges.map((college) => (
              <option key={college}>{college}</option>
            ))}
          </select>
        </div>

        <div className="filter">
          <label>Corporate</label>
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
          >
            <option>All Corporates</option>
            {companies.map((company) => (
              <option key={company}>{company}</option>
            ))}
          </select>
        </div>

        <div className="filter">
          <label>Candidate Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Status</option>
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>

        <button className="reset" onClick={resetFilters}>
          Reset
        </button>
      </section>

      {/* KPI CARDS */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-symbol">👥</div>
          <div>
            <span>Total Candidates</span>
            <h2>{totalCandidates}</h2>
            <small>Current filtered view</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-symbol">🏢</div>
          <div>
            <span>Corporate Requirements</span>
            <h2>{filteredRequirements.length}</h2>
            <small>{activeRequirements} active</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-symbol">📤</div>
          <div>
            <span>Candidates Shared</span>
            <h2>{totalShared}</h2>
            <small>With corporate clients</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-symbol">🎯</div>
          <div>
            <span>Selected</span>
            <h2>{selectedCandidates + totalCorporateSelected}</h2>
            <small>{selectedCandidates} candidate status selected</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-symbol">✓</div>
          <div>
            <span>Joined</span>
            <h2>{joinedCandidates}</h2>
            <small>Final joining status</small>
          </div>
        </div>
      </section>

      {/* MAIN DASHBOARD */}
      <main className="dashboard-grid">
        {/* MONTHLY ACTIVITY */}
        <section className="card monthly-card">
          <div className="card-heading">
            <div>
              <h3>Monthly Recruitment Activity</h3>
              <p>College candidates and candidates shared with corporates</p>
            </div>

            <div className="legend">
              <span>
                <i className="legend-college"></i>
                College
              </span>
              <span>
                <i className="legend-shared"></i>
                Corporate Shared
              </span>
            </div>
          </div>

          <div className="bar-chart">
            {monthlyData.map((item) => {
              const collegeHeight =
                ((item.college || 0) / maxMonthlyValue) * 100;
              const sharedHeight =
                ((item.shared || 0) / maxMonthlyValue) * 100;

              return (
                <div className="bar-column" key={item.id || item.month}>
                  <div className="bars">
                    <div
                      className="bar college-bar"
                      style={{ height: `${collegeHeight}%` }}
                      title={`College: ${item.college || 0}`}
                    ></div>

                    <div
                      className="bar shared-bar"
                      style={{ height: `${sharedHeight}%` }}
                      title={`Shared: ${item.shared || 0}`}
                    ></div>
                  </div>

                  <span>{item.month}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* RECRUITMENT FUNNEL */}
        <section className="card">
          <div className="card-heading">
            <div>
              <h3>Recruitment Pipeline</h3>
              <p>Current candidate journey</p>
            </div>
          </div>

          <div className="pipeline">
            <div className="pipeline-row">
              <div className="pipeline-label">
                <span>Sourced</span>
                <strong>{totalCandidates}</strong>
              </div>
              <div className="pipeline-track">
                <div
                  className="pipeline-fill first"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>

            <div className="pipeline-row">
              <div className="pipeline-label">
                <span>Shortlisted</span>
                <strong>{shortlistedCandidates}</strong>
              </div>
              <div className="pipeline-track">
                <div
                  className="pipeline-fill second"
                  style={{
                    width: `${Math.max(
                      25,
                      (shortlistedCandidates / Math.max(totalCandidates, 1)) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="pipeline-row">
              <div className="pipeline-label">
                <span>Interview</span>
                <strong>{interviewCandidates}</strong>
              </div>
              <div className="pipeline-track">
                <div
                  className="pipeline-fill third"
                  style={{
                    width: `${Math.max(
                      20,
                      (interviewCandidates / Math.max(totalCandidates, 1)) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="pipeline-row">
              <div className="pipeline-label">
                <span>Selected</span>
                <strong>{selectedCandidates}</strong>
              </div>
              <div className="pipeline-track">
                <div
                  className="pipeline-fill fourth"
                  style={{
                    width: `${Math.max(
                      18,
                      (selectedCandidates / Math.max(totalCandidates, 1)) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="pipeline-row">
              <div className="pipeline-label">
                <span>Joined</span>
                <strong>{joinedCandidates}</strong>
              </div>
              <div className="pipeline-track">
                <div
                  className="pipeline-fill fifth"
                  style={{
                    width: `${Math.max(
                      15,
                      (joinedCandidates / Math.max(totalCandidates, 1)) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* CORPORATE REQUIREMENTS */}
        <section className="card corporate-card">
          <div className="card-heading">
            <div>
              <h3>Corporate Candidate Supply</h3>
              <p>Requirements and suitable candidate movement</p>
            </div>

            <span className="count-badge">
              {filteredRequirements.length} Requirements
            </span>
          </div>

          <div className="corporate-stats">
            <div>
              <span>Active</span>
              <strong>{activeRequirements}</strong>
            </div>

            <div>
              <span>Fulfilled</span>
              <strong>{fulfilledRequirements}</strong>
            </div>

            <div>
              <span>Pending</span>
              <strong>{pendingRequirements}</strong>
            </div>

            <div>
              <span>Selected</span>
              <strong>{totalCorporateSelected}</strong>
            </div>
          </div>

          <div className="mini-table">
            <div className="mini-row heading">
              <span>Corporate</span>
              <span>Profile</span>
              <span>Status</span>
              <span>Selected</span>
            </div>

            {filteredRequirements.map((item) => (
              <div className="mini-row" key={item.id}>
                <span>{item.company}</span>
                <span>{item.profile}</span>
                <span>
                  <em className={`status ${(item.status || "").toLowerCase()}`}>
                    {item.status}
                  </em>
                </span>
                <strong>{item.selected || 0}</strong>
              </div>
            ))}
          </div>
        </section>

        {/* JOB PROFILE */}
        <section className="card">
          <div className="card-heading">
            <div>
              <h3>Job Profile Analysis</h3>
              <p>Candidate distribution by specialization</p>
            </div>
          </div>

          <div className="profile-list">
            {profiles.map((profile) => {
              const count = filteredCandidates.filter(
                (candidate) => candidate.profile === profile
              ).length;

              const percentage =
                (count / Math.max(filteredCandidates.length, 1)) * 100;

              return (
                <div className="profile-item" key={profile}>
                  <div className="profile-top">
                    <span>{profile}</span>
                    <strong>{count}</strong>
                  </div>

                  <div className="profile-progress">
                    <div style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* PERFORMANCE ANALYSIS */}
        <section className="card full-width">
          <div className="card-heading">
            <div>
              <h3>Performance Analysis</h3>
              <p>Switch between different management views</p>
            </div>

            <div className="tabs">
              <button
                className={view === "college" ? "active" : ""}
                onClick={() => setView("college")}
              >
                College
              </button>

              <button
                className={view === "corporate" ? "active" : ""}
                onClick={() => setView("corporate")}
              >
                Corporate
              </button>

              <button
                className={view === "profile" ? "active" : ""}
                onClick={() => setView("profile")}
              >
                Job Profile
              </button>
            </div>
          </div>

          {view === "college" && (
            <div className="analysis-grid">
              {colleges.map((college) => {
                const total = candidates.filter(
                  (candidate) => candidate.college === college
                ).length;

                const joined = candidates.filter(
                  (candidate) =>
                    candidate.college === college && candidate.status === "Joined"
                ).length;

                return (
                  <div className="analysis-box" key={college}>
                    <span>{college}</span>
                    <strong>{total}</strong>
                    <small>{joined} joined</small>
                  </div>
                );
              })}
            </div>
          )}

          {view === "corporate" && (
            <div className="analysis-grid">
              {requirements.map((company) => (
                <div className="analysis-box" key={company.id}>
                  <span>{company.company}</span>
                  <strong>{company.candidates_shared || 0}</strong>
                  <small>{company.selected || 0} selected</small>
                </div>
              ))}
            </div>
          )}

          {view === "profile" && (
            <div className="analysis-grid">
              {profiles.map((profile) => {
                const candidateCount = candidates.filter(
                  (candidate) => candidate.profile === profile
                ).length;

                const selected = candidates.filter(
                  (candidate) =>
                    candidate.profile === profile && candidate.status === "Selected"
                ).length;

                return (
                  <div className="analysis-box" key={profile}>
                    <span>{profile}</span>
                    <strong>{candidateCount}</strong>
                    <small>{selected} selected</small>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ACTION REQUIRED */}
        <section className="card full-width action-card">
          <div className="card-heading">
            <div>
              <h3>Action Required</h3>
              <p>Items that may need administrator attention</p>
            </div>
          </div>

          <div className="action-grid">
            <div className="action-item">
              <div className="action-number">{pendingRequirements}</div>
              <div>
                <strong>Pending Corporate Requirements</strong>
                <small>Requirements waiting for suitable candidates</small>
              </div>
            </div>

            <div className="action-item">
              <div className="action-number">{interviewCandidates}</div>
              <div>
                <strong>Candidates in Interview</strong>
                <small>Candidates currently at interview stage</small>
              </div>
            </div>

            <div className="action-item">
              <div className="action-number">{shortlistedCandidates}</div>
              <div>
                <strong>Shortlisted Candidates</strong>
                <small>Candidates requiring next-stage movement</small>
              </div>
            </div>

            <div className="action-item">
              <div className="action-number">{activeRequirements}</div>
              <div>
                <strong>Active Corporate Requirements</strong>
                <small>Currently open requirements</small>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        Saarthi Admin Dashboard • Management Overview
      </footer>
    </div>
  );
}

export default AdminDashboard;
