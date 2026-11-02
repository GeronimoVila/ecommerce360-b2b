import { apiClient } from './apiClient';

export interface CreateSellerPayload {
  first_name: string;
  last_name: string;
  email: string;
  cbu_alias?: string;
}

export interface UpdateUserPayload {
  email?: string;
  first_name?: string;
  last_name?: string;
  cbu_alias?: string;
  is_active?: boolean;
}

export const UserService = {
  getMe: async () => {
    const response = await apiClient.get('users/me');
    return response.data;
  },
  
  getSellers: async () => {
    const response = await apiClient.get('users/sellers');
    return response.data.data;
  },

  createSeller: async (data: any) => {
    const response = await apiClient.post('users/seller', data);
    return response.data;
  },

  updateUser: async (id: string, data: any) => {
    const response = await apiClient.patch(`users/${id}`, data);
    return response.data;
  },

  deactivateUser: async (id: string) => {
    const response = await apiClient.delete(`users/${id}`);
    return response.data;
  },

  updateMe: async (data: { cbu_alias?: string }) => {
    const response = await apiClient.patch('users/me', data);
    return response.data;
  },

  changePassword: async (data: any) => {
    const response = await apiClient.post('users/me/password', data);
    return response.data;
  }
};