import axios from 'axios';

const API_BASE_URL = '/api';

export interface ProjectResponse {
  projectId: number;
  projectName: string;
  address?: string;
  status: string; // '견적중', '수주', '공사중', '완료'
  createdAt: string;
  clientVendorId?: number;
  clientVendorName?: string;
}

export const fetchProjects = async (): Promise<ProjectResponse[]> => {
  try {
    const response = await axios.get<ProjectResponse[]>(`${API_BASE_URL}/projects`);
    return response.data;
  } catch (error) {
    console.error('현장 목록 조회 실패:', error);
    throw error;
  }
};

export const createProject = async (projectName: string, address: string, clientVendorId?: number): Promise<ProjectResponse> => {
  try {
    const response = await axios.post<ProjectResponse>(`${API_BASE_URL}/projects`, { projectName, address, clientVendorId });
    return response.data;
  } catch (error) {
    console.error('현장 생성 실패:', error);
    throw error;
  }
};

export const getProject = async (projectId: number): Promise<ProjectResponse> => {
  try {
    const response = await axios.get<ProjectResponse>(`${API_BASE_URL}/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('현장 상세 조회 실패:', error);
    throw error;
  }
};

export const updateProject = async (projectId: number, projectName: string, address: string, clientVendorId?: number): Promise<ProjectResponse> => {
  try {
    const response = await axios.put<ProjectResponse>(`${API_BASE_URL}/projects/${projectId}`, { projectName, address, clientVendorId });
    return response.data;
  } catch (error) {
    console.error('현장 수정 실패:', error);
    throw error;
  }
};

export const deleteProject = async (projectId: number): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/projects/${projectId}`);
  } catch (error) {
    console.error('현장 삭제 실패:', error);
    throw error;
  }
};

export const updateProjectStatus = async (projectId: number, status: string): Promise<ProjectResponse> => {
  try {
    const response = await axios.patch<ProjectResponse>(`${API_BASE_URL}/projects/${projectId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('현장 상태 변경 실패:', error);
    throw error;
  }
};
