import { useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';

export default function GDRoom() {
  const callFrameRef = useRef(null);
  const containerRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const sessionId = parts[1];
      const token = new URLSearchParams(window.location.search).get('token');

      if (!sessionId || !token) {
        setError('Invalid GD link. Please use the link exactly as shared with you.');
        return;
      }

      try {
        const res = await fetch(`http://localhost:5000/api/gd/${sessionId}/token?token=${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not join session');

        if (cancelled) return;

        const callFrame = DailyIframe.createFrame(containerRef.current, {
          iframeStyle: { width: '100%', height: '100%', border: '0' },
        });
        callFrameRef.current = callFrame;
        await callFrame.join({ url: data.roomUrl, token: data.dailyToken });
        if (!cancelled) setJoined(true);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    init();

    return () => {
      cancelled = true;
      callFrameRef.current?.destroy();
    };
  }, []);

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <p style={{ color: 'var(--danger)', textAlign: 'center' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
        <strong>Group Discussion</strong> {!joined && '— connecting…'}
      </div>
      <div ref={containerRef} style={{ flex: 1 }} />
    </div>
  );
}