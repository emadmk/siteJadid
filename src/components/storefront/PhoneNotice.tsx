'use client';

import { useState, useEffect } from 'react';
import { X, Phone, MapPin, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PhoneNotice() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    const wasDismissed = sessionStorage.getItem('phone-notice-dismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }
    // Slight delay for smooth entrance
    const timer = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setShow(false);
    setTimeout(() => setDismissed(true), 400);
    sessionStorage.setItem('phone-notice-dismissed', 'true');
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999]"
            onClick={handleDismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full pointer-events-auto overflow-hidden">
              {/* Green accent bar */}
              <div className="h-1.5 bg-gradient-to-r from-safety-green-500 via-safety-green-600 to-emerald-600" />

              {/* Content */}
              <div className="p-8">
                {/* Icon */}
                <div className="flex justify-center mb-5">
                  <div className="relative">
                    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100">
                      <MapPin className="w-8 h-8 text-amber-600" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                      <AlertTriangle className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Heading */}
                <h2 className="text-xl font-bold text-gray-900 text-center mb-3">
                  We're Moving to a New Location!
                </h2>

                {/* Message */}
                <p className="text-gray-600 text-center text-sm leading-relaxed mb-6">
                  As we transition to our new facility, we are experiencing temporary issues
                  with our telephone system. We expect this to be fully resolved in the coming days.
                </p>

                {/* Temporary Number */}
                <div className="bg-gradient-to-br from-safety-green-50 to-emerald-50 rounded-xl p-5 border border-safety-green-100 mb-6">
                  <div className="text-center">
                    <div className="text-xs font-semibold text-safety-green-700 uppercase tracking-wider mb-2">
                      Temporary Contact Number
                    </div>
                    <a
                      href="tel:+14782948684"
                      className="inline-flex items-center gap-3 text-2xl font-bold text-safety-green-700 hover:text-safety-green-800 transition-colors"
                    >
                      <Phone className="w-6 h-6" />
                      (478) 294-8684
                    </a>
                    <div className="text-xs text-safety-green-600 mt-2">
                      Mon-Fri 8AM-6PM &bull; Sat 9AM-2PM
                    </div>
                  </div>
                </div>

                {/* Dismiss */}
                <button
                  onClick={handleDismiss}
                  className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors text-sm"
                >
                  Got it, thanks!
                </button>

                <p className="text-center text-xs text-gray-400 mt-3">
                  We apologize for any inconvenience and appreciate your patience.
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
