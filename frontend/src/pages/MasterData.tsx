import { useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Package, Building2, Wrench, Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { fetchMaterials, createMaterial, updateMaterial, deleteMaterial } from '../api/materialApi';
import type { MaterialResponse, MaterialCreateRequest } from '../api/materialApi';
import {
  fetchVendors, createVendor, updateVendor, deleteVendor,
  fetchProcesses, createProcess, updateProcess, deleteProcess
} from '../api/settlementApi';
import type { VendorResponse, VendorCreateRequest, ProcessResponse, ProcessCreateRequest } from '../api/settlementApi';

type Tab = 'material' | 'vendor' | 'process';

const VENDOR_TYPES = ['SUPPLIER', 'CLIENT', 'SUBCONTRACTOR'];
const VENDOR_TYPE_LABELS: Record<string, string> = {
  SUPPLIER: '자재납품업체',
  CLIENT: '고객(수금처)',
  SUBCONTRACTOR: '외주업체',
};
const BIZ_TYPES = ['CORPORATION', 'INDIVIDUAL'];
const BIZ_TYPE_LABELS: Record<string, string> = {
  CORPORATION: '법인',
  INDIVIDUAL: '개인',
};

// ─── 초기 폼 상태 ───────────────────────────────────────────────
const initVendorForm = (): VendorCreateRequest => ({
  vendorName: '', vendorType: 'SUPPLIER', businessType: 'CORPORATION',
  businessNumber: '', address: '', contactPerson: '', accountInfo: '',
});
const initProcessForm = (): ProcessCreateRequest => ({ processName: '', sortOrder: 0 });

export default function MasterData() {
  const [activeTab, setActiveTab] = useState<Tab>('material');
  const [matScrollTop, setMatScrollTop] = useState(0);

  // ─── 자재 상태 ─────────────────────────────────────────────
  const [materials, setMaterials] = useState<MaterialResponse[]>([]);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialResponse | null>(null);
  const [matForm, setMatForm] = useState<MaterialCreateRequest>({
    materialName: '', processId: 1, standardUnit: '', distributionUnit: '',
    conversionRate: 1, purchasePrice: 0, laborPrice: 0, specification: '',
    itemType: 'MATERIAL',
  });

  // ─── 거래처 상태 ───────────────────────────────────────────
  const [vendors, setVendors] = useState<VendorResponse[]>([]);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<number | null>(null);
  const [vendorForm, setVendorForm] = useState<VendorCreateRequest>(initVendorForm());

  // ─── 공정 상태 ────────────────────────────────────────────
  const [processes, setProcesses] = useState<ProcessResponse[]>([]);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [editingProcessId, setEditingProcessId] = useState<number | null>(null);
  const [processForm, setProcessForm] = useState<ProcessCreateRequest>(initProcessForm());

  // ─── 초기 데이터 로드 ──────────────────────────────────────
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [mats, vends, procs] = await Promise.all([fetchMaterials(), fetchVendors(), fetchProcesses()]);
    setMaterials(mats);
    setVendors(vends as VendorResponse[]);
    setProcesses(procs);
    if (mats.length > 0 && matForm.processId === 1) {
      setMatForm(f => ({ ...f, processId: procs[0]?.processId ?? 1 }));
    }
  };

  // ─── 자재 핸들러 ───────────────────────────────────────────
  const openMatModal = (mat?: MaterialResponse) => {
    if (mat) {
      setEditingMaterial(mat);
      setMatForm({
        materialName: mat.materialName, processId: mat.process.processId,
        standardUnit: mat.standardUnit, distributionUnit: mat.distributionUnit,
        conversionRate: mat.conversionRate, purchasePrice: mat.purchasePrice, laborPrice: mat.laborPrice,
        specification: mat.specification ?? '',
        itemType: mat.itemType ?? 'MATERIAL',
      });
    } else {
      setEditingMaterial(null);
      setMatForm({ materialName: '', processId: processes[0]?.processId ?? 1, standardUnit: '', distributionUnit: '', conversionRate: 1, purchasePrice: 0, laborPrice: 0, specification: '', itemType: 'MATERIAL' });
    }
    setShowMaterialModal(true);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matForm.materialName.trim()) {
      alert("자재명을 입력해 주세요.");
      return;
    }
    if (!matForm.standardUnit.trim()) {
      alert("기본 단위를 입력해 주세요.");
      return;
    }
    if (!matForm.distributionUnit.trim()) {
      alert("유통 단위를 입력해 주세요.");
      return;
    }
    try {
      if (editingMaterial) {
        await updateMaterial(editingMaterial.materialId, matForm);
      } else {
        await createMaterial(matForm);
      }
      setShowMaterialModal(false);
      const mats = await fetchMaterials();
      setMaterials(mats);
    } catch (error) {
      console.error(error);
      alert("자재 정보 저장 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    if (window.confirm('자재를 삭제하시겠습니까?')) {
      try {
        await deleteMaterial(id);
        setMaterials(prev => prev.filter(m => m.materialId !== id));
        alert('자재가 정상 삭제되었습니다.');
      } catch (error) {
        console.error(error);
        alert('자재 삭제에 실패했습니다. (견적서 등에 사용 중인 자재인지 확인하세요)');
      }
    }
  };

  // ─── 거래처 핸들러 ─────────────────────────────────────────
  const openVendorModal = (v?: VendorResponse) => {
    if (v) {
      setEditingVendorId(v.vendorId);
      setVendorForm({
        vendorName: v.vendorName, vendorType: v.vendorType,
        businessType: (v as any).businessType ?? 'CORPORATION',
        businessNumber: (v as any).businessNumber ?? '',
        address: (v as any).address ?? '',
        contactPerson: (v as any).contactPerson ?? '',
        accountInfo: (v as any).accountInfo ?? '',
      });
    } else {
      setEditingVendorId(null);
      setVendorForm(initVendorForm());
    }
    setShowVendorModal(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.vendorName.trim()) {
      alert("거래처명을 입력해 주세요.");
      return;
    }
    try {
      if (editingVendorId) {
        await updateVendor(editingVendorId, vendorForm);
      } else {
        await createVendor(vendorForm);
      }
      setShowVendorModal(false);
      const vends = await fetchVendors();
      setVendors(vends as VendorResponse[]);
    } catch (error) {
      console.error(error);
      alert("거래처 정보 저장 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteVendor = async (id: number) => {
    if (window.confirm('거래처를 삭제하시겠습니까?')) {
      try {
        await deleteVendor(id);
        setVendors(prev => prev.filter(v => v.vendorId !== id));
        alert('거래처가 정상 삭제되었습니다.');
      } catch (error) {
        console.error(error);
        alert('거래처 삭제에 실패했습니다. (견적서 또는 지출 등에 연결된 거래처인지 확인하세요)');
      }
    }
  };

  // ─── 공정 핸들러 ─────────────────────────────────────────
  const openProcessModal = (p?: ProcessResponse) => {
    if (p) {
      setEditingProcessId(p.processId);
      setProcessForm({ processName: p.processName, sortOrder: (p as any).sortOrder ?? 0 });
    } else {
      setEditingProcessId(null);
      setProcessForm(initProcessForm());
    }
    setShowProcessModal(true);
  };

  const handleSaveProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processForm.processName.trim()) {
      alert("공정명을 입력해 주세요.");
      return;
    }
    try {
      if (editingProcessId) {
        await updateProcess(editingProcessId, processForm);
      } else {
        await createProcess(processForm);
      }
      setShowProcessModal(false);
      const procs = await fetchProcesses();
      setProcesses(procs);
    } catch (error) {
      console.error(error);
      alert("공정 정보 저장 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteProcess = async (id: number) => {
    if (window.confirm('공정을 삭제하시겠습니까? 연결된 자재 데이터에 영향을 줄 수 있습니다.')) {
      try {
        await deleteProcess(id);
        setProcesses(prev => prev.filter(p => p.processId !== id));
        alert('공정이 정상 삭제되었습니다.');
      } catch (error) {
        console.error(error);
        alert('공정 삭제에 실패했습니다. (이 공정에 속한 자재가 존재하는지 확인하세요)');
      }
    }
  };

  // ─── 탭 스타일 ────────────────────────────────────────────
  const tabStyle = (tab: Tab) => ({
    padding: '0.5rem 1.25rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
    background: activeTab === tab ? 'var(--accent-color)' : 'transparent',
    color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
    transition: 'all 0.2s',
  });

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)', borderRadius: '16px',
    padding: '2rem', width: '480px', maxWidth: '95vw',
    border: '1px solid var(--border-color)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px',
    border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
    color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' };

  return (
    <MainLayout>
      <header className="glass-panel" style={{ padding: '1.25rem 2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700 }}>마스터 데이터 관리</h1>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-primary)', borderRadius: '10px', padding: '0.35rem' }}>
          <button style={tabStyle('material')} onClick={() => setActiveTab('material')}><Package size={14} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />자재 단가</button>
          <button style={tabStyle('vendor')} onClick={() => setActiveTab('vendor')}><Building2 size={14} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />거래처</button>
          <button style={tabStyle('process')} onClick={() => setActiveTab('process')}><Wrench size={14} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />공정</button>
        </div>
      </header>

      {/* ─── 자재 단가 탭 ──────────────────────────────────── */}
      {activeTab === 'material' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>자재 단가 사전</h2>
            <button className="btn btn-primary" onClick={() => openMatModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Plus size={14} /> 신규 자재 추가
            </button>
          </div>
          {(() => {
            const MAT_ROW_HEIGHT = 45;
            const TABLE_HEIGHT = 500;
            const totalHeight = materials.length * MAT_ROW_HEIGHT;
            const visibleCount = Math.ceil(TABLE_HEIGHT / MAT_ROW_HEIGHT);
            const startIndex = Math.max(0, Math.floor(matScrollTop / MAT_ROW_HEIGHT) - 2);
            const endIndex = Math.min(materials.length - 1, startIndex + visibleCount + 4);
            const visibleMaterials = materials.slice(startIndex, endIndex + 1);
            const offsetY = startIndex * MAT_ROW_HEIGHT;
            const paddingBottomY = Math.max(0, totalHeight - (endIndex + 1) * MAT_ROW_HEIGHT);

            return (
              <div 
                onScroll={e => setMatScrollTop(e.currentTarget.scrollTop)} 
                style={{ maxHeight: `${TABLE_HEIGHT}px`, overflowY: 'auto', width: '100%' }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1, boxShadow: '0 1px 0 var(--border-color)' }}>
                    <tr style={{ color: 'var(--text-secondary)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>품목 구분</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>자재/노무명</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>규격</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>공정</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>실측단위</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>발주단위</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>환산율</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>매입원가(원)</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>노무단가(원)</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ height: `${offsetY}px` }}><td colSpan={10} style={{ padding: 0, border: 'none' }} /></tr>
                    {visibleMaterials.map(m => (
                      <tr key={m.materialId} style={{ borderBottom: '1px solid var(--border-color)', height: `${MAT_ROW_HEIGHT}px` }}>
                        <td style={{ padding: '0.4rem 0.5rem' }}>
                          <span style={{ 
                            fontSize: '0.72rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 600,
                            background: m.itemType === 'LABOR' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: m.itemType === 'LABOR' ? '#3b82f6' : '#10b981'
                          }}>
                            {m.itemType === 'LABOR' ? '노무비' : '자재'}
                          </span>
                        </td>
                        <td style={{ padding: '0.4rem 0.5rem', fontWeight: 600 }}>{m.materialName}</td>
                        <td style={{ padding: '0.4rem 0.5rem' }}>{m.specification ?? '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem' }}><span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'var(--accent-color)20', color: 'var(--accent-color)', fontWeight: 600 }}>{m.process.processName}</span></td>
                        <td style={{ padding: '0.4rem 0.5rem' }}>{m.standardUnit}</td>
                        <td style={{ padding: '0.4rem 0.5rem' }}>{m.distributionUnit}</td>
                        <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>{m.conversionRate}</td>
                        <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>{m.itemType === 'LABOR' ? '-' : `₩ ${m.purchasePrice.toLocaleString()}`}</td>
                        <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>{m.itemType === 'LABOR' ? `₩ ${m.laborPrice.toLocaleString()}` : '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center' }}>
                            <button onClick={() => openMatModal(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-color)', padding: 0 }}><Pencil size={14} /></button>
                            <button onClick={() => handleDeleteMaterial(m.materialId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0 }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ height: `${paddingBottomY}px` }}><td colSpan={10} style={{ padding: 0, border: 'none' }} /></tr>
                  </tbody>
                </table>
              </div>
            );
          })()}
          {materials.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>등록된 자재가 없습니다.</div>}
        </div>
      )}

      {/* ─── 거래처 탭 ────────────────────────────────────── */}
      {activeTab === 'vendor' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>거래처 관리</h2>
            <button className="btn btn-primary" onClick={() => openVendorModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Plus size={14} /> 거래처 추가
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>거래처명</th>
                <th style={{ padding: '0.5rem' }}>유형</th>
                <th style={{ padding: '0.5rem' }}>사업자 구분</th>
                <th style={{ padding: '0.5rem' }}>사업자번호</th>
                <th style={{ padding: '0.5rem' }}>담당자</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v: any) => (
                <tr key={v.vendorId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.6rem', fontWeight: 600 }}>{v.vendorName}</td>
                  <td style={{ padding: '0.6rem' }}>
                    <span style={{
                      fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600,
                      background: v.vendorType === 'SUPPLIER' ? '#f59e0b20' : v.vendorType === 'CLIENT' ? '#10b98120' : '#3b82f620',
                      color: v.vendorType === 'SUPPLIER' ? '#f59e0b' : v.vendorType === 'CLIENT' ? '#10b981' : '#3b82f6',
                    }}>{VENDOR_TYPE_LABELS[v.vendorType] ?? v.vendorType}</span>
                  </td>
                  <td style={{ padding: '0.6rem' }}>{BIZ_TYPE_LABELS[v.businessType] ?? v.businessType ?? '-'}</td>
                  <td style={{ padding: '0.6rem' }}>{v.businessNumber ?? '-'}</td>
                  <td style={{ padding: '0.6rem' }}>{v.contactPerson ?? '-'}</td>
                  <td style={{ padding: '0.6rem', textAlign: 'center', display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                    <button onClick={() => openVendorModal(v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-color)' }}><Pencil size={14} /></button>
                    <button onClick={() => handleDeleteVendor(v.vendorId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {vendors.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>등록된 거래처가 없습니다.</div>}
        </div>
      )}

      {/* ─── 공정 탭 ──────────────────────────────────────── */}
      {activeTab === 'process' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>공정 관리</h2>
            <button className="btn btn-primary" onClick={() => openProcessModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Plus size={14} /> 공정 추가
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>공정명</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>정렬 순서</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((p: any) => (
                <tr key={p.processId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.6rem', fontWeight: 600 }}>{p.processName}</td>
                  <td style={{ padding: '0.6rem', textAlign: 'right' }}>{p.sortOrder ?? '-'}</td>
                  <td style={{ padding: '0.6rem', textAlign: 'center', display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                    <button onClick={() => openProcessModal(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-color)' }}><Pencil size={14} /></button>
                    <button onClick={() => handleDeleteProcess(p.processId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {processes.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>등록된 공정이 없습니다.</div>}
        </div>
      )}

      {/* ─── 자재 모달 ──────────────────────────────────────── */}
      {showMaterialModal && (
        <div style={modalOverlayStyle} onClick={() => setShowMaterialModal(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 700 }}>{editingMaterial ? '자재 수정' : '신규 자재 등록'}</h3>
              <button onClick={() => setShowMaterialModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>품목 구분</label>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <button type="button" 
                    onClick={() => setMatForm({ ...matForm, itemType: 'MATERIAL' })} 
                    style={{ flex: 1, padding: '0.4rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: matForm.itemType === 'LABOR' ? 'transparent' : 'var(--accent-color)', color: matForm.itemType === 'LABOR' ? 'var(--text-secondary)' : '#fff', transition: 'all 0.2s' }}>
                    자재 단가
                  </button>
                  <button type="button" 
                    onClick={() => setMatForm({ ...matForm, itemType: 'LABOR', standardUnit: '일', distributionUnit: '일', conversionRate: 1 })} 
                    style={{ flex: 1, padding: '0.4rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: matForm.itemType === 'LABOR' ? 'var(--accent-color)' : 'transparent', color: matForm.itemType === 'LABOR' ? '#fff' : 'var(--text-secondary)', transition: 'all 0.2s' }}>
                    노무/인건비 단가
                  </button>
                </div>
              </div>

              <div><label style={labelStyle}>{matForm.itemType === 'LABOR' ? '노무/인건비 명칭' : '자재명'}</label><input style={inputStyle} value={matForm.materialName} onChange={e => setMatForm({ ...matForm, materialName: e.target.value })} required /></div>
              <div><label style={labelStyle}>규격</label><input style={inputStyle} value={matForm.specification} onChange={e => setMatForm({ ...matForm, specification: e.target.value })} placeholder={matForm.itemType === 'LABOR' ? '예: 기공, 조공, 식대 포함 등' : '예: 600x600, 100m 등'} /></div>
              <div><label style={labelStyle}>공정 분류</label>
                <select style={inputStyle} value={matForm.processId} onChange={e => setMatForm({ ...matForm, processId: Number(e.target.value) })}>
                  {processes.map(p => <option key={p.processId} value={p.processId}>{p.processName}</option>)}
                </select>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  공정을 추가하려면 →
                  <button type="button" onClick={() => { setShowMaterialModal(false); setActiveTab('process'); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', textDecoration: 'underline', padding: 0 }}>
                    공정 탭에서 추가
                  </button>
                </div>
              </div>

              {matForm.itemType !== 'LABOR' && (
                <>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}><label style={labelStyle}>실측 단위</label><input style={inputStyle} value={matForm.standardUnit} onChange={e => setMatForm({ ...matForm, standardUnit: e.target.value })} placeholder="예: ㎡" required /></div>
                    <div style={{ flex: 1 }}><label style={labelStyle}>발주 단위</label><input style={inputStyle} value={matForm.distributionUnit} onChange={e => setMatForm({ ...matForm, distributionUnit: e.target.value })} placeholder="예: Roll" required /></div>
                  </div>
                  <div><label style={labelStyle}>환산 계수 (1 {matForm.distributionUnit || '발주단위'} = ? {matForm.standardUnit || '실측단위'})</label><input type="number" step="0.01" style={inputStyle} value={matForm.conversionRate} onChange={e => setMatForm({ ...matForm, conversionRate: Number(e.target.value) })} required /></div>
                </>
              )}

              <div>
                {matForm.itemType === 'LABOR' ? (
                  <div>
                    <label style={labelStyle}>노무 단가 (원/일)</label>
                    <input type="number" style={inputStyle} value={matForm.laborPrice} onChange={e => setMatForm({ ...matForm, laborPrice: Number(e.target.value), purchasePrice: 0 })} required />
                  </div>
                ) : (
                  <div>
                    <label style={labelStyle}>매입 원가 (원/{matForm.distributionUnit || '발주단위'})</label>
                    <input type="number" style={inputStyle} value={matForm.purchasePrice} onChange={e => setMatForm({ ...matForm, purchasePrice: Number(e.target.value), laborPrice: 0 })} required />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowMaterialModal(false)} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>취소</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Save size={14} /> 저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 거래처 모달 ─────────────────────────────────────── */}
      {showVendorModal && (
        <div style={modalOverlayStyle} onClick={() => setShowVendorModal(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 700 }}>{editingVendorId ? '거래처 수정' : '신규 거래처 등록'}</h3>
              <button onClick={() => setShowVendorModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveVendor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={labelStyle}>거래처명 *</label><input style={inputStyle} value={vendorForm.vendorName} onChange={e => setVendorForm({ ...vendorForm, vendorName: e.target.value })} required /></div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}><label style={labelStyle}>거래처 유형</label>
                  <select style={inputStyle} value={vendorForm.vendorType} onChange={e => setVendorForm({ ...vendorForm, vendorType: e.target.value })}>
                    {VENDOR_TYPES.map(t => <option key={t} value={t}>{VENDOR_TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}><label style={labelStyle}>사업자 구분</label>
                  <select style={inputStyle} value={vendorForm.businessType} onChange={e => setVendorForm({ ...vendorForm, businessType: e.target.value })}>
                    {BIZ_TYPES.map(t => <option key={t} value={t}>{BIZ_TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={labelStyle}>사업자번호</label><input style={inputStyle} value={vendorForm.businessNumber ?? ''} onChange={e => setVendorForm({ ...vendorForm, businessNumber: e.target.value })} placeholder="예: 123-45-67890" /></div>
              <div><label style={labelStyle}>주소</label><input style={inputStyle} value={vendorForm.address ?? ''} onChange={e => setVendorForm({ ...vendorForm, address: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}><label style={labelStyle}>담당자명</label><input style={inputStyle} value={vendorForm.contactPerson ?? ''} onChange={e => setVendorForm({ ...vendorForm, contactPerson: e.target.value })} /></div>
                <div style={{ flex: 1 }}><label style={labelStyle}>계좌 정보</label><input style={inputStyle} value={vendorForm.accountInfo ?? ''} onChange={e => setVendorForm({ ...vendorForm, accountInfo: e.target.value })} /></div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowVendorModal(false)} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>취소</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Save size={14} /> 저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 공정 모달 ──────────────────────────────────────── */}
      {showProcessModal && (
        <div style={modalOverlayStyle} onClick={() => setShowProcessModal(false)}>
          <div style={{ ...modalStyle, width: '360px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 700 }}>{editingProcessId ? '공정 수정' : '신규 공정 등록'}</h3>
              <button onClick={() => setShowProcessModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveProcess} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={labelStyle}>공정명 *</label><input style={inputStyle} value={processForm.processName} onChange={e => setProcessForm({ ...processForm, processName: e.target.value })} required /></div>
              <div><label style={labelStyle}>정렬 순서</label><input type="number" style={inputStyle} value={processForm.sortOrder ?? 0} onChange={e => setProcessForm({ ...processForm, sortOrder: Number(e.target.value) })} /></div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowProcessModal(false)} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>취소</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Save size={14} /> 저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
