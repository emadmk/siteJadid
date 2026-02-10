'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  Users,
  User,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Phone,
  MapPin,
  Briefcase,
  Shield,
  Star,
  Truck,
  BadgePercent,
  AlertCircle
} from 'lucide-react';
import { signIn } from 'next-auth/react';

// Buyer types with their details
const buyerTypes = [
  {
    id: 'GOVERNMENT',
    title: 'Government Buyer',
    subtitle: 'Federal & Government Agencies',
    description: 'Access exclusive Government pricing and dedicated support for government procurement.',
    icon: Building2,
    bgGradient: 'from-safety-green-600 via-safety-green-700 to-safety-green-800',
    iconBg: 'bg-safety-green-500/20',
    benefits: [
      { icon: Shield, text: 'Government Pricing' },
      { icon: CheckCircle2, text: 'Government Contract Support' },
      { icon: Star, text: 'Priority Processing' },
    ],
    image: '/images/imagesite/gsa.jpg',
  },
  {
    id: 'VOLUME_BUYER',
    title: 'Volume Buyer',
    subtitle: 'Business & Bulk Orders',
    description: 'Unlock volume discounts and dedicated account management for your business needs.',
    icon: Users,
    bgGradient: 'from-purple-600 via-purple-700 to-purple-800',
    iconBg: 'bg-purple-500/20',
    benefits: [
      { icon: BadgePercent, text: 'Volume Discounts' },
      { icon: Truck, text: 'Free Bulk Shipping' },
      { icon: Star, text: 'Dedicated Account Manager' },
    ],
    image: '/images/imagesite/ppenewphoto.jpg',
  },
  {
    id: 'PERSONAL',
    title: 'Personal Buyer',
    subtitle: 'Individual Professionals',
    description: 'Quality PPE and safety equipment for contractors and individual professionals.',
    icon: User,
    bgGradient: 'from-blue-600 via-blue-700 to-blue-800',
    iconBg: 'bg-blue-500/20',
    benefits: [
      { icon: CheckCircle2, text: 'No Minimum Order' },
      { icon: Truck, text: 'Fast Home Delivery' },
      { icon: Star, text: 'Personal Account Dashboard' },
    ],
    image: '/uploads/ppe-rhn2syjhuk4f553vlfqcysr0quy8cnjai2hlg26xxc.jpg',
  },
];

// Government Departments
const GOVERNMENT_DEPARTMENTS = [
  { value: 'DOW', label: 'Department of War (DOW)' },
  { value: 'DLA', label: 'Defense Logistics Agency (DLA)' },
  { value: 'USDA', label: 'US Department of Agriculture (USDA)' },
  { value: 'NIH', label: 'National Institute of Health (NIH)' },
  { value: 'GCSS-Army', label: 'Global Combat Support System-Army (GCSS-Army)' },
  { value: 'OTHER', label: 'Other Government Agency' },
];

export default function RegisterPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    jobTitle: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    gsaDepartment: '',
    taxId: '',
    agreeTerms: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!formData.agreeTerms) {
      setError('Please agree to the Terms of Service');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          password: formData.password,
          accountType: selectedType,
          companyName: selectedType !== 'PERSONAL' ? formData.companyName : undefined,
          governmentDepartment: selectedType === 'GOVERNMENT' ? formData.gsaDepartment : undefined,
        }),
      });

      if (res.ok) {
        // Auto-login after registration
        const loginResult = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (loginResult?.ok) {
          setRegistrationComplete(true);
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedBuyerType = buyerTypes.find(t => t.id === selectedType);

  // Success screen
  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-safety-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-safety-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome to ADA Supplies!</h1>
          <p className="text-gray-600 mb-8">
            Your account has been created successfully.
            {(selectedType === 'GOVERNMENT' || selectedType === 'VOLUME_BUYER') && ' Your account is pending admin approval.'}
          </p>
          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full py-3 bg-safety-green-600 text-white rounded-xl font-semibold hover:bg-safety-green-700 transition-colors"
            >
              Start Shopping
            </Link>
            <Link
              href="/account"
              className="block w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-gray-300 transition-colors"
            >
              Go to My Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        {!selectedType ? (
          // Buyer Type Selection
          <>
            {/* Hero */}
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Create Your Account
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Choose your account type to get started with exclusive benefits tailored to your needs
              </p>
            </div>

            {/* Buyer Type Cards */}
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {buyerTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden text-left"
                  >
                    {/* Card Header with Image */}
                    <div className={`relative h-40 bg-gradient-to-br ${type.bgGradient}`}>
                      <Image
                        src={type.image}
                        alt={type.title}
                        fill
                        className="object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                      />
                      <div className="absolute inset-0 p-6 flex flex-col justify-end">
                        <div className={`w-14 h-14 ${type.iconBg} backdrop-blur rounded-xl flex items-center justify-center mb-3`}>
                          <IconComponent className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-white font-bold text-xl">{type.title}</h3>
                        <p className="text-white/80 text-sm">{type.subtitle}</p>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6">
                      <p className="text-gray-600 text-sm mb-4">{type.description}</p>

                      {/* Benefits */}
                      <div className="space-y-2 mb-4">
                        {type.benefits.map((benefit, idx) => {
                          const BenefitIcon = benefit.icon;
                          return (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                              <BenefitIcon className="w-4 h-4 text-safety-green-600" />
                              <span>{benefit.text}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* CTA */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-safety-green-600 font-semibold text-sm group-hover:text-safety-green-700">
                          Get Started
                        </span>
                        <div className="w-8 h-8 bg-safety-green-100 rounded-full flex items-center justify-center group-hover:bg-safety-green-600 transition-colors">
                          <ArrowRight className="w-4 h-4 text-safety-green-600 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          // Registration Form
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => {
                setSelectedType(null);
                setError('');
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to account types</span>
            </button>

            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              {/* Form Header */}
              {selectedBuyerType && (
                <div className={`relative bg-gradient-to-br ${selectedBuyerType.bgGradient} p-6 md:p-8`}>
                  <div className="absolute inset-0 opacity-10">
                    <Image
                      src={selectedBuyerType.image}
                      alt={selectedBuyerType.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="relative flex items-center gap-4">
                    <div className={`w-16 h-16 ${selectedBuyerType.iconBg} backdrop-blur rounded-2xl flex items-center justify-center`}>
                      <selectedBuyerType.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white">{selectedBuyerType.title} Registration</h2>
                      <p className="text-white/80">{selectedBuyerType.subtitle}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6 md:p-8">
                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Personal Information */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-safety-green-600" />
                    Personal Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                        placeholder="John"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                        placeholder="Doe"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company/Organization Information (for VOLUME_BUYER and GOVERNMENT) */}
                {selectedType !== 'PERSONAL' && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-safety-green-600" />
                      {selectedType === 'GOVERNMENT' ? 'Agency Information' : 'Company Information'}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {selectedType === 'GOVERNMENT' ? 'Agency Name *' : 'Company Name *'}
                        </label>
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                          placeholder={selectedType === 'GOVERNMENT' ? 'Agency name' : 'Company name'}
                          required
                        />
                      </div>

                      {selectedType === 'GOVERNMENT' && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                          <select
                            name="gsaDepartment"
                            value={formData.gsaDepartment}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                            required
                          >
                            <option value="">Select your department</option>
                            {GOVERNMENT_DEPARTMENTS.map((dept) => (
                              <option key={dept.value} value={dept.value}>
                                {dept.label}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-gray-500">Your account will be pending admin approval</p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                        <div className="relative">
                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            name="jobTitle"
                            value={formData.jobTitle}
                            onChange={handleInputChange}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                            placeholder="Procurement Manager"
                          />
                        </div>
                      </div>

                      {selectedType === 'VOLUME_BUYER' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID (Optional)</label>
                          <input
                            type="text"
                            name="taxId"
                            value={formData.taxId}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                            placeholder="XX-XXXXXXX"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Address Information */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-safety-green-600" />
                    Address (Optional)
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                        placeholder="New York"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                          placeholder="NY"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                        <input
                          type="text"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                          placeholder="10001"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-safety-green-600" />
                    Create Password
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                          placeholder="At least 8 characters"
                          required
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                          placeholder="Confirm your password"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms & Submit */}
                <div className="border-t border-gray-100 pt-6">
                  <label className="flex items-start gap-3 cursor-pointer mb-6">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-safety-green-600 rounded focus:ring-safety-green-500 mt-0.5"
                    />
                    <span className="text-sm text-gray-600">
                      I agree to the{' '}
                      <Link href="/terms" className="text-safety-green-600 hover:text-safety-green-700 font-medium">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-safety-green-600 hover:text-safety-green-700 font-medium">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-safety-green-600 text-white rounded-xl font-semibold text-lg hover:bg-safety-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-safety-green-600/20"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-sm text-gray-600 mt-4">
                    Already have an account?{' '}
                    <Link href="/auth/signin" className="text-safety-green-600 hover:text-safety-green-700 font-medium">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
