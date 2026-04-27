import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export type SpecRow = { label: string; value: string };

function normalizeSpecs(raw: unknown): SpecRow[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.flatMap((row) => {
      if (row && typeof row === 'object' && 'name' in row && 'value' in row) {
        const o = row as { name: unknown; value: unknown };
        return [{ label: String(o.name), value: String(o.value) }];
      }
      return [];
    });
  }
  if (typeof raw === 'object') {
    return Object.entries(raw as Record<string, unknown>).map(([k, v]) => {
      // If the key looks like a slug (has underscores, no spaces), normalize it.
      // Otherwise, assume it's a user-entered label and keep it as is.
      const label = (!k.includes(' ') && k.includes('_'))
        ? k.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
        : k;

      return {
        label,
        value: v === null || v === undefined ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v),
      };
    });
  }
  return [];
}

interface ProductSpecificationsProps {
  specifications: unknown;
}

export const ProductSpecifications: React.FC<ProductSpecificationsProps> = ({ specifications }) => {
  const { t } = useTranslation();
  const rows = useMemo(() => normalizeSpecs(specifications), [specifications]);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-slate-500 leading-relaxed py-4 text-center bg-slate-50/80 rounded-xl border border-slate-100">
        {t('productDetail.specsEmpty')}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_4px_25px_rgba(0,0,0,0.04)]">
      <table className="w-full text-[13px] sm:text-sm border-collapse">
        <tbody className="divide-y divide-slate-100/50">
          {rows.map((row, idx) => (
            <tr key={`${row.label}-${idx}`} className="group hover:bg-slate-50/40 transition-all duration-300">
              <th
                scope="row"
                className="w-[32%] sm:w-[28%] max-w-[200px] align-top px-6 py-5 text-left bg-slate-50/30 group-hover:bg-primary/5 transition-colors"
              >
                <span className="font-bold text-slate-800 leading-snug break-words">
                  {row.label}
                </span>
              </th>
              <td className="px-6 py-5 align-top">
                <p className="text-slate-600 font-medium leading-relaxed break-words whitespace-pre-wrap">
                  {row.value}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
