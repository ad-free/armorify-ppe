import React, { useState, useMemo, useEffect } from 'react';
import { EntitySchema, PropertySchema } from '../../hooks/useSchema';
import { Settings2, ChevronDown, Check, Columns, MoreVertical } from 'lucide-react';

interface DynamicTableProps {
  entityName: string;
  schema: EntitySchema;
  data: Record<string, unknown>[];
  isLoading?: boolean;
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
  onEdit,
  onDelete,
  onRestore,
  onSort,
}) => {
  // 1. Compute all available columns from schema
  const allColumns = useMemo(() => {
    return Object.entries(schema.properties)
      .filter(([_, prop]) => !prop['x-ui-hidden'])
      .sort((a, b) => (a[1]['x-ui-order'] || 0) - (b[1]['x-ui-order'] || 0))
      .map(([key, prop]) => ({
        key,
        title: prop.title || key,
        priority: prop['x-ui-priority'] || false,
      }));
  }, [schema]);

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

  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);

  const toggleColumn = (key: string) => {
    setVisibleKeys(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key) 
        : [...prev, key]
    );
  };

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Fetching records...</p>
      </div>
    );
  }

  // Active columns for rendering
  const activeColumns = allColumns.filter(c => visibleKeys.includes(c.key));

  return (
    <div className="space-y-4 min-w-0">
      {/* Table Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
        <div className="text-sm text-slate-500 px-2 italic break-words">
          Showing {data?.length || 0} records
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition"
          >
            <Columns className="w-4 h-4" />
            Columns
            <ChevronDown className={`w-3 h-3 transition-transform ${isColumnSelectorOpen ? 'rotate-180' : ''}`} />
          </button>

          {isColumnSelectorOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsColumnSelectorOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-[400px] overflow-y-auto p-1">
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">
                  Visible Columns
                </div>
                {allColumns.map(col => (
                  <button
                    key={col.key}
                    onClick={() => toggleColumn(col.key)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md transition text-left"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${visibleKeys.includes(col.key) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                      {visibleKeys.includes(col.key) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="truncate">{col.title}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="relative max-w-full overflow-x-auto overflow-y-hidden rounded-xl border border-slate-200 bg-white shadow-sm scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full min-w-max text-left text-sm border-collapse">
          <thead className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-200">
            <tr>
              {activeColumns.map((col) => (
                <th
                  key={col.key} 
                  className="px-4 lg:px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group whitespace-nowrap"
                  onClick={() => onSort?.(col.key)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600 uppercase tracking-tight">{col.title}</span>
                    <Settings2 className="w-3 h-3 text-slate-300 group-hover:text-indigo-400" />
                  </div>
                </th>
              ))}
              <th className="px-4 lg:px-6 py-4 text-right bg-slate-50 sticky right-0 z-10 border-l border-slate-200/50 font-semibold text-slate-600 uppercase tracking-tight whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.length > 0 ? (
              data.map((row, index) => {
                const item = row as Record<string, unknown> & { id?: string | number; is_active?: boolean };
                return (
                  <tr key={item.id || index} className="group hover:bg-slate-50/50 transition-colors">
                  {activeColumns.map((col) => (
                    <td key={col.key} className="px-4 lg:px-6 py-4 text-slate-700 align-top">
                      {renderCell(item[col.key], schema.properties[col.key])}
                    </td>
                  ))}
                  <td className="px-4 lg:px-6 py-4 text-right bg-white/95 group-hover:bg-slate-50/95 sticky right-0 z-10 border-l border-slate-200/50 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)] transition-colors whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-2">
                       <button 
                        onClick={() => onEdit?.(item)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors font-medium text-xs"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => item.is_active === false ? onRestore?.(item.id!) : onDelete?.(item.id!)}
                        className={`p-1.5 rounded-md transition-colors font-medium text-xs ${
                          item.is_active === false 
                            ? 'text-emerald-600 hover:bg-emerald-50' 
                            : 'text-rose-600 hover:bg-rose-50'
                        }`}
                        title={item.is_active === false ? 'Restore Record' : 'Deactivate Record'}
                      >
                        {item.is_active === false ? 'Restore' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={activeColumns.length + 1} className="px-6 py-16 text-center text-slate-400 italic">
                  No records found in this entity.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const renderCell = (value: unknown, schema: PropertySchema) => {
  if (value === null || value === undefined) return <span className="text-slate-300">N/A</span>;

  // Handle Boolean
  if (schema.type === 'boolean' && typeof value === 'boolean') {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${value ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
        {value ? 'Active' : 'Inactive'}
      </span>
    );
  }

  // Handle Dates
  if ((schema.format === 'date-time' || schema.format === 'date') && (typeof value === 'string' || typeof value === 'number')) {
    const date = new Date(value);
    return (
      <div className="flex flex-col">
        <span className="text-slate-700 font-medium">{date.toLocaleDateString()}</span>
        <span className="text-[10px] text-slate-400 capitalize">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    );
  }

  // Handle Enums
  if (schema.enum) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-xs font-bold uppercase tracking-wider">
        {String(value)}
      </span>
    );
  }

  // Handle Objects/Arrays
  if (typeof value === 'object') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 w-fit">
        <MoreVertical className="w-3 h-3" />
        {Array.isArray(value) ? `${value.length} items` : 'Object'}
      </div>
    );
  }

  // Handle Long Strings
  const stringValue = String(value);
  if (stringValue.length > 40) {
    return (
      <div className="max-w-[200px] group relative cursor-help">
        <span className="truncate block" title={stringValue}>{stringValue}</span>
      </div>
    );
  }

  return <span className="font-medium text-slate-800">{stringValue}</span>;
};
