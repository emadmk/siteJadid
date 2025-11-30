'use client';

import { useState } from 'react';
import { X, Truck, Phone, Clock } from 'lucide-react';
import Link from 'next/link';

export function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-black text-white text-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2">
          {/* Left - Promo */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-safety-green-400" />
              <span>Free Shipping on Orders $99+</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-safety-green-400" />
              <span>Same Day Shipping Before 2PM</span>
            </div>
          </div>

          {/* Center - Main message (mobile shows this) */}
          <div className="flex-1 md:flex-none text-center">
            <Link href="/products" className="hover:text-safety-green-400 transition-colors">
              <span className="font-medium">Winter Sale:</span> Up to 30% off Safety Gear
            </Link>
          </div>

          {/* Right - Contact */}
          <div className="hidden md:flex items-center gap-4">
            <a href="tel:1-800-ADA-SAFE" className="flex items-center gap-2 hover:text-safety-green-400 transition-colors">
              <Phone className="w-4 h-4" />
              <span>1-800-ADA-SAFE</span>
            </a>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              aria-label="Close announcement"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
