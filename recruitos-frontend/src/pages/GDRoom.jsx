import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function GDRoom() {
  const [session, setSession] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  const sessionId = window.location.pathname.split('/')[2];
  const token = new URLSearchParams(window.location.search).get('token');

  useEffect(() => {
    const init = async () => {
      // Validate token
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gd/${sessionId}/join?token=${token}`);
      if (!res.ok) { setError('Invalid or expired link.'); setLoading(false); return; }
      const data = await res.json();
      setParticipant(data.participant);

      // Get session + messages
      const sessionRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gd/${sessionId}`);
      const sessionData = await sessionRes.json();
      setSession(sessionData.session);
      setMessages(sessionData.messages || []);
      setLoading(false);
    };
    init();
  }, [sessionId, token]);

  useEffect(() => {
    if (!sessionId) return;

    // Realtime messages subscription
    const channel = supabase
      .channel('gd-messages-' + sessionId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'gd_messages',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    // Realtime session status
    const sessionChannel = supabase
      .channel('gd-session-' + sessionId)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'gd_sessions',
        filter: `id=eq.${sessionId}`,
      }, (payload) => {
        setSession(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(sessionChannel);
    };
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !participant) return;
    if (session?.status !== 'Active') {
      alert('GD has not started yet or has ended.');
      return;
    }

    await supabase.from('gd_messages').insert([{
      session_id: sessionId,
      participant_id: participant.id,
      candidate_name: participant.candidate_name,
      message: input.trim(),
    }]);

    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
      <div style={{ color: 'var(--slate-light)' }}>Loading GD Room...</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>❌</div>
        <div style={{ color: 'var(--red)', fontWeight: 600 }}>{error}</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: 'var(--navy-deep)', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'Fraunces, serif', color: 'var(--white)', fontSize: 18, fontWeight: 600 }}>RecruitOS — GD Room</div>
          <div style={{ color: 'var(--gold-soft)', fontSize: 12, marginTop: 2 }}>Topic: {session?.topic}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className={`badge ${session?.status === 'Active' ? 'green' : session?.status === 'Ended' ? 'gray' : 'gold'}`}>
            {session?.status === 'Active' ? 'LIVE' : session?.status === 'Ended' ? 'GD Ended' : 'Waiting to Start'}
          </span>
          <div style={{ color: 'var(--gold-soft)', fontSize: 12 }}>You: <strong>{participant?.candidate_name}</strong></div>
        </div>
      </div>

      {/* Topic banner */}
      <div style={{ background: 'var(--gold-soft)', padding: '12px 28px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontSize: 12, color: 'var(--slate-light)' }}>Discuss the topic below. Press Enter to send your message.</div>
        <div style={{ fontWeight: 600, color: 'var(--navy-deep)', fontSize: 15, marginTop: 2 }}>"{session?.topic}"</div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 'calc(100vh - 220px)' }}>
        {session?.status === 'Pending' && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--slate-light)' }}>
            Waiting for admin to start the GD...
          </div>
        )}
        {session?.status === 'Ended' && (
          <div style={{ textAlign: 'center', background: '#E1ECE6', borderRadius: 10, padding: 16, color: 'var(--green)', fontWeight: 600 }}>
            GD has ended. AI is scoring your performance. You will receive an email if shortlisted.
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.participant_id === participant?.id;
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: isMe ? 'var(--gold)' : 'var(--navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                {msg.candidate_name?.[0]}
              </div>
              <div style={{ maxWidth: '70%' }}>
                <div style={{ fontSize: 10.5, color: 'var(--slate-light)', marginBottom: 3, textAlign: isMe ? 'right' : 'left' }}>
                  {msg.candidate_name}
                </div>
                <div style={{
                  background: isMe ? 'var(--navy-deep)' : 'white',
                  color: isMe ? 'var(--gold-soft)' : 'var(--slate)',
                  padding: '10px 14px',
                  borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  fontSize: 13.5,
                  border: '1px solid var(--line)',
                  lineHeight: 1.5,
                }}>
                  {msg.message}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ padding: '16px 28px', background: 'white', borderTop: '1px solid var(--line)', display: 'flex', gap: 10 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={session?.status === 'Active' ? 'Type your argument and press Enter...' : 'Waiting for GD to start...'}
          disabled={session?.status !== 'Active'}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1px solid var(--line)',
            borderRadius: 8,
            fontSize: 13.5,
            resize: 'none',
            height: 50,
            background: session?.status !== 'Active' ? 'var(--cream)' : 'white',
          }}
        />
        <button
          className="btn-gold"
          onClick={sendMessage}
          disabled={session?.status !== 'Active' || !input.trim()}
          style={{ padding: '10px 20px', alignSelf: 'flex-end' }}
        >
          Send
        </button>
      </div>
    </div>
  );
}