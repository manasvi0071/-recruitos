const nav = [
  {
    section: 'Overview',
    items: [
      { key: 'dashboard', icon: '◆', label: 'Dashboard' },
    ],
  },

  {
    section: 'Setup',
    items: [
      { key: 'campusdb', icon: '▤', label: 'Campus Database' },
      { key: 'corpdb', icon: '▤', label: 'Corporate Database' },
      { key: 'jobs', icon: '▤', label: 'Job Profiles' },
    ],
  },

  {
    section: 'Recruitment',
    items: [
      { key: 'resume', icon: '→', label: 'Resume Analyzer (AI)' },
      { key: 'aptitude', icon: '→', label: 'Aptitude Test' },
      { key: 'gd', icon: '→', label: 'Group Discussion' },
      { key: 'interview', icon: '→', label: 'Interviews' },
      { key: 'offers', icon: '→', label: 'Offer Letters' },
      { key: 'pipeline', icon: '→', label: 'Hiring Pipeline' },
    ],
  },

  {
    section: 'Admin',
    items: [
      {
        key: 'pendingapprovals',
        icon: '✓',
        label: 'Pending Approvals',
      },
    ],
  },

  {
    section: 'Tracking',
    items: [
      { key: 'joining', icon: '●', label: 'Joining Tracker' },

      // NEW
      { key: 'callrecords', icon: '●', label: 'Call Records' },

      { key: 'comm', icon: '●', label: 'Communication CRM' },
      { key: 'reports', icon: '●', label: 'Reports & Analytics' },
    ],
  },
];

export default function Sidebar({ activePage, setActivePage }) {
  return (
    <>
      {nav.map((group) => (
        <div className="side-group" key={group.section}>
          <div className="side-section">
            {group.section}
          </div>

          {group.items.map((item) => (
            <div
              key={item.key}
              className={`side-link ${
                activePage === item.key ? 'active' : ''
              }`}
              onClick={() => setActivePage(item.key)}
            >
              {item.icon} {item.label}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}