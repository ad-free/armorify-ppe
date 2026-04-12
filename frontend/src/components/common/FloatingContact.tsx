// src/components/common/FloatingContact.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Phone, MessageCircle, ArrowUp } from 'lucide-react';

export const FloatingContact: React.FC = () => {
  const loc = useLocation();
  const [showScroll, setShowScroll] = useState(false);
  const phone = import.meta.env.VITE_CONTACT_PHONE || "0372371668";

  useEffect(() => {
    const checkScroll = () => {
      if (window.scrollY > 400) {
        setShowScroll(true);
      } else {
        setShowScroll(false);
      }
    };
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  if (loc.pathname.startsWith('/admin')) {
    return null;
  }

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* Scroll to top */}
      {showScroll && (
        <button
          onClick={handleScrollTop}
          className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors w-12 h-12 flex items-center justify-center"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Phone */}
      <a
        href={`tel:+84${phone}`}
        className="bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors w-12 h-12 flex items-center justify-center relative group"
      >
        <Phone className="w-5 h-5" />
        <span className="absolute right-full mr-3 whitespace-nowrap bg-gray-800 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Gọi ngay {phone}
        </span>
      </a>

      {/* Zalo with pulse animation */}
      <motion.a
        href={`https://zalo.me/${phone}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-[#0068ff] text-white p-3 rounded-full shadow-lg hover:bg-[#0052cc] transition-colors w-12 h-12 flex items-center justify-center relative group"
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ repeat: Infinity, duration: 4 }}
      >
        <MessageCircle className="w-5 h-5" />
        <span className="absolute right-full mr-3 whitespace-nowrap bg-gray-800 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Chat Zalo
        </span>
      </motion.a>
    </div>
  );
};
