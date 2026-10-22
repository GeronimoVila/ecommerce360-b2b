import { create } from 'zustand';
import { apiClient } from '../services/apiClient';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'SELLER';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  login: (userData: User) => void;
  logout: () => void;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isCheckingAuth: true,

  login: (userData) => set({ user: userData, isAuthenticated: true }),
  
  logout: () => set({ user: null, isAuthenticated: false }),
  
  checkSession: async () => {
    try {
      const response = await apiClient.get('auth/me');
      set({ user: response.data.user, isAuthenticated: true, isCheckingAuth: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isCheckingAuth: false });
    }
  },
}));