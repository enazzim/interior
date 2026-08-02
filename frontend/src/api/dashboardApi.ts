import axios from 'axios';

const API_BASE_URL = '/api';

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
}

export interface ProcessShare {
  processName: string;
  amount: number;
  shareRate: number;
}

export interface UrgentAR {
  projectId: number;
  projectName: string;
  balance: number;
}

export interface MarginRanking {
  projectId: number;
  projectName: string;
  marginAmount: number;
  marginRate: number;
}

export interface AgingAR {
  agingGroup: string;
  amount: number;
}

export interface VendorSpend {
  vendorName: string;
  amount: number;
  shareRate: number;
}

export interface DashboardStatsResponse {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
  totalIncome: number;
  totalExpense: number;
  totalMargin: number;
  averageMarginRate: number;
  monthlyTrends: MonthlyTrend[];
  processShares: ProcessShare[];
  urgentARs: UrgentAR[];
  topMargins: MarginRanking[];
  agingARs: AgingAR[];
  topVendors: VendorSpend[];
}

export const fetchDashboardStats = async (
  startDate?: string,
  endDate?: string,
  projectId?: number
): Promise<DashboardStatsResponse> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (projectId) params.append('projectId', projectId.toString());
  
  const response = await axios.get<DashboardStatsResponse>(`${API_BASE_URL}/dashboard/stats?${params.toString()}`);
  return response.data;
};
