export interface ProjectSettlementSummary {
  projectId: number;
  projectName: string;
  clientName: string;
  status: string; // '견적중' | '수주' | '공사중' | '완료'
  totalAmount: number;
  expenseAmount: number;
  netProfit: number;
  completionDate: string;
}

export interface SettlementHistoryResponse {
  year: number;
  totalProjects: number;
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  profitMargin: number;
  items: ProjectSettlementSummary[];
}

const MOCK_BY_YEAR: Record<number, SettlementHistoryResponse> = {
  2026: {
    year: 2026,
    totalProjects: 5,
    totalRevenue: 138000000,
    totalExpense: 98000000,
    netProfit: 40000000,
    profitMargin: 29.0,
    items: [
      {
        projectId: 1,
        projectName: '반포 자이 아파트 인테리어',
        clientName: '김철수 고객님',
        status: '견적중',
        totalAmount: 35000000,
        expenseAmount: 25000000,
        netProfit: 10000000,
        completionDate: '2026-06-15',
      },
      {
        projectId: 2,
        projectName: '강남 래미안 거실 타일 시공',
        clientName: '이영희 고객님',
        status: '수주',
        totalAmount: 28000000,
        expenseAmount: 20000000,
        netProfit: 8000000,
        completionDate: '2026-05-20',
      },
      {
        projectId: 3,
        projectName: '역삼동 단독주택 올수리',
        clientName: '박민수 고객님',
        status: '공사중',
        totalAmount: 53000000,
        expenseAmount: 37000000,
        netProfit: 16000000,
        completionDate: '2026-04-10',
      },
      {
        projectId: 4,
        projectName: '분당 정자동 상가 도배',
        clientName: '정성훈 거래처',
        status: '완료',
        totalAmount: 22000000,
        expenseAmount: 16000000,
        netProfit: 6000000,
        completionDate: '2026-01-10',
      },
    ],
  },
  2025: {
    year: 2025,
    totalProjects: 4,
    totalRevenue: 142000000,
    totalExpense: 102000000,
    netProfit: 40000000,
    profitMargin: 28.2,
    items: [
      {
        projectId: 10,
        projectName: '분당 파크뷰 50평 고급 턴키 인테리어',
        clientName: '최진우 고객',
        status: '완료',
        totalAmount: 62000000,
        expenseAmount: 44000000,
        netProfit: 18000000,
        completionDate: '2025-11-28',
      },
      {
        projectId: 11,
        projectName: '판교 봇들마을 33평 전체 타일 & 샷시 교체',
        clientName: '한소희 고객',
        status: '완료',
        totalAmount: 38000000,
        expenseAmount: 27000000,
        netProfit: 11000000,
        completionDate: '2025-08-14',
      },
      {
        projectId: 12,
        projectName: '용인 수지 성복동 45평 주방 리모델링',
        clientName: '정명훈 고객',
        status: '완료',
        totalAmount: 27000000,
        expenseAmount: 19000000,
        netProfit: 8000000,
        completionDate: '2025-04-20',
      },
      {
        projectId: 13,
        projectName: '송파 위례 24평 소형 아파트 신혼집 인테리어',
        clientName: '강유진 고객',
        status: '완료',
        totalAmount: 15000000,
        expenseAmount: 12000000,
        netProfit: 3000000,
        completionDate: '2025-02-10',
      },
    ],
  },
  2024: {
    year: 2024,
    totalProjects: 3,
    totalRevenue: 98000000,
    totalExpense: 71000000,
    netProfit: 27000000,
    profitMargin: 27.5,
    items: [
      {
        projectId: 20,
        projectName: '마포 메세나폴리스 59평 올수리',
        clientName: '오성택 고객',
        status: '완료',
        totalAmount: 48000000,
        expenseAmount: 35000000,
        netProfit: 13000000,
        completionDate: '2024-10-15',
      },
      {
        projectId: 21,
        projectName: '성수 트리마제 드레스룸 특화 공사',
        clientName: '임수진 고객',
        status: '완료',
        totalAmount: 30000000,
        expenseAmount: 21000000,
        netProfit: 9000000,
        completionDate: '2024-06-30',
      },
      {
        projectId: 22,
        projectName: '영등포 푸르지오 욕실 2개개소 전면 교체',
        clientName: '윤도현 고객',
        status: '완료',
        totalAmount: 20000000,
        expenseAmount: 15000000,
        netProfit: 5000000,
        completionDate: '2024-03-12',
      },
    ],
  },
};

export async function fetchSettlementHistory(year: number = 2026, keyword: string = ''): Promise<SettlementHistoryResponse> {
  const baseData = MOCK_BY_YEAR[year] || MOCK_BY_YEAR[2026];

  let filteredItems = baseData.items;
  if (keyword.trim()) {
    const kw = keyword.toLowerCase();
    filteredItems = filteredItems.filter(item =>
      item.projectName.toLowerCase().includes(kw) ||
      item.clientName.toLowerCase().includes(kw)
    );
  }

  const totalRev = filteredItems.reduce((acc, item) => acc + item.totalAmount, 0);
  const totalExp = filteredItems.reduce((acc, item) => acc + item.expenseAmount, 0);
  const netProf = totalRev - totalExp;
  const margin = totalRev > 0 ? Number(((netProf / totalRev) * 100).toFixed(1)) : 0;

  return {
    year,
    totalProjects: filteredItems.length,
    totalRevenue: totalRev,
    totalExpense: totalExp,
    netProfit: netProf,
    profitMargin: margin,
    items: filteredItems,
  };
}
