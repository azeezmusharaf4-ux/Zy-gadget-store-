import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'signin',
}) => {
  const {
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    resetPassword,
    authError,
    clearAuthError,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'forgot'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    clearAuthError();
    setLocalError(null);
    setResetSuccess(false);
    onClose();
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      handleClose();
    } catch {
      // Handled via context authError
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setLocalError(null);
    setResetSuccess(false);

    if (!email.trim()) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    if (activeTab === 'forgot') {
      setLoading(true);
      try {
        await resetPassword(email.trim());
        setResetSuccess(true);
      } catch {
        // Handled via context
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    if (activeTab === 'register') {
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match.');
        return;
      }
      setLoading(true);
      try {
        await registerWithEmail(email.trim(), password);
        handleClose();
      } catch {
        // Handled via context
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        await signInWithEmail(email.trim(), password);
        handleClose();
      } catch {
        // Handled via context
      } finally {
        setLoading(false);
      }
    }
  };

  const currentError = localError || authError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">
            {activeTab === 'signin' && 'Welcome Back'}
            {activeTab === 'register' && 'Create Customer Account'}
            {activeTab === 'forgot' && 'Reset Password'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === 'signin' && 'Sign in to track orders and save gadget inquiries'}
            {activeTab === 'register' && 'Register to manage orders and fast-track checkout'}
            {activeTab === 'forgot' && 'Enter your email to receive a password reset link'}
          </p>
        </div>

        {/* Tab Switcher (if not in forgot mode) */}
        {activeTab !== 'forgot' && (
          <div className="flex border-b border-slate-200 mb-5">
            <button
              onClick={() => {
                setActiveTab('signin');
                clearAuthError();
                setLocalError(null);
              }}
              className={`flex-1 pb-2.5 text-xs font-bold transition-colors ${
                activeTab === 'signin'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                clearAuthError();
                setLocalError(null);
              }}
              className={`flex-1 pb-2.5 text-xs font-bold transition-colors ${
                activeTab === 'register'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Errors / Success alerts */}
        {currentError && (
          <div
            className={`mb-4 p-3.5 rounded-xl text-xs border ${
              currentError.includes('Firebase Console') || currentError.includes('disabled in Firebase') || currentError.includes('operation-not-allowed')
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle
                className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  currentError.includes('Firebase Console') || currentError.includes('disabled in Firebase') || currentError.includes('operation-not-allowed')
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}
              />
              <div className="space-y-1.5 flex-1 min-w-0">
                <p className="font-semibold leading-snug">{currentError}</p>

                {(currentError.includes('Firebase Console') || currentError.includes('disabled in Firebase') || currentError.includes('operation-not-allowed')) && (
                  <div className="mt-2 text-[11px] bg-white/90 p-3 rounded-lg border border-amber-200/90 text-slate-800 space-y-1.5 shadow-2xs">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Store Owner Setup Steps:</span>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-0.5">
                      <li>Open Firebase Console for project: <strong className="font-mono text-blue-700">gen-lang-client-0029331785</strong></li>
                      <li>In the left sidebar, click <strong>Authentication</strong> → <strong>Sign-in method</strong> tab</li>
                      <li>Click <strong>Email/Password</strong> and turn ON the <strong>Enable</strong> switch, then click <strong>Save</strong></li>
                      <li>Click <strong>Google</strong> and turn ON the <strong>Enable</strong> switch, select your support email (<span className="font-mono text-blue-700">zenetofficialhub@gmail.com</span>), then click <strong>Save</strong></li>
                    </ol>
                    <p className="text-[10px] text-slate-500 pt-0.5">
                      Once saved in Firebase Console, new customers can immediately register and log in.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {resetSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Password reset link sent! Check your email inbox.</span>
          </div>
        )}

        {/* Google Sign In Button */}
        {activeTab !== 'forgot' && (
          <div className="mb-5">
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google / Gmail</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2 text-slate-400 font-semibold">Or with email</span>
              </div>
            </div>
          </div>
        )}

        {/* Email / Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-base pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {activeTab !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                {activeTab === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('forgot');
                      clearAuthError();
                      setLocalError(null);
                    }}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-base pl-9 pr-9 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-base pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 mt-2"
          >
            {loading ? (
              'Processing...'
            ) : activeTab === 'signin' ? (
              'Sign In'
            ) : activeTab === 'register' ? (
              'Create Account'
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        {/* Back to sign in if in forgot mode */}
        {activeTab === 'forgot' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setActiveTab('signin');
                clearAuthError();
                setLocalError(null);
                setResetSuccess(false);
              }}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
