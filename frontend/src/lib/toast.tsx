import React from 'react';
import toast, { Toast } from 'react-hot-toast';
import { AlertCircle, CheckCircle2, LogOut, Info, X } from 'lucide-react';
import i18n from '../i18n';

type ToastKind = 'success' | 'error' | 'info' | 'logout';

const TOAST_CONFIG: Record<ToastKind, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  success: {
    icon: CheckCircle2,
    color: '#0da487',
    bg: 'bg-emerald-50/90',
    border: 'border-emerald-100',
  },
  error: {
    icon: AlertCircle,
    color: '#ef4444',
    bg: 'bg-rose-50/90',
    border: 'border-rose-100',
  },
  info: {
    icon: Info,
    color: '#3b82f6',
    bg: 'bg-blue-50/90',
    border: 'border-blue-100',
  },
  logout: {
    icon: LogOut,
    color: '#6366f1',
    bg: 'bg-indigo-50/90',
    border: 'border-indigo-100',
  },
};

/**
 * Hiển thị Toast thông minh: 
 * - Chống lặp (duplicate) bằng cách sử dụng message làm ID
 * - Thiết kế nhỏ gọn, tinh tế hơn
 */
const showPremiumToast = (kind: ToastKind, title: string, description?: string) => {
  const config = TOAST_CONFIG[kind];
  const Icon = config.icon;
  // Sử dụng title làm ID để các toast trùng lặp sẽ ghi đè lên nhau thay vì hiện nhiều cái
  const toastId = `toast-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return toast.custom(
    (t: Toast) => (
      <div
        className={`${
          t.visible ? 'animate-in fade-in slide-in-from-right-5 duration-300' : 'animate-out fade-out slide-out-to-right-5 duration-200'
        } pointer-events-auto flex w-full max-w-[320px] rounded-2xl bg-white/95 backdrop-blur-md border ${config.border} shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-3.5 transition-all`}
      >
        <div className="flex items-start gap-3 w-full">
          <div 
            className={`flex-shrink-0 w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center mt-0.5`}
          >
            <Icon size={18} style={{ color: config.color }} strokeWidth={3} />
          </div>
          
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-[13px] font-black text-gray-900 leading-snug">
              {title}
            </h3>
            {description && (
              <p className="text-[11px] font-bold text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 p-1 rounded-lg text-gray-300 hover:text-gray-400 transition-all"
          >
            <X size={14} strokeWidth={3} />
          </button>
        </div>
      </div>
    ),
    { 
      id: toastId, // Quan trọng: Chống hiển thị 2 lần
      duration: kind === 'error' ? 4000 : 2500,
      position: 'top-right'
    }
  );
};

export const authToast = {
  success: (title: string, desc?: string) => showPremiumToast('success', title, desc),
  error: (title: string, desc?: string) => showPremiumToast('error', title, desc),
  info: (title: string, desc?: string) => showPremiumToast('info', title, desc),
  loginSuccess: () =>
    showPremiumToast('success', i18n.t('toast.auth.loginSuccessTitle'), i18n.t('toast.auth.loginSuccessDescription')),
  loginError: () =>
    showPremiumToast('error', i18n.t('toast.auth.loginErrorTitle'), i18n.t('toast.auth.loginErrorDescription')),
  logoutSuccess: () =>
    showPremiumToast('logout', i18n.t('toast.auth.logoutSuccessTitle'), i18n.t('toast.auth.logoutSuccessDescription')),
};
