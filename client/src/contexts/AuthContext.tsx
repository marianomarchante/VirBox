import { createContext, useContext, ReactNode } from 'react';
import { useAuth, type User } from '@/hooks/use-auth';

interface AuthContextType {
  user: User | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
