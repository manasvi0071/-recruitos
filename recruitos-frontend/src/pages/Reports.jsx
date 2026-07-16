import { useEffect, useState, useMemo } from 'react';
import {
  getAllApplications, getColleges, getCompanies, getOffers, getJoiningStatus,
} from '../lib/api';

const FUNNEL_ORDER = ['Resume Review', 'Interview', 'Selected', 'Rejected'];

const REPORT_LIST = [
  { key: 'campus', t: 'Campus-wise Report', d: 'Performance per college' },
  { key: 'company', t: 'Company-wise Report', d: 'Performance per company' },
  { key: 'recruiter', t: 'Recruiter Performance', d: 'Drives handled, conversion', comingSoon: true },
  { key: 'funnel', t: 'Hiring Funnel', d: 'Applied → Joined' },
  { key: 'selection', t: 'Selection Report', d: 'Shortlist to offer' },
  { key: 'joining', t: 'Joining Report', d: 'Accepted vs joined' },
  { key: 'acceptance', t: 'Offer Acceptance', d: 'Acceptance rate trend' },
  { key: 'monthly', t: 'Monthly / Yearly Report', d: 'Drive summary' },
];

export default function Reports() {
  const [apps, setApps] = useState([]);
  const [offers, setOffers] = useState([]);
  const [joining, setJoining] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function init() {
      try {
        const [a, , , off, joi] = await Promise.all([
          getAllApplications(), getColleges(), getCompanies(), getOffers(), getJoiningStatus(),
        ]);
        if (!ignore) {
          setApps(a);
          setOffers(off);
          setJoining(joi);
        }
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    init();
    return () => { ignore = true; };
  }, []);

  const campusRows = useMemo(() => {
    const byCollege = {};
    apps.forEach((a) => {
      const name = a.candidates?.colleges?.name || 'Unknown';
      if (!byCollege[name]) byCollege[name] = { name, total: 0, selected: 0, joined: 0 };
      byCollege[name].total += 1;
      if (a.stage === 'Selected') byCollege[name].selected += 1;
      if (a.stage === 'Joined') byCollege[name].joined += 1;
    });
    return Object.values(byCollege).sort((x, y) => y.total - x.total);
  }, [apps]);

  const companyRows = useMemo(() => {
    const byCompany = {};
    apps.forEach((a) => {
      const name = a.job_profiles?.company || 'Unknown';
      if (!byCompany[name]) byCompany[name] = { name, total: 0, selected: 0, joined: 0 };
      byCompany[name].total += 1;
      if (a.stage === 'Selected') byCompany[name].selected += 1;
      if (a.stage === 'Joined') byCompany[name].joined += 1;
    });
    return Object.values(byCompany).sort((x, y) => y.total - x.total);
  }, [apps]);

  const funnelRows = useMemo(() => {
    const counts = {};
    apps.forEach((a) => { counts[a.stage] = (counts[a.stage] || 0) + 1; });
    return FUNNEL_ORDER
      .filter((s) => counts[s])
      .map((s) => ({ stage: s, count: counts[s] }));
  }, [apps]);

  const selectedCount = apps.filter((a) => a.stage === 'Selected').length;
  const offersSent = offers.length;

  const offersAccepted = offers.filter((o) => o.status === 'Accepted').length;
  const joinedCount = joining.filter((j) => j.status === 'Joined').length;

  const acceptanceByMonth = useMemo(() => {
    const byMonth = {};
    offers.forEach((o) => {
      if (!o.sent_on) return;
      const m = new Date(o.sent_on).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
      if (!byMonth[m]) byMonth[m] = { month: m, sent: 0, accepted: 0 };
      byMonth[m].sent += 1;
      if (o.status === 'Accepted') byMonth[m].accepted += 1;
    });
    return Object.values(byMonth);
  }, [offers]);

  const monthlyRows = useMemo(() => {
    const byMonth = {};
    apps.forEach((a) => {
      if (!a.created_at) return;
      const m = new Date(a.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
      if (!byMonth[m]) byMonth[m] = { month: m, applied: 0, selected: 0, joined: 0 };
      byMonth[m].applied += 1;
      if (a.stage === 'Selected') byMonth[m].selected += 1;
      if (a.stage === 'Joined') byMonth[m].joined += 1;
    });
    return Object.values(byMonth);
  }, [apps]);

  if (loading) return <div className="page active"><div className="panel"><p style={{ color: 'var(--slate-light)' }}>Loading…</p></div></div>;
  if (error) return <div className="page active"><div className="panel"><p style={{ color: 'var(--red, #d64545)' }}>{error}</p></div></div>;

  return (
    <div className="page active" id="page-reports">
      <div className="page-head">
        <div><h1>Reports & Analytics</h1><p>{active ? REPORT_LIST.find((r) => r.key === active)?.t : 'Export to PDF or Excel'}</p></div>
        {active
          ? <button className="btn-outline" onClick={() => setActive(null)}>← Back</button>
          : <button className="btn-outline">Export Excel</button>}
      </div>

      {!active && (
        <div className="report-grid">
          {REPORT_LIST.map((r) => (
            <div
              className="report-tile"
              key={r.key}
              style={{ cursor: r.comingSoon ? 'default' : 'pointer', opacity: r.comingSoon ? 0.5 : 1 }}
              onClick={() => !r.comingSoon && setActive(r.key)}
            >
              <div><div className="t">{r.t}{r.comingSoon ? ' (Coming Soon)' : ''}</div><div className="d">{r.d}</div></div>
              <span className="arrow">→</span>
            </div>
          ))}
        </div>
      )}

      {active === 'campus' && (
        <div className="panel">
          <div className="panel-title">Campus-wise Report</div>
          <table className="data-table">
            <thead><tr><th>College</th><th>Applications</th><th>Selected</th><th>Joined</th></tr></thead>
            <tbody>
              {campusRows.map((r) => (
                <tr key={r.name}><td>{r.name}</td><td>{r.total}</td><td>{r.selected}</td><td>{r.joined}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active === 'company' && (
        <div className="panel">
          <div className="panel-title">Company-wise Report</div>
          <table className="data-table">
            <thead><tr><th>Company</th><th>Applications</th><th>Selected</th><th>Joined</th></tr></thead>
            <tbody>
              {companyRows.map((r) => (
                <tr key={r.name}><td>{r.name}</td><td>{r.total}</td><td>{r.selected}</td><td>{r.joined}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active === 'funnel' && (
        <div className="panel">
          <div className="panel-title">Hiring Funnel — Applied → Joined</div>
          <table className="data-table">
            <thead><tr><th>Stage</th><th>Candidates</th></tr></thead>
            <tbody>
              {funnelRows.map((r) => (
                <tr key={r.stage}><td>{r.stage}</td><td>{r.count}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active === 'selection' && (
        <div className="panel">
          <div className="panel-title">Selection Report — Shortlist to Offer</div>
          <p>Selected candidates: <b>{selectedCount}</b></p>
          <p>Offers sent: <b>{offersSent}</b></p>
          <p>Conversion: <b>{selectedCount > 0 ? Math.round((offersSent / selectedCount) * 100) : 0}%</b></p>
        </div>
      )}

      {active === 'joining' && (
        <div className="panel">
          <div className="panel-title">Joining Report — Accepted vs Joined</div>
          <p>Offers accepted: <b>{offersAccepted}</b></p>
          <p>Joined: <b>{joinedCount}</b></p>
          <p>Conversion: <b>{offersAccepted > 0 ? Math.round((joinedCount / offersAccepted) * 100) : 0}%</b></p>
        </div>
      )}

      {active === 'acceptance' && (
        <div className="panel">
          <div className="panel-title">Offer Acceptance Trend</div>
          <table className="data-table">
            <thead><tr><th>Month</th><th>Offers Sent</th><th>Accepted</th><th>Rate</th></tr></thead>
            <tbody>
              {acceptanceByMonth.map((r) => (
                <tr key={r.month}>
                  <td>{r.month}</td><td>{r.sent}</td><td>{r.accepted}</td>
                  <td>{r.sent > 0 ? Math.round((r.accepted / r.sent) * 100) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active === 'monthly' && (
        <div className="panel">
          <div className="panel-title">Monthly / Yearly Summary</div>
          <table className="data-table">
            <thead><tr><th>Month</th><th>Applied</th><th>Selected</th><th>Joined</th></tr></thead>
            <tbody>
              {monthlyRows.map((r) => (
                <tr key={r.month}><td>{r.month}</td><td>{r.applied}</td><td>{r.selected}</td><td>{r.joined}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}