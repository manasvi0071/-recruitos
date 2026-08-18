const NAV = {
  admin: [
    { section: 'Overview', items: [{ key: 'dashboard', icon: '◆', label: 'Dashboard' }] },
    { section: 'Databases', items: [
      { key: 'campusdb', icon: '▤', label: 'Campus Database' },
      { key: 'corpdb', icon: '▤', label: 'Corporate Database' },
      { key: 'jobs', icon: '▤', label: 'Job Profiles' },
    ]},
    { section: 'Control', items: [
      { key: 'users', icon: '●', label: 'User Management' },
      { key: 'pipeline', icon: '→', label: 'Recruitment Pipeline' },
      { key: 'joining', icon: '●', label: 'Joining Tracker' },
    ]},
    { section: 'Engagement', items: [
      { key: 'calls', icon: '☎', label: 'Call Records' },
      { key: 'comm', icon: '●', label: 'Communication CRM' },
      { key: 'reports', icon: '●', label: 'Reports & Analytics' },
    ]},
  ],

  recruiter: [
    { section: 'Overview', items: [{ key: 'dashboard', icon: '◆', label: 'Dashboard' }] },
    { section: 'Candidates', items: [
      { key: 'campusdb', icon: '▤', label: 'Candidate Database' },
      { key: 'resume', icon: '→', label: 'Resume Analyzer (AI)' },
      { key: 'jobs', icon: '▤', label: 'Job Profiles' },
      { key: 'applications', icon: '→', label: 'Applications' },
    ]},
    { section: 'Rounds', items: [
      { key: 'aptitude', icon: '→', label: 'Aptitude Test' },
      { key: 'gd', icon: '→', label: 'Group Discussion' },
      { key: 'interview', icon: '→', label: 'Interviews' },
      { key: 'pipeline', icon: '→', label: 'Hiring Pipeline' },
    ]},
    { section: 'Tracking', items: [
      { key: 'offers', icon: '●', label: 'Offer Letters' },
      { key: 'joining', icon: '●', label: 'Joining Tracker' },
      { key: 'calls', icon: '☎', label: 'Call Records' },
      { key: 'comm', icon: '●', label: 'Communication / CRM' },
      { key: 'reports', icon: '●', label: 'Reports & Analytics' },
    ]},
  ],

  corporate: [
    { section: 'Overview', items: [{ key: 'corporateDashboard', icon: '◆', label: 'Dashboard' }] },
    { section: 'Company', items: [
      { key: 'corpProfile', icon: '▤', label: 'Company Profile' },
      { key: 'corpJobs', icon: '▤', label: 'Job Profiles / Post Job' },
    ]},
    { section: 'Hiring', items: [
      { key: 'corpApplications', icon: '→', label: 'Applications' },
      { key: 'corpCandidates', icon: '→', label: 'Candidates' },
      { key: 'corpShortlisted', icon: '→', label: 'Shortlisted Candidates' },
      { key: 'interview', icon: '→', label: 'Interviews' },
      { key: 'corpPipeline', icon: '→', label: 'Hiring Pipeline' },
    ]},
    { section: 'Tracking', items: [
      { key: 'offers', icon: '●', label: 'Offer Letters' },
      { key: 'joining', icon: '●', label: 'Joining Tracker' },
      { key: 'reports', icon: '●', label: 'Reports & Analytics' },
    ]},
  ],
};

export default function Sidebar({ activePage, setActivePage, role = 'admin' }) {
  const nav = NAV[role] || NAV.admin;

  return (
    <div className="sidebar">
      {nav.map((group) => (
        <div key={group.section}>
          <div className="side-section-label">{group.section}</div>
          {group.items.map((item) => (
            <div
              key={item.key}
              className={`side-link ${activePage === item.key ? 'active' : ''}`}
              onClick={() => setActivePage(item.key)}
            >
              <span className="side-icon">{item.icon}</span> {item.label}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}