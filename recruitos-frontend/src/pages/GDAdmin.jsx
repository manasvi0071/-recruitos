import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function GDAdmin() {
  const [sessions, setSessions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ topic: '', duration_minutes: 30 });
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  const fetchSessions = async () => {
    const { data } = await supabase
      .from('gd_sessions')
      .select('*')
      .order('created_at', { ascending: false });
    setSessions(data || []);
  };

  const fetchCandidates = async () => {
    const { data, error } = await supabase
      .from('candidates')
      .select('id, name, email, colleges(name)');
    if (error) {
      console.error('Failed to load candidates:', error);
    }
    setCandidates(data || []);
  };

  useEffect(() => {
    const load = async () => {
      await fetchSessions();
      await fetchCandidates();
    };
    load();
  }, []);

  const fetchSessionData = async (sessionId) => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gd/${sessionId}`);
    const data = await res.json();
    setSessionData(data);
  };

  const handleCreate = async () => {
    if (!form.topic || selectedCandidates.length === 0) {
      alert('Please enter a topic and select at least 2 candidates');
      return;
    }
    setCreating(true);
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gd/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: form.topic,
        duration_minutes: form.duration_minutes,
        candidates: selectedCandidates,
      }),
    });
    const data = await res.json();
    if (data.success) {
      alert('GD Session created! Invite emails sent to all students.');
      setForm({ topic: '', duration_minutes: 30 });
      setSelectedCandidates([]);
      await fetchSessions();
    }
    setCreating(false);
  };

  const handleStart = async (sessionId) => {
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gd/${sessionId}/start`, { method: 'POST' });
    await fetchSessions();
    setActiveSession(sessionId);
    await fetchSessionData(sessionId);
  };

  const handleEnd = async (sessionId) => {
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gd/${sessionId}/end`, { method: 'POST' });
    alert('GD ended! AI is scoring all participants. Check back in 30 seconds.');
    await fetchSessions();
    await fetchSessionData(sessionId);
  };

  const handleShortlist = async (sessionId, participantIds) => {
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gd/${sessionId}/shortlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantIds }),
    });
    alert('Shortlisted! Emails sent to selected students.');
    await fetchSessionData(sessionId);
  };

  const toggleCandidate = (c) => {
    setSelectedCandidates(prev =>
      prev.find(x => x.id === c.id)
        ? prev.filter(x => x.id !== c.id)
        : [...prev, c]
    );
  };

  return (
    <div className="page active">
      <div className="page-head">
        <div><h1>Group Discussion</h1><p>Create sessions, invite students, AI auto-scores after GD ends</p></div>
      </div>

      {/* Create Session */}
      <div className="panel">
        <div className="panel-title">Create New GD Session</div>
        <div className="panel-sub">Students will receive an email with their personal join link</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 16 }}>
          <div className="field" style={{ margin: 0 }}>
            <label>GD Topic</label>
            <input
              className="search-box"
              style={{ width: '100%' }}
              placeholder="e.g. AI vs Human Intelligence"
              value={form.topic}
              onChange={e => setForm({ ...form, topic: e.target.value })}
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Duration (minutes)</label>
            <input
              type="number"
              className="search-box"
              style={{ width: '100%' }}
              value={form.duration_minutes}
              onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div style={{ marginBottom: 16, position: 'relative' }}>
          <div style={{ fontSize: 11.5, color: 'var(--slate-light)', marginBottom: 8 }}>
            Select Candidates ({selectedCandidates.length} selected)
          </div>

          {/* Input box with selected candidates shown as chips */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              alignItems: 'center',
              width: '100%',
              minHeight: 40,
              padding: '6px 8px',
              border: 'none',
              borderRadius: 8,
              background: 'var(--cream)',
            }}
          >
            {selectedCandidates.map(c => (
              <span
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--gold-soft)',
                  border: '1px solid var(--gold)',
                  borderRadius: 6,
                  padding: '3px 8px',
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: 'var(--navy-deep)',
                }}
              >
                {c.name}
                <span
                  onClick={() => toggleCandidate(c)}
                  style={{ cursor: 'pointer', color: 'var(--slate-light)', fontWeight: 700 }}
                >
                  ✕
                </span>
              </span>
            ))}
            <input
              style={{
                flex: 1,
                minWidth: 120,
                border: 'none',
                outline: 'none',
                fontSize: 12.5,
                padding: '4px 2px',
              }}
              placeholder={selectedCandidates.length ? 'Add more…' : 'Click to select candidates…'}
              value={candidateSearch}
              onChange={e => setCandidateSearch(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            />
          </div>

          {/* Dropdown suggestions — show on focus or while typing */}
          {showDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 20,
                marginTop: 6,
                maxHeight: 240,
                overflowY: 'auto',
                border: '1px solid var(--line)',
                borderRadius: 8,
                background: '#fff',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              }}
            >
              {candidates
                .filter(c =>
                  !selectedCandidates.find(x => x.id === c.id) &&
                  (c.name?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
                    c.colleges?.name?.toLowerCase().includes(candidateSearch.toLowerCase()))
                )
                .slice(0, 20)
                .map(c => (
                  <div
                    key={c.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => toggleCandidate(c)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--line)',
                      fontSize: 12,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--cream)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--navy-deep)' }}>{c.name}</div>
                      <div style={{ color: 'var(--slate-light)', fontSize: 11 }}>
                        {c.colleges?.name || 'No college set'} · {c.email || 'No email'}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => toggleCandidate(c)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: 'pointer', flexShrink: 0 }}
                    />
                  </div>
                ))}
              {candidates.filter(c =>
                !selectedCandidates.find(x => x.id === c.id) &&
                (c.name?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
                  c.colleges?.name?.toLowerCase().includes(candidateSearch.toLowerCase()))
              ).length === 0 && (
                <div style={{ padding: 12, textAlign: 'center', color: 'var(--slate-light)', fontSize: 12 }}>
                  No candidates found
                </div>
              )}
            </div>
          )}
        </div>

        <button className="btn-gold" onClick={handleCreate} disabled={creating}>
          {creating ? 'Creating & Sending Emails...' : '+ Create GD Session'}
        </button>
      </div>

      {/* Sessions List */}
      <div className="panel">
        <div className="panel-title">GD Sessions</div>
        {sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--slate-light)' }}>No sessions yet</div>
        ) : (
          sessions.map(session => (
            <div key={session.id} style={{ padding: '16px 0', borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--navy-deep)', fontSize: 14 }}>{session.topic}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--slate-light)', marginTop: 3 }}>
                    {session.duration_minutes} mins · Created {new Date(session.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge ${session.status === 'Active' ? 'green' : session.status === 'Ended' ? 'gray' : 'gold'}`}>
                    {session.status}
                  </span>
                  {session.status === 'Pending' && (
                    <button className="btn-gold" style={{ fontSize: 11.5, padding: '6px 12px' }} onClick={() => handleStart(session.id)}>
                      Start GD
                    </button>
                  )}
                  {session.status === 'Active' && (
                    <button className="btn-outline" style={{ fontSize: 11.5, padding: '6px 12px', color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => handleEnd(session.id)}>
                      End GD
                    </button>
                  )}
                  <button className="btn-outline" style={{ fontSize: 11.5, padding: '6px 12px' }}
                    onClick={async () => { setActiveSession(session.id); await fetchSessionData(session.id); }}>
                    View Results
                  </button>
                </div>
              </div>

              {/* Results panel */}
              {activeSession === session.id && sessionData && (
                <div style={{ marginTop: 16, background: 'var(--cream)', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>
                    AI Scores {session.status !== 'Ended' ? '(available after GD ends)' : ''}
                  </div>
                  {sessionData.participants && sessionData.participants.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                      <div className={`score-ring ${p.ai_score >= 70 ? 'high' : p.ai_score >= 50 ? 'mid' : 'low'}`} style={{ fontSize: p.ai_score ? 12 : 10 }}>
                        {p.ai_score || '...'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.candidate_name}</div>
                        {p.ai_score && (
                          <div style={{ fontSize: 11, color: 'var(--slate-light)', marginTop: 2 }}>
                            Participation: {p.participation_score} · Communication: {p.communication_score} · Leadership: {p.leadership_score}
                          </div>
                        )}
                        {p.ai_feedback && (
                          <div style={{ fontSize: 11.5, color: 'var(--slate-light)', marginTop: 4, fontStyle: 'italic' }}>{p.ai_feedback}</div>
                        )}
                      </div>
                      {p.shortlisted ? (
                        <span className="badge green">Shortlisted</span>
                      ) : p.ai_score && (
                        <button className="btn-gold" style={{ fontSize: 11, padding: '5px 10px' }}
                          onClick={() => handleShortlist(session.id, [p.id])}>
                          Shortlist
                        </button>
                      )}
                    </div>
                  ))}

                  {sessionData.participants && sessionData.participants.filter(p => p.ai_score && !p.shortlisted).length > 0 && (
                    <button className="btn-gold" style={{ marginTop: 12 }}
                      onClick={() => {
                        const top = sessionData.participants.filter(p => p.ai_score >= 70 && !p.shortlisted).map(p => p.id);
                        if (top.length) handleShortlist(session.id, top);
                        else alert('No candidates scored 70 or above');
                      }}>
                      Shortlist All Above 70
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}