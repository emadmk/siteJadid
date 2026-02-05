'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

const companies = [
  { name: 'Robins AFB', logo: '/uploads/Robins-AFB.jpeg' },
  { name: 'Boeing', logo: '/uploads/Boeing-Logo.png' },
  { name: 'Northrop Grumman', logo: '/uploads/Northrop-Grumman-Logo.png' },
  { name: 'Perdue', logo: '/uploads/Perdue Logo.png' },
  { name: 'Frito-Lay', logo: '/uploads/FritoLay Logo.png' },
  { name: 'Enterprise', logo: '/uploads/Enterprise logo.png' },
  { name: 'Pratt Industries', logo: '/uploads/Pratt Industries Logo.png' },
  { name: 'LDI (Liberty Disposal)', logo: '/uploads/LDI - Liberty Disposal.png' },
  { name: 'City of Warner Robins', logo: '/uploads/City of Warner Robins.png' },
];

export function ProudlySupplyBanner() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let scrollPosition = 0;
    const speed = 0.5;

    const animate = () => {
      scrollPosition += speed;
      if (scrollContainer.scrollWidth > 0) {
        // Reset when we've scrolled half (since content is duplicated)
        if (scrollPosition >= scrollContainer.scrollWidth / 2) {
          scrollPosition = 0;
        }
        scrollContainer.scrollLeft = scrollPosition;
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <section className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-8 overflow-hidden">
      <div className="container mx-auto px-4 mb-6">
        <h3 className="text-center text-white text-lg font-semibold mb-2">
          Companies We Proudly Supply
        </h3>
        <div className="w-24 h-1 bg-safety-green-500 mx-auto rounded-full"></div>
      </div>

      <div
        ref={scrollRef}
        className="flex overflow-hidden whitespace-nowrap"
        style={{ scrollBehavior: 'auto' }}
      >
        {/* Duplicate content for seamless loop */}
        {[...companies, ...companies].map((company, index) => (
          <div
            key={index}
            className="flex-shrink-0 mx-4 px-6 py-4 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
            style={{ minWidth: '180px', height: '100px' }}
          >
            <Image
              src={company.logo}
              alt={company.name}
              width={150}
              height={70}
              className="object-contain max-h-16"
              style={{ width: 'auto', height: 'auto', maxHeight: '64px', maxWidth: '150px' }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
