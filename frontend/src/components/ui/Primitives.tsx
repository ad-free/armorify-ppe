import React from 'react';
import { AlertCircle, Package } from 'lucide-react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', loading = false, disabled, className, children, type = 'button', ...props }, ref) => {
    const variants = { primary: 'btn-primary', secondary: 'btn-secondary', ghost: 'btn-ghost', danger: 'btn-danger' };
    return (
      <button {...props} ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined}
        className={clsx('btn', variants[variant], className)}>
        {loading && <span aria-hidden="true" className="h-4 w-4 rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

interface FeedbackStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  variant?: 'empty' | 'error';
}

export const FeedbackState = ({ title, description, variant = 'empty', children, className, ...props }: FeedbackStateProps) => {
  const Icon = variant === 'error' ? AlertCircle : Package;
  return (
    <div {...props} role={variant === 'error' ? 'alert' : 'status'} className={clsx('empty-state', className)}>
      <Icon aria-hidden="true" size={28} className={variant === 'error' ? 'text-destructive' : 'text-muted-foreground'} />
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {description && <p className="text-body max-w-md">{description}</p>}
      {children}
    </div>
  );
};

export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props} aria-hidden="true" className={clsx('skeleton', className)} />
);
