import { useEffect, useState, useRef } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { fetchProjects } from '../api/projectApi';
import type { ProjectResponse } from '../api/projectApi';
import { fetchProjectEstimates } from '../api/estimateApi';
import {
  fetchProjectExpenses,
  fetchProjectIncomes,
  createExpense,
  createIncome,
  deleteExpense,
  deleteIncome,
  fetchVendors,
  fetchProcesses,
  bulkCollectIncomes
} from '../api/settlementApi';
import type {
  ExpenseResponse,
  IncomeResponse,
  VendorResponse,
  ProcessResponse
} from '../api/settlementApi';
import { Landmark, ArrowDownRight, Wallet, Receipt, Trash2, Plus, Search, AlertTriangle } from 'lucide-react';

// ─── 5번: 현장 검색 자동완성 컴포넌트 ──────────────────────────────
interface ProjectSearchProps {
  projects: ProjectResponse[];
  selectedId: number;
  onSelect: (id: number) => void;
}
function ProjectSearch({ projects, selectedId, onSelect }: ProjectSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = projects.find(p => p.projectId === selectedId);
  const filtered = query.trim()
    ? projects.filter(p => p.projectName.toLowerCase().includes(query.toLowerCase()) || (p.address ?? '').toLowerCase().includes(query.toLowerCase()))
    : projects;
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const handleSelect = (p: ProjectResponse) => { onSelect(p.projectId); setQuery(''); setOpen(false); };
  return (
    <div ref={ref} style={{ position: 'relative', minWidth: '280px' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', cursor: 'text' }}
        onClick={() => setOpen(true)}
      >
        <Search size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        {open ? (
          <input autoFocus value={query} onChange={e => { setQuery(e.target.value); setOpen(true); }}
            placeholder="현장명 검색..."
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', flex: 1 }} />
        ) : (
          <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600, color: selected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            {selected ? selected.projectName : '현장을 선택하세요'}
          </span>
        )}
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 1000, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', maxHeight: '260px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>검색 결과 없음</div>
          ) : filtered.map(p => (
            <div key={p.projectId} onMouseDown={() => handleSelect(p)}
              style={{ padding: '0.65rem 0.9rem', cursor: 'pointer', fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)', background: p.projectId === selectedId ? 'var(--accent-color)20' : 'transparent' }}>
              <div style={{ fontWeight: 600 }}>{p.projectName}</div>
              {p.address && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.address}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Settlement() {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(0);
  const [selectedProject, setSelectedProject] = useState<ProjectResponse | null>(null);

  // 데이터 상태
  const [estimates, setEstimates] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<IncomeResponse[]>([]);
  const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
  const [vendors, setVendors] = useState<VendorResponse[]>([]);
  const [processes, setProcesses] = useState<ProcessResponse[]>([]);


  // 수입 등록 폼 상태
  const [incomeAmount, setIncomeAmount] = useState<number>(0);
  const [incomeType, setIncomeType] = useState('계약금');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().substring(0, 10));

  // 지출 등록 폼 상태
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseVendorId, setExpenseVendorId] = useState<number>(0);
  const [expenseProcessId, setExpenseProcessId] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().substring(0, 10));

  // 일괄 수입(수금) 및 할인 네고 폼 상태
  const [bulkClientId, setBulkClientId] = useState<number>(0);
  const [bulkAmount, setBulkAmount] = useState<number>(0);
  const [bulkDiscount, setBulkDiscount] = useState<number>(0);
  const [bulkDate, setBulkDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [bulkType, setBulkType] = useState<string>('일괄수금');
  const [allClients, setAllClients] = useState<VendorResponse[]>([]);

  // 초기 기초 정보 로드
  useEffect(() => {
    const initLoad = async () => {
      try {
        const projData = await fetchProjects();
        setProjects(projData);
        if (projData.length > 0) {
          setSelectedProjectId(projData[0].projectId);
        }

        const vendorData = await fetchVendors();
        
        // CLIENT 타입 거래처(발주처) 목록
        const clients = vendorData.filter(v => v.vendorType === 'CLIENT');
        setAllClients(clients);
        if (clients.length > 0) {
          setBulkClientId(clients[0].vendorId);
        }

        // SUPPLIER 타입 거래처만 필터링해서 지출 목록에 노출
        const suppliers = vendorData.filter(v => v.vendorType === 'SUPPLIER');
        setVendors(suppliers);
        if (suppliers.length > 0) {
          setExpenseVendorId(suppliers[0].vendorId);
        }

        const processData = await fetchProcesses();
        setProcesses(processData);
        if (processData.length > 0) {
          setExpenseProcessId(processData[0].processId);
        }
      } catch (error) {
        console.error('초기 기초 정보 로드 실패:', error);
      }
    };
    initLoad();
  }, []);

  // 선택된 현장의 금융 정보 로드
  const loadProjectFinance = async (projectId: number) => {
    if (!projectId) return;
    try {
      const proj = projects.find(p => p.projectId === projectId);
      setSelectedProject(proj || null);

      // 견적 이력, 수입 내역, 지출 내역 병렬 조회
      const [estData, incData, expData] = await Promise.all([
        fetchProjectEstimates(projectId),
        fetchProjectIncomes(projectId),
        fetchProjectExpenses(projectId)
      ]);

      setEstimates(estData);
      setIncomes(incData);
      setExpenses(expData);
    } catch (error) {
      console.error('현장 금융 정보 조회 실패:', error);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectFinance(selectedProjectId);
    }
  }, [selectedProjectId, projects]);

  // 수입 등록
  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (incomeAmount <= 0) {
      alert('수금 금액을 1원 이상 입력해주세요.');
      return;
    }
    try {
      await createIncome({
        projectId: selectedProjectId,
        amount: incomeAmount,
        incomeDate,
        type: incomeType
      });
      setIncomeAmount(0);
      loadProjectFinance(selectedProjectId);
    } catch (error) {
      console.error(error);
      alert('수입 내역 등록에 실패했습니다.');
    }
  };

  // 수입 삭제
  const handleDeleteIncome = async (id: number) => {
    if (window.confirm('해당 수금 내역을 삭제하시겠습니까?')) {
      try {
        await deleteIncome(id);
        loadProjectFinance(selectedProjectId);
      } catch (error) {
        console.error(error);
        alert('삭제 실패');
      }
    }
  };

  // 지출 등록
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0) {
      alert('지출 금액을 1원 이상 입력해주세요.');
      return;
    }
    if (!expenseVendorId) {
      alert('자재 거래처를 선택해주세요.');
      return;
    }
    try {
      await createExpense({
        projectId: selectedProjectId,
        vendorId: expenseVendorId,
        processId: expenseProcessId || undefined,
        amount: expenseAmount,
        expenseDate
      });
      setExpenseAmount(0);
      loadProjectFinance(selectedProjectId);
    } catch (error) {
      console.error(error);
      alert('지출 내역 등록에 실패했습니다.');
    }
  };

  // 지출 삭제
  const handleDeleteExpense = async (id: number) => {
    if (window.confirm('해당 지출 내역을 삭제하시겠습니까?')) {
      try {
        await deleteExpense(id);
        loadProjectFinance(selectedProjectId);
      } catch (error) {
        console.error(error);
        alert('삭제 실패');
      }
    }
  };

  // 연산 변수들
  const latestEstimateAmount = estimates.length > 0 ? estimates[0].totalAmount : 0;
  const totalIncomeAmount = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenseAmount = expenses.reduce((sum, item) => sum + item.amount, 0);
  const marginAmount = latestEstimateAmount - totalExpenseAmount;
  const marginRate = latestEstimateAmount > 0 ? (marginAmount / latestEstimateAmount) * 100 : 0;
  const collectionRate = latestEstimateAmount > 0 ? (totalIncomeAmount / latestEstimateAmount) * 100 : 0;
  // 6번: 미수금 전체 현황 (모든 현장)
  const [showArPanel, setShowArPanel] = useState(false);

  // 일괄 선입선출 수입 및 할인 처리 핸들러
  const handleBulkArCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkClientId <= 0) { alert('대상 고객을 선택해주세요.'); return; }
    if (bulkAmount <= 0 && bulkDiscount <= 0) { alert('수금 또는 할인 금액을 1원 이상 입력해주세요.'); return; }
    try {
      await bulkCollectIncomes({
        clientVendorId: bulkClientId,
        amount: bulkAmount,
        discount: bulkDiscount,
        incomeDate: bulkDate,
        type: bulkType
      });
      alert('선입선출 일괄 수금 배분이 완료되었습니다! 🎉');
      setBulkAmount(0);
      setBulkDiscount(0);
      if (selectedProjectId) {
        loadProjectFinance(selectedProjectId);
      }
      // 리스트 갱신 유도
      const projData = await fetchProjects();
      setProjects(projData);
    } catch (error) {
      console.error(error);
      alert('일괄 수금 배분 처리에 실패했습니다.');
    }
  };

  return (
    <MainLayout>
      <header className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 90 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Landmark size={20} style={{ color: 'var(--accent-color)' }} />
          현장별 정산 대조표 & 장부 관리
        </h1>
        {/* 5번: 현장 검색 자동완성 */}
        <ProjectSearch projects={projects} selectedId={selectedProjectId} onSelect={setSelectedProjectId} />
      </header>

      {selectedProject && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* 1. KPI 대시보드 카드 섹션 */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            
            {/* 최종 견적액 */}
            <div className="glass-panel" style={{ flex: 1, minWidth: '220px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>최종 견적 총액</span>
                <Receipt size={16} />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ₩ {latestEstimateAmount.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                * 가장 최근 등록된 견적서 기준
              </div>
            </div>

            {/* 실제 지출 총액 */}
            <div className="glass-panel" style={{ flex: 1, minWidth: '220px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>실제 지출 총액 (원가)</span>
                <Wallet size={16} />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>
                ₩ {totalExpenseAmount.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                * 자재상/외주 지급 지출액 누계
              </div>
            </div>

            {/* 최종 마진율 */}
            <div className="glass-panel" style={{ flex: 1, minWidth: '220px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>최종 마진 현황 (마진율)</span>
                <ArrowDownRight size={16} />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: marginRate >= 0 ? '#3b82f6' : '#ef4444' }}>
                {marginRate >= 0 ? '+' : ''}{marginRate.toFixed(1)} %
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                순수익: ₩ {marginAmount.toLocaleString()}
              </div>
            </div>

            {/* 수금 진척률 */}
            <div className="glass-panel" style={{ flex: 1, minWidth: '220px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>수금 진척도 (수금률)</span>
                <Landmark size={16} />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
                {collectionRate.toFixed(1)} %
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                수금액: ₩ {totalIncomeAmount.toLocaleString()}
              </div>
            </div>

          </div>

          {/* 2. 장부 데이터 입력 및 원장 리스트 */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            
            {/* 좌측: 실제 수입 관리 (입금 장부) */}
            <div style={{ flex: 1, minWidth: '350px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* 수입 입력 폼 */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Plus size={16} /> 실제 수금 내역 추가
                </h3>
                <form onSubmit={handleAddIncome} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>구분</label>
                    <select
                      value={incomeType}
                      onChange={e => setIncomeType(e.target.value)}
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      <option value="계약금">계약금</option>
                      <option value="중도금">중도금</option>
                      <option value="잔금">잔금</option>
                      <option value="추가공사비">추가공사비</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                  <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>수금액 (₩)</label>
                    <input
                      type="number"
                      value={incomeAmount || ''}
                      onChange={e => setIncomeAmount(Number(e.target.value))}
                      placeholder="예: 30000"
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>수금일자</label>
                    <input
                      type="date"
                      value={incomeDate}
                      onChange={e => setIncomeDate(e.target.value)}
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1rem' }}>입력</button>
                </form>
              </div>

              {/* 수입 리스트 */}
              <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>수금 원장</h3>
                {incomes.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '0.5rem' }}>구분</th>
                        <th style={{ padding: '0.5rem' }}>수금일자</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>수금액</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomes.map(inc => (
                        <tr key={inc.incomeId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.55rem' }}>{inc.type}</td>
                          <td style={{ padding: '0.55rem' }}>{inc.incomeDate}</td>
                          <td style={{ padding: '0.55rem', textAlign: 'right', fontWeight: 600 }}>₩ {inc.amount.toLocaleString()}</td>
                          <td style={{ padding: '0.55rem', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteIncome(inc.incomeId)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                    등록된 수금 내역이 없습니다.
                  </div>
                )}
              </div>

            </div>

            {/* 우측: 실제 지출 관리 (지출 장부) */}
            <div style={{ flex: 1.2, minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* 지출 입력 폼 */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Plus size={16} /> 실제 지출 내역 추가
                </h3>
                <form onSubmit={handleAddExpense} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  
                  <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>거래처(매입처)</label>
                    <select
                      value={expenseVendorId}
                      onChange={e => setExpenseVendorId(Number(e.target.value))}
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      {vendors.map(v => (
                        <option key={v.vendorId} value={v.vendorId}>{v.vendorName}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>공정 분류</label>
                    <select
                      value={expenseProcessId}
                      onChange={e => setExpenseProcessId(Number(e.target.value))}
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      {processes.map(p => (
                        <option key={p.processId} value={p.processId}>{p.processName}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>지출액 (₩)</label>
                    <input
                      type="number"
                      value={expenseAmount || ''}
                      onChange={e => setExpenseAmount(Number(e.target.value))}
                      placeholder="예: 45000"
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>지출일자</label>
                    <input
                      type="date"
                      value={expenseDate}
                      onChange={e => setExpenseDate(e.target.value)}
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1rem' }}>입력</button>
                </form>
              </div>

              {/* 지출 리스트 */}
              <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>지출 원장</h3>
                {expenses.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '0.5rem' }}>공정</th>
                        <th style={{ padding: '0.5rem' }}>거래처</th>
                        <th style={{ padding: '0.5rem' }}>지출일자</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>지출금액</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(exp => (
                        <tr key={exp.expenseId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.55rem' }}>
                            <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: exp.processId === 1 ? '#8b5cf615' : '#3b82f615', color: exp.processId === 1 ? '#8b5cf6' : '#3b82f6', fontWeight: 600 }}>
                              {exp.processName || '기타'}
                            </span>
                          </td>
                          <td style={{ padding: '0.55rem', fontWeight: 600 }}>{exp.vendorName}</td>
                          <td style={{ padding: '0.55rem' }}>{exp.expenseDate}</td>
                          <td style={{ padding: '0.55rem', textAlign: 'right', fontWeight: 600, color: '#f59e0b' }}>₩ {exp.amount.toLocaleString()}</td>
                          <td style={{ padding: '0.55rem', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteExpense(exp.expenseId)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                    등록된 지출 내역이 없습니다.
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 6번: 미수금 일괄 수금 처리 패널 */}
      <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showArPanel ? '1.25rem' : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={16} style={{ color: '#10b981' }} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>고객별 미수금 일괄 수금 및 할인(네고) 처리</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>거래처 기준 여러 현장 미수금 선입선출(FIFO) 입금 및 삭감 마감</span>
          </div>
          <button
            onClick={() => setShowArPanel(v => !v)}
            style={{ padding: '0.4rem 0.9rem', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
          >
            {showArPanel ? '▲ 접기' : '▼ 펼치기'}
          </button>
        </div>
        {showArPanel && (
          <form onSubmit={handleBulkArCollect} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '180px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>대상 수신 고객사 (발주처)</label>
              <select
                value={bulkClientId}
                onChange={e => setBulkClientId(Number(e.target.value))}
                style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', width: '100%' }}
              >
                <option value={0}>-- 고객을 지정하세요 --</option>
                {allClients.map(c => (
                  <option key={c.vendorId} value={c.vendorId}>{c.vendorName}</option>
                ))}
              </select>
            </div>
            
            <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '130px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>일괄 입금액 (₩)</label>
              <input
                type="number"
                value={bulkAmount || ''}
                onChange={e => setBulkAmount(Number(e.target.value))}
                placeholder="입금 총액"
                style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', textAlign: 'right' }}
              />
            </div>

            <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '130px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f59e0b' }}>일괄 할인/네고액 (₩)</label>
              <input
                type="number"
                value={bulkDiscount || ''}
                onChange={e => setBulkDiscount(Number(e.target.value))}
                placeholder="합의 삭감액"
                style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', textAlign: 'right' }}
              />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '110px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>수금일자</label>
              <input
                type="date"
                value={bulkDate}
                onChange={e => setBulkDate(e.target.value)}
                style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '110px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>수금구분</label>
              <select
                value={bulkType}
                onChange={e => setBulkType(e.target.value)}
                style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              >
                <option value="일괄수금">일괄수금</option>
                <option value="잔금일괄">잔금일괄</option>
                <option value="네고마감">네고마감</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
              일괄 수금 실행 🚀
            </button>
          </form>
        )}
      </div>
    </MainLayout>
  );
}
