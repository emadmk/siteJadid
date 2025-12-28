import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Users, Award, TrendingUp, CheckCircle, Building2, Globe, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'About Us | Ada Supply - Safety Done Right',
  description: 'Learn about Ada Supply - your trusted partner for industrial safety equipment, PPE, and GSA contract solutions serving government and commercial customers nationwide.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-safety-green-700 to-safety-green-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">About Ada Supply</h1>
            <p className="text-xl text-safety-green-100 mb-4">
              Safety Done Right
            </p>
            <p className="text-lg text-white/90">
              Your trusted partner for industrial safety equipment, personal protective equipment (PPE),
              and comprehensive safety solutions for government agencies and commercial enterprises nationwide.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Mission Statement */}
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 mb-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                At Ada Supply, we are committed to protecting workers and creating safer work environments
                across America. We believe that every person deserves access to quality safety equipment
                that meets the highest industry standards.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                We specialize in providing comprehensive safety solutions to federal, state, and local
                government agencies, as well as commercial and industrial customers. Our extensive product
                catalog includes PPE, fall protection equipment, protective clothing, safety footwear,
                and much more.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-safety-green-50 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-safety-green-600 mb-2">15K+</div>
                <div className="text-gray-600">Products Available</div>
              </div>
              <div className="bg-safety-green-50 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-safety-green-600 mb-2">50+</div>
                <div className="text-gray-600">Brand Partners</div>
              </div>
              <div className="bg-safety-green-50 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-safety-green-600 mb-2">GSA</div>
                <div className="text-gray-600">Contract Holder</div>
              </div>
              <div className="bg-safety-green-50 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-safety-green-600 mb-2">USA</div>
                <div className="text-gray-600">Nationwide Shipping</div>
              </div>
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose Ada Supply?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-safety-green-100 rounded-xl flex items-center justify-center mb-4">
                <ShieldCheck className="w-7 h-7 text-safety-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Quality Assured</h3>
              <p className="text-gray-600">
                All products meet or exceed ANSI, OSHA, and industry safety standards. We only source from certified manufacturers.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-safety-green-100 rounded-xl flex items-center justify-center mb-4">
                <Building2 className="w-7 h-7 text-safety-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">GSA Authorized</h3>
              <p className="text-gray-600">
                GSA Schedule Contract holder serving federal, state, and local government agencies with competitive pricing.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-safety-green-100 rounded-xl flex items-center justify-center mb-4">
                <Truck className="w-7 h-7 text-safety-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Fast Shipping</h3>
              <p className="text-gray-600">
                Same-day shipping on orders placed before 2 PM EST. Free shipping on qualifying orders nationwide.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-safety-green-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-safety-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Expert Support</h3>
              <p className="text-gray-600">
                Our knowledgeable team provides personalized assistance to help you find the right safety solutions.
              </p>
            </div>
          </div>
        </div>

        {/* What We Offer */}
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">What We Offer</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Product Categories</h3>
              <ul className="space-y-3">
                {[
                  'Personal Protective Equipment (PPE)',
                  'Fall Protection & Safety Harnesses',
                  'Protective Clothing & Workwear',
                  'Safety Footwear & Boots',
                  'Eye & Face Protection',
                  'Hand Protection & Gloves',
                  'Head Protection & Hard Hats',
                  'Respiratory Protection',
                  'High-Visibility Apparel',
                  'First Aid & Emergency Equipment',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-safety-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Services</h3>
              <ul className="space-y-3">
                {[
                  'GSA Schedule Contract Fulfillment',
                  'Government Purchase Card (GPC) Accepted',
                  'B2B Bulk Order Solutions',
                  'Custom Product Sourcing',
                  'Net Terms for Qualified Accounts',
                  'Technical Product Consultation',
                  'Compliance Guidance & Support',
                  'Volume Discount Programs',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-safety-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* GSA Information */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-8 md:p-12 mb-12 text-white">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">GSA Schedule Contract Holder</h2>
              <p className="text-blue-100 mb-6">
                Ada Supply is proud to be an authorized GSA Schedule contract holder, providing federal,
                state, and local government agencies with streamlined procurement of safety equipment
                at pre-negotiated prices.
              </p>
              <div className="space-y-2 mb-6">
                <p><span className="text-blue-300">Contract Number:</span> <span className="font-semibold">GS-21F-0086U</span></p>
                <p><span className="text-blue-300">DLA BPA Contract:</span> <span className="font-semibold">SP3300-20-A-5011</span></p>
                <p><span className="text-blue-300">CAGE Code:</span> <span className="font-semibold">1J2Y1</span></p>
              </div>
              <Link href="/gsa">
                <Button className="bg-white text-blue-900 hover:bg-blue-50">
                  View GSA Information
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <Globe className="w-8 h-8 mx-auto mb-2 text-blue-300" />
                <p className="text-sm text-blue-200">GSA Advantage</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <Award className="w-8 h-8 mx-auto mb-2 text-blue-300" />
                <p className="text-sm text-blue-200">TAA Compliant</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <Building2 className="w-8 h-8 mx-auto mb-2 text-blue-300" />
                <p className="text-sm text-blue-200">Federal Buyer</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-300" />
                <p className="text-sm text-blue-200">Best Prices</p>
              </div>
            </div>
          </div>
        </div>

        {/* Certifications & Major Accounts */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Certifications</h2>
            <ul className="space-y-3">
              {[
                'GSA Schedule Contract Holder',
                'DLA BPA Contract Holder',
                'ANSI Authorized Dealer',
                'OSHA Compliance Partner',
                'Woman-Owned Small Business (WOSB)',
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-safety-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Major Accounts</h2>
            <ul className="space-y-3">
              {[
                'Department of Defense (DoD)',
                'Department of Homeland Security',
                'Department of Veterans Affairs',
                'State & Local Government Agencies',
                'Major Corporations & Contractors',
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-safety-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-safety-green-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-safety-green-100 mb-8 max-w-2xl mx-auto">
            Whether you're a government agency, contractor, or business, we're here to help you find
            the right safety equipment for your needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/products">
              <Button size="lg" className="bg-white text-safety-green-700 hover:bg-gray-100">
                Browse Products
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Contact Us
              </Button>
            </Link>
            <Link href="/gsa">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                GSA Ordering
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
