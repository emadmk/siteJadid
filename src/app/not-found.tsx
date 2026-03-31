'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Home,
  Search,
  ShoppingCart,
  Phone,
  HardHat,
  Shield,
  ArrowRight,
} from 'lucide-react';

// Animated floating safety equipment icons
function FloatingIcon({ children, delay, x, y }: { children: React.ReactNode; delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="absolute text-safety-green-200/40"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{
        y: [0, -15, 0],
        rotate: [0, 5, -5, 0],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}

// Caution tape stripe animation
function CautionTape() {
  return (
    <div className="relative overflow-hidden h-12 my-8">
      <motion.div
        className="absolute whitespace-nowrap flex items-center h-full"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className="inline-flex items-center">
            <span className="bg-yellow-400 text-black font-bold text-sm px-6 py-2 skew-x-[-12deg] inline-block">
              CAUTION
            </span>
            <span className="bg-black text-yellow-400 font-bold text-sm px-6 py-2 skew-x-[-12deg] inline-block">
              AREA NOT FOUND
            </span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Floating safety icons background */}
      <div className="absolute inset-0 pointer-events-none">
        <FloatingIcon delay={0} x={10} y={20}>
          <HardHat className="w-12 h-12" />
        </FloatingIcon>
        <FloatingIcon delay={1} x={80} y={15}>
          <Shield className="w-10 h-10" />
        </FloatingIcon>
        <FloatingIcon delay={2} x={20} y={70}>
          <Shield className="w-8 h-8" />
        </FloatingIcon>
        <FloatingIcon delay={0.5} x={70} y={65}>
          <HardHat className="w-14 h-14" />
        </FloatingIcon>
        <FloatingIcon delay={1.5} x={50} y={10}>
          <HardHat className="w-10 h-10" />
        </FloatingIcon>
        <FloatingIcon delay={3} x={90} y={50}>
          <Shield className="w-12 h-12" />
        </FloatingIcon>
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Caution Tape */}
        <CautionTape />

        {/* Main Content */}
        <div className="text-center max-w-2xl mx-auto">
          {/* Animated 404 */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 100 }}
            className="mb-6"
          >
            <div className="inline-flex items-center justify-center">
              <span className="text-[120px] md:text-[160px] font-black text-transparent bg-clip-text bg-gradient-to-b from-safety-green-600 to-safety-green-800 leading-none">
                4
              </span>
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="mx-1"
              >
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-[8px] border-dashed border-yellow-400 flex items-center justify-center bg-yellow-50">
                  <HardHat className="w-12 h-12 md:w-16 md:h-16 text-yellow-500" />
                </div>
              </motion.div>
              <span className="text-[120px] md:text-[160px] font-black text-transparent bg-clip-text bg-gradient-to-b from-safety-green-600 to-safety-green-800 leading-none">
                4
              </span>
            </div>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Hazard Zone! Page Not Found
            </h1>
            <p className="text-gray-600 text-lg mb-2">
              Looks like this area hasn't been cleared for access yet.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              The page you're looking for may have been moved, removed, or is temporarily under construction.
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-10"
          >
            <form onSubmit={handleSearch} className="flex max-w-md mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-l-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-safety-green-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 bg-safety-green-600 hover:bg-safety-green-700 text-white font-medium rounded-r-xl transition-colors flex items-center gap-2"
              >
                Search
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
              Navigate to safety
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl mx-auto">
              <Link
                href="/"
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-safety-green-300 hover:shadow-lg hover:shadow-safety-green-100/50 transition-all group"
              >
                <Home className="w-6 h-6 text-gray-400 group-hover:text-safety-green-600 transition-colors" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-safety-green-700">Home</span>
              </Link>
              <Link
                href="/categories"
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-safety-green-300 hover:shadow-lg hover:shadow-safety-green-100/50 transition-all group"
              >
                <ShoppingCart className="w-6 h-6 text-gray-400 group-hover:text-safety-green-600 transition-colors" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-safety-green-700">Shop</span>
              </Link>
              <Link
                href="/brands"
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-safety-green-300 hover:shadow-lg hover:shadow-safety-green-100/50 transition-all group"
              >
                <Shield className="w-6 h-6 text-gray-400 group-hover:text-safety-green-600 transition-colors" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-safety-green-700">Brands</span>
              </Link>
              <Link
                href="/contact"
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-safety-green-300 hover:shadow-lg hover:shadow-safety-green-100/50 transition-all group"
              >
                <Phone className="w-6 h-6 text-gray-400 group-hover:text-safety-green-600 transition-colors" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-safety-green-700">Contact</span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Caution Tape Bottom */}
        <CautionTape />
      </div>
    </div>
  );
}
