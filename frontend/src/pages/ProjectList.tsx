import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { fetchProjects, createProject, updateProject, deleteProject, updateProjectStatus } from '../api/projectApi';
import type { ProjectResponse } from '../api/projectApi';
import { fetchProjectEstimates } from '../api/estimateApi';
import type { EstimateResponse } from '../api/estimateApi';
import { fetchVendors } from '../api/settlementApi';
import type { VendorResponse } from '../api/settlementApi';
import ClientAutocomplete from '../components/common/ClientAutocomplete';
import axios from 'axios';
import { Clock, CheckCircle2, Hammer, Handshake, X, Trash2, FileText, Plus, Search, Copy, Filter } from 'lucide-react';

const STATUS_OPTIONS = ['전체', '견적중', '수주', '공사중', '완료'];

interface KanbanColumnListProps {
  projects: any[];
  draggedProjectId: number | null;
  handleDragStart: (e: React.DragEvent, id: number) => void;
  openDetailModal: (project: any) => void;
  colColor: string;
}

function KanbanColumnList({ projects, draggedProjectId, handleDragStart, openDetailModal, colColor }: KanbanColumnListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerHeight = 600;
  const rowHeight = 120;
  const totalHeight = projects.length * rowHeight;
  const visibleCount = Math.ceil(containerHeight / rowHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 1);
  const endIndex = Math.min(projects.length - 1, startIndex + visibleCount + 1);
  const visibleProjects = projects.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * rowHeight;

  return (
    <div 
      onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, maxHeight: `${containerHeight}px`, overflowY: 'auto', paddingRight: '0.25rem' }}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative', width: '100%' }}>
        <div style={{ transform: `translateY(${offsetY}px)`, position: 'absolute', left: 0, right: 0, top: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {visibleProjects.map(project => (
            <div
              key={project.projectId}
              className="glass-panel"
              draggable
              onDragStart={(e) => handleDragStart(e, project.projectId)}
              onClick={() => openDetailModal(project)}
              style={{ 
                padding: '1.25rem', 
                cursor: 'pointer', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.5rem', 
                transition: 'transform 0.15s', 
                opacity: draggedProjectId === project.projectId ? 0.5 : 1,
                height: `${rowHeight - 16}px`,
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.projectName}</h4>
              </div>
              {project.address && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.address}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                  {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '오늘'}
                </span>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: `${colColor}20`, color: colColor, fontWeight: 600 }}>
                  {project.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {projects.length === 0 && (
        <div style={{ border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          해당 상태의 현장이 없습니다
        </div>
      )}
    </div>
  );
}

export default function ProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── 검색 필터 상태 ────────────────────────────────────────
  const [searchName, setSearchName] = useState('');
  const [estScrollTop, setEstScrollTop] = useState(0);
  const [searchStatus, setSearchStatus] = useState('전체');
  const [searchDateFrom, setSearchDateFrom] = useState('');
  const [searchDateTo, setSearchDateTo] = useState('');

  // 모달 상태 (신규 등록)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectAddress, setNewProjectAddress] = useState('');
  const [clients, setClients] = useState<VendorResponse[]>([]);
  const [newProjectClientId, setNewProjectClientId] = useState<number>(0);

  // 모달 상태 (상세 조회/수정)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectResponse | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectAddress, setEditProjectAddress] = useState('');
  const [editProjectStatus, setEditProjectStatus] = useState('');
  const [editProjectClientId, setEditProjectClientId] = useState<number>(0);
  const [histories, setHistories] = useState<any[]>([]);
  const [estimates, setEstimates] = useState<EstimateResponse[]>([]);
  const [estimatesLoading, setEstimatesLoading] = useState(false);

  // 드래그 상태
  const [draggedProjectId, setDraggedProjectId] = useState<number | null>(null);

  // 모바일 컬럼 활성 탭 상태 추가
  const [activeMobileCol, setActiveMobileCol] = useState<string>('견적중');

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await fetchProjects();
      setProjects(data);
      
      const vendorData = await fetchVendors();
      const clientList = vendorData.filter(v => v.vendorType === 'CLIENT');
      setClients(clientList);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // ─── 필터 적용 ─────────────────────────────────────────────
  const filteredProjects = projects.filter(p => {
    const nameMatch = !searchName || p.projectName.toLowerCase().includes(searchName.toLowerCase());
    const statusMatch = searchStatus === '전체' || p.status === searchStatus;
    const dateFromMatch = !searchDateFrom || (p.createdAt && new Date(p.createdAt) >= new Date(searchDateFrom));
    const dateToMatch = !searchDateTo || (p.createdAt && new Date(p.createdAt) <= new Date(searchDateTo + 'T23:59:59'));
    return nameMatch && statusMatch && dateFromMatch && dateToMatch;
  });

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert("현장명을 입력해주세요.");
      return;
    }
    try {
      await createProject(newProjectName, newProjectAddress, newProjectClientId || undefined);
      setIsModalOpen(false);
      setNewProjectName('');
      setNewProjectAddress('');
      setNewProjectClientId(0);
      loadProjects();
    } catch (error) {
      alert("현장 등록 중 오류가 발생했습니다.");
    }
  };

  const openDetailModal = async (project: ProjectResponse) => {
    setSelectedProject(project);
    setEditProjectName(project.projectName);
    setEditProjectAddress(project.address || '');
    setEditProjectStatus(project.status);
    setEditProjectClientId(project.clientVendorId || 0);
    setIsDetailModalOpen(true);
    setEstimatesLoading(true);
    try {
      const data = await fetchProjectEstimates(project.projectId);
      setEstimates(data);

      const historyRes = await axios.get(`/api/projects/${project.projectId}/histories`);
      setHistories(historyRes.data);
    } catch (error) {
      console.error('세부 정보 조회 실패:', error);
    } finally {
      setEstimatesLoading(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;
    if (!editProjectName.trim()) {
      alert("현장명을 입력해주세요.");
      return;
    }
    try {
      await updateProject(selectedProject.projectId, editProjectName, editProjectAddress, editProjectClientId || undefined);

      if (editProjectStatus !== selectedProject.status) {
        await updateProjectStatus(selectedProject.projectId, editProjectStatus);
      }

      setIsDetailModalOpen(false);
      loadProjects();
    } catch (error) {
      alert("현장 정보 수정 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    if (selectedProject.status === '완료') {
      alert('완료(정산) 상태의 현장은 삭제할 수 없습니다.');
      return;
    }
    if (window.confirm('정말 이 현장을 삭제하시겠습니까? 관련 데이터(견적, 정산 이력 등)가 모두 일괄 삭제됩니다.')) {
      try {
        await deleteProject(selectedProject.projectId);
        setIsDetailModalOpen(false);
        loadProjects();
        alert("현장이 성공적으로 삭제되었습니다.");
      } catch (error) {
        alert("현장 삭제 중 오류가 발생했습니다. 하위 자식 데이터 제약 조건을 확인해 주세요.");
      }
    }
  };

  // ─── 2번: 견적 이력에서 "수정하여 새 버전 생성" ──────────────
  const handleCopyEstimate = (estimateId: number) => {
    if (!selectedProject) return;
    // fromEstimateId 쿼리 파라미터로 기존 견적 항목을 로드해 새 버전 생성
    navigate(`/estimate?projectId=${selectedProject.projectId}&fromEstimateId=${estimateId}`);
  };

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, projectId: number) => {
    setDraggedProjectId(projectId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (draggedProjectId === null) return;
    const project = projects.find(p => p.projectId === draggedProjectId);
    if (!project || project.status === targetStatus) {
      setDraggedProjectId(null);
      return;
    }
    setProjects(prev => prev.map(p => p.projectId === draggedProjectId ? { ...p, status: targetStatus } : p));
    try {
      await updateProjectStatus(draggedProjectId, targetStatus);
    } catch (error) {
      alert('상태 변경 중 오류가 발생했습니다.');
      loadProjects();
    } finally {
      setDraggedProjectId(null);
    }
  };

  const getColumnProjects = (status: string) =>
    filteredProjects.filter(p => p.status === status);

  const columns = [
    { title: '견적중', status: '견적중', icon: <Clock size={18} />, color: '#f59e0b' },
    { title: '수주(계약)', status: '수주', icon: <Handshake size={18} />, color: '#3b82f6' },
    { title: '공사중', status: '공사중', icon: <Hammer size={18} />, color: '#8b5cf6' },
    { title: '완료(정산)', status: '완료', icon: <CheckCircle2 size={18} />, color: '#10b981' }
  ];

  const inputStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem', borderRadius: '8px',
    border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
    color: 'var(--text-primary)', fontSize: '0.85rem',
  };

  return (
    <MainLayout>
      <header className="glass-panel" style={{ padding: '1.25rem 2rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>현장 목록 관리 (CRM 보드)</h1>
        <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => setIsModalOpen(true)}>
          + 신규 현장 등록
        </button>
      </header>

      {/* ─── 1번: 검색 필터 영역 ─────────────────────────────── */}
      <div className="glass-panel filter-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '180px' }}>
          <Search size={14} style={{ color: 'var(--text-secondary)' }} />
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="공사명 검색..."
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>진행 상태</label>
          <select style={inputStyle} value={searchStatus} onChange={e => setSearchStatus(e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>등록일</label>
          <input type="date" style={inputStyle} value={searchDateFrom} onChange={e => setSearchDateFrom(e.target.value)} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>~</span>
          <input type="date" style={inputStyle} value={searchDateTo} onChange={e => setSearchDateTo(e.target.value)} />
        </div>
        {(searchName || searchStatus !== '전체' || searchDateFrom || searchDateTo) && (
          <button
            onClick={() => { setSearchName(''); setSearchStatus('전체'); setSearchDateFrom(''); setSearchDateTo(''); }}
            style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: 'none', background: '#ef444420', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}
          >
            초기화
          </button>
        )}
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
          {filteredProjects.length} / {projects.length} 건
        </span>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>데이터를 불러오는 중입니다...</div>
      ) : (
        <>
          {/* 모바일 탭 바 (768px 이하 모바일 전용) */}
          <div className="mobile-tab-bar" style={{ display: 'none', gap: '0.25rem', marginBottom: '1.25rem', background: 'var(--bg-secondary)', padding: '0.35rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            {columns.map(col => (
              <button
                key={col.status}
                onClick={() => setActiveMobileCol(col.status)}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.5rem',
                  borderRadius: '8px',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  border: 'none',
                  background: activeMobileCol === col.status ? 'var(--accent-color)' : 'transparent',
                  color: activeMobileCol === col.status ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center'
                }}
              >
                {col.title}
              </button>
            ))}
          </div>

          <div className="board-container" style={{ display: 'flex', gap: '1.5rem', flex: 1, paddingBottom: '1rem', overflowX: 'auto' }}>
            {columns.map(col => (
              <div
                key={col.title}
                className={`board-column-card ${activeMobileCol === col.status ? 'active-mobile-col' : ''}`}
                style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.status)}
              >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', borderBottom: `2px solid ${col.color}` }}>
                <span style={{ color: col.color }}>{col.icon}</span>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{col.title}</h3>
                <span style={{ marginLeft: 'auto', background: 'var(--bg-primary)', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
                  {getColumnProjects(col.status).length}
                </span>
              </div>

              <KanbanColumnList
                projects={getColumnProjects(col.status)}
                draggedProjectId={draggedProjectId}
                handleDragStart={handleDragStart}
                openDetailModal={openDetailModal}
                colColor={col.color}
              />
            </div>
          ))}
        </div>
        </>
      )}

      {/* 현장 등록 모달 */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>신규 현장 등록</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>현장명 (필수)</label>
              <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="예: 반포 자이 101동 인테리어" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>주소 (선택)</label>
              <input type="text" value={newProjectAddress} onChange={e => setNewProjectAddress(e.target.value)} placeholder="상세 주소 입력" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>발주처 (고객사) 지정</label>
              <ClientAutocomplete
                clients={clients}
                selectedId={newProjectClientId}
                onSelect={setNewProjectClientId}
              />
            </div>
            <button className="btn btn-primary" onClick={handleCreateProject} style={{ padding: '0.75rem', marginTop: '0.5rem' }}>
              등록하기
            </button>
          </div>
        </div>
      )}

      {/* 현장 상세/수정 모달 */}
      {isDetailModalOpen && selectedProject && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Hammer size={20} /> 현장 상세 정보
              </h2>
              <button onClick={() => setIsDetailModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>현장명 (필수)</label>
              <input type="text" value={editProjectName} onChange={e => setEditProjectName(e.target.value)} disabled={selectedProject.status === '완료'} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', opacity: selectedProject.status === '완료' ? 0.6 : 1 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', zIndex: 100 }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>발주처 (고객사) 지정</label>
              <ClientAutocomplete
                clients={clients}
                selectedId={editProjectClientId}
                onSelect={setEditProjectClientId}
                disabled={selectedProject.status === '완료'}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>주소</label>
              <input type="text" value={editProjectAddress} onChange={e => setEditProjectAddress(e.target.value)} disabled={selectedProject.status === '완료'} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', opacity: selectedProject.status === '완료' ? 0.6 : 1 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>현장 진행 상태</label>
              <select
                value={editProjectStatus}
                onChange={e => setEditProjectStatus(e.target.value)}
                disabled={selectedProject.status === '완료'}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem', opacity: selectedProject.status === '완료' ? 0.6 : 1 }}
              >
                <option value="견적중">견적중</option>
                <option value="수주">수주(계약)</option>
                <option value="공사중">공사중</option>
                <option value="완료">완료(정산)</option>
              </select>
            </div>

            {/* ─── 현장 상태 변경 및 타임라인 이력 섹션 ─── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                📈 현장 타임라인 및 변경 이력 ({histories.length})
              </label>
              {histories.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto', paddingRight: '0.25rem', fontSize: '0.8rem' }}>
                  {histories.map(h => (
                    <div key={h.historyId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                          [{h.changedByName || '시스템'}]
                        </span>{' '}
                        {h.fromStatus ? (
                          <>
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)' }}>{h.fromStatus}</span> ➔{' '}
                          </>
                        ) : (
                          <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>[신규 등록] </span>
                        )}
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.toStatus}</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {new Date(h.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  이력 정보가 없습니다.
                </div>
              )}
            </div>

            {/* ─── 견적 이력 섹션 (2번: 버전 복사 버튼 추가) ─── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <FileText size={16} /> 견적 이력 ({estimates.length})
                </label>
                {selectedProject.status !== '완료' && (
                  <button
                    onClick={() => navigate(`/estimate?projectId=${selectedProject.projectId}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px', cursor: 'pointer', background: 'var(--accent-color)', color: '#fff', border: 'none', fontWeight: 600 }}
                  >
                    <Plus size={14} /> 신규 견적
                  </button>
                )}
              </div>

              {estimatesLoading ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '0.5rem' }}>견적 목록을 가져오는 중...</div>
              ) : estimates.length > 0 ? (() => {
                const EST_HEIGHT = 58;
                const EST_CONTAINER_HEIGHT = 200;
                const totalEstHeight = estimates.length * EST_HEIGHT;
                const visibleEstCount = Math.ceil(EST_CONTAINER_HEIGHT / EST_HEIGHT);
                const startEstIndex = Math.max(0, Math.floor(estScrollTop / EST_HEIGHT) - 1);
                const endEstIndex = Math.min(estimates.length - 1, startEstIndex + visibleEstCount + 2);
                const visibleEstimates = estimates.slice(startEstIndex, endEstIndex + 1);
                const offsetEstY = startEstIndex * EST_HEIGHT;

                return (
                  <div 
                    onScroll={e => setEstScrollTop(e.currentTarget.scrollTop)}
                    style={{ display: 'flex', flexDirection: 'column', maxHeight: `${EST_CONTAINER_HEIGHT}px`, overflowY: 'auto', paddingRight: '0.25rem' }}
                  >
                    <div style={{ height: `${totalEstHeight}px`, position: 'relative', width: '100%' }}>
                      <div style={{ transform: `translateY(${offsetEstY}px)`, position: 'absolute', left: 0, right: 0, top: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {visibleEstimates.map((est, index) => {
                          const actualIdx = startEstIndex + index;
                          return (
                            <div key={est.estimateId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', fontSize: '0.85rem', height: `${EST_HEIGHT - 8}px`, boxSizing: 'border-box' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                <span style={{ fontWeight: 600 }}>견적 #{estimates.length - actualIdx}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                  {est.createdAt ? new Date(est.createdAt).toLocaleDateString() : '오늘'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>₩ {est.totalAmount.toLocaleString()}</span>
                                {selectedProject.status !== '완료' && (
                                  <button
                                    title="이 견적 내용을 바탕으로 새 버전 견적 작성"
                                    onClick={() => handleCopyEstimate(est.estimateId)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px', cursor: 'pointer', background: '#3b82f620', color: '#3b82f6', border: '1px solid #3b82f640', fontWeight: 600 }}
                                  >
                                    <Copy size={12} /> 수정·새버전
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  등록된 견적이 없습니다.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              {selectedProject.status !== '완료' ? (
                <button onClick={handleDeleteProject} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem', fontWeight: 600 }}>
                  <Trash2 size={16} /> 현장 삭제
                </button>
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0.5rem', fontWeight: 600, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  🔒 완료된 현장 (삭제 불가)
                </span>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setIsDetailModalOpen(false)} style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>
                  {selectedProject.status === '완료' ? '닫기' : '취소'}
                </button>
                {selectedProject.status !== '완료' && (
                  <button className="btn btn-primary" onClick={handleUpdateProject} style={{ padding: '0.75rem 1.5rem' }}>수정 저장</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
