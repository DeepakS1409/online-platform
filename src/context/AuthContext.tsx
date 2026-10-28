import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { adminAuth, AdminSession } from '../services/adminAuth';
import { db } from '../services/db';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface AuthContextType {
  // Customer Authentication (Storefront)
  user: UserProfile | null;
  login: (phone: string, pass: string) => Promise<boolean>;
  register: (name: string, phone: string, address: string) => Promise<boolean>;
  logout: () => void;
  verifyOtpMock: (phone: string, code: string) => boolean;

  // Administrator Authentication (Protected Console)
  adminSession: AdminSession | null;
  isAdmin: boolean;
  adminLogin: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'v2_authenticated_customer';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Customer User State
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_USER_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // Strictly enforce that customer storage only holds customer role
      return {
        ...parsed,
        role: 'customer' as UserRole,
      };
    } catch {
      return null;
    }
  });

  // 2. Administrator Session State
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => {
    return adminAuth.getSession();
  });

  // Sync admin session with DB service on mount and update
  useEffect(() => {
    db.setAdminSession(adminSession);
  }, [adminSession]);

  // Persist customer profile in localStorage
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

  // Listen to Supabase Auth state changes if Supabase is configured
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          adminAuth.clearSession();
          setAdminSession(null);
          db.setAdminSession(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  // Strict check: Admin access requires valid, non-expired administrator session
  const isAdmin = Boolean(adminSession && adminSession.expiresAt > Date.now());

  // Customer Login — Strictly creates/authenticates customer role
  const login = async (phone: string, _pass: string): Promise<boolean> => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    const profile: UserProfile = {
      id: 'usr-' + Date.now(),
      phone: cleanPhone,
      full_name: 'Valued Customer',
      role: 'customer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setUser(profile);
    return true;
  };

  // Customer Registration
  const register = async (name: string, phone: string, _address: string): Promise<boolean> => {
    const cleanPhone = phone.replace(/\D/g, '');
    const profile: UserProfile = {
      id: 'usr-' + Date.now(),
      phone: cleanPhone,
      full_name: name.trim() || 'Valued Customer',
      role: 'customer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setUser(profile);
    return true;
  };

  // Customer Logout
  const logout = () => {
    setUser(null);
  };

  // Mock OTP verification for customer phone verification
  const verifyOtpMock = (_phone: string, code: string): boolean => {
    return code === '123456' || code.length === 6;
  };

  // Dedicated Administrator Login
  const adminLogin = async (username: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const res = await adminAuth.login(username, pass);
    if (res.success && res.session) {
      setAdminSession(res.session);
      db.setAdminSession(res.session);
      return { success: true };
    }
    return { success: false, error: res.error || 'Invalid administrator credentials.' };
  };

  // Dedicated Administrator Logout
  const adminLogout = async (): Promise<void> => {
    await adminAuth.logout();
    setAdminSession(null);
    db.setAdminSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        verifyOtpMock,
        adminSession,
        isAdmin,
        adminLogin,
        adminLogout,
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
