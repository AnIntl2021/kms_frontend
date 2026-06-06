import { create } from 'zustand';

interface Admin {
  admin_id: number;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
  permissions?: string[];
}

interface AuthState {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (admin: Admin, token: string) => void;
  logout: () => void;
}

const getStoredAdmin = (): Admin | null => {
  const admin = localStorage.getItem('admin');
  return admin ? JSON.parse(admin) : null;
};

export const useAuthStore = create<AuthState>((set) => ({
  admin: getStoredAdmin(),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  login: (admin, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('admin', JSON.stringify(admin));
    set({ admin, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    set({ admin: null, token: null, isAuthenticated: false });
  },
}));
