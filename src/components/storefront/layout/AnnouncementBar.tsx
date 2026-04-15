'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export function AnnouncementBar() {
  const [phone, setPhone] = useState('478-329-8896');

  useEffect(() => {
    fetch('/api/storefront/company-info')
      .then(res => res.json())
      .then(data => { if (data.phone) setPhone(data.phone); })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-white border-b border-gray-200 text-[1.3125rem]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2.5">
          {/* Left - Welcome Message */}
          <div className="hidden md:flex items-center">
            <span className="text-gray-700">
              Welcome to <span className="font-semibold text-black">ADA Supplies</span> | Your trusted Industrial & Safety Equipment Supplier!
            </span>
          </div>

          {/* Mobile - Short message */}
          <div className="md:hidden text-gray-700 text-[1.125rem]">
            <span className="font-semibold text-black">ADA Supplies</span> | Safety Equipment
          </div>

          {/* Right - Support & Logos */}
          <div className="flex items-center gap-4 lg:gap-5">
            {/* Support Links */}
            <div className="hidden lg:flex items-center gap-4 text-gray-600 text-[1.125rem]">
              <span>Support: <a href={`tel:${phone}`} className="hover:text-safety-green-600 transition-colors">{phone}</a></span>
              <span className="text-gray-300">|</span>
              <Link href="/contact" className="hover:text-safety-green-600 transition-colors">Contact us</Link>
              <span className="text-gray-300">|</span>
              <Link href="/faq" className="hover:text-safety-green-600 transition-colors">Help</Link>
              <span className="text-gray-300">|</span>
            </div>

            {/* Partner Logos */}
            <div className="flex items-center gap-2.5 lg:gap-3.5">
              {/* FedMall */}
              <Image
                src="/images/imagesite/02.jpg"
                alt="FedMall"
                width={91}
                height={31}
                className="h-7 lg:h-8 w-auto object-contain"
                quality={100}
                unoptimized
              />
              {/* GSA */}
              <Image
                src="/images/imagesite/01.jpg"
                alt="GSA"
                width={36}
                height={36}
                className="h-8 lg:h-9 w-auto object-contain"
                quality={100}
                unoptimized
              />
              {/* AbilityOne & MRO */}
              <Image
                src="/images/imagesite/03.png"
                alt="AbilityOne & MRO"
                width={156}
                height={31}
                className="h-7 lg:h-8 w-auto object-contain hidden sm:block"
                quality={100}
                unoptimized
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
