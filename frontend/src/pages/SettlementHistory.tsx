import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { fetchSettlementHistory, type SettlementHistoryResponse } from '../api/settlementHistoryApi';
import { Calendar, Search, Download, TrendingUp, DollarSign, PieChart, CheckCircle2, History, Filter, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function SettlementHistory() {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [historyData, setHistoryData] = useState<SettlementHistoryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 접이식 상세 필터 상태
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('ALL');
  const [amountRange, setAmountRange] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  useEffect(() => {
    loadHistory(selectedYear, searchTerm);
  }, [selectedYear]);

  const loadHistory = async (year: number, keyword: string) => {
    setLoading(true);
    const data = await fetchSettlementHistory(year, keyword);
    setHistoryData(data);
    setLoading(false);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedQuarter('ALL');
    setAmountRange('ALL');
    setSelectedStatus('ALL');
  };

  // 실시간 엑셀 (.xlsx) 파일 내보내기 핸들러 (합계 행 포함)
  const handleExportExcel = () => {
    if (!filteredItems.length) {
      alert('내보낼 정산 이력 데이터가 없습니다.');
      return;
    }

    const totalRevenue = filteredItems.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalExpense = filteredItems.reduce((sum, item) => sum + item.expenseAmount, 0);
    const totalNetProfit = filteredItems.reduce((sum, item) => sum + item.netProfit, 0);

    // 1. 상세 목록 행 구성
    const excelData: Array<Record<string, any>> = filteredItems.map(item => ({
      '현장명': item.projectName,
      '고객/거래처': item.clientName,
      '현장 상태': item.status,
      '총 공사금액(원)': item.totalAmount,
      '총 지출(원)': item.expenseAmount,
      '순이익(원)': item.netProfit,
      '완공 및 정산일': item.completionDate,
    }));

    // 2. 맨 아래 필터링 합계 요약 행 추가
    excelData.push({
      '현장명': `필터링 합계 (총 ${filteredItems.length}건)`,
      '고객/거래처': '-',
      '현장 상태': '-',
      '총 공사금액(원)': totalRevenue,
      '총 지출(원)': totalExpense,
      '순이익(원)': totalNetProfit,
      '완공 및 정산일': '-',
    });

    // 3. XLSX 바이너리 워크시트 생성 및 다운로드
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 열 너비 자동 맞춤
    worksheet['!cols'] = [
      { wch: 35 }, // 현장명
      { wch: 18 }, // 고객/거래처
      { wch: 16 }, // 현장 상태
      { wch: 18 }, // 총 공사금액
      { wch: 18 }, // 총 지출
      { wch: 18 }, // 순이익
      { wch: 15 }, // 완공 및 정산일
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${selectedYear}년 정산아카이브`);

    XLSX.writeFile(workbook, `인테리어_정산이력_아카이브_${selectedYear}년.xlsx`);
  };

  const filteredItems = (historyData?.items || []).filter(item => {
    const matchesSearch = item.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.clientName.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesQuarter = true;
    if (selectedQuarter !== 'ALL' && item.completionDate) {
      const month = parseInt(item.completionDate.split('-')[1], 10);
      if (selectedQuarter === 'Q1') matchesQuarter = month >= 1 && month <= 3;
      else if (selectedQuarter === 'Q2') matchesQuarter = month >= 4 && month <= 6;
      else if (selectedQuarter === 'Q3') matchesQuarter = month >= 7 && month <= 9;
      else if (selectedQuarter === 'Q4') matchesQuarter = month >= 10 && month <= 12;
    }

    let matchesAmount = true;
    if (amountRange === 'UNDER_30M') matchesAmount = item.totalAmount < 30000000;
    else if (amountRange === '30M_50M') matchesAmount = item.totalAmount >= 30000000 && item.totalAmount <= 50000000;
    else if (amountRange === 'OVER_50M') matchesAmount = item.totalAmount > 50000000;

    let matchesStatus = true;
    if (selectedStatus !== 'ALL') {
      matchesStatus = item.status === selectedStatus;
    }

    return matchesSearch && matchesQuarter && matchesAmount && matchesStatus;
  });

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case '견적중':
        return { bg: '#3B82F620', color: '#3B82F6' };
      case '수주':
        return { bg: '#8B5CF620', color: '#8B5CF6' };
      case '공사중':
        return { bg: '#F59E0B20', color: '#F59E0B' };
      case '완료':
      default:
        return { bg: '#10B98120', color: '#10B981' };
    }
  };

  return (
    <MainLayout>
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)' }}>
            <History style={{ color: 'var(--accent-color)' }} />
            정산 이력 & 아카이브
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            전체 현장(견적중, 수주, 공사중, 완료)의 손익 이력 및 연도별 집계 데이터를 다차원으로 분석합니다.
          </p>
        </div>

        {/* Summary Metrics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>연간 관리 현장 수</span>
              <CheckCircle2 size={20} style={{ color: '#10B981' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-primary)' }}>
              {historyData?.totalProjects || 0} 개 현장
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>연간 총 매출액</span>
              <DollarSign size={20} style={{ color: '#3B82F6' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: '#3B82F6' }}>
              ₩{historyData?.totalRevenue.toLocaleString() || 0}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>연간 총 집행 지출</span>
              <TrendingUp size={20} style={{ color: '#EF4444' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: '#EF4444' }}>
              ₩{historyData?.totalExpense.toLocaleString() || 0}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>연간 누적 순이익 (이익률)</span>
              <PieChart size={20} style={{ color: '#8B5CF6' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: '#8B5CF6' }}>
              ₩{historyData?.netProfit.toLocaleString() || 0} ({historyData?.profitMargin || 0}%)
            </div>
          </div>
        </div>

        {/* Unified Control Panel & Data Table */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* 단일 통합 검색 패널 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>전체 현장 정산 및 손익 이력 목록</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              
              {/* 1. 연도 선택 콤보박스 (DB 동적 연도 목록 바인딩) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-secondary)', padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <Calendar size={16} style={{ color: 'var(--accent-color)' }} />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                >
                  {(historyData?.availableYears && historyData.availableYears.length > 0
                    ? historyData.availableYears
                    : [selectedYear]
                  ).map(year => (
                    <option key={year} value={year}>
                      {year}년 아카이브
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. 자연어 통합 검색창 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '240px' }}>
                <Search size={16} style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="현장명 또는 고객명..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '0.9rem' }}
                />
              </div>

              {/* 3. 접이식 상세 필터 토글 */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  border: isFilterOpen ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                  background: isFilterOpen ? 'var(--accent-color)15' : 'var(--bg-secondary)',
                  color: isFilterOpen ? 'var(--accent-color)' : 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                <Filter size={16} />
                상세 필터
                {isFilterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {/* 4. 엑셀 다운로드 버튼 (.xlsx 바이너리) */}
              <button
                onClick={handleExportExcel}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                <Download size={16} />
                .xlsx 엑셀 내보내기
              </button>
            </div>
          </div>

          {/* 접이식 상세 필터 패널 */}
          {isFilterOpen && (
            <div
              style={{
                padding: '1.25rem',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.25rem',
                alignItems: 'center',
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>분기 선택</label>
                <select
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                >
                  <option value="ALL">전체 분기</option>
                  <option value="Q1">1분기 (1월~3월)</option>
                  <option value="Q2">2분기 (4월~6월)</option>
                  <option value="Q3">3분기 (7월~9월)</option>
                  <option value="Q4">4분기 (10월~12월)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>공사 금액대</label>
                <select
                  value={amountRange}
                  onChange={(e) => setAmountRange(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                >
                  <option value="ALL">전체 금액대</option>
                  <option value="UNDER_30M">3천만원 미만</option>
                  <option value="30M_50M">3천만원 ~ 5천만원</option>
                  <option value="OVER_50M">5천만원 초과</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>현장 상태</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                >
                  <option value="ALL">전체 상태</option>
                  <option value="견적중">견적중</option>
                  <option value="수주">수주</option>
                  <option value="공사중">공사중</option>
                  <option value="완료">완료</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                <button
                  onClick={handleResetFilters}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  <RotateCcw size={14} />
                  필터 초기화
                </button>
              </div>
            </div>
          )}

          {/* Data Table */}
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>이력 데이터를 불러오는 중...</div>
          ) : filteredItems.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>조건에 해당하는 과거 정산 이력이 없습니다.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>현장명</th>
                    <th style={{ padding: '0.75rem 1rem' }}>고객 / 거래처</th>
                    <th style={{ padding: '0.75rem 1rem' }}>상태</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>총 공사금액</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>총 지출</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>순이익</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>완공 및 정산일</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const badge = getStatusBadgeStyle(item.status);
                    return (
                      <tr key={item.projectId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.projectName}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{item.clientName}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ background: badge.bg, color: badge.color, padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>₩{item.totalAmount.toLocaleString()}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: '#EF4444' }}>₩{item.expenseAmount.toLocaleString()}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: '#10B981', fontWeight: 700 }}>₩{item.netProfit.toLocaleString()}</td>
                        <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{item.completionDate}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--accent-color)', background: 'var(--bg-secondary)', fontWeight: 700 }}>
                    <td style={{ padding: '1rem', color: 'var(--accent-color)' }}>
                      필터링 합계 (총 {filteredItems.length}건)
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>-</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>-</td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#3B82F6' }}>
                      ₩{filteredItems.reduce((sum, item) => sum + item.totalAmount, 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#EF4444' }}>
                      ₩{filteredItems.reduce((sum, item) => sum + item.expenseAmount, 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#10B981', fontSize: '1.05rem' }}>
                      ₩{filteredItems.reduce((sum, item) => sum + item.netProfit, 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
