import { useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { fetchDashboardStats } from '../api/dashboardApi';
import type { DashboardStatsResponse } from '../api/dashboardApi';
import { fetchProjects } from '../api/projectApi';
import type { ProjectResponse } from '../api/projectApi';
import { TrendingUp, TrendingDown, DollarSign, Briefcase, Activity, Percent, Trophy, Clock, Users, Search, FilterX } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Analytics() {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [projectId, setProjectId] = useState<number | ''>('');
  
  // Custom Dropdown State
  const [projectSearch, setProjectSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter projects by search text
  const filteredProjects = projects.filter(p => p.projectName.toLowerCase().includes(projectSearch.toLowerCase()));

  useEffect(() => {
    loadProjects();
    loadStats();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await fetchDashboardStats(
        startDate || undefined,
        endDate || undefined,
        projectId !== '' ? projectId : undefined
      );
      setStats(data);
    } catch (err) {
      console.error('경영 지표 통계 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadStats();
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setProjectId('');
    setProjectSearch('');
  };

  if (loading && !stats) {
    return (
      <MainLayout>
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          상세 경영 데이터를 분석 중입니다...
        </div>
      </MainLayout>
    );
  }

  if (!stats) {
    return (
      <MainLayout>
        <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>
          데이터를 로드하지 못했습니다. 서버 상태를 확인해주세요.
        </div>
      </MainLayout>
    );
  }

  const formatCurrency = (value: number) => `₩ ${value.toLocaleString()}`;
  const pieColors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6b7280'];

  return (
    <MainLayout>
      <header className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>상세 경영 지표 (Analytics)</h1>
          <p className="text-muted" style={{ fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>원하는 기간 및 현장별 상세 통계를 분석합니다.</p>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', position: 'relative', zIndex: 50 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>시작일</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '140px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>종료일</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '140px' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>현장 검색 및 선택</label>
            <input
              type="text"
              value={projectSearch}
              onChange={e => {
                setProjectSearch(e.target.value);
                setProjectId(''); // Clear selection when typing
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // delay for click event
              placeholder="검색할 현장명 입력 (비우면 전체)"
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
            {showDropdown && (
              <ul style={{ 
                position: 'absolute', top: '100%', left: 0, right: 0, 
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', 
                borderRadius: '6px', zIndex: 9999, maxHeight: '200px', overflowY: 'auto', 
                listStyle: 'none', padding: 0, margin: '4px 0 0 0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}>
                <li 
                  onClick={() => { setProjectId(''); setProjectSearch(''); setShowDropdown(false); }}
                  style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}
                >
                  전체 현장
                </li>
                {filteredProjects.map(p => (
                  <li 
                    key={p.projectId}
                    onClick={() => { setProjectId(p.projectId); setProjectSearch(p.projectName); setShowDropdown(false); }}
                    style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {p.projectName}
                  </li>
                ))}
                {filteredProjects.length === 0 && (
                  <li style={{ padding: '0.5rem 1rem', color: 'var(--text-secondary)' }}>검색 결과가 없습니다.</li>
                )}
              </ul>
            )}
          </div>
          <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 1rem' }}>
            <Search size={16} /> 조회
          </button>
          <button type="button" onClick={resetFilters} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <FilterX size={16} /> 초기화
          </button>
        </form>
      </div>

      {loading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          데이터 업데이트 중...
        </div>
      )}

      <div style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        {/* KPI Cards */}
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          
          <div className="glass-panel text-card" style={{ flex: 1, minWidth: '220px', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>수금액 (실수입)</span>
              <TrendingUp size={18} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              ₩ {stats.totalIncome.toLocaleString()}
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '40px', height: '40px', background: '#10b98110', borderRadius: '50% 0 0 0' }}></div>
          </div>

          <div className="glass-panel text-card" style={{ flex: 1, minWidth: '220px', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>집행 비용 (지출)</span>
              <TrendingDown size={18} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              ₩ {stats.totalExpense.toLocaleString()}
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '40px', height: '40px', background: '#ef444410', borderRadius: '50% 0 0 0' }}></div>
          </div>

          <div className="glass-panel text-card" style={{ flex: 1, minWidth: '220px', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-color)', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>마진액 (순수익)</span>
              <DollarSign size={18} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              ₩ {stats.totalMargin.toLocaleString()}
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '40px', height: '40px', background: 'var(--accent-color)10', borderRadius: '50% 0 0 0' }}></div>
          </div>

          <div className="glass-panel text-card" style={{ flex: 1, minWidth: '220px', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>평균 마진율</span>
              <Percent size={18} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stats.averageMarginRate >= 0 ? '#3b82f6' : '#ef4444' }}>
              {stats.averageMarginRate.toFixed(1)} %
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '40px', height: '40px', background: '#f59e0b10', borderRadius: '50% 0 0 0' }}></div>
          </div>
        </div>

        {/* 4 Core Charts Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          
          {/* 1. Monthly Trends */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} style={{ color: 'var(--accent-color)' }} />
              최근 6개월 누적 금융 추이
            </h3>
            <div style={{ width: '100%', height: 300 }}>
              {stats.monthlyTrends.length > 0 ? (
                <ResponsiveContainer>
                  <AreaChart data={stats.monthlyTrends} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tickFormatter={(val: string) => val.substring(5) + '월'} style={{ fontSize: '0.75rem' }} />
                    <YAxis tickFormatter={(val: number) => (val / 10000).toFixed(0) + '만'} style={{ fontSize: '0.75rem' }} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                    <Legend />
                    <Area type="monotone" dataKey="income" name="수금액" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="expense" name="비용지출" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>데이터가 없습니다.</div>
              )}
            </div>
          </div>

          {/* 2. Margin Ranking */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trophy size={16} style={{ color: '#f59e0b' }} />
              진짜 마진율 현장 랭킹 (Top 5)
            </h3>
            <div style={{ width: '100%', height: 300 }}>
              {stats.topMargins?.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={stats.topMargins} layout="vertical" margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                    <XAxis type="number" tickFormatter={(val: number) => val + '%'} style={{ fontSize: '0.75rem' }} />
                    <YAxis dataKey="projectName" type="category" width={100} style={{ fontSize: '0.75rem' }} />
                    <Tooltip formatter={(value: any) => Number(value).toFixed(1) + '%'} />
                    <Bar dataKey="marginRate" name="순이익(마진율)" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>데이터가 없습니다.</div>
              )}
            </div>
          </div>

          {/* 3. AR Aging */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} style={{ color: '#ef4444' }} />
              미수금 연령(Aging) 분석
            </h3>
            <div style={{ width: '100%', height: 300 }}>
              {stats.agingARs?.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={stats.agingARs} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="agingGroup" style={{ fontSize: '0.75rem' }} />
                    <YAxis tickFormatter={(val: number) => (val / 10000).toFixed(0) + '만'} style={{ fontSize: '0.75rem' }} />
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                    <Bar dataKey="amount" name="미수금액" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>미수금이 없습니다.</div>
              )}
            </div>
          </div>

          {/* 4. Top Vendors */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} style={{ color: '#3b82f6' }} />
              거래처별 매입 지출 랭킹 (Top 5)
            </h3>
            <div style={{ width: '100%', height: 300 }}>
              {stats.topVendors?.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={stats.topVendors} layout="vertical" margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                    <XAxis type="number" tickFormatter={(val: number) => (val / 10000).toFixed(0) + '만'} style={{ fontSize: '0.75rem' }} />
                    <YAxis dataKey="vendorName" type="category" width={100} style={{ fontSize: '0.75rem' }} />
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                    <Bar dataKey="amount" name="매입액" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>데이터가 없습니다.</div>
              )}
            </div>
          </div>

          {/* 5. Process Share (Pie) */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={16} style={{ color: '#8b5cf6' }} />
              공정별 집행 비용 비중
            </h3>
            <div style={{ width: '100%', height: 300 }}>
              {stats.processShares?.length > 0 ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={stats.processShares}
                      dataKey="amount"
                      nameKey="processName"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {stats.processShares.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>데이터가 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
