import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileSpreadsheet, FolderGit2, HardDrive, Settings, Moon, Sun, LogOut, User, X, BarChart3, History } from 'lucide-react';
import { useState, useEffect } from 'react';

const MENU_ITEMS = [
  { path: '/', label: '대시보드', icon: <LayoutDashboard size={20} /> },
  { path: '/analytics', label: '상세 경영 지표', icon: <BarChart3 size={20} /> },
  { path: '/projects', label: '현장 목록 관리', icon: <FolderGit2 size={20} /> },
  { path: '/settlements', label: '정산 및 매입 관리', icon: <FileSpreadsheet size={20} /> },
  { path: '/settlement-history', label: '현장 이력 현황', icon: <History size={20} /> },
  { path: '/master', label: '마스터 데이터 관리', icon: <HardDrive size={20} /> },
  { path: '/settings', label: '시스템 설정', icon: <Settings size={20} /> },
];


export default function Sidebar({ isMobileOpen, onClose }: { isMobileOpen?: boolean; onClose?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDarkMode = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDarkMode) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <aside className={`glass-panel ${isMobileOpen ? 'mobile-active' : ''}`} style={{ width: '280px', minWidth: '280px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '1rem', height: 'calc(100vh - 2rem)', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-color)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            PRODEV ERP
          </h2>
          <p className="text-muted">Premium Interior System</p>
        </div>
        <button 
          className="mobile-close-btn"
          onClick={onClose}
          style={{
            display: 'none',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={24} />
        </button>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
        {MENU_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              to={item.path}
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', borderRadius: '8px', 
                textDecoration: 'none',
                background: isActive ? 'var(--accent-color)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-primary)',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 사용자 정보 및 로그아웃 버튼 */}
      {currentUser && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.75rem 0', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <User size={16} style={{ color: 'var(--accent-color)' }} />
            <span style={{ fontWeight: 600 }}>{currentUser.username}님</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({currentUser.role})</span>
          </div>
          <button 
            className="btn" 
            style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem' }}
            onClick={handleLogout}
          >
            <LogOut size={16} /> 로그아웃
          </button>
        </div>
      )}

      {/* 테마 스위치 버튼 */}
      <div style={{ marginTop: currentUser ? '0' : 'auto' }}>
        <button className="btn" 
                style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                onClick={toggleTheme}>
          {theme === 'light' ? <><Moon size={18} /> 다크 모드로 전환</> : <><Sun size={18} /> 라이트 모드로 전환</>}
        </button>
      </div>
    </aside>
  );
}
