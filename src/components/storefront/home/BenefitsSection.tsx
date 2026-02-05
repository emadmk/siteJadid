'use client';

import { Truck, ShieldCheck, CreditCard, Headphones, Award, RefreshCcw } from 'lucide-react';

const benefits = [
  {
    icon: Truck,
    title: 'Fast Shipping',
    description: 'Same-day dispatch before 2PM EST. Reliable delivery nationwide.',
  },
  {
    icon: ShieldCheck,
    title: 'ANSI Certified',
    description: 'All products meet or exceed ANSI/ISEA safety standards.',
  },
  {
    icon: CreditCard,
    title: 'Secure Payment',
    description: '256-bit SSL encryption. All major cards accepted.',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Expert safety advisors ready to help anytime.',
  },
  {
    icon: Award,
    title: 'Quality Guaranteed',
    description: 'Premium brands you know and trust.',
  },
  {
    icon: RefreshCcw,
    title: 'Easy Returns',
    description: '30-day hassle-free return policy.',
  },
];

export function BenefitsSection() {
  return (
    <section className="py-16 bg-white border-y border-gray-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-black mb-3">Why Choose ADA Supplies?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We're committed to keeping your team safe with quality products and exceptional service.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-safety-green-100 rounded-2xl flex items-center justify-center group-hover:bg-safety-green-600 transition-colors">
                <benefit.icon className="w-8 h-8 text-safety-green-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-semibold text-black mb-2">{benefit.title}</h3>
              <p className="text-sm text-gray-500">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
