import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authLogin, authRegister } from '../api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('grove_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('grove_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && user) {
      localStorage.setItem('grove_token', token);
      localStorage.setItem('grove_user', JSON.stringify(user));
    }
  }, [token, user]);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await authLogin({ username, password });
      const payload = parseJwt(res.token);
      const userData: User = {
        id: payload.sub || payload.userId || '',
        username: payload.username || username,
        email: payload.email || '',
        role: payload.role || 'ROLE_USER',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('grove_token', res.token);
      localStorage.setItem('grove_user', JSON.stringify(userData));
      setToken(res.token);
      setUser(userData);
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    try {
      await authRegister({ username, email, password });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('grove_token');
    localStorage.removeItem('grove_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

function parseJwt(token: string): Record<string, string> {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return {};
  }
}
