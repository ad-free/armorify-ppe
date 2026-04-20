// src/components/common/FloatingContact.tsx — Premium Support Stack
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Phone, MessageCircle, ArrowUp } from 'lucide-react';

export const FloatingContact: React.FC = () => {
  const loc = useLocation();
  const [showScroll, setShowScroll] = useState(false);
  const phone = import.meta.env.VITE_CONTACT_PHONE || "0372.371.668";

  useEffect(() => {
    const checkScroll = () => setShowScroll(window.scrollY > 400);
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  if (loc.pathname.startsWith('/admin')) return null;

  const handleScrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="fixed bottom-10 right-10 z-50 flex flex-col gap-5 items-end">
      <AnimatePresence>
        {showScroll && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={handleScrollTop}
            className="w-14 h-14 bg-white text-gray-900 rounded-2xl shadow-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer group"
          >
            <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" strokeWidth={3} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Phone Support */}
      <motion.a
        href={`tel:${phone.replace(/\./g, '')}`}
        whileHover={{ scale: 1.1, y: -5 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-primary text-white rounded-2xl shadow-2xl shadow-primary/30 flex items-center justify-center relative group"
      >
        <Phone className="w-6 h-6 fill-white" />
        <div className="absolute inset-0 rounded-2xl bg-primary animate-ping opacity-20 pointer-events-none" />
        
        {/* Tooltip */}
        <span className="absolute right-[120%] whitespace-nowrap bg-gray-900/90 backdrop-blur-md text-white text-[11px] font-black px-4 py-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 pointer-events-none tracking-widest uppercase border border-white/10 shadow-2xl">
          Hotline: {phone}
        </span>
      </motion.a>

      {/* Zalo Chat */}
      <motion.a
        href={`https://zalo.me/${phone.replace(/\./g, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.1, y: -5 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-[#0068ff] text-white rounded-2xl shadow-2xl shadow-blue-500/30 flex items-center justify-center relative group"
      >
        <MessageCircle className="w-7 h-7 fill-white" />
        
        {/* Tooltip */}
        <span className="absolute right-[120%] whitespace-nowrap bg-gray-900/90 backdrop-blur-md text-white text-[11px] font-black px-4 py-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 pointer-events-none tracking-widest uppercase border border-white/10 shadow-2xl">
          Chat Zalo ngay
        </span>
      </motion.a>
    </div>
  );
};

