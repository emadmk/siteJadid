'use client';

import { useEffect, useRef } from 'react';

const companies = [
  'Warner Robins AFB',
  'Boeing',
  'Northrop Grumman',
  'Perdue',
  'Frito-Lay',
  'Enterprise',
  'Pratt Industries',
  'LDI (Liberty Disposal)',
  'City of Warner Robins',
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
      <div className="container mx-auto px-4 mb-4">
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
            className="flex-shrink-0 mx-4 px-8 py-4 bg-white/10 backdrop-blur rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
          >
            <span className="text-white font-medium text-base whitespace-nowrap">
              {company}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
