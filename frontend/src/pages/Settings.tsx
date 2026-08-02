import { useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Users, Building, Plus, Pencil, Trash2, X, Save, Shield } from 'lucide-react';
import { fetchAllUsers, createUser, updateUser, deleteUser } from '../api/userApi';
import type { UserResponse, UserCreateRequest } from '../api/userApi';
import { fetchCompany, updateCompany } from '../api/companyApi';
import type { CompanyResponse, CompanyUpdateRequest } from '../api/companyApi';

type Tab = 'users' | 'company';

const ROLES = ['ADMIN', 'STAFF'];
const ROLE_LABELS: Record<string, string> = { ADMIN: '관리자', STAFF: '직원' };

const initUserForm = (): UserCreateRequest => ({ username: '', loginId: '', password: '', role: 'STAFF' });

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [isAdmin, setIsAdmin] = useState(false);

  // ─── 직원 계정 상태 ──────────────────────────────────────
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userForm, setUserForm] = useState<UserCreateRequest>(initUserForm());

  // ─── 회사 정보 상태 ──────────────────────────────────────
  const [, setCompany] = useState<CompanyResponse | null>(null);
  const [companyForm, setCompanyForm] = useState<CompanyUpdateRequest>({ 
    companyName: '', 
    businessNumber: '', 
    address: '', 
    subscriptionPlan: 'STANDARD',
    businessType: '',
    businessItem: '',
    tel: '',
    fax: '',
    ceoName: ''
  });
  const [companySaved, setCompanySaved] = useState(false);

  // ─── 초기 로드 ───────────────────────────────────────────
  useEffect(() => {
    loadUsers();
    loadCompany();

    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setIsAdmin(u.role === 'ADMIN');
      } catch (e) {
        setIsAdmin(false);
      }
    }
  }, []);

  const loadUsers = async () => {
    const data = await fetchAllUsers();
    setUsers(data);
  };

  const loadCompany = async () => {
    try {
      const data = await fetchCompany(1);
      setCompany(data);
      setCompanyForm({ 
        companyName: data.companyName, 
        businessNumber: data.businessNumber ?? '', 
        address: data.address ?? '', 
        subscriptionPlan: data.subscriptionPlan,
        businessType: data.businessType ?? '',
        businessItem: data.businessItem ?? '',
        tel: data.tel ?? '',
        fax: data.fax ?? '',
        ceoName: data.ceoName ?? ''
      });
    } catch (e) {
      console.error('회사 정보 조회 실패:', e);
    }
  };

  // ─── 직원 핸들러 ─────────────────────────────────────────
  const openUserModal = (u?: UserResponse) => {
    if (u) {
      setEditingUserId(u.userId);
      setUserForm({ username: u.username, loginId: u.loginId, password: '', role: u.role });
    } else {
      setEditingUserId(null);
      setUserForm(initUserForm());
    }
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username.trim()) {
      alert("이름을 입력해 주세요.");
      return;
    }
    if (!editingUserId) {
      if (!userForm.loginId.trim()) {
        alert("로그인 ID를 입력해 주세요.");
        return;
      }
      if (!userForm.password.trim()) {
        alert("비밀번호를 입력해 주세요.");
        return;
      }
    }
    try {
      if (editingUserId) {
        await updateUser(editingUserId, { username: userForm.username, password: userForm.password, role: userForm.role });
      } else {
        await createUser(userForm);
      }
      setShowUserModal(false);
      loadUsers();
    } catch (error) {
      console.error(error);
      alert("직원 정보 저장 중 오류가 발생했습니다. 아이디 중복 등을 확인하세요.");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('해당 직원 계정을 삭제하시겠습니까?')) {
      try {
        await deleteUser(id);
        setUsers(prev => prev.filter(u => u.userId !== id));
        alert('직원 계정이 정상 삭제되었습니다.');
      } catch (error) {
        console.error(error);
        alert('직원 계정 삭제에 실패했습니다. (관리자 권한 또는 네트워크 상태를 확인하세요)');
      }
    }
  };

  // ─── 회사 정보 핸들러 ────────────────────────────────────
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCompany(1, companyForm);
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 2500);
    loadCompany();
  };

  // ─── 스타일 ──────────────────────────────────────────────
  const tabStyle = (tab: Tab) => ({
    padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontWeight: 600, fontSize: '0.9rem',
    background: activeTab === tab ? 'var(--accent-color)' : 'transparent',
    color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
    transition: 'all 0.2s',
  });

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  };
  const modalStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)', borderRadius: '16px', padding: '2rem',
    width: '420px', maxWidth: '95vw', border: '1px solid var(--border-color)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px',
    border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
    color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' };

  return (
    <MainLayout>
      {!isAdmin && (
        <div style={{ background: '#f59e0b20', border: '1px solid #f59e0b50', color: '#d97706', padding: '0.75rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
          ⚠️ 시스템 설정 메뉴는 관리자(ADMIN) 권한을 가진 계정만 수정할 수 있습니다. 현재 계정은 읽기 전용 상태입니다.
        </div>
      )}
      <header className="glass-panel" style={{ padding: '1.25rem 2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700 }}>시스템 설정</h1>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-primary)', borderRadius: '10px', padding: '0.35rem' }}>
          <button style={tabStyle('users')} onClick={() => setActiveTab('users')}><Users size={14} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />직원 계정</button>
          <button style={tabStyle('company')} onClick={() => setActiveTab('company')}><Building size={14} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />회사 정보</button>
        </div>
      </header>

      {/* ─── 직원 계정 탭 ──────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>직원 계정 관리</h2>
            {isAdmin ? (
              <button className="btn btn-primary" onClick={() => openUserModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Plus size={14} /> 직원 추가
              </button>
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>🔒 권한 없음</span>
            )}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>이름</th>
                <th style={{ padding: '0.5rem' }}>로그인 ID</th>
                <th style={{ padding: '0.5rem' }}>권한</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.userId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.6rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--accent-color)30', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)', fontWeight: 700, fontSize: '0.8rem' }}>
                      {u.username.charAt(0)}
                    </div>
                    {u.username}
                  </td>
                  <td style={{ padding: '0.6rem', color: 'var(--text-secondary)' }}>{u.loginId}</td>
                  <td style={{ padding: '0.6rem' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 600,
                      background: u.role === 'ADMIN' ? '#8b5cf620' : '#6b728020',
                      color: u.role === 'ADMIN' ? '#8b5cf6' : '#9ca3af',
                    }}>
                      <Shield size={10} />{ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td style={{ padding: '0.6rem', textAlign: 'center', display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                    {isAdmin ? (
                      <>
                        <button onClick={() => openUserModal(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-color)' }}><Pencil size={14} /></button>
                        <button onClick={() => handleDeleteUser(u.userId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>수정 불가</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>등록된 직원 계정이 없습니다.</div>}
        </div>
      )}

      {/* ─── 회사 정보 탭 ──────────────────────────────────── */}
      {activeTab === 'company' && (
        <div className="glass-panel" style={{ padding: '1.5rem', maxWidth: '580px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' }}>회사 프로필 설정</h2>
          <form onSubmit={handleSaveCompany} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>회사명 *</label>
                <input style={inputStyle} value={companyForm.companyName} onChange={e => setCompanyForm({ ...companyForm, companyName: e.target.value })} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>대표자명</label>
                <input style={inputStyle} value={companyForm.ceoName} onChange={e => setCompanyForm({ ...companyForm, ceoName: e.target.value })} placeholder="예: 홍길동" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>사업자등록번호</label>
              <input style={inputStyle} value={companyForm.businessNumber} onChange={e => setCompanyForm({ ...companyForm, businessNumber: e.target.value })} placeholder="예: 123-45-67890" />
            </div>
            <div>
              <label style={labelStyle}>사업장 주소</label>
              <input style={inputStyle} value={companyForm.address} onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })} placeholder="예: 서울시 강남구 테헤란로 123" />
            </div>
            {/* 업태 & 종목 */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>업태</label>
                <input style={inputStyle} value={companyForm.businessType} onChange={e => setCompanyForm({ ...companyForm, businessType: e.target.value })} placeholder="예: 건설업, 서비스" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>종목</label>
                <input style={inputStyle} value={companyForm.businessItem} onChange={e => setCompanyForm({ ...companyForm, businessItem: e.target.value })} placeholder="예: 실내건축, 인테리어" />
              </div>
            </div>
            {/* 전화번호 & 팩스번호 */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>전화번호 (Tel)</label>
                <input style={inputStyle} value={companyForm.tel} onChange={e => setCompanyForm({ ...companyForm, tel: e.target.value })} placeholder="예: 02-1234-5678" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>팩스번호 (Fax)</label>
                <input style={inputStyle} value={companyForm.fax} onChange={e => setCompanyForm({ ...companyForm, fax: e.target.value })} placeholder="예: 02-1234-5679" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              {isAdmin ? (
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Save size={14} /> 변경 사항 저장
                </button>
              ) : (
                <button type="button" disabled style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--border-color)', color: 'var(--text-secondary)', border: 'none', cursor: 'not-allowed', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600 }}>
                  🔒 변경 권한 없음 (읽기 전용)
                </button>
              )}
              {companySaved && (
                <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>✓ 저장 완료!</span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ─── 직원 추가/수정 모달 ──────────────────────────────── */}
      {showUserModal && (
        <div style={modalOverlayStyle} onClick={() => setShowUserModal(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 700 }}>{editingUserId ? '직원 정보 수정' : '신규 직원 등록'}</h3>
              <button onClick={() => setShowUserModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={labelStyle}>이름 *</label><input style={inputStyle} value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} required /></div>
              {!editingUserId && (
                <div><label style={labelStyle}>로그인 ID *</label><input style={inputStyle} value={userForm.loginId} onChange={e => setUserForm({ ...userForm, loginId: e.target.value })} required /></div>
              )}
              <div><label style={labelStyle}>{editingUserId ? '새 비밀번호 (변경 시에만 입력)' : '비밀번호 *'}</label>
                <input type="password" style={inputStyle} value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required={!editingUserId} />
              </div>
              <div><label style={labelStyle}>권한</label>
                <select style={inputStyle} value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowUserModal(false)} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>취소</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Save size={14} /> 저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
