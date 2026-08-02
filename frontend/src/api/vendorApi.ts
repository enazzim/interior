import axios from 'axios';

const API_BASE_URL = '/api';

export interface VendorResponse {
  vendorId: number;
  vendorName: string;
  vendorType: string; // CLIENT, SUPPLIER, SUBCONTRACTOR
  businessType: string;
  businessNumber?: string;
  address?: string;
  contactPerson?: string;
  accountInfo?: string;
}

export const fetchAllVendors = async (): Promise<VendorResponse[]> => {
  const response = await axios.get<VendorResponse[]>(`${API_BASE_URL}/vendors`);
  return response.data;
};
