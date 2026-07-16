const nav = [
  { section: 'Overview', items: [{ key: 'dashboard', icon: '◆', label: 'Dashboard' }] },
  { section: 'Setup', items: [
    { key: 'campusdb', icon: '▤', label: 'Campus Database' },
    { key: 'corpdb', icon: '▤', label: 'Corporate Database' },
    { key: 'jobs', icon: '▤', label: 'Job Profiles' },
  ]},
  { section: 'Recruitment', items: [
    { key: 'resume', icon: '→', label: 'Resume Analyzer (AI)' },
    { key: 'aptitude', icon: '→', label: 'Aptitude Test' },
    { key: 'gd', icon: '→', label: 'Group Discussion' },
    { key: 'interview', icon: '→', label: 'Interviews' },
    { key: 'offers', icon: '→', label: 'Offer Letters' },
    { key: 'pipeline', icon: '→', label: 'Hiring Pipeline' },
  ]},
  { section: 'Tracking', items: [
    { key: 'joining', icon: '●', label: 'Joining Tracker' },
    { key: 'comm', icon: '●', label: 'Communication CRM' },
    { key: 'reports', icon: '●', label: 'Reports & Analytics' },
  ]},
];

export default function Sidebar({ activePage, setActivePage }) {
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