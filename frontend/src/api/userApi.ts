import axios from 'axios';

const API_BASE_URL = '/api';

export interface UserResponse {
  userId: number;
  username: string;
  loginId: string;
  role: string;
}

export interface LoginResponse {
  user: UserResponse;
  bootId: string;
  loginTimestamp: number;
  expiresIn: number;
}

export interface UserCreateRequest {
  username: string;
  loginId: string;
  password: string;
  role: string;
}

export interface UserUpdateRequest {
  username: string;
  password: string;
  role: string;
}

export const fetchAllUsers = async (): Promise<UserResponse[]> => {
  const response = await axios.get<UserResponse[]>(`${API_BASE_URL}/users`);
  return response.data;
};

export const createUser = async (request: UserCreateRequest): Promise<UserResponse> => {
  const response = await axios.post<UserResponse>(`${API_BASE_URL}/users`, request);
  return response.data;
};

export const updateUser = async (userId: number, request: UserUpdateRequest): Promise<UserResponse> => {
  const response = await axios.put<UserResponse>(`${API_BASE_URL}/users/${userId}`, request);
  return response.data;
};

export const deleteUser = async (userId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/users/${userId}`);
};

export const loginUser = async (loginId: string, password: string): Promise<LoginResponse> => {
  const response = await axios.post<any>(`${API_BASE_URL}/users/login`, { loginId, password });
  if (response.data && response.data.user) {
    return response.data;
  }
  // 하위 호환성 예외 처리
  return {
    user: response.data,
    bootId: 'legacy',
    loginTimestamp: Date.now(),
    expiresIn: 8 * 60 * 60 * 1000
  };
};

export const checkServerSessionApi = async (): Promise<{ bootId: string; serverTime: number; sessionTimeoutMs: number }> => {
  const response = await axios.get<{ bootId: string; serverTime: number; sessionTimeoutMs: number }>(`${API_BASE_URL}/users/session-check`);
  return response.data;
};
