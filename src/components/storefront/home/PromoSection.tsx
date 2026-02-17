'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Shield, CheckCircle2, Building2 } from 'lucide-react';

// DISABLED: Set to false to re-enable the GSA/B2B/Quote banners
const BANNERS_ENABLED = false;

export function PromoSection() {
  if (!BANNERS_ENABLED) {
    return null;
  }

  return (
    <section className="py-12 lg:py-16">
      <div className="container mx-auto px-4">
        {/* GSA Government Section */}
        <div className="relative overflow-hidden rounded-2xl bg-safety-green-600">
          <div className="grid lg:grid-cols-2 items-center">
            {/* Left Content */}
            <div className="p-8 lg:p-12 xl:p-16">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6">
                <Shield className="w-4 h-4" />
                Government Solutions
              </div>

              {/* Heading */}
              <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4">
                GSA MAS Contract Holder
              </h2>

              {/* Subheading */}
              <p className="text-lg text-white/90 mb-4">
                Streamlined procurement for federal, state & local agencies
              </p>

              {/* Description */}
              <p className="text-white/75 mb-6 max-w-lg">
                As an approved GOV Multiple Award Schedule (MAS) supplier, we provide competitive pricing, full compliance with federal acquisition regulations, and reliable solutions for your operations.
              </p>

              {/* Benefits List */}
              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {[
                  'GOV Schedule Pricing',
                  'Purchase Card Accepted',
                  'TAA Compliant Products',
                  'Fast Federal Shipping',
                ].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2 text-white/90 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                    {benefit}
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Link
                href="/gsa"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-safety-green-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors group"
              >
                Learn More About GOV
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Right Image */}
            <div className="relative h-64 lg:h-full lg:min-h-[400px]">
              {/* Decorative Shape */}
              <div className="absolute inset-0 bg-gradient-to-r from-safety-green-600 via-safety-green-600/50 to-transparent z-10 lg:hidden" />
              <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-safety-green-600 to-transparent z-10" />

              {/* Image Container */}
              <div className="absolute inset-0 lg:inset-y-8 lg:right-8 lg:left-12 overflow-hidden rounded-xl lg:rounded-2xl shadow-2xl">
                <Image
                  src="/images/imagesite/gsaplane.jpg"
                  alt="Military Aircraft - GOV Government Solutions"
                  fill
                  className="object-cover"
                  quality={100}
                  unoptimized
                />
                {/* Subtle overlay for text readability on mobile */}
                <div className="absolute inset-0 bg-black/10" />
              </div>
            </div>
          </div>
        </div>

        {/* B2B Section - Smaller */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          {/* B2B Card */}
          <Link
            href="/b2b"
            className="group relative overflow-hidden rounded-xl bg-gray-900 p-6 lg:p-8 hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  Business & Volume Accounts
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Net-30 terms, volume discounts, dedicated account management, and team ordering tools.
                </p>
                <span className="inline-flex items-center gap-2 text-purple-400 font-medium text-sm group-hover:gap-3 transition-all">
                  Apply for B2B Account
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>

          {/* Quick Quote Card */}
          <Link
            href="/b2b/request-quote"
            className="group relative overflow-hidden rounded-xl bg-gray-900 p-6 lg:p-8 hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-safety-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-safety-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  Request a Custom Quote
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Large orders? Special requirements? Get personalized pricing for your project needs.
                </p>
                <span className="inline-flex items-center gap-2 text-safety-green-400 font-medium text-sm group-hover:gap-3 transition-all">
                  Get a Quote
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
