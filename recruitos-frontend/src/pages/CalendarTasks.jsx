import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function CalendarTasks() {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', type: 'drive' });
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

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
      title: newTask,
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
    if (!newEvent.title || !newEvent.date) return;
    const { data: { session } } = await supabase.auth.getSession();
    const { data } = await supabase.from('calendar_events').insert([{
      user_id: session.user.id,
      title: newEvent.title,
      event_date: newEvent.date,
      event_time: newEvent.time || null,
      type: newEvent.type,
    }]).select().single();
    if (data) setEvents(prev => [...prev, data].sort((a, b) => new Date(a.event_date) - new Date(b.event_date)));
    setNewEvent({ title: '', date: '', time: '', type: 'drive' });
  };

  const deleteEvent = async (id) => {
    await supabase.from('calendar_events').delete().eq('id', id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const priorityColor = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' };
  const eventTypeColor = { drive: 'var(--brand-purple)', interview: 'var(--brand-electric)', gd: 'var(--warning)', meeting: 'var(--success)', other: 'var(--text-muted)' };
  const eventTypeLabel = { drive: 'Campus Drive', interview: 'Interview', gd: 'Group Discussion', meeting: 'Meeting', other: 'Other' };

  const today = new Date().toISOString().split('T')[0];
  const upcomingEvents = events.filter(e => e.event_date >= today);
  const pastEvents = events.filter(e => e.event_date < today);
  const pendingTasks = tasks.filter(t => !t.completed);
  const doneTasks = tasks.filter(t => t.completed);

  return (
    <div className="page active">
      <div className="page-head">
        <div>
          <h1>Calendar & Tasks</h1>
          <p>{pendingTasks.length} pending tasks · {upcomingEvents.length} upcoming events</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="mode-toggle" style={{ marginBottom: 24 }}>
        <button className={`mode-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
          📝 To-Do List
        </button>
        <button className={`mode-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          📅 Calendar Events
        </button>
      </div>

      {/* ===== TO-DO LIST ===== */}
      {activeTab === 'tasks' && (
        <div>
          {/* Add task */}
          <div className="panel">
            <div className="panel-title">Add New Task</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Task</label>
                <input
                  className="search-box"
                  style={{ width: '100%' }}
                  placeholder="e.g. Follow up with SVCE TPO"
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Due Date</label>
                <input
                  type="date"
                  className="search-box"
                  style={{ width: '100%' }}
                  value={newTaskDate}
                  onChange={e => setNewTaskDate(e.target.value)}
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Priority</label>
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
              <button className="btn-gold" onClick={addTask} style={{ alignSelf: 'flex-end' }}>
                + Add
              </button>
            </div>
          </div>

          {/* Pending tasks */}
          <div className="panel">
            <div className="panel-title">Pending ({pendingTasks.length})</div>
            {loading && <div style={{ color: 'var(--text-muted)', padding: 16 }}>Loading...</div>}
            {!loading && pendingTasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                🎉 All tasks done!
              </div>
            )}
            {pendingTasks.map(task => (
              <div key={task.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 0',
                borderBottom: '1px solid var(--border-default)',
              }}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id, task.completed)}
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--brand-purple)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)' }}>{task.title}</div>
                  {task.due_date && (
                    <div style={{ fontSize: 11.5, color: task.due_date < today ? 'var(--danger)' : 'var(--text-muted)', marginTop: 2 }}>
                      {task.due_date < today ? '⚠️ Overdue · ' : '📅 Due · '}
                      {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </div>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  color: priorityColor[task.priority],
                  background: `${priorityColor[task.priority]}15`,
                  border: `1px solid ${priorityColor[task.priority]}30`,
                }}>
                  {task.priority?.toUpperCase()}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 4 }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Completed tasks */}
          {doneTasks.length > 0 && (
            <div className="panel">
              <div className="panel-title" style={{ color: 'var(--text-muted)' }}>Completed ({doneTasks.length})</div>
              {doneTasks.map(task => (
                <div key={task.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border-default)',
                  opacity: 0.6,
                }}>
                  <input type="checkbox" checked onChange={() => toggleTask(task.id, task.completed)}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--brand-purple)' }} />
                  <div style={{ flex: 1, textDecoration: 'line-through', fontSize: 13.5, color: 'var(--text-muted)' }}>{task.title}</div>
                  <button onClick={() => deleteTask(task.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 4 }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== CALENDAR EVENTS ===== */}
      {activeTab === 'calendar' && (
        <div>
          {/* Add event */}
          <div className="panel">
            <div className="panel-title">Schedule New Event</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Event Title</label>
                <input
                  className="search-box"
                  style={{ width: '100%' }}
                  placeholder="e.g. SVCE Campus Drive"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Date</label>
                <input type="date" className="search-box" style={{ width: '100%' }}
                  value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Time</label>
                <input type="time" className="search-box" style={{ width: '100%' }}
                  value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Type</label>
                <select className="search-box" style={{ width: '100%' }}
                  value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}>
                  <option value="drive">Campus Drive</option>
                  <option value="interview">Interview</option>
                  <option value="gd">Group Discussion</option>
                  <option value="meeting">Meeting</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button className="btn-gold" onClick={addEvent} style={{ alignSelf: 'flex-end' }}>
                + Add
              </button>
            </div>
          </div>

          {/* Upcoming events */}
          <div className="panel">
            <div className="panel-title">Upcoming Events ({upcomingEvents.length})</div>
            {loading && <div style={{ color: 'var(--text-muted)', padding: 16 }}>Loading...</div>}
            {!loading && upcomingEvents.length === 0 && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No upcoming events</div>
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
                  width: 52, height: 52,
                  borderRadius: 12,
                  background: `${eventTypeColor[event.type]}15`,
                  border: `2px solid ${eventTypeColor[event.type]}30`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: eventTypeColor[event.type] }}>
                    {new Date(event.event_date).getDate()}
                  </div>
                  <div style={{ fontSize: 9, color: eventTypeColor[event.type], fontWeight: 700, textTransform: 'uppercase' }}>
                    {new Date(event.event_date).toLocaleString('default', { month: 'short' })}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{event.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {event.event_time && `${event.event_time} · `}
                    <span style={{ color: eventTypeColor[event.type], fontWeight: 600 }}>
                      {eventTypeLabel[event.type]}
                    </span>
                  </div>
                </div>
                {event.event_date === today && (
                  <span style={{ background: 'var(--success-soft)', color: 'var(--success)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                    TODAY
                  </span>
                )}
                <button onClick={() => deleteEvent(event.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 4 }}>✕</button>
              </div>
            ))}
          </div>

          {/* Past events */}
          {pastEvents.length > 0 && (
            <div className="panel">
              <div className="panel-title" style={{ color: 'var(--text-muted)' }}>Past Events ({pastEvents.length})</div>
              {pastEvents.map(event => (
                <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--border-default)', opacity: 0.5 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, textDecoration: 'line-through', color: 'var(--text-muted)' }}>{event.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{new Date(event.event_date).toLocaleDateString()}</div>
                  </div>
                  <button onClick={() => deleteEvent(event.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14 }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}