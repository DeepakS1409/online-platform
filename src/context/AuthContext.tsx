import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  isAdmin: boolean;
  login: (phone: string, pass: string) => Promise<boolean>;
  register: (name: string, phone: string, address: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  verifyOtpMock: (phone: string, code: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'v2_authenticated_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_USER_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, [user]);

  const isAdmin = user?.role === 'admin';

  const login = async (phone: string, _pass: string): Promise<boolean> => {
    const cleanPhone = phone.replace(/\D/g, '');
    // Known admin phone is 7306117078 (Savithri)
    const isAdminUser = cleanPhone === '7306117078' || cleanPhone === '9876543210';
    const role: UserRole = isAdminUser ? 'admin' : 'customer';
    const profile: UserProfile = {
      id: 'usr-' + (isAdminUser ? 'admin-001' : Date.now()),
      phone: cleanPhone,
      full_name: isAdminUser ? 'Savithri (V2 Administrator)' : 'Valued Customer',
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setUser(profile);
    return true;
  };

  const register = async (name: string, phone: string, _address: string): Promise<boolean> => {
    const cleanPhone = phone.replace(/\D/g, '');
    const profile: UserProfile = {
      id: 'usr-' + Date.now(),
      phone: cleanPhone,
      full_name: name.trim(),
      role: 'customer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setUser(profile);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (user) {
      setUser({ ...user, role: newRole });
    } else {
      setUser({
        id: newRole === 'admin' ? 'admin-001' : 'usr-' + Date.now(),
        phone: newRole === 'admin' ? '7306117078' : '9123456780',
        full_name: newRole === 'admin' ? 'Savithri (V2 Administrator)' : 'Demo Customer',
        role: newRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  };

  const verifyOtpMock = (_phone: string, code: string): boolean => {
    // In production with Twilio / Msg91 / Supabase SMS OTP, code is validated by provider
    // Default mock verification code is 123456 or any 6 digit
    return code === '123456' || code.length === 6;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        login,
        register,
        logout,
        switchRole,
        verifyOtpMock,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
