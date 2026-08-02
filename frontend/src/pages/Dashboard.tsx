import { useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { fetchDashboardStats } from '../api/dashboardApi';
import type { DashboardStatsResponse } from '../api/dashboardApi';
import { TrendingUp, TrendingDown, DollarSign, Briefcase, Activity, AlertCircle, Percent } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats()
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('대시보드 통계 조회 실패:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          대시보드 데이터를 분석 중입니다...
        </div>
      </MainLayout>
    );
  }

  if (!stats) {
    return (
      <MainLayout>
        <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>
          대시보드 데이터를 로드하지 못했습니다. 서버 상태를 확인해주세요.
        </div>
      </MainLayout>
    );
  }

  // ─── SVG 누적 추이 차트 계산용 데이터 가공 ────────────────────
  const trends = stats.monthlyTrends;
  const maxVal = Math.max(...trends.flatMap(t => [t.income, t.expense]), 1000000);
  
  // SVG 크기
  const chartW = 500;
  const chartH = 200;
  const padding = 30;
  const graphW = chartW - padding * 2;
  const graphH = chartH - padding * 2;

  // 좌표 매핑 함수
  const getCoords = (index: number, val: number) => {
    const x = padding + (index / (trends.length - 1)) * graphW;
    const y = chartH - padding - (val / maxVal) * graphH;
    return { x, y };
  };

  // 수입(Income) 라인용 SVG Path 생성
  const incomePoints = trends.map((t, idx) => getCoords(idx, t.income));
  const incomePath = incomePoints.length > 0 
    ? `M ${incomePoints[0].x} ${incomePoints[0].y} ` + incomePoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';
  const incomeAreaPath = incomePoints.length > 0 
    ? `${incomePath} L ${incomePoints[incomePoints.length - 1].x} ${chartH - padding} L ${incomePoints[0].x} ${chartH - padding} Z`
    : '';

  // 지출(Expense) 라인용 SVG Path 생성
  const expensePoints = trends.map((t, idx) => getCoords(idx, t.expense));
  const expensePath = expensePoints.length > 0 
    ? `M ${expensePoints[0].x} ${expensePoints[0].y} ` + expensePoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';
  const expenseAreaPath = expensePoints.length > 0 
    ? `${expensePath} L ${expensePoints[expensePoints.length - 1].x} ${chartH - padding} L ${expensePoints[0].x} ${chartH - padding} Z`
    : '';

  // ─── 공정별 지출 비중 도넛 차트용 SVG 계산 ────────────────────
  // 도넛 차트 중심 및 반지름
  const cx = 100;
  const cy = 100;
  const r = 70;
  const strokeW = 20;
  const circumference = 2 * Math.PI * r;

  let currentAngle = 0;
  const shareColors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6b7280'];

  const processPieSegments = stats.processShares.map((share, idx) => {
    const strokeDashoffset = circumference - (share.shareRate / 100) * circumference;
    const rotation = currentAngle;
    currentAngle += (share.shareRate / 100) * 360;

    return {
      ...share,
      color: shareColors[idx % shareColors.length],
      strokeDashoffset,
      rotation
    };
  });

  return (
    <MainLayout>
      <header className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>종합 경영 대시보드</h1>
          <p className="text-muted" style={{ fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>실시간 매출, 정산 수치 및 전사 금융 통계 알림판</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
          <span style={{ fontWeight: 600 }}>시스템 정상 작동 중</span>
        </div>
      </header>

      {/* ─── 상단 4구 KPI 카드 ───────────────────────────────── */}
      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        
        {/* 누적 수금액 (수입) */}
        <div className="glass-panel text-card" style={{ flex: 1, minWidth: '220px', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>누적 수금액 (실수입)</span>
            <TrendingUp size={18} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            ₩ {stats.totalIncome.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>계약금, 중도금, 잔금 포함 총 수금</span>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '40px', height: '40px', background: '#10b98110', borderRadius: '50% 0 0 0' }}></div>
        </div>

        {/* 누적 실제 지출 */}
        <div className="glass-panel text-card" style={{ flex: 1, minWidth: '220px', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>누적 집행 비용 (지출)</span>
            <TrendingDown size={18} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            ₩ {stats.totalExpense.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>자재비 및 외주공임 실제 집행 비용</span>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '40px', height: '40px', background: '#ef444410', borderRadius: '50% 0 0 0' }}></div>
        </div>

        {/* 누적 매출총액 및 마진액 */}
        <div className="glass-panel text-card" style={{ flex: 1, minWidth: '220px', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-color)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>누적 마진액 (순수익)</span>
            <DollarSign size={18} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            ₩ {stats.totalMargin.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>총 매출액 ₩ {stats.totalRevenue.toLocaleString()} 대비</span>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '40px', height: '40px', background: 'var(--accent-color)10', borderRadius: '50% 0 0 0' }}></div>
        </div>

        {/* 평균 마진율 */}
        <div className="glass-panel text-card" style={{ flex: 1, minWidth: '220px', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>평균 전사 마진율</span>
            <Percent size={18} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stats.averageMarginRate >= 0 ? '#3b82f6' : '#ef4444' }}>
            {stats.averageMarginRate.toFixed(1)} %
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>전사 프로젝트 평균 마진 산정 비율</span>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '40px', height: '40px', background: '#f59e0b10', borderRadius: '50% 0 0 0' }}></div>
        </div>

        {/* 활성 현장 수 */}
        <div className="glass-panel text-card" style={{ flex: 0.8, minWidth: '150px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>진행 현장</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem', display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
            {stats.activeProjects} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>/ {stats.totalProjects}개</span>
          </div>
        </div>

      </div>

      {/* ─── 차트 및 긴급 알림 목록 레이아웃 ────────────────────── */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        
        {/* 최근 6개월 매출/비용 추이 (영역 차트) */}
        <div className="glass-panel" style={{ flex: 1.5, minWidth: '350px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} style={{ color: 'var(--accent-color)' }} />
            최근 6개월 누적 금융 추이
          </h3>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#10b981', borderRadius: '2px' }}></span>수금액</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#ef4444', borderRadius: '2px' }}></span>비용지출</span>
          </div>

          <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
            <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" height={chartH} style={{ background: 'transparent' }}>
              {/* 그리드 가로선 */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = padding + ratio * graphH;
                return (
                  <line key={idx} x1={padding} y1={y} x2={chartW - padding} y2={y} stroke="var(--border-color)" strokeWidth={0.5} strokeDasharray="3 3" />
                );
              })}

              {/* 수입 영역 & 선 */}
              {incomePath && (
                <>
                  <path d={incomeAreaPath} fill="url(#incomeGrad)" opacity={0.15} />
                  <path d={incomePath} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" />
                </>
              )}

              {/* 지출 영역 & 선 */}
              {expensePath && (
                <>
                  <path d={expenseAreaPath} fill="url(#expenseGrad)" opacity={0.15} />
                  <path d={expensePath} fill="none" stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" />
                </>
              )}

              {/* 각 월별 X축 라벨 및 점 마커 */}
              {trends.map((t, idx) => {
                const incCoord = getCoords(idx, t.income);
                const expCoord = getCoords(idx, t.expense);
                return (
                  <g key={idx}>
                    <circle cx={incCoord.x} cy={incCoord.y} r={3} fill="#10b981" />
                    <circle cx={expCoord.x} cy={expCoord.y} r={3} fill="#ef4444" />
                    <text x={incCoord.x} y={chartH - 10} textAnchor="middle" fill="var(--text-secondary)" fontSize={8}>
                      {t.month.substring(5)}월
                    </text>
                  </g>
                );
              })}

              {/* 그라데이션 정의 */}
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* 공정별 지출 비중 도넛 차트 */}
        <div className="glass-panel" style={{ flex: 1, minWidth: '280px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={16} style={{ color: 'var(--accent-color)' }} />
            공정별 집행 비용 비중
          </h3>
          {stats.processShares.length === 0 ? (
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              비용 지출 내역이 없습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1rem', flex: 1 }}>
              <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
                {processPieSegments.map((segment, idx) => (
                  <circle
                    key={idx}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="transparent"
                    stroke={segment.color}
                    strokeWidth={strokeW}
                    strokeDasharray={circumference}
                    strokeDashoffset={segment.strokeDashoffset}
                    style={{
                      transformOrigin: 'center',
                      transform: `rotate(${segment.rotation}deg)`,
                      transition: 'all 0.5s ease-out'
                    }}
                  />
                ))}
                {/* 중앙 구멍 */}
                <circle cx={cx} cy={cy} r={r - strokeW} fill="var(--bg-secondary)" />
              </svg>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem', minWidth: '120px' }}>
                {processPieSegments.slice(0, 4).map((segment, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', background: segment.color, borderRadius: '50%', marginRight: '0.4rem' }}></span>
                    <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{segment.processName}</span>
                    <span style={{ fontWeight: 700, marginLeft: '0.5rem' }}>{segment.shareRate.toFixed(0)}%</span>
                  </div>
                ))}
                {processPieSegments.length > 4 && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', paddingLeft: '0.9rem' }}>
                    외 {processPieSegments.length - 4}개 공정 더 있음
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ─── 미수금 긴급 알림 및 연체 보드 ───────────────────── */}
      <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} />
          미수금 긴급 관리 보드
        </h3>
        {stats.urgentARs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            미수금이 발생한 현장이 없습니다! 전사 채권 회수 완료 상태입니다 🎉
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {stats.urgentARs.slice(0, 4).map((ar) => (
                <div key={ar.projectId} className="glass-panel" style={{ flex: 1, minWidth: '220px', padding: '1rem', borderLeft: '4px solid #ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{ar.projectName}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>긴급 채권 회수 요망</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '1rem' }}>
                      ₩ {ar.balance.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {stats.urgentARs.length > 4 && (
              <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                이외 {stats.urgentARs.length - 4}개 현장의 채권 미수금이 남아 있습니다. 정산 장부 페이지에서 상세 내역을 수금 처리할 수 있습니다.
              </div>
            )}
          </div>
        )}
      </div>

    </MainLayout>
  );
}
