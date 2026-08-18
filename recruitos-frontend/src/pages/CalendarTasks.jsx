import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const PRIORITY_COLOR = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981',
};

const EVENT_COLOR = {
  drive: '#7C3AED',
  interview: '#06B6D4',
  gd: '#F59E0B',
  meeting: '#10B981',
  other: '#8B90A7',
};

const EVENT_LABEL = {
  drive: 'Campus Drive',
  interview: 'Interview',
  gd: 'Group Discussion',
  meeting: 'Meeting',
  other: 'Other',
};

export default function CalendarTasks() {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(true);

  const [newTask, setNewTask] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');

  const [newEvent, setNewEvent] = useState({
    title: '', date: '', time: '', type: 'drive',
  });

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const [{ data: t }, { data: e }] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('calendar_events').select('*').eq('user_id', session.user.id).order('event_date', { ascending: true }),
      ]);

      setTasks(t || []);
      setEvents(e || []);
      setLoading(false);
    };
    load();
  }, []);

  const addTask = async () => {
    if (!newTask.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    const { data } = await supabase.from('tasks').insert([{
      user_id: session.user.id,
      title: newTask.trim(),
      due_date: newTaskDate || null,
      priority: newTaskPriority,
      completed: false,
    }]).select().single();
    if (data) setTasks(prev => [data, ...prev]);
    setNewTask('');
    setNewTaskDate('');
    setNewTaskPriority('medium');
  };

  const toggleTask = async (id, completed) => {
    await supabase.from('tasks').update({ completed: !completed }).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t));
  };

  const deleteTask = async (id) => {
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.date) return;
    const { data: { session } } = await supabase.auth.getSession();
    const { data } = await supabase.from('calendar_events').insert([{
      user_id: session.user.id,
      title: newEvent.title.trim(),
      event_date: newEvent.date,
      event_time: newEvent.time || null,
      type: newEvent.type,
    }]).select().single();
    if (data) {
      setEvents(prev => [...prev, data].sort((a, b) =>
        new Date(a.event_date) - new Date(b.event_date)
      ));
    }
    setNewEvent({ title: '', date: '', time: '', type: 'drive' });
  };

  const deleteEvent = async (id) => {
    await supabase.from('calendar_events').delete().eq('id', id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const pendingTasks = tasks.filter(t => !t.completed);
  const doneTasks = tasks.filter(t => t.completed);
  const upcomingEvents = events.filter(e => e.event_date >= today);
  const pastEvents = events.filter(e => e.event_date < today);

  if (loading) {
    return (
      <div className="page active">
        <div className="page-head"><div><h1>Calendar & Tasks</h1></div></div>
        <div className="panel" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="page active">
      <div className="page-head">
        <div>
          <h1>Calendar & Tasks</h1>
          <p>{pendingTasks.length} pending tasks · {upcomingEvents.length} upcoming events</p>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="mode-toggle" style={{ marginBottom: 24 }}>
        <button
          className={`mode-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          📝 To-Do List
        </button>
        <button
          className={`mode-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          📅 Calendar Events
        </button>
      </div>

      {/* ===== TO-DO LIST ===== */}
      {activeTab === 'tasks' && (
        <>
          {/* Add task form */}
          <div className="panel">
            <div className="panel-title">Add New Task</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, marginTop: 12, alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Task</div>
                <input
                  className="search-box"
                  style={{ width: '100%' }}
                  placeholder="e.g. Follow up with SVCE TPO"
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                />
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due Date</div>
                <input
                  type="date"
                  className="search-box"
                  style={{ width: '100%' }}
                  value={newTaskDate}
                  onChange={e => setNewTaskDate(e.target.value)}
                />
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</div>
                <select
                  className="search-box"
                  style={{ width: '100%' }}
                  value={newTaskPriority}
                  onChange={e => setNewTaskPriority(e.target.value)}
                >
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>
              <button className="btn-gold" onClick={addTask}>+ Add</button>
            </div>
          </div>

          {/* Pending tasks */}
          <div className="panel">
            <div className="panel-title">Pending Tasks ({pendingTasks.length})</div>
            {pendingTasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                🎉 No pending tasks!
              </div>
            )}
            {pendingTasks.map(task => (
              <div key={task.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '13px 0',
                borderBottom: '1px solid var(--border-default)',
              }}>
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => toggleTask(task.id, task.completed)}
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--brand-purple)', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)' }}>{task.title}</div>
                  {task.due_date && (
                    <div style={{
                      fontSize: 11.5,
                      color: task.due_date < today ? '#EF4444' : 'var(--text-muted)',
                      marginTop: 3,
                    }}>
                      {task.due_date < today ? '⚠️ Overdue — ' : '📅 Due — '}
                      {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </div>
                  )}
                </div>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  color: PRIORITY_COLOR[task.priority],
                  background: PRIORITY_COLOR[task.priority] + '18',
                  border: `1px solid ${PRIORITY_COLOR[task.priority]}30`,
                  flexShrink: 0,
                }}>
                  {(task.priority || 'medium').toUpperCase()}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: 4 }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Done tasks */}
          {doneTasks.length > 0 && (
            <div className="panel">
              <div className="panel-title" style={{ color: 'var(--text-muted)' }}>Completed ({doneTasks.length})</div>
              {doneTasks.map(task => (
                <div key={task.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 0',
                  borderBottom: '1px solid var(--border-default)',
                  opacity: 0.55,
                }}>
                  <input
                    type="checkbox"
                    checked
                    onChange={() => toggleTask(task.id, task.completed)}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--brand-purple)', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, textDecoration: 'line-through', fontSize: 13.5, color: 'var(--text-muted)' }}>
                    {task.title}
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 4 }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== CALENDAR EVENTS ===== */}
      {activeTab === 'calendar' && (
        <>
          {/* Add event form */}
          <div className="panel">
            <div className="panel-title">Schedule New Event</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 10, marginTop: 12, alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event Title</div>
                <input
                  className="search-box"
                  style={{ width: '100%' }}
                  placeholder="e.g. SVCE Campus Drive"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && addEvent()}
                />
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</div>
                <input type="date" className="search-box" style={{ width: '100%' }}
                  value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time</div>
                <input type="time" className="search-box" style={{ width: '100%' }}
                  value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</div>
                <select className="search-box" style={{ width: '100%' }}
                  value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}>
                  <option value="drive">Campus Drive</option>
                  <option value="interview">Interview</option>
                  <option value="gd">Group Discussion</option>
                  <option value="meeting">Meeting</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button className="btn-gold" onClick={addEvent}>+ Add</button>
            </div>
          </div>

          {/* Upcoming events */}
          <div className="panel">
            <div className="panel-title">Upcoming Events ({upcomingEvents.length})</div>
            {upcomingEvents.length === 0 && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No upcoming events scheduled</div>
            )}
            {upcomingEvents.map(event => (
              <div key={event.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 0',
                borderBottom: '1px solid var(--border-default)',
              }}>
                <div style={{
                  width: 54, height: 54,
                  borderRadius: 12,
                  background: EVENT_COLOR[event.type] + '15',
                  border: `2px solid ${EVENT_COLOR[event.type]}30`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: EVENT_COLOR[event.type], lineHeight: 1 }}>
                    {new Date(event.event_date + 'T00:00:00').getDate()}
                  </div>
                  <div style={{ fontSize: 9, color: EVENT_COLOR[event.type], fontWeight: 700, textTransform: 'uppercase', marginTop: 1 }}>
                    {new Date(event.event_date + 'T00:00:00').toLocaleString('default', { month: 'short' })}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{event.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                    {event.event_time && `${event.event_time} · `}
                    <span style={{ color: EVENT_COLOR[event.type], fontWeight: 600 }}>
                      {EVENT_LABEL[event.type]}
                    </span>
                  </div>
                </div>
                {event.event_date === today && (
                  <span style={{
                    background: '#D1FAE5',
                    color: '#059669',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '4px 12px',
                    borderRadius: 20,
                    border: '1px solid #6EE7B7',
                  }}>
                    TODAY
                  </span>
                )}
                <button
                  onClick={() => deleteEvent(event.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, padding: 4 }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Past events */}
          {pastEvents.length > 0 && (
            <div className="panel">
              <div className="panel-title" style={{ color: 'var(--text-muted)' }}>Past Events ({pastEvents.length})</div>
              {pastEvents.map(event => (
                <div key={event.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '11px 0',
                  borderBottom: '1px solid var(--border-default)',
                  opacity: 0.5,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, textDecoration: 'line-through', color: 'var(--text-muted)' }}>{event.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {event.event_time && ` · ${event.event_time}`}
                    </div>
                  </div>
                  <button onClick={() => deleteEvent(event.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 4 }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}