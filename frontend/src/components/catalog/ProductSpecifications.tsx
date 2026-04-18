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
    return Object.entries(raw as Record<string, unknown>).map(([k, v]) => ({
      label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      value: v === null || v === undefined ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v),
    }));
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
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, idx) => (
            <tr key={`${row.label}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
              <th
                scope="row"
                className="w-[38%] max-w-[220px] align-top px-4 py-3 text-left font-semibold text-slate-700 bg-slate-50/60 border-r border-slate-100"
              >
                {row.label}
              </th>
              <td className="px-4 py-3 text-slate-600 leading-relaxed">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
