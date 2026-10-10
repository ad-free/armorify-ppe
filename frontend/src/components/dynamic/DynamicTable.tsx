import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EntitySchema, PropertySchema } from '../../hooks/useSchema';
import { Settings2, ChevronDown, Check, Columns, MoreVertical, Search } from 'lucide-react';
import { getMediaUrl } from '../../lib/api';
import { Button, FeedbackState, Skeleton } from '@/components/ui/Primitives';

interface DynamicTableProps {
  entityName: string;
  schema: EntitySchema;
  data: Record<string, unknown>[];
  isLoading?: boolean;
  onAdd?: () => void;
  onEdit?: (item: Record<string, unknown>) => void;
  onDelete?: (id: string | number) => void;
  onRestore?: (id: string | number) => void;
  onSort?: (field: string) => void;
}

const renderCell = (
  value: unknown,
  schema: PropertySchema | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
  key: string,
  entityName: string,
  row?: Record<string, unknown>
) => {
  if (value === null || value === undefined || value === '') return <span className="text-caption">—</span>;

  // Render Brand relation beautifully in tables if brand info is preloaded
  if ((key === 'brand_id' || key === 'branch_id') && row && typeof row.brand === 'object' && row.brand !== null) {
    const brand = row.brand as { name?: string; logo_url?: string | null };
    return (
      <div className="flex items-center gap-2">
        {brand.logo_url ? (
          <div className="w-6 h-6 rounded-md overflow-hidden bg-slate-50 border border-slate-100 shrink-0 p-0.5 flex items-center justify-center">
            <img src={getMediaUrl(brand.logo_url)} alt="" className="w-full h-full object-contain" />
          </div>
        ) : null}
        <span className="font-bold text-slate-700 text-xs tracking-tight">{brand.name || '—'}</span>
      </div>
    );
  }

  if (!schema) return <span className="font-bold text-slate-700 tracking-tight text-[14px]">{String(value)}</span>;

  const stringValue = String(value);

  // 0. Handle Images
  const normalizedKey = key.toLowerCase();
  if (typeof value === 'string' && (normalizedKey.includes('image') || normalizedKey.includes('logo') || normalizedKey.includes('avatar') || normalizedKey.includes('picture'))) {
    if (value.startsWith('http') || value.startsWith('/') || value.startsWith('data:image')) {
      return (
        <div className="w-12 h-12 rounded-md overflow-hidden bg-muted border border-border shrink-0">
          <img src={getMediaUrl(value)} alt="" className="w-full h-full object-cover" />
        </div>
      );
    }
  }

  // 1. Handle Boolean (Status/Active/Approved)
  if (schema.type === 'boolean' && typeof value === 'boolean') {
    const boolValue = value;
    const isApprovedField = key === 'is_approved';
    const isActiveField = key === 'is_active';

    let label = boolValue ? t('generic.active') : t('generic.inactive');
    let colorStyle = boolValue ? 'badge-success' : 'badge-neutral';

    // Special logic for Review statuses
    if (entityName === 'review') {
      if (isApprovedField) {
        label = boolValue ? "Đã duyệt" : "Đang chờ duyệt";
        colorStyle = boolValue ? 'badge-success' : 'badge-warning';
      }
      if (isActiveField && !boolValue) {
        label = "Từ chối";
        colorStyle = 'badge-neutral';
      }
    } else if (isApprovedField) {
      label = boolValue ? "Đã duyệt" : "Chờ duyệt";
    }

    return (
      <span className={`badge ${colorStyle}`}>
        {label}
      </span>
    );
  }

  // 2. Handle Roles
  if (key === 'role' || key === 'user_role') {
    const isAdmin = stringValue.toLowerCase() === 'admin';
    return (
      <span className={`badge ${isAdmin ? 'badge-success' : 'badge-neutral'}`}>
        {stringValue}
      </span>
    );
  }

  // 3. Handle Statuses (Order, Payment, etc.)
  if (key.includes('status')) {
    const val = stringValue.toLowerCase();
    let style = 'badge-neutral';

    if (['completed', 'paid', 'success', 'delivered', 'active'].includes(val)) style = 'badge-success';
    if (['pending', 'processing', 'waiting'].includes(val)) style = 'badge-warning';
    if (['failed', 'error'].includes(val)) style = 'badge-error';

    return (
      <span className={`badge ${style}`}>
        {stringValue}
      </span>
    );
  }

  // 4. Handle Dates
  if ((schema.format === 'date-time' || schema.format === 'date') && (typeof value === 'string' || typeof value === 'number')) {
    const date = new Date(value);
    return (
      <div className="flex flex-col">
        <span className="text-slate-700 font-bold text-[13px] tracking-tight">{date.toLocaleDateString('vi-VN')}</span>
        <span className="text-caption mt-0.5">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    );
  }

  // 5. Handle Enums
  if (schema.enum) {
    return (
      <span className="badge badge-neutral">
        {stringValue}
      </span>
    );
  }

  // 6. Handle Objects/Arrays
  if (typeof value === 'object') {
    return (
      <div className="badge badge-neutral w-fit">
        <MoreVertical className="w-3 h-3" />
        {Array.isArray(value) ? t('generic.itemsCount', { count: value.length }) : t('generic.object')}
      </div>
    );
  }

  // 7. Handle UUIDs or Long IDs
  if (key === 'id' || key === 'uuid' || /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(stringValue)) {
    return (
      <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded-sm" title={stringValue}>
        {stringValue.substring(0, 8)}...
      </span>
    );
  }

  // 8. Handle Long Strings
  if (stringValue.length > 50) {
    return (
      <div className="max-w-[250px] group relative cursor-help">
        <span className="truncate block font-bold text-slate-600" title={stringValue}>{stringValue}</span>
      </div>
    );
  }

  return <span className="font-bold text-slate-700 tracking-tight text-[14px]">{stringValue}</span>;
};

export const DynamicTable: React.FC<DynamicTableProps> = ({
  entityName,
  schema,
  data,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
  onRestore,
  onSort,
}) => {
  const { t } = useTranslation();
  const columnSelectorRef = React.useRef<HTMLDivElement>(null);
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Close column selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target as Node)) {
        setIsColumnSelectorOpen(false);
      }
    };

    if (isColumnSelectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isColumnSelectorOpen]);

  const humanizeField = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b(id|sku|url|api|json|csv)\b/gi, (match) => match.toUpperCase())
      .replace(/\b([a-z])/g, (match) => match.toUpperCase());
  };

  const getFieldLabel = (key: string, prop: PropertySchema) => {
    const defaultLabel = prop.title || humanizeField(key);
    const genericKey = t(`generic.fields.${key}`, { defaultValue: defaultLabel });
    return t(`generic.fields.${entityName}.${key}`, { defaultValue: genericKey });
  };

  // 1. Compute all available columns from schema
  const allColumns = useMemo(() => {
    return Object.entries(schema.properties)
      .filter(([_, prop]) => !prop['x-ui-hidden'])
      .sort((a, b) => (a[1]['x-ui-order'] || 0) - (b[1]['x-ui-order'] || 0))
      .map(([key, prop]) => ({
        key,
        title: getFieldLabel(key, prop),
        priority: prop['x-ui-priority'] || false,
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityName, schema.properties, t]);

  // 2. Initialize visible columns state
  const [visibleKeys, setVisibleKeys] = useState<string[]>([]);

  // 3. Load preferences or defaults when entity or columns change
  useEffect(() => {
    const storageKey = `table_cols_${entityName}`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVisibleKeys(parsed);
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved columns", e);
      }
    }

    // Default fallback: Priority columns or first 5
    const priority = allColumns.filter(c => c.priority).map(c => c.key);
    if (priority.length > 0) {
      setVisibleKeys(priority);
    } else {
      setVisibleKeys(allColumns.slice(0, 5).map(c => c.key));
    }
  }, [entityName, allColumns]);

  // 4. Save preferences when they change (but only if we have keys)
  useEffect(() => {
    if (visibleKeys.length > 0) {
      localStorage.setItem(`table_cols_${entityName}`, JSON.stringify(visibleKeys));
    }
  }, [visibleKeys, entityName]);


  const toggleColumn = (key: string) => {
    setVisibleKeys(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  // Active columns for rendering
  const activeColumns = useMemo(() =>
    allColumns.filter(c => visibleKeys.includes(c.key)),
    [allColumns, visibleKeys]
  );

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(row => {
      return Object.entries(row).some(([key, value]) => {
        // Only search visible columns or priority columns
        if (!visibleKeys.includes(key) && !allColumns.find(c => c.key === key)?.priority) return false;
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm, visibleKeys, allColumns]);

  if (isLoading) {
    return (
      <div role="status" className="card p-6 space-y-4">
        <p className="text-body">{t('generic.tableFetching')}...</p>
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      {/* Table Toolbar */}
      <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:justify-between sm:items-center relative z-20">
        <div className="flex flex-1 flex-wrap items-center gap-4 min-w-0">
          <div className="relative flex-1 min-w-40 max-w-md">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              aria-label={t('search.placeholder')}
              placeholder={`${t('search.placeholder')}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="field pl-10"
            />
          </div>
          <div className="text-caption hidden md:block">
            {t('generic.tableSummary', { count: filteredData?.length || 0 })}
          </div>
          {onAdd && (
            <Button onClick={onAdd} className="whitespace-nowrap">
              + {t('generic.createNew')}
            </Button>
          )}
        </div>

        <div className="relative" ref={columnSelectorRef}>
          <Button
            variant="secondary"
            onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)}
            aria-expanded={isColumnSelectorOpen}
            aria-controls={`table-columns-${entityName}`}
          >
            <Columns className="w-4 h-4" />
            {t('generic.tableColumns')}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isColumnSelectorOpen ? 'rotate-180' : ''}`} />
          </Button>

          {isColumnSelectorOpen && (
            <div id={`table-columns-${entityName}`} onKeyDown={(event) => { if (event.key === 'Escape') { setIsColumnSelectorOpen(false); columnSelectorRef.current?.querySelector('button')?.focus(); } }} className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] card shadow-md z-[100] max-h-[400px] overflow-y-auto p-3">
              <div className="px-3 py-3 text-caption border-b border-border mb-2">
                {t('generic.visibleColumns')}
              </div>
              <div className="space-y-1">
                {allColumns.map(col => (
                  <button
                    key={col.key}
                    onClick={() => toggleColumn(col.key)}
                    aria-pressed={visibleKeys.includes(col.key)}
                    className="btn btn-ghost w-full justify-start text-left px-3"
                  >
                    <div aria-hidden="true" className={`w-5 h-5 rounded-sm border flex items-center justify-center ${visibleKeys.includes(col.key) ? 'bg-primary border-primary' : 'bg-surface border-input'}`}>
                      {visibleKeys.includes(col.key) && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                    </div>
                    <span className="truncate">{col.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="table-shell" tabIndex={0} role="region" aria-label={t('generic.tableSummary', { count: filteredData.length })}>
        <table className="w-full min-w-max text-left text-sm border-collapse">
          <thead className="bg-muted border-b border-border">
            <tr>
              {activeColumns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="px-4 py-2 whitespace-nowrap"
                >
                  <button type="button" disabled={!onSort} onClick={() => onSort?.(col.key)} className="btn btn-ghost justify-start px-0">
                    <span>{col.title}</span>
                    {onSort && <Settings2 aria-hidden="true" className="w-4 h-4" />}
                  </button>
                </th>
              ))}
              <th scope="col" className="px-4 py-4 text-right bg-muted sticky right-0 z-10 border-l border-border font-semibold text-muted-foreground whitespace-nowrap">
                {t('generic.tableActions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredData?.length > 0 ? (
              filteredData.map((row, index) => {
                const item = row as Record<string, unknown> & { id?: string | number; is_active?: boolean };
                return (
                  <tr key={item.id || index} className="group hover:bg-muted transition-colors">
                    {activeColumns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-muted-foreground align-middle">
                        {renderCell(item[col.key], schema.properties[col.key], t, col.key, entityName, item)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right bg-surface group-hover:bg-muted sticky right-0 z-10 border-l border-border transition-colors">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          disabled={!onEdit}
                          onClick={() => onEdit?.(item)}
                        >
                          {t('generic.edit')}
                        </Button>
                        <Button
                          variant={item.is_active === false ? 'secondary' : 'danger'}
                          disabled={item.id == null || (item.is_active === false ? !onRestore : !onDelete)}
                          onClick={() => item.is_active === false ? onRestore?.(item.id!) : onDelete?.(item.id!)}
                          title={item.is_active === false ? t('generic.restoreRecord') : t('generic.deactivateRecord')}
                        >
                          {item.is_active === false ? t('generic.restore') : t('generic.delete')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={activeColumns.length + 1} className="p-4">
                  <FeedbackState title={t('generic.noRecords')} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};



