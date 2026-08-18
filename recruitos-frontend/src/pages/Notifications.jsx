import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      setNotifications(data || []);
      setLoading(false);

      // Mark all as read
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', session.user.id)
        .eq('read', false);
    };
    load();
  }, []);

  const getIcon = (type) => {
    const icons = {
      selected: '🎉',
      rejected: '❌',
      shortlisted: '✅',
      interview: '📅',
      offer: '📄',
      gd: '💬',
      aptitude: '📝',
      default: '🔔',
    };
    return icons[type] || icons.default;
  };

  const getColor = (type) => {
    const colors = {
      selected: 'var(--success)',
      rejected: 'var(--danger)',
      shortlisted: 'var(--success)',
      interview: 'var(--brand-purple)',
      offer: 'var(--brand-gold)',
      default: 'var(--text-muted)',
    };
    return colors[type] || colors.default;
  };

  return (
    <div className="page active">
      <div className="page-head">
        <div>
          <h1>Notifications</h1>
          <p>{notifications.filter(n => !n.read).length} unread · {notifications.length} total</p>
        </div>
        <button className="btn-outline" onClick={async () => {
          const { data: { session } } = await supabase.auth.getSession();
          await supabase.from('notifications').delete().eq('user_id', session.user.id);
          setNotifications([]);
        }}>
          Clear All
        </button>
      </div>

      {loading ? (
        <div className="panel" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No notifications yet</div>
        </div>
      ) : (
        <div className="panel">
          {notifications.map((n) => (
            <div key={n.id} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              padding: '16px 0',
              borderBottom: '1px solid var(--border-default)',
              opacity: n.read ? 0.7 : 1,
            }}>
              <div style={{
                width: 44, height: 44,
                borderRadius: '50%',
                background: 'var(--bg-surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                flexShrink: 0,
                border: `2px solid ${getColor(n.type)}`,
              }}>
                {getIcon(n.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {n.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {n.message}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
              {!n.read && (
                <div style={{
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: 'var(--brand-purple)',
                  flexShrink: 0,
                  marginTop: 6,
                }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}