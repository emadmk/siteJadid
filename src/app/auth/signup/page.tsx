'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle, Building2, User } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    accountType: 'B2C' as 'B2C' | 'B2B' | 'GSA',
    companyName: '',
    taxId: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if ((formData.accountType === 'B2B' || formData.accountType === 'GSA') && !formData.companyName) {
      setError('Company name is required for business accounts');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          accountType: formData.accountType,
          companyName: formData.companyName || undefined,
          taxId: formData.taxId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/signin?registered=true');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <ShieldCheck className="w-12 h-12 text-safety-green-600" />
            <span className="text-2xl font-bold text-black">SafetyPro Supply</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-black">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/signin" className="font-medium text-safety-green-600 hover:text-safety-green-700">
              Sign in
            </Link>
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 mb-6">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Account created successfully!</p>
              <p className="text-sm text-green-700 mt-1">Redirecting to sign in...</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-8 space-y-6">
          {/* Account Type Selection */}
          <div>
            <label className="block text-sm font-medium text-black mb-3">Account Type</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, accountType: 'B2C' })}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  formData.accountType === 'B2C'
                    ? 'border-safety-green-600 bg-safety-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <User className="w-6 h-6 mb-2 text-safety-green-600" />
                <div className="font-medium text-black">Personal</div>
                <div className="text-xs text-gray-600">Individual customer</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, accountType: 'B2B' })}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  formData.accountType === 'B2B'
                    ? 'border-safety-green-600 bg-safety-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Building2 className="w-6 h-6 mb-2 text-safety-green-600" />
                <div className="font-medium text-black">Business</div>
                <div className="text-xs text-gray-600">Wholesale pricing</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, accountType: 'GSA' })}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  formData.accountType === 'GSA'
                    ? 'border-safety-green-600 bg-safety-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <ShieldCheck className="w-6 h-6 mb-2 text-safety-green-600" />
                <div className="font-medium text-black">Government</div>
                <div className="text-xs text-gray-600">GSA contract</div>
              </button>
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
                Full Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-black mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Business Information (conditional) */}
          {(formData.accountType === 'B2B' || formData.accountType === 'GSA') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-black mb-2">
                  Company Name *
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                  placeholder="Company Inc."
                />
              </div>

              <div>
                <label htmlFor="taxId" className="block text-sm font-medium text-black mb-2">
                  Tax ID / EIN {formData.accountType === 'B2B' && '(Optional)'}
                </label>
                <input
                  id="taxId"
                  name="taxId"
                  type="text"
                  value={formData.taxId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                  placeholder="12-3456789"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
              Email Address *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
              placeholder="you@example.com"
            />
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-600">Minimum 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-safety-green-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Terms Acceptance */}
          <div className="flex items-start">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 mt-1 text-safety-green-600 focus:ring-safety-green-500 border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
              I agree to the{' '}
              <Link href="/terms" className="text-safety-green-600 hover:text-safety-green-700">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-safety-green-600 hover:text-safety-green-700">
                Privacy Policy
              </Link>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || success}
            className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-base font-medium"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>

          {/* Business Account Info */}
          {(formData.accountType === 'B2B' || formData.accountType === 'GSA') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> {formData.accountType === 'B2B' ? 'Business' : 'Government'} accounts require
                approval before accessing special pricing. You'll be notified via email once your account is verified.
              </p>
            </div>
          )}
        </form>

        {/* Trust Badges */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <ShieldCheck className="w-4 h-4 text-safety-green-600" />
            <span>Your information is secure and encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
