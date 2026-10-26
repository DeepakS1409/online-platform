import React, { useState } from 'react';
import { X, Lock, Phone, User, CheckCircle, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, verifyOtpMock } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (isRegisterMode) {
      if (!name.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      // Phone OTP Verification step
      setStep('otp');
      setSuccessNotice(`A 6-digit mock OTP has been generated for ${cleanPhone}. (Use 123456)`);
    } else {
      setLoading(true);
      try {
        await login(cleanPhone, password);
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Login failed.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!verifyOtpMock(phone, otpCode)) {
      setErrorMsg('Invalid verification code. Please enter 123456.');
      return;
    }

    setLoading(true);
    try {
      await register(name, phone, address);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminDemoLogin = async () => {
    setLoading(true);
    try {
      await login('7306117078', 'admin123');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-stone-100">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-stone-100 pb-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-stone-900">
              {step === 'otp'
                ? 'Verify Mobile Number'
                : isRegisterMode
                ? 'Create Customer Account'
                : 'Customer Sign In'}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Access your saved addresses and order delivery tracking
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successNotice && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-xl flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {step === 'otp' ? (
          /* OTP STEP */
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-stone-700 mb-1">
                Enter 6-digit OTP sent to {phone} *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-center font-mono text-lg font-bold tracking-widest focus:bg-white focus:outline-hidden"
              />
              <span className="text-[11px] text-stone-400 block mt-1 text-center">
                (Mock OTP is active: type <strong>123456</strong>)
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Verify & Activate Account
            </button>

            <button
              type="button"
              onClick={() => setStep('form')}
              className="w-full text-center text-xs text-stone-500 hover:text-stone-800"
            >
              Change Mobile Number
            </button>
          </form>
        ) : (
          /* LOGIN OR REGISTER FORM */
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {isRegisterMode && (
              <div>
                <label className="block font-medium text-stone-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-medium text-stone-700 mb-1">Mobile Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit number e.g. 9876543210"
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            {isRegisterMode && (
              <div>
                <label className="block font-medium text-stone-700 mb-1">Delivery Address (Optional)</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, Pincode..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
            >
              {loading
                ? 'Processing...'
                : isRegisterMode
                ? 'Continue to OTP Verification'
                : 'Sign In'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setErrorMsg('');
                }}
                className="text-xs text-rose-700 font-semibold hover:underline"
              >
                {isRegisterMode
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Register with Phone"}
              </button>
            </div>

            {/* Quick Administrator Demo Shortcut */}
            <div className="pt-3 border-t border-stone-100 text-center">
              <button
                type="button"
                onClick={handleAdminDemoLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[11px] font-semibold cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span>One-Click Store Admin Demo Sign-In</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
