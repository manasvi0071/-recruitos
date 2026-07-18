import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const BACKEND_URL = 'http://localhost:5000';

export default function AIInterview() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const candidateId = parts[1];
  const jobId = parts[2];

  const [phase, setPhase] = useState('loading');
  const [candidate, setCandidate] = useState(null);
  const [job, setJob] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    async function loadInfo() {
      if (!candidateId || !jobId) {
        setErrorMsg('Invalid interview link. Please use the link exactly as shared with you.');
        setPhase('error');
        return;
      }
      try {
        const [{ data: cand, error: candErr }, { data: jobRow, error: jobErr }] = await Promise.all([
          supabase.from('candidates').select('name').eq('id', candidateId).single(),
          supabase.from('job_profiles').select('title, company').eq('id', jobId).single(),
        ]);
        if (candErr || jobErr) throw candErr || jobErr;
        setCandidate(cand);
        setJob(jobRow);
        setPhase('intro');
      } catch (err) {
        setErrorMsg('Could not load your interview details. Please check the link or contact the recruiter.');
        setPhase('error');
      }
    }
    loadInfo();
  }, [candidateId, jobId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function startInterview() {
    setPhase('chatting');
    setSending(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/ai-interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id: candidateId, job_id: jobId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start interview');
      setSessionId(data.sessionId);
      setMessages([{ role: 'assistant', content: data.question }]);
    } catch (err) {
      setErrorMsg(err.message);
      setPhase('error');
    } finally {
      setSending(false);
    }
  }

  async function sendAnswer() {
    if (!input.trim() || sending) return;
    const answer = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: answer }]);
    setSending(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/ai-interview/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, answer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      if (data.done) {
        setResult(data.evaluation);
        setPhase('done');
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.question }]);
      }
    } catch (err) {
      setErrorMsg(err.message);
      setPhase('error');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAnswer();
    }
  }

  const pageStyle = {
    minHeight: '100vh',
    background: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  };

  const cardStyle = {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-xl)',
    width: '100%',
    maxWidth: 560,
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-lg)',
    overflow: 'hidden',
  };

  if (phase === 'loading') {
    return <div style={pageStyle}><p style={{ color: 'var(--text-muted)' }}>Loading your interview…</p></div>;
  }

  if (phase === 'error') {
    return (
      <div style={pageStyle}>
        <div style={{ ...cardStyle, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div style={pageStyle}>
        <div style={{ ...cardStyle, padding: '40px 36px', textAlign: 'center' }}>
          <div className="brand-mark" style={{ margin: '0 auto 20px' }}>R</div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 21, marginBottom: 8, color: 'var(--text-primary)' }}>
            Hi {candidate?.name?.split(' ')[0]}, ready for your AI interview?
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 4 }}>
            for <strong style={{ color: 'var(--text-primary)' }}>{job?.title}</strong> {job?.company ? `at ${job.company}` : ''}
          </p>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '16px 0 28px', lineHeight: 1.6 }}>
            This is a short, friendly text-based interview. Our AI will ask you a handful of questions —
            answer honestly and take your time. It usually takes 5-10 minutes.
          </p>
          <button className="btn-primary" onClick={startInterview}>Start Interview</button>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div style={pageStyle}>
        <div style={{ ...cardStyle, padding: '40px 36px', textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, marginBottom: 8, color: 'var(--text-primary)' }}>
            Thanks, {candidate?.name?.split(' ')[0]}!
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Your interview has been submitted. Our recruitment team will review it and reach out
            with next steps soon. Good luck!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', height: '80vh', maxHeight: 640 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="brand-mark" style={{ width: 32, height: 32, fontSize: 14 }}>R</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>AI Interview</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{job?.title}</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                background: m.role === 'user' ? 'var(--primary)' : 'var(--surface-2)',
                color: m.role === 'user' ? 'white' : 'var(--text-primary)',
                fontSize: 13.5,
                lineHeight: 1.5,
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '10px 14px', borderRadius: '14px 14px 14px 2px', background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: 13 }}>
                Thinking…
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer…"
            disabled={sending}
            rows={1}
            style={{
              flex: 1, resize: 'none', padding: '10px 14px', border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)', fontSize: 13.5, fontFamily: 'inherit', background: 'var(--bg)',
            }}
          />
          <button className="btn-primary" disabled={sending || !input.trim()} onClick={sendAnswer} style={{ width: 'auto', padding: '0 20px' }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}