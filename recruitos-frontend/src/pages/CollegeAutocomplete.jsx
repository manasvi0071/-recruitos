// CollegeAutocomplete.jsx
// Searchable college picker — replaces a plain <select> that's unusable
// once there are thousands of colleges in the list.

import { useState, useRef, useEffect } from 'react';

export default function CollegeAutocomplete({ colleges, value, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const selected = colleges.find((c) => c.id === value);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = colleges
    .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      const q = query.toLowerCase();
      const aStarts = a.name.toLowerCase().startsWith(q);
      const bStarts = b.name.toLowerCase().startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 50);

  function highlightMatch(name, q) {
    if (!q) return name;
    const idx = name.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return name;
    return (
      <>
        {name.slice(0, idx)}
        <mark style={{ background: '#F5E6FF', color: '#8B5CF6', fontWeight: 700 }}>
          {name.slice(idx, idx + q.length)}
        </mark>
        {name.slice(idx + q.length)}
      </>
    );
  }

  function handleSelect(college) {
    onChange(college.id);
    setQuery('');
    setOpen(false);
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          fontSize: 14, color: '#B0B0B0', pointerEvents: 'none',
        }}>
          🔍
        </span>
        <input
          value={open ? query : selected?.name || ''}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setQuery(''); setOpen(true); }}
          placeholder="Search your college…"
          style={{
            width: '100%',
            padding: '11px 14px 11px 38px',
            borderRadius: 10,
            border: open ? '1.5px solid #8B5CF6' : '1px solid #E2E2E8',
            fontSize: 13.5,
            boxSizing: 'border-box',
            outline: 'none',
            color: '#1A1A1A',
            background: '#fff',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxShadow: open ? '0 0 0 3px rgba(139,92,246,0.12)' : 'none',
          }}
        />
        {selected && !open && (
          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#8B5CF6' }}>
            ✓
          </span>
        )}
      </div>

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: '#fff', border: '1px solid #EDEDF2', borderRadius: 12,
            maxHeight: 270, overflowY: 'auto',
            boxShadow: '0 12px 32px -6px rgba(20,10,40,0.14), 0 2px 8px rgba(20,10,40,0.06)',
            zIndex: 50, padding: '6px',
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '16px 14px', fontSize: 13, color: '#AAA', textAlign: 'center' }}>
              No colleges found for "{query}".
            </div>
          ) : (
            filtered.map((c) => {
              const isSelected = c.id === value;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  style={{
                    padding: '10px 12px',
                    fontSize: 13,
                    fontWeight: isSelected ? 600 : 400,
                    cursor: 'pointer',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: isSelected ? '#F5F0FF' : 'transparent',
                    color: isSelected ? '#8B5CF6' : '#333',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#FAFAFC'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span>{highlightMatch(c.name, query)}</span>
                  {isSelected && <span>✓</span>}
                </div>
              );
            })
          )}
          {colleges.length > 50 && filtered.length === 50 && (
            <div style={{ padding: '8px 12px', fontSize: 11, color: '#BBB', borderTop: '1px solid #F2F2F5', marginTop: 4 }}>
              Showing first 50 results — keep typing to narrow it down.
            </div>
          )}
        </div>
      )}
    </div>
  );
}