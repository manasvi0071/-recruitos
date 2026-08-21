import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import "./CorporateApp.css";

/* =========================================================
   SAMPLE CORPORATE DATA
   =========================================================
   This is sample data only.

   Later, during application integration, these values should
   come from the application's API/database.

   IMPORTANT:
   candidate.role = Job Profile / Specialization
========================================================= */

const corporateData = {
  kpis: {
    availableCandidates: 190,
    matchingCandidates: 68,
    jobProfiles: 5,
    locations: 4,
  },

  /* Candidate profile / specialization data */

  profiles: [
    {
      name: "Data Analyst",
      candidates: 42,
    },
    {
      name: "Business Analyst",
      candidates: 31,
    },
    {
      name: "Marketing",
      candidates: 24,
    },
    {
      name: "HR Executive",
      candidates: 18,
    },
    {
      name: "Business Development",
      candidates: 15,
    },
  ],

  /* Experience distribution */

  experience: [
    {
      name: "0–1 Years",
      candidates: 35,
    },
    {
      name: "1–3 Years",
      candidates: 62,
    },
    {
      name: "3–5 Years",
      candidates: 41,
    },
    {
      name: "5+ Years",
      candidates: 18,
    },
  ],

  /* Location availability */

  locations: [
    {
      name: "Mumbai",
      candidates: 58,
    },
    {
      name: "Pune",
      candidates: 32,
    },
    {
      name: "Thane",
      candidates: 18,
    },
    {
      name: "Bangalore",
      candidates: 14,
    },
  ],
};

/* =========================================================
   SAMPLE CANDIDATES
   =========================================================
   Sample candidates for dashboard development.

   The filter options are NOT hard-coded.

   They are generated automatically from this candidate data.
========================================================= */

const candidates = [
  {
    id: 1,
    name: "Aarav Sharma",
    role: "Data Analyst",
    match: 94,
    resumeScore: 91,
    experience: "2 Years",
    experienceYears: 2,
    skills: "SQL, Excel, Power BI",
    location: "Mumbai",
    stage: "Shortlisted",
    source: "LinkedIn",
    email: "aarav.sharma@example.com",
    phone: "+91 98765 43210",
  },

  {
    id: 2,
    name: "Priya Mehta",
    role: "Business Analyst",
    match: 91,
    resumeScore: 88,
    experience: "3 Years",
    experienceYears: 3,
    skills: "Excel, SQL, Tableau",
    location: "Pune",
    stage: "Interview",
    source: "Naukri",
    email: "priya.mehta@example.com",
    phone: "+91 98765 12345",
  },

  {
    id: 3,
    name: "Rahul Patil",
    role: "Data Analyst",
    match: 87,
    resumeScore: 85,
    experience: "3 Years",
    experienceYears: 3,
    skills: "Python, SQL, Power BI",
    location: "Mumbai",
    stage: "Screening",
    source: "Referral",
    email: "rahul.patil@example.com",
    phone: "+91 98234 56789",
  },

  {
    id: 4,
    name: "Sneha Joshi",
    role: "Business Analyst",
    match: 85,
    resumeScore: 82,
    experience: "2 Years",
    experienceYears: 2,
    skills: "Excel, Power BI, SQL",
    location: "Thane",
    stage: "Applied",
    source: "Website",
    email: "sneha.joshi@example.com",
    phone: "+91 98123 45678",
  },

  {
    id: 5,
    name: "Rohan Shah",
    role: "Data Analyst",
    match: 83,
    resumeScore: 80,
    experience: "4 Years",
    experienceYears: 4,
    skills: "Python, Excel, SQL",
    location: "Mumbai",
    stage: "Offered",
    source: "LinkedIn",
    email: "rohan.shah@example.com",
    phone: "+91 98989 12345",
  },

  {
    id: 6,
    name: "Neha Kapoor",
    role: "HR Executive",
    match: 88,
    resumeScore: 86,
    experience: "2 Years",
    experienceYears: 2,
    skills: "Recruitment, HRMS, Excel",
    location: "Mumbai",
    stage: "Shortlisted",
    source: "Naukri",
    email: "neha.kapoor@example.com",
    phone: "+91 98765 67890",
  },

  {
    id: 7,
    name: "Karan Desai",
    role: "Business Development",
    match: 82,
    resumeScore: 79,
    experience: "3 Years",
    experienceYears: 3,
    skills: "Sales, CRM, Communication",
    location: "Mumbai",
    stage: "Interview",
    source: "Referral",
    email: "karan.desai@example.com",
    phone: "+91 98111 22334",
  },

  {
    id: 8,
    name: "Ananya Rao",
    role: "Marketing",
    match: 90,
    resumeScore: 87,
    experience: "2 Years",
    experienceYears: 2,
    skills: "Digital Marketing, SEO, Analytics",
    location: "Pune",
    stage: "Shortlisted",
    source: "LinkedIn",
    email: "ananya.rao@example.com",
    phone: "+91 98222 33445",
  },
];

const COLORS = [
  "#743bf1",
  "#d83da9",
  "#239ddd",
  "#079b6d",
  "#f59e0b",
];

const rowsPerPage = 5;

/* =========================================================
   GREETING
========================================================= */

function getGreeting() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "Good morning";
  }

  if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

function CorporateApp() {
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [showCandidateTable, setShowCandidateTable] = useState(false);

  const [profileChartType, setProfileChartType] = useState("profiles");

  /* =======================================================
     FILTER STATES
  ======================================================= */

  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] = useState("All");

  const [experienceFilter, setExperienceFilter] = useState("All");

  const [locationFilter, setLocationFilter] = useState("All");

  const [stageFilter, setStageFilter] = useState("All");

  const [matchFilter, setMatchFilter] = useState("All");

  const [tablePage, setTablePage] = useState(1);

  /* =======================================================
     DYNAMIC JOB PROFILE OPTIONS
     =======================================================
     This is the important part.

     The dropdown is generated from candidate.role.

     If a new candidate is added with:

       role: "Marketing"

     Marketing automatically becomes available.

     If later there is:

       role: "Finance"

     Finance will automatically appear too.
  ======================================================= */

  const jobProfiles = useMemo(() => {
    const profiles = candidates
      .map((candidate) => candidate.role)
      .filter(Boolean);

    return [
      "All",
      ...Array.from(new Set(profiles)).sort(),
    ];
  }, []);

  /* =======================================================
     DYNAMIC EXPERIENCE OPTIONS
  ======================================================= */

  const experienceOptions = useMemo(() => {
    const values = candidates
      .map((candidate) => candidate.experienceYears)
      .filter(
        (value) =>
          value !== undefined &&
          value !== null
      );

    return [
      "All",
      ...Array.from(new Set(values)).sort(
        (a, b) => a - b
      ),
    ];
  }, []);

  /* =======================================================
     DYNAMIC LOCATION OPTIONS
  ======================================================= */

  const locationOptions = useMemo(() => {
    const values = candidates
      .map((candidate) => candidate.location)
      .filter(Boolean);

    return [
      "All",
      ...Array.from(new Set(values)).sort(),
    ];
  }, []);

  /* =======================================================
     DYNAMIC STAGE OPTIONS
  ======================================================= */

  const stageOptions = useMemo(() => {
    const values = candidates
      .map((candidate) => candidate.stage)
      .filter(Boolean);

    return [
      "All",
      ...Array.from(new Set(values)),
    ];
  }, []);

  /* =======================================================
     GREETING
  ======================================================= */

  const greeting = getGreeting();

  /* =======================================================
     FILTER CANDIDATES
  ======================================================= */

  const filteredCandidates = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return candidates.filter((candidate) => {
      const matchesSearch =
        !searchValue ||
        candidate.name.toLowerCase().includes(searchValue) ||
        candidate.role.toLowerCase().includes(searchValue) ||
        candidate.skills.toLowerCase().includes(searchValue);

      const matchesRole =
        roleFilter === "All" ||
        candidate.role === roleFilter;

      let matchesExperience = true;

      if (experienceFilter !== "All") {
        matchesExperience =
          candidate.experienceYears === Number(experienceFilter);
      }

      const matchesLocation =
        locationFilter === "All" ||
        candidate.location === locationFilter;

      const matchesStage =
        stageFilter === "All" ||
        candidate.stage === stageFilter;

      let matchesMatch = true;

      if (matchFilter === "80+") {
        matchesMatch = candidate.match >= 80;
      }

      if (matchFilter === "85+") {
        matchesMatch = candidate.match >= 85;
      }

      if (matchFilter === "90+") {
        matchesMatch = candidate.match >= 90;
      }

      return (
        matchesSearch &&
        matchesRole &&
        matchesExperience &&
        matchesLocation &&
        matchesStage &&
        matchesMatch
      );
    });
  }, [
    search,
    roleFilter,
    experienceFilter,
    locationFilter,
    stageFilter,
    matchFilter,
  ]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCandidates.length / rowsPerPage)
  );

  const paginatedCandidates = filteredCandidates.slice(
    (tablePage - 1) * rowsPerPage,
    tablePage * rowsPerPage
  );

  /* =======================================================
     RESET PAGE WHEN FILTER CHANGES
  ======================================================= */

    useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTablePage(1);
  }, [
    search,
    roleFilter,
    experienceFilter,
    locationFilter,
    stageFilter,
    matchFilter,
  ]);

  /* =======================================================
     RESET FILTERS
  ======================================================= */

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("All");
    setExperienceFilter("All");
    setLocationFilter("All");
    setStageFilter("All");
    setMatchFilter("All");
    setTablePage(1);
  };

  /* =======================================================
     PROFILE / EXPERIENCE CHART
  ======================================================= */

  const chartData =
    profileChartType === "profiles"
      ? corporateData.profiles
      : corporateData.experience;

  return (
    <div className="corporate-app">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="corporate-sidebar">
        <div className="corporate-brand">
          <div className="corporate-brand-logo">
            TC
          </div>

          <div>
            <h2>
              Talent Corner
            </h2>

            <span>
              Corporate
            </span>
          </div>
        </div>

        <div className="corporate-menu">
          <div className="corporate-menu-title">
            MAIN MENU
          </div>

          <div
            className="
              corporate-menu-item
              active
            "
          >
            <span>
              📊
            </span>

            Dashboard
          </div>
        </div>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="corporate-main">
        {/* TOPBAR */}

        <header className="corporate-topbar">
          <div>
            <h1>
              Corporate Dashboard
            </h1>

            <p>
              Explore available talent and
              discover suitable candidates
            </p>
          </div>

          <div className="corporate-top-actions">
            <button
              className="corporate-notification"
              type="button"
            >
              🔔
            </button>
          </div>
        </header>

        {/* CONTENT */}

        <section className="corporate-content">
          {/* =================================================
              GREETING
          ================================================= */}

          <div className="corporate-greeting">
            <div>
              <div className="corporate-greeting-label">
                TALENT OVERVIEW
              </div>

              <h2>
                {greeting}
              </h2>

              <p>
                Explore the available talent
                pool and find candidates that
                match your requirements.
              </p>
            </div>

            <div className="corporate-greeting-icon">
              🏢
            </div>
          </div>

          {/* =================================================
              KPI CARDS
          ================================================= */}

          <div className="corporate-stats">
            <div className="corporate-stat-card">
              <div className="corporate-stat-icon">
                👥
              </div>

              <h3>
                {
                  corporateData
                    .kpis
                    .availableCandidates
                }
              </h3>

              <p>
                Available Candidates
              </p>

              <span className="corporate-stat-change">
                Talent Pool
              </span>
            </div>

            <div className="corporate-stat-card">
              <div className="corporate-stat-icon">
                ⭐
              </div>

              <h3>
                {
                  corporateData
                    .kpis
                    .matchingCandidates
                }
              </h3>

              <p>
                Matching Candidates
              </p>

              <span className="corporate-stat-change">
                High relevance
              </span>
            </div>

            <div className="corporate-stat-card">
              <div className="corporate-stat-icon">
                💼
              </div>

              <h3>
                {
                  corporateData
                    .kpis
                    .jobProfiles
                }
              </h3>

              <p>
                Job Profiles
              </p>

              <span className="corporate-stat-change">
                Specializations
              </span>
            </div>

            <div className="corporate-stat-card">
              <div className="corporate-stat-icon">
                📍
              </div>

              <h3>
                {
                  corporateData
                    .kpis
                    .locations
                }
              </h3>

              <p>
                Candidate Locations
              </p>

              <span className="corporate-stat-change">
                Available cities
              </span>
            </div>
          </div>

          {/* =================================================
              TALENT PROFILE ANALYTICS
          ================================================= */}

          <div className="corporate-chart-card">
            <div className="corporate-card-header">
              <div>
                <h3>
                  Talent Pool Overview
                </h3>

                <p>
                  Explore available candidates
                  by profile and experience
                </p>
              </div>

              <div className="corporate-toggle">
                <button
                  className={
                    profileChartType ===
                    "profiles"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setProfileChartType(
                      "profiles"
                    )
                  }
                  type="button"
                >
                  Profiles
                </button>

                <button
                  className={
                    profileChartType ===
                    "experience"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setProfileChartType(
                      "experience"
                    )
                  }
                  type="button"
                >
                  Experience
                </button>
              </div>
            </div>

            <div className="corporate-chart-container">
              {
                profileChartType ===
                "profiles" ? (

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <BarChart
                      data={
                        chartData
                      }
                      layout="vertical"
                      margin={{
                        left: 20,
                        right: 25,
                        top: 5,
                        bottom: 5,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#eeeaf3"
                      />

                      <XAxis
                        type="number"
                        stroke="#9995ae"
                        tick={{
                          fontSize: 10,
                        }}
                      />

                      <YAxis
                        type="category"
                        dataKey="name"
                        width={125}
                        stroke="#9995ae"
                        tick={{
                          fontSize: 10,
                        }}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="candidates"
                        name="Candidates"
                        fill="#743bf1"
                        radius={[
                          0,
                          5,
                          5,
                          0,
                        ]}
                      />

                    </BarChart>

                  </ResponsiveContainer>

                ) : (

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <PieChart>

                      <Pie
                        data={
                          chartData
                        }
                        dataKey="candidates"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={3}
                        label
                      >

                        {
                          chartData.map(
                            (
                              entry,
                              index
                            ) => (

                              <Cell
                                key={
                                  entry.name
                                }
                                fill={
                                  COLORS[
                                    index %
                                      COLORS.length
                                  ]
                                }
                              />

                            )
                          )
                        }

                      </Pie>

                      <Tooltip />

                    </PieChart>

                  </ResponsiveContainer>

                )
              }
            </div>
          </div>

          {/* =================================================
              LOCATION + TOP PROFILES
          ================================================= */}

          <div className="corporate-two-column">
            {/* LOCATION */}

            <div className="corporate-card">
              <div className="corporate-card-header">
                <div>
                  <h3>
                    Candidate Locations
                  </h3>

                  <p>
                    Where available candidates
                    are located
                  </p>
                </div>
              </div>

              <div className="corporate-location-list">
                {
                  corporateData.locations
                    .map(
                      (location) => (

                        <div
                          className="
                            corporate-location-row
                          "
                          key={
                            location.name
                          }
                        >

                          <div>

                            <span>
                              📍
                            </span>

                            <strong>
                              {
                                location.name
                              }
                            </strong>

                          </div>


                          <div>

                            <strong>
                              {
                                location.candidates
                              }
                            </strong>

                            <span>
                              candidates
                            </span>

                          </div>

                        </div>

                      )
                    )
                }
              </div>
            </div>

            {/* TOP SPECIALIZATIONS */}

            <div className="corporate-card">
              <div className="corporate-card-header">
                <div>
                  <h3>
                    Available Specializations
                  </h3>

                  <p>
                    Most available candidate
                    profiles
                  </p>
                </div>
              </div>

              <div className="corporate-profile-list">
                {
                  corporateData.profiles
                    .map(
                      (
                        profile,
                        index
                      ) => (

                        <div
                          className="
                            corporate-profile-row
                          "
                          key={
                            profile.name
                          }
                        >

                          <div>

                            <span
                              className="
                                corporate-profile-number
                              "
                            >
                              {
                                index +
                                1
                              }
                            </span>

                            <strong>
                              {
                                profile.name
                              }
                            </strong>

                          </div>


                          <div>

                            <strong>
                              {
                                profile.candidates
                              }
                            </strong>

                            <span>
                              candidates
                            </span>

                          </div>

                        </div>

                      )
                    )
                }
              </div>
            </div>
          </div>

          {/* =================================================
              RECOMMENDED CANDIDATES
          ================================================= */}

          <div className="corporate-card">
            <div className="corporate-card-header">
              <div>
                <h3>
                  Recommended Candidates
                </h3>

                <p>
                  Find candidates based on
                  your hiring requirements
                </p>
              </div>

              <button
                className="
                  corporate-details-button
                "
                onClick={() =>
                  setShowCandidateTable(
                    true
                  )
                }
                type="button"
              >
                View All Candidates
              </button>
            </div>

            {/* FILTER BAR */}

            <div className="corporate-quick-filters">
              {/* JOB PROFILE */}

              <div className="corporate-filter-field">
                <label>
                  Job Profile
                </label>

                <select
                  value={
                    roleFilter
                  }
                  onChange={(e) =>
                    setRoleFilter(
                      e.target.value
                    )
                  }
                >

                  {
                    jobProfiles.map(
                      (profile) => (

                        <option
                          key={
                            profile
                          }
                          value={
                            profile
                          }
                        >
                          {
                            profile ===
                            "All"
                              ? "All Profiles"
                              : profile
                          }
                        </option>

                      )
                    )
                  }

                </select>
              </div>

              {/* EXPERIENCE */}

              <div className="corporate-filter-field">
                <label>
                  Experience
                </label>

                <select
                  value={
                    experienceFilter
                  }
                  onChange={(e) =>
                    setExperienceFilter(
                      e.target.value
                    )
                  }
                >

                  <option value="All">
                    All Experience
                  </option>

                  {
                    experienceOptions
                      .filter(
                        (value) =>
                          value !==
                          "All"
                      )
                      .map(
                        (value) => (

                          <option
                            key={
                              value
                            }
                            value={
                              value
                            }
                          >
                            {value}{" "}
                            {value === 1
                              ? "Year"
                              : "Years"}
                          </option>

                        )
                      )
                  }

                </select>
              </div>

              {/* LOCATION */}

              <div className="corporate-filter-field">
                <label>
                  Location
                </label>

                <select
                  value={
                    locationFilter
                  }
                  onChange={(e) =>
                    setLocationFilter(
                      e.target.value
                    )
                  }
                >

                  {
                    locationOptions.map(
                      (location) => (

                        <option
                          key={
                            location
                          }
                          value={
                            location
                          }
                        >
                          {
                            location ===
                            "All"
                              ? "All Locations"
                              : location
                          }
                        </option>

                      )
                    )
                  }

                </select>
              </div>

              {/* MATCH SCORE */}

              <div className="corporate-filter-field">
                <label>
                  Match Score
                </label>

                <select
                  value={
                    matchFilter
                  }
                  onChange={(e) =>
                    setMatchFilter(
                      e.target.value
                    )
                  }
                >

                  <option value="All">
                    All Scores
                  </option>

                  <option value="80+">
                    80%+
                  </option>

                  <option value="85+">
                    85%+
                  </option>

                  <option value="90+">
                    90%+
                  </option>

                </select>
              </div>

              {/* RESET */}

              <button
                className="
                  corporate-reset-filter
                "
                onClick={
                  resetFilters
                }
                type="button"
              >
                Reset
              </button>
            </div>

            {/* RESULT COUNT */}

            <div className="corporate-filter-result">
              <span>
                Showing{" "}
                <strong>
                  {
                    filteredCandidates.length
                  }
                </strong>{" "}
                matching candidates
              </span>

              {
                roleFilter !==
                  "All" && (

                  <span
                    className="
                      corporate-active-filter
                    "
                  >
                    Profile:{" "}
                    {roleFilter}
                  </span>

                )
              }
            </div>

            {/* RECOMMENDED TABLE */}

            <div className="corporate-table-wrapper">
              <table className="corporate-table">
                <thead>
                  <tr>
                    <th>
                      Candidate
                    </th>

                    <th>
                      Profile
                    </th>

                    <th>
                      Match
                    </th>

                    <th>
                      Experience
                    </th>

                    <th>
                      Location
                    </th>

                    <th>
                      Skills
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {
                    filteredCandidates
                      .slice()
                      .sort(
                        (a, b) =>
                          b.match -
                          a.match
                      )
                      .slice(0, 5)
                      .map(
                        (candidate) => (

                          <tr
                            key={
                              candidate.id
                            }
                          >

                            <td>

                              <div
                                className="
                                  corporate-candidate-name
                                "
                              >

                                <div
                                  className="
                                    corporate-avatar
                                  "
                                >
                                  {
                                    candidate.name.charAt(
                                      0
                                    )
                                  }
                                </div>

                                <strong>
                                  {
                                    candidate.name
                                  }
                                </strong>

                              </div>

                            </td>

                            <td>
                              {
                                candidate.role
                              }
                            </td>

                            <td>

                              <span
                                className="
                                  match-score
                                "
                              >
                                {
                                  candidate.match
                                }%
                              </span>

                            </td>

                            <td>
                              {
                                candidate.experience
                              }
                            </td>

                            <td>
                              {
                                candidate.location
                              }
                            </td>

                            <td>
                              {
                                candidate.skills
                              }
                            </td>

                            <td>

                              <button
                                className="
                                  corporate-view-button
                                "
                                onClick={() =>
                                  setSelectedCandidate(
                                    candidate
                                  )
                                }
                                type="button"
                              >
                                View
                              </button>

                            </td>

                          </tr>

                        )
                      )
                  }

                  {
                    filteredCandidates.length ===
                      0 && (

                      <tr>

                        <td
                          colSpan="7"
                          className="
                            corporate-empty
                          "
                        >
                          No candidates match
                          the selected filters.

                        </td>

                      </tr>

                    )
                  }

                </tbody>

              </table>

            </div>

          </div>

        </section>

      </main>

      {/* =====================================================
          FULL CANDIDATE TABLE MODAL
      ===================================================== */}

      {
        showCandidateTable && (

          <div
            className="
              corporate-modal-overlay
            "
            onClick={() =>
              setShowCandidateTable(
                false
              )
            }
          >

            <div
              className="
                corporate-modal
                corporate-large-modal
              "
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div
                className="
                  corporate-modal-header
                "
              >

                <div>

                  <h3>
                    Candidate Table
                  </h3>

                  <p>
                    Search and explore
                    available candidates
                  </p>

                </div>

                <button
                  className="
                    corporate-modal-close
                  "
                  onClick={() =>
                    setShowCandidateTable(
                      false
                    )
                  }
                  type="button"
                >
                  ×
                </button>

              </div>

              {/* SEARCH + FILTERS */}

              <div
                className="
                  corporate-filters
                "
              >

                <input
                  type="text"
                  placeholder="
                    Search candidate, profile or skill...
                  "
                  value={
                    search
                  }
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                />

                <select
                  value={
                    roleFilter
                  }
                  onChange={(e) =>
                    setRoleFilter(
                      e.target.value
                    )
                  }
                >

                  {
                    jobProfiles.map(
                      (profile) => (

                        <option
                          key={
                            profile
                          }
                          value={
                            profile
                          }
                        >
                          {
                            profile ===
                            "All"
                              ? "All Profiles"
                              : profile
                          }
                        </option>

                      )
                    )
                  }

                </select>

                <select
                  value={
                    experienceFilter
                  }
                  onChange={(e) =>
                    setExperienceFilter(
                      e.target.value
                    )
                  }
                >

                  <option value="All">
                    All Experience
                  </option>

                  {
                    experienceOptions
                      .filter(
                        (value) =>
                          value !==
                          "All"
                      )
                      .map(
                        (value) => (

                          <option
                            key={
                              value
                            }
                            value={
                              value
                            }
                          >
                            {value}{" "}
                            {value === 1
                              ? "Year"
                              : "Years"}
                          </option>

                        )
                      )
                  }

                </select>

                <select
                  value={
                    locationFilter
                  }
                  onChange={(e) =>
                    setLocationFilter(
                      e.target.value
                    )
                  }
                >

                  {
                    locationOptions.map(
                      (location) => (

                        <option
                          key={
                            location
                          }
                          value={
                            location
                          }
                        >
                          {
                            location ===
                            "All"
                              ? "All Locations"
                              : location
                          }
                        </option>

                      )
                    )
                  }

                </select>

                <select
                  value={
                    stageFilter
                  }
                  onChange={(e) =>
                    setStageFilter(
                      e.target.value
                    )
                  }
                >

                  {
                    stageOptions.map(
                      (stage) => (

                        <option
                          key={
                            stage
                          }
                          value={
                            stage
                          }
                        >
                          {
                            stage ===
                            "All"
                              ? "All Stages"
                              : stage
                          }
                        </option>

                      )
                    )
                  }

                </select>

              </div>

              <div
                className="
                  corporate-modal-match-filter
                "
              >

                <label>
                  Match Score
                </label>

                <select
                  value={
                    matchFilter
                  }
                  onChange={(e) =>
                    setMatchFilter(
                      e.target.value
                    )
                  }
                >

                  <option value="All">
                    All Scores
                  </option>

                  <option value="80+">
                    80%+
                  </option>

                  <option value="85+">
                    85%+
                  </option>

                  <option value="90+">
                    90%+
                  </option>

                </select>

                <button
                  className="
                    corporate-reset-filter
                  "
                  onClick={
                    resetFilters
                  }
                  type="button"
                >
                  Reset Filters
                </button>

              </div>

              {/* TABLE */}

              <div
                className="
                  corporate-table-wrapper
                "
              >

                <table
                  className="
                    corporate-table
                  "
                >

                  <thead>

                    <tr>

                      <th>
                        Candidate
                      </th>

                      <th>
                        Profile
                      </th>

                      <th>
                        Match
                      </th>

                      <th>
                        Resume
                      </th>

                      <th>
                        Experience
                      </th>

                      <th>
                        Skills
                      </th>

                      <th>
                        Location
                      </th>

                      <th>
                        Stage
                      </th>

                      <th>
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {
                      paginatedCandidates.length >
                        0 ? (

                        paginatedCandidates.map(
                          (
                            candidate
                          ) => (

                            <tr
                              key={
                                candidate.id
                              }
                            >

                              <td>

                                <strong>
                                  {
                                    candidate.name
                                  }
                                </strong>

                              </td>

                              <td>
                                {
                                  candidate.role
                                }
                              </td>

                              <td>

                                <span
                                  className="
                                    match-score
                                  "
                                >
                                  {
                                    candidate.match
                                  }%
                                </span>

                              </td>

                              <td>
                                {
                                  candidate.resumeScore
                                }
                              </td>

                              <td>
                                {
                                  candidate.experience
                                }
                              </td>

                              <td>
                                {
                                  candidate.skills
                                }
                              </td>

                              <td>
                                {
                                  candidate.location
                                }
                              </td>

                              <td>

                                <span
                                  className={`
                                    corporate-status
                                    ${candidate.stage
                                      .toLowerCase()
                                      .replace(
                                        " ",
                                        "-"
                                      )}
                                  `}
                                >
                                  {
                                    candidate.stage
                                  }
                                </span>

                              </td>

                              <td>

                                <button
                                  className="
                                    corporate-view-button
                                  "
                                  onClick={() =>
                                    setSelectedCandidate(
                                      candidate
                                    )
                                  }
                                  type="button"
                                >
                                  View
                                </button>

                              </td>

                            </tr>

                          )
                        )

                      ) : (

                        <tr>

                          <td
                            colSpan="9"
                            className="
                              corporate-empty
                            "
                          >
                            No candidates
                            found.

                          </td>

                        </tr>

                      )
                    }

                  </tbody>

                </table>

              </div>

              {/* PAGINATION */}

              <div
                className="
                  corporate-pagination
                "
              >

                <span>

                  Showing{" "}

                  {
                    filteredCandidates.length ===
                      0
                      ? 0
                      : (
                          tablePage -
                          1
                        ) *
                          rowsPerPage +
                        1
                  }

                  {" - "}

                  {
                    Math.min(
                      tablePage *
                        rowsPerPage,
                      filteredCandidates.length
                    )
                  }

                  {" of "}

                  {
                    filteredCandidates.length
                  }

                </span>

                <div>

                  <button
                    disabled={
                      tablePage ===
                      1
                    }
                    onClick={() =>
                      setTablePage(
                        (page) =>
                          Math.max(
                            1,
                            page - 1
                          )
                      )
                    }
                    type="button"
                  >
                    ←
                  </button>

                  <span>
                    {
                      tablePage
                    }{" "}
                    /{" "}
                    {
                      totalPages
                    }
                  </span>

                  <button
                    disabled={
                      tablePage ===
                      totalPages
                    }
                    onClick={() =>
                      setTablePage(
                        (page) =>
                          Math.min(
                            totalPages,
                            page + 1
                          )
                      )
                    }
                    type="button"
                  >
                    →
                  </button>

                </div>

              </div>

              <div
                className="
                  corporate-modal-footer
                "
              >

                <button
                  className="
                    corporate-close-button
                  "
                  onClick={() =>
                    setShowCandidateTable(
                      false
                    )
                  }
                  type="button"
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        )
      }

      {/* =====================================================
          CANDIDATE DETAILS MODAL
      ===================================================== */}

      {
        selectedCandidate && (

          <div
            className="
              corporate-modal-overlay
            "
            onClick={() =>
              setSelectedCandidate(
                null
              )
            }
          >

            <div
              className="
                corporate-modal
              "
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div
                className="
                  corporate-modal-header
                "
              >

                <div>

                  <h3>
                    {
                      selectedCandidate.name
                    }
                  </h3>

                  <p>
                    Candidate Details
                  </p>

                </div>

                <button
                  className="
                    corporate-modal-close
                  "
                  onClick={() =>
                    setSelectedCandidate(
                      null
                    )
                  }
                  type="button"
                >
                  ×
                </button>

              </div>

              <div
                className="
                  corporate-detail-grid
                "
              >

                <div>

                  <span>
                    PROFILE
                  </span>

                  <strong>
                    {
                      selectedCandidate.role
                    }
                  </strong>

                </div>

                <div>

                  <span>
                    MATCH SCORE
                  </span>

                  <strong>
                    {
                      selectedCandidate.match
                    }%
                  </strong>

                </div>

                <div>

                  <span>
                    RESUME SCORE
                  </span>

                  <strong>
                    {
                      selectedCandidate.resumeScore
                    }
                  </strong>

                </div>

                <div>

                  <span>
                    EXPERIENCE
                  </span>

                  <strong>
                    {
                      selectedCandidate.experience
                    }
                  </strong>

                </div>

                <div>

                  <span>
                    SKILLS
                  </span>

                  <strong>
                    {
                      selectedCandidate.skills
                    }
                  </strong>

                </div>

                <div>

                  <span>
                    LOCATION
                  </span>

                  <strong>
                    {
                      selectedCandidate.location
                    }
                  </strong>

                </div>

                <div>

                  <span>
                    CURRENT STAGE
                  </span>

                  <strong>
                    {
                      selectedCandidate.stage
                    }
                  </strong>

                </div>

                <div>

                  <span>
                    SOURCE
                  </span>

                  <strong>
                    {
                      selectedCandidate.source
                    }
                  </strong>

                </div>

                <div>

                  <span>
                    EMAIL
                  </span>

                  <strong>
                    {
                      selectedCandidate.email
                    }
                  </strong>

                </div>

                <div>

                  <span>
                    PHONE
                  </span>

                  <strong>
                    {
                      selectedCandidate.phone
                    }
                  </strong>

                </div>

              </div>

              <div
                className="
                  corporate-modal-footer
                "
              >

                <button
                  className="
                    corporate-close-button
                  "
                  onClick={() =>
                    setSelectedCandidate(
                      null
                    )
                  }
                  type="button"
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        )
      }

    </div>

  );

}

export default CorporateApp;