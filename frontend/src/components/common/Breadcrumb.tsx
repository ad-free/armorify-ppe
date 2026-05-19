// src/components/common/Breadcrumb.tsx
import React from 'react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
  variant?: 'default' | 'dark';
}

export const Breadcrumb: React.FC<Props> = ({ items, variant = 'default' }) => {
  const isDark = variant === 'dark';

  return (
    <nav className={`text-sm overflow-x-auto hide-scrollbar whitespace-nowrap ${isDark ? 'my-0' : 'my-4'}`}>
      <ol className="flex items-center space-x-2">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;

          return (
            <li key={idx} className="flex items-center">
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className={`transition-colors ${
                    isDark
                      ? 'text-gray-400 hover:text-white'
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <span className={`max-w-[200px] truncate sm:max-w-none ${
                  isLast
                    ? isDark ? 'text-white font-medium' : 'text-foreground font-medium'
                    : isDark ? 'text-gray-400' : 'text-muted-foreground'
                }`}>
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className={`mx-2 ${isDark ? 'text-gray-500' : 'text-muted-foreground'}`} aria-hidden="true">&rsaquo;</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
