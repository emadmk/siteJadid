'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { X, Eye, EyeOff, Loader2, Mail, Lock, User, Building2, AlertCircle } from 'lucide-react';
import { useAuthModal } from '@/contexts/AuthModalContext';

export function AuthModal() {
  const { isOpen, view, reason, closeModal, setView } = useAuthModal();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // GSA Departments
  const GSA_DEPARTMENTS = [
    { value: 'DOW', label: 'Department of War (DOW)' },
    { value: 'DLA', label: 'Defense Logistics Agency (DLA)' },
    { value: 'USDA', label: 'US Department of Agriculture (USDA)' },
    { value: 'NIH', label: 'National Institute of Health (NIH)' },
    { value: 'GCSS-Army', label: 'Global Combat Support System-Army (GCSS-Army)' },
  ];

  // Register form - Pre-select B2B if reason is 'b2b'
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: (reason === 'b2b' ? 'B2B' : 'B2C') as 'B2C' | 'B2B' | 'GSA',
    companyName: '',
    gsaDepartment: '',
  });

  // Forgot password form
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Pre-select B2B account type when reason is 'b2b'
  useEffect(() => {
    if (reason === 'b2b') {
      setRegisterData(prev => ({ ...prev, accountType: 'B2B' }));
    }
  }, [reason]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        closeModal();
        window.location.reload();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (registerData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email,
          password: registerData.password,
          accountType: registerData.accountType,
          companyName: registerData.accountType !== 'B2C' ? registerData.companyName : undefined,
          gsaDepartment: registerData.accountType === 'GSA' ? registerData.gsaDepartment : undefined,
        }),
      });

      if (res.ok) {
        // Auto-login after registration
        const loginResult = await signIn('credentials', {
          email: registerData.email,
          password: registerData.password,
          redirect: false,
        });

        if (loginResult?.ok) {
          closeModal();
          window.location.reload();
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      if (res.ok) {
        setForgotSent(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send reset email');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeModal}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-xl font-bold">ADA Supply</span>
          </div>
          <h2 className="text-2xl font-bold">
            {view === 'login' && 'Welcome Back'}
            {view === 'register' && 'Create Account'}
            {view === 'forgot-password' && 'Reset Password'}
          </h2>
          <p className="text-white/80 text-sm mt-1">
            {view === 'login' && 'Sign in to access your account'}
            {view === 'register' && 'Join ADA Supply for exclusive benefits'}
            {view === 'forgot-password' && "Enter your email to reset your password"}
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Login Form */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-safety-green-600 rounded focus:ring-safety-green-500"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setView('forgot-password')}
                  className="text-sm text-safety-green-600 hover:text-safety-green-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-safety-green-600 text-white rounded-lg font-semibold hover:bg-safety-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign In
              </button>

              <p className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setView('register')}
                  className="text-safety-green-600 hover:text-safety-green-700 font-medium"
                >
                  Create one
                </button>
              </p>
            </form>
          )}

          {/* Register Form */}
          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    placeholder="john@company.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'B2C', label: 'Personal' },
                    { value: 'B2B', label: 'Business' },
                    { value: 'GSA', label: 'Government' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setRegisterData({ ...registerData, accountType: type.value as 'B2C' | 'B2B' | 'GSA' })}
                      className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        registerData.accountType === type.value
                          ? 'border-safety-green-600 bg-safety-green-50 text-safety-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {registerData.accountType !== 'B2C' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {registerData.accountType === 'GSA' ? 'Agency Name' : 'Company Name'}
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={registerData.companyName}
                      onChange={(e) => setRegisterData({ ...registerData, companyName: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                      placeholder={registerData.accountType === 'GSA' ? 'Agency name' : 'Company name'}
                      required
                    />
                  </div>
                </div>
              )}

              {registerData.accountType === 'GSA' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <select
                    value={registerData.gsaDepartment}
                    onChange={(e) => setRegisterData({ ...registerData, gsaDepartment: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    required
                  >
                    <option value="">Select your department</option>
                    {GSA_DEPARTMENTS.map((dept) => (
                      <option key={dept.value} value={dept.value}>
                        {dept.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Your account will be pending admin approval
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-safety-green-600 text-white rounded-lg font-semibold hover:bg-safety-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Account
              </button>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="text-safety-green-600 hover:text-safety-green-700 font-medium"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* Forgot Password Form */}
          {view === 'forgot-password' && (
            <>
              {forgotSent ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-safety-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-safety-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    We've sent password reset instructions to {forgotEmail}
                  </p>
                  <button
                    onClick={() => {
                      setForgotSent(false);
                      setView('login');
                    }}
                    className="text-safety-green-600 hover:text-safety-green-700 font-medium text-sm"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-safety-green-600 text-white rounded-lg font-semibold hover:bg-safety-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Send Reset Link
                  </button>

                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="w-full text-center text-sm text-gray-600 hover:text-gray-800"
                  >
                    Back to Sign In
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
