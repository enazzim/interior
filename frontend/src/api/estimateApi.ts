import axios from 'axios';

// 백엔드 API 기본 주소 설정 (Spring Boot 기본 포트 8080)
const API_BASE_URL = '/api';

// Request DTO (백엔드 구조와 동일하게 맞춤)
export interface EstimateItemRequest {
  materialId: number;
  inputArea: number; // 입력된 ㎡
}

export interface EstimateCreateRequest {
  projectId: number;
  clientVendorId: number;
  authorUserId: number;
  marginRate?: number; // 사용자가 직접 설정한 마진율
  items: EstimateItemRequest[];
}

// Response DTO
export interface EstimateItemResponse {
  itemId: number;
  materialId: number;
  materialName: string;
  inputArea: number;
  calculatedQty: number; // 발주 수량
  materialCost: number;  // 원가
  laborCost: number;     // 인건비
  customerUnitPrice: number; // 청구 단가
  itemType?: string;
  distributionUnit?: string;
  specification?: string;
}

export interface EstimateResponse {
  estimateId: number;
  projectId: number;
  projectName: string;
  clientVendorId?: number;
  clientVendorName?: string;
  totalAmount: number;
  marginRate?: number; // 적용된 마진율
  isFinal?: boolean;
  createdAt: string;
  items: EstimateItemResponse[];
}

// 스마트 견적 생성 API 호출 함수
export const createEstimate = async (requestData: EstimateCreateRequest): Promise<EstimateResponse> => {
  try {
    const response = await axios.post<EstimateResponse>(`${API_BASE_URL}/estimates`, requestData);
    return response.data;
  } catch (error) {
    console.error('스마트 견적 요청 실패:', error);
    throw error;
  }
};

// 현장별 견적서 목록 조회
export const fetchProjectEstimates = async (projectId: number): Promise<EstimateResponse[]> => {
  try {
    const response = await axios.get<EstimateResponse[]>(`${API_BASE_URL}/estimates/project/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('현장별 견적 목록 조회 실패:', error);
    throw error;
  }
};

// 단건 견적서 조회 (기존 견적 기반 새 버전 생성용)
export const fetchEstimateById = async (estimateId: number): Promise<EstimateResponse> => {
  try {
    const response = await axios.get<EstimateResponse>(`${API_BASE_URL}/estimates/${estimateId}`);
    return response.data;
  } catch (error) {
    console.error('견적서 단건 조회 실패:', error);
    throw error;
  }
};

