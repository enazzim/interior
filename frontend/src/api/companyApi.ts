import axios from 'axios';

const API_BASE_URL = '/api';

export interface CompanyResponse {
  companyId: number;
  companyName: string;
  businessNumber: string;
  address?: string;
  subscriptionPlan: string;
  businessType?: string;
  businessItem?: string;
  tel?: string;
  fax?: string;
  ceoName?: string;
}

export interface CompanyUpdateRequest {
  companyName: string;
  businessNumber: string;
  address?: string;
  subscriptionPlan: string;
  businessType?: string;
  businessItem?: string;
  tel?: string;
  fax?: string;
  ceoName?: string;
}

export const fetchCompany = async (companyId: number): Promise<CompanyResponse> => {
  const response = await axios.get<CompanyResponse>(`${API_BASE_URL}/companies/${companyId}`);
  return response.data;
};

export const updateCompany = async (companyId: number, request: CompanyUpdateRequest): Promise<CompanyResponse> => {
  const response = await axios.put<CompanyResponse>(`${API_BASE_URL}/companies/${companyId}`, request);
  return response.data;
};
