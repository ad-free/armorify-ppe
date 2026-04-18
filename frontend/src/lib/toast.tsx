import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle2, LogOut } from 'lucide-react';
import i18n from '../i18n';

type AuthToastKind = 'success' | 'error' | 'logout';

const TOAST_STYLES: Record<AuthToastKind, { icon: typeof CheckCircle2; iconClass: string; ringClass: string }> = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-500',
    ringClass: 'ring-emerald-100',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-rose-500',
    ringClass: 'ring-rose-100',
  },
  logout: {
    icon: LogOut,
    iconClass: 'text-indigo-500',
    ringClass: 'ring-indigo-100',
  },
};

const showAuthToast = (kind: AuthToastKind, title: string, description: string) => {
  const style = TOAST_STYLES[kind];
  const Icon = style.icon;

  return toast.custom(
    (t) => (
      <div
        className={`pointer-events-auto w-[340px] rounded-xl bg-white px-4 py-3 shadow-lg ring-1 transition-all duration-300 ${
          style.ringClass
        } ${t.visible ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-2 scale-95 opacity-0'}`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <Icon className={`h-5 w-5 ${style.iconClass}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="mt-0.5 text-xs text-slate-600">{description}</p>
          </div>
        </div>
      </div>
    ),
    { duration: kind === 'error' ? 4200 : 3000 }
  );
};

export const authToast = {
  loginSuccess: () =>
    showAuthToast('success', i18n.t('toast.auth.loginSuccessTitle'), i18n.t('toast.auth.loginSuccessDescription')),
  loginError: () =>
    showAuthToast('error', i18n.t('toast.auth.loginErrorTitle'), i18n.t('toast.auth.loginErrorDescription')),
  logoutSuccess: () =>
    showAuthToast('logout', i18n.t('toast.auth.logoutSuccessTitle'), i18n.t('toast.auth.logoutSuccessDescription')),
};
