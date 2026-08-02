import { useState } from 'react';
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function MainLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="layout-container" style={{ display: 'flex', minHeight: '100vh', padding: '1rem', gap: '1.5rem', alignItems: 'flex-start' }}>

      {/* 모바일 전용 상단 햄버거 헤더 */}
      <header 
        className="mobile-header glass-panel" 
        style={{ 
          display: 'none', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0.75rem 1.25rem', 
          background: 'var(--glass-bg)', 
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          width: '100%'
        }}
      >
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
        >
          <Menu size={24} />
        </button>
        <span style={{ fontWeight: 700, color: 'var(--accent-color)', fontSize: '1.1rem' }}>PRODEV ERP</span>
        <div style={{ width: '24px' }}></div>
      </header>

      {/* 모바일용 뒷배경 어둡게 블러 오버레이 */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 1000
          }}
        />
      )}

      <Sidebar isMobileOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
