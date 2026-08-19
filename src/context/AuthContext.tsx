import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email?: string, password?: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sentinel_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Default initial user: Sarah Vance (ADMIN)
    return {
      id: 'usr-admin-01',
      name: 'Sarah Vance',
      email: 'admin@sentinel.ai',
      role: 'ADMIN',
      department: 'Global Security Operations',
      lastLogin: new Date().toISOString(),
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    };
  });

  const [isLoading, setIsLoading] = useState(false);

  const login = async (email?: string, password?: string, requestedRole?: UserRole) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password, role: requestedRole });
      setUser(res.user);
      localStorage.setItem('sentinel_user', JSON.stringify(res.user));
    } catch (err) {
      console.error('Login error:', err);
      // Fallback
      const fallbackUser: User = {
        id: `usr-${Date.now()}`,
        name: email ? email.split('@')[0].toUpperCase() : 'Security Analyst',
        email: email || 'analyst@sentinel.ai',
        role: requestedRole || 'ANALYST',
        department: 'Security Operations Center',
        lastLogin: new Date().toISOString(),
      };
      setUser(fallbackUser);
      localStorage.setItem('sentinel_user', JSON.stringify(fallbackUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sentinel_user');
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const names: Record<UserRole, string> = {
      ADMIN: 'Sarah Vance (Admin)',
      ANALYST: 'Marcus Thorne (Analyst)',
      VIEWER: 'Elena Rostova (Viewer)',
    };
    const emails: Record<UserRole, string> = {
      ADMIN: 'admin@sentinel.ai',
      ANALYST: 'analyst@sentinel.ai',
      VIEWER: 'viewer@sentinel.ai',
    };
    const updated: User = {
      ...user,
      role: newRole,
      name: names[newRole],
      email: emails[newRole],
    };
    setUser(updated);
    localStorage.setItem('sentinel_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'VIEWER',
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
