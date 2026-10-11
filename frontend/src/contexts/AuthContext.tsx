import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { DEMO_USERS } from '../data/mockData';

interface AuthContextType {
  currentUser: User;
  role: UserRole;
  token: string | null;
  isAuthenticated: boolean;
  switchRole: (role: UserRole) => void;
  login: (email: string, role?: UserRole, password?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('certichain_role');
    if (saved && ['admin', 'university_admin', 'student', 'authority', 'verifier', 'validator'].includes(saved)) {
      return saved as UserRole;
    }
    return 'admin';
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('certichain_token');
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedUser = localStorage.getItem('certichain_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        // Fallback
      }
    }
    return DEMO_USERS[role] || DEMO_USERS.admin;
  });

  useEffect(() => {
    localStorage.setItem('certichain_role', role);
  }, [role]);

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    const demo = DEMO_USERS[newRole] || DEMO_USERS.admin;
    setCurrentUser(demo);
    localStorage.setItem('certichain_user', JSON.stringify(demo));
  };

  const login = async (email: string, targetRole?: UserRole, password?: string): Promise<boolean> => {
    const roleCandidate = targetRole || role;
    
    // Attempt backend API login if password provided
    if (password) {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.token && data.user) {
            setToken(data.token);
            localStorage.setItem('certichain_token', data.token);
            
            const userObj: User = {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
              title: data.user.title,
              institution: data.user.institution,
              studentId: data.user.studentId,
              avatar: data.user.avatar || DEMO_USERS[data.user.role as UserRole]?.avatar,
            };

            setCurrentUser(userObj);
            setRole(data.user.role);
            localStorage.setItem('certichain_user', JSON.stringify(userObj));
            return true;
          }
        }
      } catch {
        // Backend not reachable; gracefully fall back to local demo auth below
      }
    }

    // Local Demo fallback
    const template = DEMO_USERS[roleCandidate] || DEMO_USERS.admin;
    const userObj: User = {
      ...template,
      email: email || template.email,
      role: roleCandidate,
    };
    setCurrentUser(userObj);
    setRole(roleCandidate);
    localStorage.setItem('certichain_user', JSON.stringify(userObj));
    return true;
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('certichain_token');
    localStorage.removeItem('certichain_user');
    setRole('verifier');
    setCurrentUser(DEMO_USERS.verifier);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        token,
        isAuthenticated: role !== 'verifier',
        switchRole,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
