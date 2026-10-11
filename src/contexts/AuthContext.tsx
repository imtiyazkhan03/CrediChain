import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { DEMO_USERS } from '../data/mockData';

interface AuthContextType {
  currentUser: User;
  role: UserRole;
  token: string | null;
  isAuthenticated: boolean;
  switchRole: (role: UserRole) => void;
  login: (email: string, role?: UserRole, password?: string, customName?: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: UserRole, institution?: string, studentId?: string) => Promise<boolean>;
  setDynamicUserName: (name: string) => void;
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
        const parsed = JSON.parse(savedUser);
        // Ensure no DP is persisted
        delete parsed.avatar;
        return parsed;
      } catch {
        // Fallback
      }
    }
    const fallback = { ...(DEMO_USERS[role] || DEMO_USERS.admin) };
    delete fallback.avatar;
    return fallback;
  });

  useEffect(() => {
    localStorage.setItem('certichain_role', role);
  }, [role]);

  const setDynamicUserName = (newName: string) => {
    if (!newName.trim()) return;
    setCurrentUser((prev) => {
      const updated = { ...prev, name: newName.trim() };
      delete updated.avatar;
      localStorage.setItem('certichain_user', JSON.stringify(updated));
      return updated;
    });
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    const demo = { ...(DEMO_USERS[newRole] || DEMO_USERS.admin) };
    delete demo.avatar;
    setCurrentUser(demo);
    localStorage.setItem('certichain_user', JSON.stringify(demo));
  };

  const login = async (email: string, targetRole?: UserRole, password?: string, customName?: string): Promise<boolean> => {
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
            
            // Normalize role for UI consistency (university_admin -> admin)
            const uiRole: UserRole = data.user.role === 'university_admin' ? 'admin' : (data.user.role as UserRole);

            const userObj: User = {
              id: data.user.id,
              name: customName?.trim() || data.user.name,
              email: data.user.email,
              role: uiRole,
              title: data.user.title,
              institution: data.user.institution,
              studentId: data.user.studentId,
            };

            setCurrentUser(userObj);
            setRole(uiRole);
            localStorage.setItem('certichain_user', JSON.stringify(userObj));
            return true;
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || errData.message || 'Invalid email or password.');
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.message !== 'Failed to fetch') {
          throw err;
        }
        // Backend not reachable; gracefully fall back to local demo auth below
      }
    }

    // Fallback: build user directly from user input without hardcoded demo names
    const roleTitle =
      roleCandidate === 'student'
        ? 'Student'
        : roleCandidate === 'validator' || roleCandidate === 'verifier'
        ? 'Talent Recruiter'
        : 'University Administrator';

    const derivedName =
      customName?.trim() ||
      (email ? email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Authorized User');

    const userObj: User = {
      id: `usr-${Date.now()}`,
      name: derivedName,
      email: email || `${roleCandidate}@institution.edu`,
      role: roleCandidate,
      title: roleTitle,
      institution: 'Academic Institution',
    };
    setCurrentUser(userObj);
    setRole(roleCandidate);
    localStorage.setItem('certichain_user', JSON.stringify(userObj));
    return true;
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    targetRole: UserRole,
    institution?: string,
    studentId?: string
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: targetRole, institution, studentId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token && data.user) {
          setToken(data.token);
          localStorage.setItem('certichain_token', data.token);

          const uiRole: UserRole = data.user.role === 'university_admin' ? 'admin' : (data.user.role as UserRole);
          const userObj: User = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: uiRole,
            title: data.user.title,
            institution: data.user.institution,
            studentId: data.user.studentId,
          };

          setCurrentUser(userObj);
          setRole(uiRole);
          localStorage.setItem('certichain_user', JSON.stringify(userObj));
          return true;
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Registration failed.');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== 'Failed to fetch') {
        throw err;
      }
    }

    // Local fallback for offline/instant testing
    const uiRole: UserRole = targetRole === 'university_admin' ? 'admin' : targetRole;
    const userObj: User = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role: uiRole,
      title: uiRole === 'student' ? 'Student' : uiRole === 'validator' ? 'Talent Recruiter' : 'University Registrar',
      institution: institution || 'Stanford University',
      studentId: studentId || (uiRole === 'student' ? `SU-2026-${Math.floor(1000 + Math.random() * 9000)}` : undefined),
    };
    setCurrentUser(userObj);
    setRole(uiRole);
    localStorage.setItem('certichain_user', JSON.stringify(userObj));
    return true;
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('certichain_token');
    localStorage.removeItem('certichain_user');
    setRole('verifier');
    const verifierUser = { ...DEMO_USERS.verifier };
    delete verifierUser.avatar;
    setCurrentUser(verifierUser);
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
        register,
        setDynamicUserName,
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
