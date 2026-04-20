import React from 'react';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle2, LogOut, Info, X } from 'lucide-react';
import i18n from '../i18n';

type ToastKind = 'success' | 'error' | 'info' | 'logout';

const TOAST_CONFIG: Record<ToastKind, { icon: React.ElementType; color: string; bg: string }> = {
  success: {
    icon: CheckCircle2,
    color: '#0da487',
    bg: 'bg-emerald-50',
  },
  error: {
    icon: AlertCircle,
    color: '#ef4444',
    bg: 'bg-rose-50',
  },
  info: {
    icon: Info,
    color: '#3b82f6',
    bg: 'bg-blue-50',
  },
  logout: {
    icon: LogOut,
    color: '#6366f1',
    bg: 'bg-indigo-50',
  },
};

const showPremiumToast = (kind: ToastKind, title: string, description?: string) => {
  const config = TOAST_CONFIG[kind];
  const Icon = config.icon;

  return toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-in fade-in slide-in-from-right-10' : 'animate-out fade-out slide-out-to-right-10'
        } pointer-events-auto flex w-full max-w-sm rounded-[1.5rem] bg-white/95 backdrop-blur-xl border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-4 transition-all duration-300`}
      >
        <div className="flex items-center gap-4 w-full">
          <div 
            className={`flex-shrink-0 w-12 h-12 rounded-2xl ${config.bg} flex items-center justify-center`}
          >
            <Icon size={24} style={{ color: config.color }} strokeWidth={2.5} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-black text-gray-900 leading-tight">
              {title}
            </h3>
            {description && (
              <p className="text-[12px] font-medium text-gray-500 mt-0.5 line-clamp-2">
                {description}
              </p>
            )}
          </div>

          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 p-1 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-all"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </div>
      </div>
    ),
    { duration: kind === 'error' ? 5000 : 3500 }
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
