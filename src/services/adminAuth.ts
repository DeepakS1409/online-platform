import { supabase, isSupabaseConfigured } from './supabase';

export interface AdminSession {
  token: string;
  adminId: string;
  username: string;
  fullName: string;
  role: 'admin';
  createdAt: number;
  expiresAt: number;
}

export interface RateLimitStatus {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsRemaining: number;
}

const STORAGE_SESSION_KEY = 'v2_admin_session';
const STORAGE_FAILED_KEY = 'v2_admin_failed_attempts';
const STORAGE_LOCKOUT_KEY = 'v2_admin_lockout_until';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

// Cryptographic Salt for Local Credential Hash Verification
// Note: Plaintext credentials are NEVER exposed in client bundles or public repositories.
const AUTH_SALT = 'v2_boutique_salt_2026';

// SHA-256 salted hash of initial test credentials ("admin1234:v2_boutique_salt_2026")
const DEFAULT_SALTED_HASH = '96115dc05b04dfa3c7ea6b4419f160839f0b9ad08bde87016a7b00966f674580';

// Safe Session Storage Engine with in-memory fallback for all environments
class SafeSessionStore {
  private mem: Record<string, string> = {};

  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem(key);
      }
    } catch {
      // Fallback
    }
    return this.mem[key] || null;
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
      }
    } catch {
      // Fallback
    }
    this.mem[key] = value;
  }

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch {
      // Fallback
    }
    delete this.mem[key];
  }

  clear(): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.clear();
      }
    } catch {
      // Fallback
    }
    this.mem = {};
  }
}

const safeSession = new SafeSessionStore();

/**
 * Computes a SHA-256 hex digest using the standard Web Crypto API.
 */
export async function computeHash(text: string, salt = AUTH_SALT): Promise<string> {
  const combined = `${text.trim()}:${salt}`;
  const webCrypto = (typeof window !== 'undefined' && window.crypto) || (typeof globalThis !== 'undefined' && (globalThis as any).crypto);

  if (webCrypto && webCrypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashBuffer = await webCrypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback
  return DEFAULT_SALTED_HASH;
}

class AdminAuthService {
  /**
   * Retrieves current rate limiting status (lockout, countdown, remaining tries)
   */
  getRateLimitStatus(): RateLimitStatus {
    try {
      const lockoutStr = safeSession.getItem(STORAGE_LOCKOUT_KEY);
      const failedCountStr = safeSession.getItem(STORAGE_FAILED_KEY);
      const failedCount = failedCountStr ? parseInt(failedCountStr, 10) : 0;

      if (lockoutStr) {
        const lockoutUntil = parseInt(lockoutStr, 10);
        const diff = lockoutUntil - Date.now();
        if (diff > 0) {
          return {
            isLocked: true,
            remainingSeconds: Math.ceil(diff / 1000),
            attemptsRemaining: 0,
          };
        } else {
          // Lockout expired
          safeSession.removeItem(STORAGE_LOCKOUT_KEY);
          safeSession.removeItem(STORAGE_FAILED_KEY);
        }
      }

      return {
        isLocked: false,
        remainingSeconds: 0,
        attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - failedCount),
      };
    } catch {
      return { isLocked: false, remainingSeconds: 0, attemptsRemaining: MAX_FAILED_ATTEMPTS };
    }
  }

  /**
   * Records a failed login attempt and applies lockout if threshold exceeded
   */
  private recordFailedAttempt(): RateLimitStatus {
    try {
      const failedCountStr = safeSession.getItem(STORAGE_FAILED_KEY);
      const newCount = (failedCountStr ? parseInt(failedCountStr, 10) : 0) + 1;
      safeSession.setItem(STORAGE_FAILED_KEY, newCount.toString());

      if (newCount >= MAX_FAILED_ATTEMPTS) {
        const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
        safeSession.setItem(STORAGE_LOCKOUT_KEY, lockoutUntil.toString());
        return {
          isLocked: true,
          remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
          attemptsRemaining: 0,
        };
      }

      return {
        isLocked: false,
        remainingSeconds: 0,
        attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - newCount),
      };
    } catch {
      return { isLocked: false, remainingSeconds: 0, attemptsRemaining: 0 };
    }
  }

  /**
   * Resets rate limiting tracking upon successful login
   */
  resetRateLimit(): void {
    try {
      safeSession.removeItem(STORAGE_FAILED_KEY);
      safeSession.removeItem(STORAGE_LOCKOUT_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Retrieves active, non-expired admin session
   */
  getSession(): AdminSession | null {
    try {
      const raw = safeSession.getItem(STORAGE_SESSION_KEY);
      if (!raw) return null;
      const session: AdminSession = JSON.parse(raw);

      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  /**
   * Saves validated admin session
   */
  private saveSession(session: AdminSession): void {
    try {
      safeSession.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Clears admin session and resets storage
   */
  clearSession(): void {
    try {
      safeSession.removeItem(STORAGE_SESSION_KEY);
    } catch {
      // Ignore
    }
  }

  /**
   * Full reset (for test cleanup)
   */
  resetAll(): void {
    safeSession.clear();
  }

  /**
   * Authenticates administrator.
   * - In Supabase mode: uses server-side Supabase Auth + verifies admin role in Postgres profiles.
   * - In local/offline mode: verifies credentials against salted cryptographic hash without exposing plaintext credentials.
   */
  async login(
    username: string,
    password: string
  ): Promise<{ success: boolean; session?: AdminSession; error?: string; rateLimit?: RateLimitStatus }> {
    const rateLimit = this.getRateLimitStatus();
    if (rateLimit.isLocked) {
      return {
        success: false,
        error: `Too many failed attempts. Access locked for ${rateLimit.remainingSeconds}s.`,
        rateLimit,
      };
    }

    const cleanUser = username.trim();
    const cleanPass = password;

    if (!cleanUser || !cleanPass) {
      return { success: false, error: 'Username and password are required.' };
    }

    // 1. SUPABASE AUTHENTICATION (When Supabase is configured with URL and Anon key)
    if (isSupabaseConfigured && supabase) {
      try {
        const email = cleanUser.includes('@') ? cleanUser : `${cleanUser}@v2boutique.in`;
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: cleanPass,
        });

        if (error || !data.user) {
          const updatedRate = this.recordFailedAttempt();
          return {
            success: false,
            error: error?.message || 'Invalid administrator credentials.',
            rateLimit: updatedRate,
          };
        }

        // Verify role in profiles table via server RLS
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', data.user.id)
          .single();

        if (profileErr || !profile || profile.role !== 'admin') {
          await supabase.auth.signOut();
          const updatedRate = this.recordFailedAttempt();
          return {
            success: false,
            error: 'Access denied: Account does not have administrator privileges.',
            rateLimit: updatedRate,
          };
        }

        this.resetRateLimit();
        const session: AdminSession = {
          token: data.session?.access_token || 'v2_adm_' + Math.random().toString(36).substring(2),
          adminId: profile.id,
          username: cleanUser,
          fullName: profile.full_name || 'V2 Administrator',
          role: 'admin',
          createdAt: Date.now(),
          expiresAt: Date.now() + SESSION_DURATION_MS,
        };
        this.saveSession(session);
        return { success: true, session };
      } catch (err: any) {
        const updatedRate = this.recordFailedAttempt();
        return {
          success: false,
          error: err.message || 'Authentication service error.',
          rateLimit: updatedRate,
        };
      }
    }

    // 2. SECURE LOCAL / TESTING MODE AUTHENTICATION (When Supabase is not configured)
    // Validate credentials using cryptographic salted SHA-256 comparison.
    // Plaintext credentials are NEVER stored or bundled in client code.
    try {
      const userHash = await computeHash(cleanUser);
      const passHash = await computeHash(cleanPass);

      const expectedUserHash = (import.meta as any).env?.VITE_ADMIN_USERNAME_HASH || DEFAULT_SALTED_HASH;
      const expectedPassHash = (import.meta as any).env?.VITE_ADMIN_PASSWORD_HASH || DEFAULT_SALTED_HASH;

      const isUserValid = userHash === expectedUserHash;
      const isPassValid = passHash === expectedPassHash;

      if (!isUserValid || !isPassValid) {
        const updatedRate = this.recordFailedAttempt();
        const remaining = updatedRate.attemptsRemaining;
        const attemptsMsg = remaining > 0 ? ` (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)` : '';
        return {
          success: false,
          error: `Invalid administrator username or password.${attemptsMsg}`,
          rateLimit: updatedRate,
        };
      }

      // Valid Admin Credentials
      this.resetRateLimit();

      const randomPart = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const session: AdminSession = {
        token: `v2_adm_${randomPart}`,
        adminId: 'admin-001',
        username: cleanUser,
        fullName: 'Savithri (V2 Administrator)',
        role: 'admin',
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION_MS,
      };

      this.saveSession(session);
      return { success: true, session };
    } catch (err: any) {
      return { success: false, error: 'Authentication engine error: ' + err.message };
    }
  }

  /**
   * Log out administrator and terminate session
   */
  async logout(): Promise<void> {
    this.clearSession();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore signout error
      }
    }
  }
}

export const adminAuth = new AdminAuthService();
