import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import type { VendorResponse } from '../../api/settlementApi';

interface ClientAutocompleteProps {
  clients: VendorResponse[];
  selectedId: number;
  onSelect: (id: number) => void;
  disabled?: boolean;
}

export default function ClientAutocomplete({ clients, selectedId, onSelect, disabled }: ClientAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = clients.find(c => c.vendorId === selectedId);

  const filtered = query.trim()
    ? clients.filter(c => c.vendorName.toLowerCase().includes(query.toLowerCase()))
    : clients;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (c: VendorResponse) => {
    onSelect(c.vendorId);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.65rem 0.75rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-primary)',
          cursor: disabled ? 'not-allowed' : 'text',
          opacity: disabled ? 0.6 : 1,
        }}
        onClick={() => {
          if (!disabled) setOpen(true);
        }}
      >
        <Search size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        {open && !disabled ? (
          <input
            autoFocus
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            placeholder="발주처 검색..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              width: '100%',
            }}
          />
        ) : (
          <span style={{ fontSize: '0.9rem', color: selected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            {selected ? selected.vendorName : '발주처를 검색하고 선택하세요'}
          </span>
        )}
      </div>
      {open && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            maxHeight: '200px',
            overflowY: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              검색 결과 없음
            </div>
          ) : (
            filtered.map(c => (
              <div
                key={c.vendorId}
                onMouseDown={() => handleSelect(c)}
                style={{
                  padding: '0.65rem 0.75rem',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  borderBottom: '1px solid var(--border-color)',
                  background: c.vendorId === selectedId ? 'var(--accent-color)20' : 'transparent',
                }}
              >
                <div style={{ fontWeight: 600 }}>{c.vendorName}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
