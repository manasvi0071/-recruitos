import { useEffect, useState } from 'react';
import { getJoiningStatus } from '../lib/api';

const STATUS_BADGE = {
  Awaiting: 'gray',
  Accepted: 'gold',
  Joined: 'green',
  'No Show': 'red',
};

export default function Joining() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJoiningStatus()
      .then(setRows)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page active" id="page-joining">
      <div className="page-head"><div><h1>Joining Tracker</h1><p>Live status for every selected candidate</p></div></div>
      <div className="panel">
        <table>
          <tbody>
            <tr><th>Candidate</th><th>Campus</th><th>Company</th><th>Offer</th><th>Status</th><th>Joining Date</th></tr>
            {loading && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--slate-light)', padding: 24 }}>Loading…</td></tr>
            )}
            {error && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--red, #d64545)', padding: 24 }}>{error}</td></tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--slate-light)', padding: 24 }}>No joining records yet</td></tr>
            )}
            {!loading && !error && rows.map((r) => (
              <tr key={r.id}>
                <td>{r.candidates?.name}</td>
                <td>{r.candidates?.colleges?.name || '—'}</td>
                <td>{r.offers?.job_profiles?.company || '—'}</td>
                <td><span className={`badge ${r.offers?.status === 'Sent' ? 'green' : 'gray'}`}>{r.offers?.status || '—'}</span></td>
                <td><span className={`badge ${STATUS_BADGE[r.status] || 'gray'}`}>{r.status}</span></td>
                <td>{r.joining_date ? new Date(r.joining_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}