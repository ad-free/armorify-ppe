import React from 'react';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle2, LogOut, Info } from 'lucide-react';
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

let lastToastTime = 0;

const showPremiumToast = (kind: ToastKind, title: string, description?: string) => {
  const now = Date.now();
  if (now - lastToastTime < 500) {
    return; // Ignore duplicate calls within 500ms
  }
  lastToastTime = now;

  toast.dismiss(); // Softly clear existing toasts

  const content = (
    <div className="flex flex-col text-left">
      <span className="font-bold text-[13px] leading-snug">{title}</span>
      {description && <span className="text-[11px] font-bold text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{description}</span>}
    </div>
  );

  const duration = kind === 'error' ? 4000 : 2500;
  const options = { duration, position: 'top-right' as const };

  if (kind === 'success') {
    return toast.success(content, options);
  } else if (kind === 'error') {
    return toast.error(content, options);
  } else {
    const config = TOAST_CONFIG[kind];
    const Icon = config.icon;
    return toast(content, {
      ...options,
      icon: <Icon size={18} style={{ color: config.color }} strokeWidth={3} />
    });
  }
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
