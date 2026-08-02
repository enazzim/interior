import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/userApi';
import { Lock, User, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await loginUser(loginId, password);
      localStorage.setItem('currentUser', JSON.stringify(user));
      navigate('/');
    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setError('로그인 중 서버 오류가 발생했습니다. 서버 상태를 확인해 주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', padding: '1rem',
      color: '#fff', fontFamily: 'sans-serif'
    }}>
      <div className="glass-panel" style={{
        padding: '2.5rem', width: '100%', maxWidth: '420px',
        display: 'flex', flexDirection: 'column', gap: '2rem',
        borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#6366f1', margin: 0, letterSpacing: '-0.05em' }}>
            PRODEV ERP
          </h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            Premium Interior Management System
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '0.75rem 1rem', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>로그인 아이디</label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1rem', borderRadius: '8px',
              background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff'
            }}>
              <User size={18} style={{ color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="아이디 입력 (예: admin)"
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                style={{
                  border: 'none', background: 'transparent', outline: 'none',
                  color: '#fff', fontSize: '0.9rem', width: '100%'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>비밀번호</label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1rem', borderRadius: '8px',
              background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff'
            }}>
              <Lock size={18} style={{ color: '#94a3b8' }} />
              <input
                type="password"
                placeholder="비밀번호 입력 (예: 1234)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  border: 'none', background: 'transparent', outline: 'none',
                  color: '#fff', fontSize: '0.9rem', width: '100%'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              padding: '0.85rem', fontSize: '1rem', fontWeight: 700,
              borderRadius: '8px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginTop: '0.5rem', background: '#6366f1',
              color: '#fff', border: 'none', cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#4f46e5'}
            onMouseOut={e => e.currentTarget.style.background = '#6366f1'}
          >
            {loading ? '인증 진행 중...' : '시스템 로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
