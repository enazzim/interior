import axios from 'axios';

const API_BASE_URL = '/api';

export interface ProcessResponse {
  processId: number;
  processName: string;
  sortOrder: number;
}

export interface MaterialResponse {
  materialId: number;
  materialName: string;
  standardUnit: string;
  distributionUnit: string;
  conversionRate: number;
  purchasePrice: number;
  laborPrice: number;
  process: ProcessResponse;
  specification?: string;
  itemType?: 'MATERIAL' | 'LABOR';
}

export interface MaterialCreateRequest {
  materialName: string;
  standardUnit: string;
  distributionUnit: string;
  conversionRate: number;
  purchasePrice: number;
  laborPrice: number;
  processId: number;
  specification?: string;
  itemType?: 'MATERIAL' | 'LABOR';
}

export interface MaterialUpdateRequest {
  materialName: string;
  standardUnit: string;
  distributionUnit: string;
  conversionRate: number;
  purchasePrice: number;
  laborPrice: number;
  processId: number;
  specification?: string;
  itemType?: 'MATERIAL' | 'LABOR';
}

export const fetchMaterials = async (): Promise<MaterialResponse[]> => {
  try {
    const response = await axios.get<MaterialResponse[]>(`${API_BASE_URL}/materials`);
    return response.data;
  } catch (error) {
    console.error('자재 목록 조회 실패:', error);
    throw error;
  }
};

export const createMaterial = async (request: MaterialCreateRequest): Promise<MaterialResponse> => {
  try {
    const response = await axios.post<MaterialResponse>(`${API_BASE_URL}/materials`, request);
    return response.data;
  } catch (error) {
    console.error('자재 등록 실패:', error);
    throw error;
  }
};

export const updateMaterial = async (materialId: number, request: MaterialUpdateRequest): Promise<MaterialResponse> => {
  try {
    const response = await axios.put<MaterialResponse>(`${API_BASE_URL}/materials/${materialId}`, request);
    return response.data;
  } catch (error) {
    console.error('자재 수정 실패:', error);
    throw error;
  }
};

export const deleteMaterial = async (materialId: number): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/materials/${materialId}`);
  } catch (error) {
    console.error('자재 삭제 실패:', error);
    throw error;
  }
};
