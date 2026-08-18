// Delete this line:
// import { useState } from "react";

const NAV = {
  admin: [
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
    ]},
    { section: 'Tracking', items: [
      { key: 'joining', icon: '●', label: 'Joining Tracker' },
      { key: 'comm', icon: '●', label: 'Communication CRM' },
      { key: 'callrecords', icon: '●', label: 'Call Records' },
      { key: 'reports', icon: '●', label: 'Reports & Analytics' },
    ]},
    { section: 'System', items: [
      { key: 'usermanagement', icon: '⚙', label: 'User Management' },
      { key: 'notifications', icon: '🔔', label: 'Notifications' },
      { key: 'calendar', icon: '📅', label: 'Calendar & Tasks' },
    ]},
  ],

  recruiter: [
    { section: 'Overview', items: [{ key: 'dashboard', icon: '◆', label: 'Dashboard' }] },
    { section: 'Recruitment', items: [
      { key: 'resume', icon: '→', label: 'Resume Analyzer (AI)' },
      { key: 'aptitude', icon: '→', label: 'Aptitude Test' },
      { key: 'gd', icon: '→', label: 'Group Discussion' },
      { key: 'interview', icon: '→', label: 'Interviews' },
      { key: 'offers', icon: '→', label: 'Offer Letters' },
      { key: 'comm', icon: '●', label: 'Communication CRM' },
      { key: 'reports', icon: '●', label: 'Reports & Analytics' },
    ]},
    { section: 'Tools', items: [
      { key: 'notifications', icon: '🔔', label: 'Notifications' },
      { key: 'calendar', icon: '📅', label: 'Calendar & Tasks' },
    ]},
  ],

  corporate: [
    { section: 'Overview', items: [{ key: 'corporateDashboard', icon: '◆', label: 'Company Dashboard' }] },
    { section: 'Hiring', items: [
      { key: 'jobs', icon: '▤', label: 'Job Postings' },
      { key: 'resume', icon: '→', label: 'Applications' },
      { key: 'interview', icon: '→', label: 'Interviews' },
      { key: 'offers', icon: '●', label: 'Offer Letters' },
      { key: 'reports', icon: '●', label: 'Reports & Analytics' },
    ]},
    { section: 'Tools', items: [
      { key: 'notifications', icon: '🔔', label: 'Notifications' },
      { key: 'calendar', icon: '📅', label: 'Calendar & Tasks' },
    ]},
  ],

  candidate: [
    { section: 'My Journey', items: [
      { key: 'candidateDashboard', icon: '◆', label: 'Dashboard' },
      { key: 'jobs', icon: '▤', label: 'Job Opportunities' },
      { key: 'myApplications', icon: '→', label: 'My Applications' },
      { key: 'aptitude', icon: '→', label: 'Aptitude Test' },
      { key: 'gd', icon: '→', label: 'Group Discussion' },
      { key: 'interview', icon: '→', label: 'Interviews' },
      { key: 'offers', icon: '●', label: 'Offer Letters' },
      { key: 'joining', icon: '●', label: 'Joining Status' },
    ]},
    { section: 'Tools', items: [
      { key: 'notifications', icon: '🔔', label: 'Notifications' },
      { key: 'calendar', icon: '📅', label: 'Calendar & Tasks' },
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