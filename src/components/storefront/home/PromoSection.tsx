'use client';

import Link from 'next/link';
import { ArrowRight, Building2, BadgeCheck } from 'lucide-react';

export function PromoSection() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-6">
          {/* B2B Promo */}
          <Link
            href="/b2b"
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 to-purple-800 p-8 lg:p-12"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <Building2 className="w-12 h-12 text-white/80 mb-6" />
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                Business Accounts
              </h3>
              <p className="text-purple-100 mb-6 max-w-sm">
                Get volume discounts, net terms, dedicated support, and team ordering tools.
              </p>
              <div className="inline-flex items-center gap-2 text-white font-medium group-hover:gap-4 transition-all">
                Apply for B2B Account
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>

          {/* GSA Promo */}
          <Link
            href="/gsa"
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-8 lg:p-12"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <BadgeCheck className="w-12 h-12 text-white/80 mb-6" />
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                GSA Advantage
              </h3>
              <p className="text-blue-100 mb-6 max-w-sm">
                Approved GSA Schedule holder. Shop with your government purchase card.
              </p>
              <div className="inline-flex items-center gap-2 text-white font-medium group-hover:gap-4 transition-all">
                Shop GSA Pricing
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
