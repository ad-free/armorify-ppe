import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EntitySchema, PropertySchema } from '../../hooks/useSchema';
import { Settings2, ChevronDown, Check, Columns, MoreVertical } from 'lucide-react';

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

  if (isLoading) {
    return (
      <div className="p-24 flex flex-col items-center justify-center space-y-6 bg-white rounded-[2rem] border border-gray-100">
        <div className="w-14 h-14 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
        <p className="text-gray-400 font-black text-xs uppercase tracking-[0.2em]">{t('generic.tableFetching')}...</p>
      </div>
    );
  }

  // Active columns for rendering
  const activeColumns = allColumns.filter(c => visibleKeys.includes(c.key));

  return (
    <div className="space-y-6 min-w-0">
      {/* Table Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] relative z-20">
        <div className="flex items-center gap-6">
          <div className="text-[13px] font-bold text-gray-700 px-2 uppercase tracking-wide">
            {t('generic.tableSummary', { count: data?.length || 0 })}
          </div>
          {onAdd && (
            <button 
              onClick={onAdd}
              className="inline-flex items-center px-4 py-2 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/90 transition-all text-[11px] uppercase tracking-widest active:scale-95"
            >
               + {t('generic.createNew')}
            </button>
          )}
        </div>
        
        <div className="relative" ref={columnSelectorRef}>
          <button 
            onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)}
            className="inline-flex items-center gap-3 px-5 py-2.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:border-primary hover:text-primary transition-all shadow-sm uppercase tracking-widest"
          >
            <Columns className="w-4 h-4" />
            {t('generic.tableColumns')}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isColumnSelectorOpen ? 'rotate-180' : ''}`} />
          </button>

          {isColumnSelectorOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-100 rounded-3xl shadow-[0_20px_50px_rgba(13,164,135,0.2)] z-[100] max-h-[400px] overflow-y-auto p-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 mb-2">
                  {t('generic.visibleColumns')}
                </div>
                <div className="space-y-1">
                  {allColumns.map(col => (
                    <button
                      key={col.key}
                      onClick={() => toggleColumn(col.key)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 rounded-2xl transition-all text-left group"
                    >
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${visibleKeys.includes(col.key) ? 'bg-primary border-primary' : 'bg-white border-gray-200 group-hover:border-primary'}`}>
                        {visibleKeys.includes(col.key) && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                      </div>
                      <span className={`truncate font-bold ${visibleKeys.includes(col.key) ? 'text-gray-900' : 'text-gray-400'}`}>{col.title}</span>
                    </button>
                  ))}
                </div>
              </div>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="relative max-w-full overflow-x-auto overflow-y-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.03)] selection:bg-primary/10">
        <table className="w-full min-w-max text-left text-sm border-collapse">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              {activeColumns.map((col) => (
                <th
                  key={col.key} 
                  className="px-8 py-6 cursor-pointer hover:bg-gray-100/50 transition-colors group whitespace-nowrap"
                  onClick={() => onSort?.(col.key)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-500 uppercase tracking-[0.1em] text-[11px]">{col.title}</span>
                    <Settings2 className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary transition-colors" />
                  </div>
                </th>
              ))}
              <th className="px-8 py-6 text-right bg-gray-50/80 sticky right-0 z-10 border-l border-gray-100 font-bold text-gray-500 uppercase tracking-[0.1em] text-[11px] whitespace-nowrap">
                {t('generic.tableActions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data?.length > 0 ? (
              data.map((row, index) => {
                const item = row as Record<string, unknown> & { id?: string | number; is_active?: boolean };
                return (
                  <tr key={item.id || index} className="group hover:bg-slate-50/50 transition-all border-b border-slate-50 last:border-none">
                  {activeColumns.map((col) => (
                    <td key={col.key} className="px-8 py-5 text-slate-600 align-middle">
                      {renderCell(item[col.key], schema.properties[col.key], t, col.key)}
                    </td>
                  ))}
                  <td className="px-8 py-5 text-right bg-white/95 group-hover:bg-slate-50/95 sticky right-0 z-10 border-l border-slate-50 shadow-[-10px_0_30px_rgba(15,23,42,0.02)] transition-all">
                    <div className="flex items-center justify-end gap-3">
                       <button 
                        onClick={() => onEdit?.(item)}
                        className="px-4 py-2 text-primary bg-primary/5 hover:bg-primary hover:text-white rounded-xl transition-all font-bold text-[10px] uppercase tracking-wider"
                      >
                        {t('generic.edit')}
                      </button>
                      <button 
                        onClick={() => item.is_active === false ? onRestore?.(item.id!) : onDelete?.(item.id!)}
                        className={`px-4 py-2 rounded-xl transition-all font-bold text-[10px] uppercase tracking-wider ${
                          item.is_active === false 
                            ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white' 
                            : 'text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white'
                        }`}
                        title={item.is_active === false ? t('generic.restoreRecord') : t('generic.deactivateRecord')}
                      >
                        {item.is_active === false ? t('generic.restore') : t('generic.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={activeColumns.length + 1} className="px-8 py-24 text-center text-slate-300 font-bold italic text-sm">
                  {t('generic.noRecords')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const renderCell = (value: unknown, schema: PropertySchema, t: (key: string, options?: Record<string, unknown>) => string, key: string) => {
  if (value === null || value === undefined || value === '') return <span className="text-slate-200 font-bold italic text-[11px]">N/A</span>;

  const stringValue = String(value);

  // 0. Handle Images
  const normalizedKey = key.toLowerCase();
  if (typeof value === 'string' && (normalizedKey.includes('image') || normalizedKey.includes('logo') || normalizedKey.includes('avatar') || normalizedKey.includes('picture'))) {
    if (value.startsWith('http') || value.startsWith('/') || value.startsWith('data:image')) {
      return (
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0 shadow-sm hover:scale-110 transition-transform">
          <img src={value} alt="" className="w-full h-full object-cover" />
        </div>
      );
    }
  }

  // 1. Handle Boolean (Status/Active)
  if (schema.type === 'boolean' && typeof value === 'boolean') {
    const isActive = value;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
        isActive 
          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
          : 'bg-rose-50 text-rose-500 border border-rose-100'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
        {isActive ? t('generic.active') : t('generic.inactive')}
      </span>
    );
  }

  // 2. Handle Roles
  if (key === 'role' || key === 'user_role') {
    const isAdmin = stringValue.toLowerCase() === 'admin';
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] ${
        isAdmin ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-500 border border-slate-100'
      }`}>
        {stringValue}
      </span>
    );
  }

  // 3. Handle Statuses (Order, Payment, etc.)
  if (key.includes('status')) {
    const val = stringValue.toLowerCase();
    let style = 'bg-slate-50 text-slate-500 border-slate-100';
    
    if (['completed', 'paid', 'success', 'delivered', 'active'].includes(val)) style = 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (['pending', 'processing', 'waiting'].includes(val)) style = 'bg-amber-50 text-amber-600 border-amber-100';
    if (['cancelled', 'failed', 'refunded', 'error', 'inactive'].includes(val)) style = 'bg-rose-50 text-rose-600 border-rose-100';
    if (['shipping', 'shipped'].includes(val)) style = 'bg-blue-50 text-blue-600 border-blue-100';

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${style}`}>
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
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    );
  }

  // 5. Handle Enums
  if (schema.enum) {
    return (
      <span className="inline-flex items-center px-3 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-[10px] font-bold uppercase tracking-widest">
        {stringValue}
      </span>
    );
  }

  // 6. Handle Objects/Arrays
  if (typeof value === 'object') {
    return (
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 w-fit uppercase tracking-tighter">
        <MoreVertical className="w-3 h-3" />
        {Array.isArray(value) ? t('generic.itemsCount', { count: value.length }) : t('generic.object')}
      </div>
    );
  }

  // 7. Handle UUIDs or Long IDs
  if (key === 'id' || key === 'uuid' || /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(stringValue)) {
    return (
      <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-50/50 px-2 py-1 rounded-lg border border-slate-100" title={stringValue}>
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

