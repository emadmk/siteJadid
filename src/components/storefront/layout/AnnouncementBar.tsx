'use client';

import Image from 'next/image';
import Link from 'next/link';

export function AnnouncementBar() {
  return (
    <div className="bg-white border-b border-gray-200 text-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2">
          {/* Left - Welcome Message */}
          <div className="hidden md:flex items-center">
            <span className="text-gray-700">
              Welcome to <span className="font-semibold text-black">Ada Supply</span> | Industrial & Safety Equipment Supplier
            </span>
          </div>

          {/* Mobile - Short message */}
          <div className="md:hidden text-gray-700 text-xs">
            <span className="font-semibold text-black">Ada Supply</span> | Safety Equipment
          </div>

          {/* Right - Support & Logos */}
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Support Links */}
            <div className="hidden lg:flex items-center gap-3 text-gray-600 text-xs">
              <span>Support: <a href="tel:1-800-XXX-XXXX" className="hover:text-safety-green-600 transition-colors">1-800-XXX-XXXX</a></span>
              <span className="text-gray-300">|</span>
              <Link href="/contact" className="hover:text-safety-green-600 transition-colors">Live Chat</Link>
              <span className="text-gray-300">|</span>
              <Link href="/help" className="hover:text-safety-green-600 transition-colors">Help</Link>
              <span className="text-gray-300">|</span>
            </div>

            {/* Partner Logos */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* FedMall */}
              <Image
                src="/images/imagesite/02.jpg"
                alt="FedMall"
                width={70}
                height={24}
                className="h-5 lg:h-6 w-auto object-contain"
              />
              {/* GSA */}
              <Image
                src="/images/imagesite/01.jpg"
                alt="GSA"
                width={28}
                height={28}
                className="h-6 lg:h-7 w-auto object-contain"
              />
              {/* AbilityOne & MRO */}
              <Image
                src="/images/imagesite/03.png"
                alt="AbilityOne & MRO"
                width={120}
                height={24}
                className="h-5 lg:h-6 w-auto object-contain hidden sm:block"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
