import axios from 'axios';

const API_BASE_URL = '/api';

export interface ExpenseResponse {
  expenseId: number;
  projectId: number;
  processId?: number;
  processName?: string;
  vendorId: number;
  vendorName: string;
  amount: number;
  expenseDate: string;
}

export interface ExpenseCreateRequest {
  projectId: number;
  processId?: number;
  vendorId: number;
  amount: number;
  expenseDate: string;
}

export interface IncomeResponse {
  incomeId: number;
  projectId: number;
  amount: number;
  discount?: number;
  incomeDate: string;
  type: string;
}

export interface BulkIncomeRequest {
  clientVendorId: number;
  amount: number;
  discount: number;
  incomeDate: string;
  type: string;
}

export interface IncomeCreateRequest {
  projectId: number;
  amount: number;
  discount?: number;
  incomeDate: string;
  type: string;
}

export interface VendorResponse {
  vendorId: number;
  vendorName: string;
  vendorType: string; // CLIENT, SUPPLIER, SUBCONTRACTOR
}

export interface ProcessResponse {
  processId: number;
  processName: string;
}

export const fetchProjectExpenses = async (projectId: number): Promise<ExpenseResponse[]> => {
  try {
    const response = await axios.get<ExpenseResponse[]>(`${API_BASE_URL}/expenses/project/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('지출 목록 조회 실패:', error);
    throw error;
  }
};

export const createExpense = async (request: ExpenseCreateRequest): Promise<ExpenseResponse> => {
  try {
    const response = await axios.post<ExpenseResponse>(`${API_BASE_URL}/expenses`, request);
    return response.data;
  } catch (error) {
    console.error('지출 등록 실패:', error);
    throw error;
  }
};

export const deleteExpense = async (expenseId: number): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/expenses/${expenseId}`);
  } catch (error) {
    console.error('지출 삭제 실패:', error);
    throw error;
  }
};

export const fetchProjectIncomes = async (projectId: number): Promise<IncomeResponse[]> => {
  try {
    const response = await axios.get<IncomeResponse[]>(`${API_BASE_URL}/incomes/project/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('수입 목록 조회 실패:', error);
    throw error;
  }
};

export const createIncome = async (request: IncomeCreateRequest): Promise<IncomeResponse> => {
  try {
    const response = await axios.post<IncomeResponse>(`${API_BASE_URL}/incomes`, request);
    return response.data;
  } catch (error) {
    console.error('수입 등록 실패:', error);
    throw error;
  }
};

export const deleteIncome = async (incomeId: number): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/incomes/${incomeId}`);
  } catch (error) {
    console.error('수입 삭제 실패:', error);
    throw error;
  }
};

export const bulkCollectIncomes = async (request: BulkIncomeRequest): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/incomes/bulk`, request);
  } catch (error) {
    console.error('일괄 수금 실패:', error);
    throw error;
  }
};

export const fetchVendors = async (): Promise<VendorResponse[]> => {
  try {
    const response = await axios.get<VendorResponse[]>(`${API_BASE_URL}/vendors`);
    return response.data;
  } catch (error) {
    console.error('거래처 목록 조회 실패:', error);
    throw error;
  }
};

export const fetchProcesses = async (): Promise<ProcessResponse[]> => {
  try {
    const response = await axios.get<ProcessResponse[]>(`${API_BASE_URL}/processes`);
    return response.data;
  } catch (error) {
    console.error('공정 목록 조회 실패:', error);
    throw error;
  }
};

// ─── 거래처 CRUD ───────────────────────────────────────────────

export interface VendorCreateRequest {
  vendorName: string;
  vendorType: string;
  businessType: string;
  businessNumber?: string;
  address?: string;
  contactPerson?: string;
  accountInfo?: string;
}

export const createVendor = async (request: VendorCreateRequest): Promise<VendorResponse> => {
  const response = await axios.post<VendorResponse>(`${API_BASE_URL}/vendors`, request);
  return response.data;
};

export const updateVendor = async (vendorId: number, request: VendorCreateRequest): Promise<VendorResponse> => {
  const response = await axios.put<VendorResponse>(`${API_BASE_URL}/vendors/${vendorId}`, request);
  return response.data;
};

export const deleteVendor = async (vendorId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/vendors/${vendorId}`);
};

// ─── 공정 CRUD ────────────────────────────────────────────────

export interface ProcessCreateRequest {
  processName: string;
  sortOrder?: number;
}

export const createProcess = async (request: ProcessCreateRequest): Promise<ProcessResponse> => {
  const response = await axios.post<ProcessResponse>(`${API_BASE_URL}/processes`, request);
  return response.data;
};

export const updateProcess = async (processId: number, request: ProcessCreateRequest): Promise<ProcessResponse> => {
  const response = await axios.put<ProcessResponse>(`${API_BASE_URL}/processes/${processId}`, request);
  return response.data;
};

export const deleteProcess = async (processId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/processes/${processId}`);
};

