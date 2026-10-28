import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Server, 
  KeyRound 
} from 'lucide-react';
import { adminAuth, RateLimitStatus } from '../../services/adminAuth';
import { isSupabaseConfigured } from '../../services/supabase';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onBackToStore: () => void;
  initialError?: string;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onSuccess,
  onBackToStore,
  initialError,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(initialError || '');
  const [rateLimit, setRateLimit] = useState<RateLimitStatus>(adminAuth.getRateLimitStatus());

  // Live countdown timer for rate limiting lockout
  useEffect(() => {
    let timer: any = null;
    if (rateLimit.isLocked && rateLimit.remainingSeconds > 0) {
      timer = setInterval(() => {
        const current = adminAuth.getRateLimitStatus();
        setRateLimit(current);
        if (!current.isLocked) {
          clearInterval(timer);
          setErrorMessage('');
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [rateLimit.isLocked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (rateLimit.isLocked) {
      setErrorMessage(`Login attempts locked. Please wait ${rateLimit.remainingSeconds} seconds.`);
      return;
    }

    setLoading(true);
    try {
      const result = await adminAuth.login(username, password);

      if (result.success) {
        onSuccess();
      } else {
        setErrorMessage(result.error || 'Invalid administrator credentials.');
        if (result.rateLimit) {
          setRateLimit(result.rateLimit);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 selection:bg-rose-500 selection:text-white">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-900/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Back to store navigation */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={onBackToStore}
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-white transition-colors cursor-pointer bg-stone-900/80 px-3.5 py-1.5 rounded-full border border-stone-800"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-rose-400" />
            <span>Return to Boutique Storefront</span>
          </button>

          {/* Backend Mode Badge */}
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5 border ${
            isSupabaseConfigured 
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' 
              : 'bg-stone-900 text-stone-400 border-stone-800'
          }`}>
            <Server className="w-3 h-3" />
            <span>{isSupabaseConfigured ? 'Supabase Auth' : 'Sandbox Security'}</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-stone-900/95 border border-stone-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-md">
          
          {/* Logo & Header */}
          <div className="text-center space-y-2 mb-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-linear-to-tr from-rose-800 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-900/30 ring-4 ring-rose-950">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-white tracking-tight">
                V2 Administrator Portal
              </h1>
              <p className="text-xs text-stone-400 mt-1">
                Restricted access for catalogue, inventory, orders & operations
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-3.5 bg-rose-950/70 border border-rose-800/60 rounded-2xl flex items-start gap-3 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Lockout Notice */}
          {rateLimit.isLocked && (
            <div className="mb-6 p-3.5 bg-amber-950/60 border border-amber-800/60 rounded-2xl flex items-center gap-3 text-xs text-amber-200">
              <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 animate-spin" />
              <div>
                Rate limit active: please wait{' '}
                <strong className="text-amber-300 font-mono text-sm">{rateLimit.remainingSeconds}s</strong>{' '}
                before retrying.
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username Field */}
            <div>
              <label 
                htmlFor="admin-username" 
                className="block text-xs font-medium text-stone-300 mb-1.5"
              >
                Administrator Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="admin-username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter administrator username"
                  disabled={loading || rateLimit.isLocked}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-950 text-stone-100 placeholder-stone-600 rounded-xl border border-stone-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-xs transition-colors outline-hidden disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label 
                  htmlFor="admin-password" 
                  className="block text-xs font-medium text-stone-300"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-stone-400 hover:text-stone-200 flex items-center gap-1 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Show</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  disabled={loading || rateLimit.isLocked}
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-950 text-stone-100 placeholder-stone-600 rounded-xl border border-stone-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-xs transition-colors outline-hidden font-mono disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-500 hover:text-stone-300 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || rateLimit.isLocked || !username.trim() || !password}
                className="w-full py-3 px-4 bg-linear-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-rose-950/50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign In to Administrator Console</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-8 pt-5 border-t border-stone-800/80 text-[11px] text-stone-400 space-y-2">
            <div className="flex items-center gap-2 text-stone-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>Multi-layer Authorization Protection</span>
            </div>
            <p className="leading-relaxed">
              Every catalogue, order, and database action is strictly protected by session verification and server-side policies. Unauthorized access attempts are monitored and rate-limited.
            </p>
          </div>

        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-stone-400 mt-6">
          V2 Online Dress Store • Coimbatore, Tamil Nadu
        </p>

      </div>
    </div>
  );
};
