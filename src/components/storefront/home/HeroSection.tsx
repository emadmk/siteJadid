'use client';

import Link from 'next/link';
import { ArrowRight, Shield, Truck, Award, Clock } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 py-16 lg:py-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-safety-green-500/20 rounded-full text-safety-green-400 text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Trusted by 10,000+ Companies
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Professional{' '}
              <span className="text-safety-green-400">Safety Equipment</span>{' '}
              for Every Industry
            </h1>

            <p className="text-lg text-gray-300 mb-8 max-w-xl">
              From hard hats to high-vis vests, we provide ANSI-certified safety gear
              trusted by construction sites, manufacturing plants, and warehouses across America.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-safety-green-600 text-white rounded-lg font-semibold hover:bg-safety-green-700 transition-colors"
              >
                Shop All Products
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/quote"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-black transition-colors"
              >
                Request a Quote
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold text-white">50K+</div>
                <div className="text-sm text-gray-400">Products</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">99.9%</div>
                <div className="text-sm text-gray-400">Satisfaction</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-sm text-gray-400">Support</div>
              </div>
            </div>
          </div>

          {/* Hero Image / Feature Cards */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <Truck className="w-10 h-10 text-safety-green-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Free Shipping</h3>
                  <p className="text-sm text-gray-400">On orders over $99</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <Award className="w-10 h-10 text-safety-green-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">ANSI Certified</h3>
                  <p className="text-sm text-gray-400">All products meet standards</p>
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <Clock className="w-10 h-10 text-safety-green-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Same Day Ship</h3>
                  <p className="text-sm text-gray-400">Order before 2PM EST</p>
                </div>
                <div className="bg-safety-green-600 rounded-2xl p-6">
                  <Shield className="w-10 h-10 text-white mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">B2B & GSA</h3>
                  <p className="text-sm text-white/80">Enterprise solutions</p>
                  <Link
                    href="/b2b"
                    className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-white hover:underline"
                  >
                    Learn More <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
