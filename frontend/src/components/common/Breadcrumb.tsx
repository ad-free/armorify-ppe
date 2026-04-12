// src/components/common/Breadcrumb.tsx
import React from 'react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<Props> = ({ items }) => {
  return (
    <nav className="text-sm my-4 overflow-x-auto hide-scrollbar whitespace-nowrap">
      <ol className="flex items-center space-x-2">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;

          return (
            <li key={idx} className="flex items-center">
              {item.href && !isLast ? (
                <Link to={item.href} className="text-muted-foreground hover:text-primary transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={`max-w-[200px] truncate sm:max-w-none ${isLast ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className="mx-2 text-muted-foreground" aria-hidden="true">&rsaquo;</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
