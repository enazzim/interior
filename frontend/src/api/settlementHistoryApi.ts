import axios from 'axios';

export interface ProjectSettlementSummary {
  projectId: number;
  projectName: string;
  clientName: string;
  status: string; // '견적중' | '수주' | '공사중' | '완료'
  totalAmount: number;
  collectedAmount?: number;
  discountAmount?: number;
  expenseAmount: number;
  plannedExpense?: number;
  netProfit: number;
  completionDate: string;
}

export interface SettlementHistoryResponse {
  year: number;
  availableYears?: number[];
  totalProjects: number;
  totalRevenue: number;
  estimatedRevenue?: number;
  totalExpense: number;
  plannedExpense?: number;
  netProfit: number;
  profitMargin: number;
  items: ProjectSettlementSummary[];
}

export async function fetchSettlementHistory(year: number = 2026, keyword: string = ''): Promise<SettlementHistoryResponse> {
  try {
    const res = await axios.get<SettlementHistoryResponse>('/api/settlements/history', {
      params: { year, keyword }
    });
    if (res.data && Array.isArray(res.data.items)) {
      return res.data;
    }
  } catch (error) {
    console.error('백엔드 DB 정산 이력 조회 실패:', error);
  }

  // DB에 데이터가 없거나 예외 발생 시 하드코딩 없이 100% 빈 결과 반환
  return {
    year,
    totalProjects: 0,
    totalRevenue: 0,
    totalExpense: 0,
    netProfit: 0,
    profitMargin: 0.0,
    items: [],
  };
}
