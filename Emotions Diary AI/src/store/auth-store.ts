import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from '@devvai/devv-code-backend';

interface User {
  projectId: string;
  uid: string;
  name: string;
  email: string;
  createdTime: number;
  lastLoginTime: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, code: string) => Promise<User>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      sendOTP: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await auth.sendOTP(email);
          set({ isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to send verification code';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      verifyOTP: async (email: string, code: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await auth.verifyOTP(email, code);
          set({ 
            user: response.user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null
          });
          return response.user;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Invalid verification code';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await auth.logout();
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.error('Logout error:', error);
          // Even if logout fails, clear local state
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);