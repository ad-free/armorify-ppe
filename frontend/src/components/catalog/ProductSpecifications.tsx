import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { normalizeSpecs } from './productFacts';

interface ProductSpecificationsProps {
  specifications: unknown;
}

export const ProductSpecifications: React.FC<ProductSpecificationsProps> = ({ specifications }) => {
  const { t } = useTranslation();
  const rows = useMemo(() => normalizeSpecs(specifications), [specifications]);

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-muted px-4 py-6 text-sm leading-relaxed text-muted-foreground">
        {t('productDetail.specsEmpty')}
      </p>
    );
  }

  return (
    <dl className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface">
      {rows.map((row, idx) => (
        <div
          key={`${row.label}-${idx}`}
          className="grid min-w-0 gap-2 border-b border-border p-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-6 sm:p-6"
        >
          <dt className="min-w-0 text-sm font-semibold text-muted-foreground [overflow-wrap:anywhere]">
            {row.label}
          </dt>
          <dd className="min-w-0 whitespace-pre-wrap text-sm font-medium leading-relaxed text-foreground [overflow-wrap:anywhere]">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
};
