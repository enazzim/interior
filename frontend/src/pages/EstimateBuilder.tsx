import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Plus, Trash2, Check, Image as ImageIcon, FileText, ArrowLeft, Calculator, Search, Download } from 'lucide-react';
import axios from 'axios';
import MainLayout from '../components/layout/MainLayout';
import ImageUploader from '../components/upload/ImageUploader';
import { createEstimate, fetchEstimateById } from '../api/estimateApi';
import type { EstimateResponse } from '../api/estimateApi';
import { getProject } from '../api/projectApi';
import { fetchMaterials } from '../api/materialApi';
import type { MaterialResponse } from '../api/materialApi';
import { fetchAllVendors } from '../api/vendorApi';
import type { VendorResponse } from '../api/vendorApi';
import ClientAutocomplete from '../components/common/ClientAutocomplete';
interface CartItem {
  materialId: number;
  materialName: string;
  processName: string;
  inputArea: number;
  itemType?: string;
  unit?: string;
}

// ─── 3번: 자재 자동완성 컴포넌트 ──────────────────────────────────
interface MaterialAutocompleteProps {
  materials: MaterialResponse[];
  selectedId: number;
  onSelect: (id: number) => void;
  disabled?: boolean;
}

function MaterialAutocomplete({ materials, selectedId, onSelect, disabled }: MaterialAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const selected = materials.find(m => m.materialId === selectedId);

  const filtered = query.trim()
    ? materials.filter(m =>
        m.materialName.toLowerCase().includes(query.toLowerCase()) ||
        m.process.processName.toLowerCase().includes(query.toLowerCase())
      )
    : materials;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (mat: MaterialResponse) => {
    onSelect(mat.materialId);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative', flex: 2, minWidth: '200px', zIndex: 10 }}>
      <label style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>자재 종류 선택</label>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', cursor: disabled ? 'not-allowed' : 'text', opacity: disabled ? 0.6 : 1 }}
        onClick={() => { if (!disabled) setOpen(true); }}
      >
        <Search size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        {open && !disabled ? (
          <input
            autoFocus
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            placeholder="자재명 또는 공정 검색..."
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', flex: 1 }}
          />
        ) : (
          <span style={{ flex: 1, fontSize: '0.9rem', color: selected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            {selected ? `[${selected.process.processName}] ${selected.materialName}${selected.specification ? ` (${selected.specification})` : ''}` : '자재를 검색하거나 선택하세요'}
          </span>
        )}
      </div>

      {open && (() => {
        const ITEM_HEIGHT = 38;
        const CONTAINER_HEIGHT = 220;
        const totalHeight = filtered.length * ITEM_HEIGHT;
        const visibleCount = Math.ceil(CONTAINER_HEIGHT / ITEM_HEIGHT);
        const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 1);
        const endIndex = Math.min(filtered.length - 1, startIndex + visibleCount + 2);
        const visibleItems = filtered.slice(startIndex, endIndex + 1);
        const offsetY = startIndex * ITEM_HEIGHT;
        const paddingBottomY = Math.max(0, totalHeight - (endIndex + 1) * ITEM_HEIGHT);

        return (
          <div 
            onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
            style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 9999,
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              borderRadius: '8px', maxHeight: `${CONTAINER_HEIGHT}px`, overflowY: 'auto',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>검색 결과 없음</div>
            ) : (
              <>
                <div style={{ height: `${offsetY}px` }} />
                {visibleItems.map(mat => (
                  <div
                    key={mat.materialId}
                    onMouseDown={() => handleSelect(mat)}
                    style={{
                      padding: '0.6rem 0.9rem', cursor: 'pointer', fontSize: '0.85rem',
                      borderBottom: '1px solid var(--border-color)',
                      background: mat.materialId === selectedId ? 'var(--accent-color)20' : 'transparent',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      height: `${ITEM_HEIGHT}px`, boxSizing: 'border-box'
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'var(--accent-color)30', color: 'var(--accent-color)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {mat.process.processName}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mat.materialName}{mat.specification ? ` (${mat.specification})` : ''}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                      {mat.standardUnit}
                    </span>
                  </div>
                ))}
                <div style={{ height: `${paddingBottomY}px` }} />
              </>
            )}
          </div>
        );
      })()}
    </div>
  );
}


// ─── 4-2번: Excel 다운로드 함수 (백엔드 공식 POI 정식 엑셀 서식 엔진 연동) ────────────────
const downloadEstimateExcel = (estimate: EstimateResponse) => {
  if (!estimate || !estimate.estimateId) return;

  const downloadUrl = `http://localhost:38080/api/estimates/${estimate.estimateId}/excel`;
  const link = document.createElement('a');
  link.href = downloadUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ─── 메인 컴포넌트 ────────────────────────────────────────────────
export default function EstimateBuilder() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const projectId = Number(queryParams.get('projectId')) || 1;
  const fromEstimateId = Number(queryParams.get('fromEstimateId')) || 0; // 2번: 기존 견적 ID

  const [projectName, setProjectName] = useState<string>('시뮬레이션 현장');
  const [materials, setMaterials] = useState<MaterialResponse[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number>(0);
  const [inputArea, setInputArea] = useState<number>(0);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [estimateResult, setEstimateResult] = useState<EstimateResponse | null>(null);
  const [baseVersionLabel, setBaseVersionLabel] = useState<string>('');
  const [vendors, setVendors] = useState<VendorResponse[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<number>(0);
  const [marginRate, setMarginRate] = useState<number>(20); // 마진율 기본 20%
  const [projectImages, setProjectImages] = useState<{ imageId: number; imageUrl: string; originalFileName: string }[]>([]);

  useEffect(() => {
    if (projectId) {
      getProject(projectId)
        .then(p => {
          setProjectName(p.projectName);
          if (p.clientVendorId) {
            setSelectedVendorId(p.clientVendorId);
          }
        })
        .catch(err => console.error('현장 정보 로드 실패:', err));
        
      fetchProjectImages();
    }

    fetchMaterials()
      .then(data => {
        setMaterials(data);
        if (data.length > 0) setSelectedMaterialId(data[0].materialId);
      })
      .catch(err => console.error('자재 목록 로드 실패:', err));

    fetchAllVendors()
      .then(data => {
        const clients = data.filter(v => v.vendorType === 'CLIENT');
        setVendors(clients);
        if (clients.length > 0) setSelectedVendorId(clients[0].vendorId);
      })
      .catch(err => console.error('거래처 목록 로드 실패:', err));
  }, [projectId]);

  const fetchProjectImages = async () => {
    try {
      const res = await axios.get(`/api/projects/${projectId}/images`);
      setProjectImages(res.data);
    } catch (error) {
      console.error('이미지 목록 로드 실패:', error);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!window.confirm("이 사진을 영구 삭제하시겠습니까?")) return;
    try {
      await axios.delete(`/api/projects/${projectId}/images/${imageId}`);
      fetchProjectImages();
    } catch (err) {
      console.error("사진 삭제 실패:", err);
      alert("사진 삭제에 실패했습니다.");
    }
  };

  const handleDownloadImage = (imageUrl: string, originalFileName: string) => {
    const backendBaseUrl = window.location.protocol + '//' + window.location.hostname + ':38080';
    const downloadUrl = `${backendBaseUrl}/api/files/download?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(originalFileName)}`;
    window.location.href = downloadUrl;
  };

  // 2번: 기존 견적 ID가 있으면 해당 항목을 장바구니에 사전 로드
  useEffect(() => {
    if (fromEstimateId > 0 && materials.length > 0) {
      fetchEstimateById(fromEstimateId).then(est => {
        const loadedCart: CartItem[] = est.items
          .map(item => {
            const mat = materials.find(m => m.materialId === item.materialId);
            if (!mat) return null;
            return {
              materialId: mat.materialId,
              materialName: `[${mat.process.processName}] ${mat.materialName}`,
              processName: mat.process.processName,
              inputArea: item.inputArea,
              itemType: mat.itemType,
              unit: mat.standardUnit,
            };
          })
          .filter(Boolean) as CartItem[];
        setCart(loadedCart);
        if (est.clientVendorId) {
          setSelectedVendorId(est.clientVendorId);
        }
        if (est.marginRate) {
          setMarginRate(est.marginRate);
        }
        
        // 락(Lock) 처리: 이미 발행 확정된 견적은 수정 차단
        // est.isFinal 필드(백엔드 JPA 필드)가 true인 경우 읽기전용 활성화
        if (est.isFinal) {
          setIsReadOnly(true);
          setBaseVersionLabel(`발행 완료 견적 #${fromEstimateId} (읽기 전용)`);
        } else {
          setIsReadOnly(false);
          setBaseVersionLabel(`기존 견적 #${fromEstimateId} 기반`);
        }
      }).catch(console.error);
    }
  }, [fromEstimateId, materials]);

  const handleAddToCart = () => {
    const targetMat = materials.find(m => m.materialId === selectedMaterialId);
    if (!targetMat) { alert("자재가 올바르지 않습니다."); return; }
    const isLabor = targetMat.itemType === 'LABOR';

    if (inputArea <= 0) { 
      alert(isLabor ? "수량/일수를 1 이상 입력해주세요." : "면적을 1㎡ 이상 입력해주세요."); 
      return; 
    }
    if (cart.some(item => item.materialId === selectedMaterialId)) { 
      alert("이미 추가된 항목입니다. 목록에서 삭제 후 다시 추가해 주세요."); 
      return; 
    }
    const matLabel = `[${targetMat.process.processName}] ${targetMat.materialName}`;
    setCart(prev => [...prev, { 
      materialId: selectedMaterialId, 
      materialName: matLabel, 
      processName: targetMat.process.processName, 
      inputArea,
      itemType: targetMat.itemType,
      unit: targetMat.standardUnit
    }]);
    setInputArea(0);
  };

  const handleRemoveFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.materialId !== id));
  };

  const handleSaveEstimate = async () => {
    if (cart.length === 0) { alert("견적에 추가할 자재가 최소 1개 이상 필요합니다."); return; }
    if (selectedVendorId <= 0) { alert("발주처(고객)를 선택해 주세요."); return; }
    setLoading(true);
    
    // 로컬스토리지에서 로그인된 유저 ID 획득
    let currentUserId = 1;
    const cachedUser = localStorage.getItem('currentUser');
    if (cachedUser) {
      try {
        const userObj = JSON.parse(cachedUser);
        if (userObj && userObj.userId) {
          currentUserId = userObj.userId;
        }
      } catch (e) {
        console.error(e);
      }
    }

    try {
      const response = await createEstimate({
        projectId,
        clientVendorId: selectedVendorId,
        authorUserId: currentUserId,
        marginRate,
        items: cart.map(item => ({ materialId: item.materialId, inputArea: item.inputArea }))
      });
      setEstimateResult(response);
      setCart([]);
      setBaseVersionLabel('');
    } catch (error) {
      alert("견적 저장에 실패했습니다. 백엔드 서버 상태를 확인해 주세요.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <header className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/projects')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            <ArrowLeft size={16} /> 현장 목록
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} style={{ color: 'var(--accent-color)' }} />
            스마트 견적서 작성: <span style={{ color: 'var(--text-primary)' }}>{projectName}</span>
          </h1>
        </div>
        {baseVersionLabel && (
          <span style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', borderRadius: '6px', background: '#3b82f620', color: '#3b82f6', fontWeight: 600 }}>
            🔄 {baseVersionLabel} — 새 버전 작성 중
          </span>
        )}
      </header>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>

        {/* 좌측: 장바구니 작성 폼 */}
        <div style={{ flex: 1.5, minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* 발주처 지정 카드 */}
          <div className="glass-panel" style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 30 }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
              발주처 (고객사) 지정
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>수신인 거래처 선택</label>
              <ClientAutocomplete
                clients={vendors}
                selectedId={selectedVendorId}
                onSelect={setSelectedVendorId}
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', zIndex: 20 }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>
              1. 시공 자재 및 면적 입력
            </h3>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {/* 3번: 자동완성 컴포넌트 */}
              <MaterialAutocomplete
                materials={materials}
                selectedId={selectedMaterialId}
                onSelect={setSelectedMaterialId}
                disabled={isReadOnly}
              />

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '100px' }}>
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {materials.find(m => m.materialId === selectedMaterialId)?.itemType === 'LABOR' 
                    ? '수량 / 투입 일수 (품)' 
                    : `소요 수량 (${materials.find(m => m.materialId === selectedMaterialId)?.standardUnit ?? '㎡'})`}
                </label>
                <input
                  type="number"
                  value={inputArea || ''}
                  onChange={e => setInputArea(Number(e.target.value))}
                  placeholder={materials.find(m => m.materialId === selectedMaterialId)?.itemType === 'LABOR' 
                    ? '예: 2' 
                    : `예: 15 (${materials.find(m => m.materialId === selectedMaterialId)?.standardUnit ?? '㎡'})`}
                  disabled={isReadOnly}
                  style={{ padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', opacity: isReadOnly ? 0.6 : 1 }}
                />
              </div>
            </div>

            <button
              className="btn btn-secondary"
              onClick={handleAddToCart}
              disabled={isReadOnly}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', opacity: isReadOnly ? 0.6 : 1 }}
            >
              <Plus size={16} /> 자재 목록에 추가
            </button>
          </div>

          {/* 자재 내역서 */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 600 }}>
              2. 견적서 자재 내역서 {cart.length > 0 && <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)' }}>({cart.length}개 항목)</span>}
            </h3>

            {cart.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {cart.map((item) => (
                  <div
                    key={item.materialId}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.materialName}</span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {item.itemType === 'LABOR' 
                          ? `노무 수량: ${item.inputArea.toLocaleString()} ${item.unit ?? '일'}` 
                          : `소요 수량: ${item.inputArea.toLocaleString()} ${item.unit ?? '㎡'}`}
                      </div>
                    </div>
                    <button
                      onClick={() => { if (!isReadOnly) handleRemoveFromCart(item.materialId); }}
                      disabled={isReadOnly}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: isReadOnly ? 'not-allowed' : 'pointer', padding: '0.5rem', opacity: isReadOnly ? 0.4 : 1 }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}

                <button
                  className="btn btn-primary"
                  onClick={handleSaveEstimate}
                  disabled={loading || isReadOnly}
                  style={{ marginTop: '1.5rem', padding: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: isReadOnly ? 0.6 : 1, cursor: isReadOnly ? 'not-allowed' : 'pointer' }}
                >
                  <Calculator size={18} />
                  {loading ? '서버에 견적 저장 중...' : isReadOnly ? '발행 완료된 견적서 (수정 불가) 🔒' : baseVersionLabel ? '새 버전으로 견적서 발행 🚀' : '이 내역으로 견적서 발행하기 🚀'}
                </button>
              </div>
            ) : (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', border: '2px dashed var(--border-color)', borderRadius: '8px' }}>
                위의 폼에서 자재를 선택하고 추가해 주세요.
              </div>
            )}
          </div>

          {/* 현장 사진 업로드 영역 */}
          <div className="glass-panel" style={{ padding: '2rem', marginTop: '1.5rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ImageIcon size={18} /> 3. 현장 시공 전/후 사진첩
            </h3>
            
            <ImageUploader projectId={projectId} onUploadComplete={fetchProjectImages} />
            
            {projectImages.length > 0 && (
              <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
                {projectImages.map(img => (
                  <div key={img.imageId} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', aspectRatio: '1/1' }}>
                    <img src={img.imageUrl} alt={img.originalFileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '4px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadImage(img.imageUrl, img.originalFileName);
                        }}
                        style={{
                          background: 'rgba(59, 130, 246, 0.9)', color: '#fff',
                          border: 'none', borderRadius: '4px', padding: '0.25rem',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)', transition: 'background 0.2s'
                        }}
                        title="사진 다운로드"
                      >
                        <Download size={12} />
                      </button>
                      {!isReadOnly && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(img.imageId);
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.9)', color: '#fff',
                            border: 'none', borderRadius: '4px', padding: '0.25rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)', transition: 'background 0.2s'
                          }}
                          title="사진 삭제"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 우측: 계산 완료 영수증 */}
        <div style={{ flex: 1, minWidth: '350px' }}>
          <div id="estimate-receipt-print" className="glass-panel" style={{ padding: '2rem', height: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: 'var(--accent-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
              <Check size={18} /> 발행된 견적 결과 영수증
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>기본 적용 마진율 (%)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={marginRate}
                  onChange={e => setMarginRate(Math.max(0, Math.min(100, Number(e.target.value))))}
                  disabled={isReadOnly}
                  style={{ width: '80px', padding: '0.4rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', textAlign: 'center', fontSize: '0.85rem', opacity: isReadOnly ? 0.6 : 1 }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>% 마진 적용</span>
              </div>
            </div>

            {estimateResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
                <div style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    <span className="text-muted">견적서 번호:</span>
                    <span style={{ fontWeight: 600 }}>#{estimateResult.estimateId}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span className="text-muted">발행일:</span>
                    <span>{new Date(estimateResult.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '250px', overflowY: 'auto' }}>
                  {estimateResult.items.map(item => {
                    const isLabor = item.itemType === 'LABOR';
                    const itemTotalAmount = item.customerUnitPrice * Math.ceil(item.calculatedQty);

                    return (
                      <div key={item.itemId} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingBottom: '0.75rem', borderBottom: '1px dashed var(--border-color)', fontSize: '0.9rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.materialName}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <span>{isLabor ? '투입 인원 / 공수:' : '시공 면적:'}</span>
                          <span>{item.inputArea} {isLabor ? '품 (명)' : '㎡'}</span>
                        </div>
                        {!isLabor && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#f59e0b' }}>
                            <span>발주 수량 (자동 계산):</span>
                            <span style={{ fontWeight: 600 }}>{Math.ceil(item.calculatedQty)} {item.distributionUnit || 'Box'}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span>항목 합계 금액 (원가):</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₩ {itemTotalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '2px solid var(--border-color)' }}>
                  {marginRate > 0 && estimateResult.totalAmount > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.8rem', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span>순수 자재/인건 원가:</span>
                        <span>₩ {Math.round(estimateResult.totalAmount / (1 + (marginRate / 100))).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#10b981', fontWeight: 700 }}>
                        <span>기업 이윤 마진 (+{marginRate}%):</span>
                        <span>+ ₩ {Math.round(estimateResult.totalAmount - (estimateResult.totalAmount / (1 + (marginRate / 100)))).toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 600 }}>총 청구 금액</span>
                    <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-color)' }}>
                      ₩ {estimateResult.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-muted" style={{ textAlign: 'right', fontSize: '0.75rem', marginTop: '0.5rem', margin: 0 }}>
                    * {marginRate > 0 ? `원가 대비 ${marginRate}% 마진이 포함된 금액입니다.` : '마진 0% (원가 청구)가 적용된 금액입니다.'}
                  </p>
                </div>

                {/* 4번: PDF 다운로드 버튼 */}
                <button
                  className="btn"
                  onClick={() => downloadEstimateExcel(estimateResult)}
                  style={{ width: '100%', padding: '0.85rem', background: '#10b981', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 700 }}
                >
                  <FileSpreadsheet size={16} /> 고객 송부용 Excel 다운로드
                </button>
                <button
                  className="btn"
                  onClick={() => navigate('/projects')}
                  style={{ width: '100%', padding: '0.65rem', background: 'transparent', border: '1px solid var(--border-color)' }}
                >
                  현장 목록으로 복귀
                </button>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: '8px' }}>
                좌측에서 자재 내역을 작성하고<br />'견적서 발행하기'를 실행해 주세요.
              </div>
            )}
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
