import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Phone, MessageCircle, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/Primitives';

export const FloatingContact: React.FC = () => {
  const { pathname } = useLocation();
  const { i18n } = useTranslation();
  const [showScroll, setShowScroll] = useState(false);
  const phone = import.meta.env.VITE_CONTACT_PHONE || '0372.371.668';
  const en = i18n.language.startsWith('en');
  const productPage = pathname.startsWith('/products/');

  useEffect(() => {
    const checkScroll = () => setShowScroll(window.scrollY > 400);
    checkScroll();
    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  if (pathname.startsWith('/admin')) return null;

  // Product details already expose support links; avoid covering mobile purchase controls.
  return (
    <nav aria-label={en ? 'Quick support' : 'Hỗ trợ nhanh'} className={`fixed bottom-6 right-4 z-40 flex-col items-end gap-3 ${productPage ? 'hidden md:flex' : 'flex'}`}>
      {showScroll && (
        <Button variant="secondary" className="btn-icon shadow-sm" aria-label={en ? 'Back to top' : 'Về đầu trang'}
          onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}>
          <ArrowUp size={20} aria-hidden="true" />
        </Button>
      )}
      <a href={`tel:${phone.replace(/\./g, '')}`} className="btn btn-primary btn-icon shadow-sm" aria-label={`${en ? 'Call support' : 'Gọi hỗ trợ'}: ${phone}`}>
        <Phone size={20} aria-hidden="true" />
      </a>
      <a href={`https://zalo.me/${phone.replace(/\./g, '')}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-icon shadow-sm" aria-label={en ? 'Chat on Zalo (new tab)' : 'Chat Zalo (tab mới)'}>
        <MessageCircle size={20} aria-hidden="true" />
      </a>
    </nav>
  );
};
