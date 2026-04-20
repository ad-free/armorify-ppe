import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller, ControllerRenderProps, FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { EntitySchema, PropertySchema } from '../../hooks/useSchema';
import { genericApiClient } from '../../api/generic';

interface DynamicFormProps {
  entityName: string;
  schema: EntitySchema;
  initialData?: Record<string, unknown> | null;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

interface RelationOption {
  value: string;
  label: string;
}

const COLOR_PALETTE: RelationOption[] = [
  { value: '#000000', label: 'Black' },
  { value: '#FFFFFF', label: 'White' },
  { value: '#FF0000', label: 'Red' },
  { value: '#0000FF', label: 'Blue' },
  { value: '#FFFF00', label: 'Yellow' },
  { value: '#008000', label: 'Green' },
  { value: '#808080', label: 'Grey' },
  { value: '#FFA500', label: 'Orange' },
  { value: '#8B4513', label: 'Brown' },
  { value: '#800080', label: 'Purple' },
];

const STATIC_SELECT_FIELDS: Record<string, RelationOption[]> = {
  color: COLOR_PALETTE,
};

const RELATION_FIELDS: Record<string, { resource: string; placeholder: string; hint: string; emptyMessage: string }> = {
  category_id: {
    resource: 'catalog',
    placeholder: 'Chon danh muc...',
    hint: 'Chon danh muc ma san pham nay thuoc ve.',
    emptyMessage: 'Chua co danh muc. Hay tao danh muc truoc.',
  },
  parent_id: {
    resource: 'catalog',
    placeholder: 'Khong co danh muc cha',
    hint: 'Danh muc cha dung de tao cau truc danh muc cap con.',
    emptyMessage: 'Chua co danh muc de chon danh muc cha.',
  },
  product_id: {
    resource: 'product',
    placeholder: 'Chon san pham...',
    hint: 'Chon san pham ma hinh anh nay thuoc ve.',
    emptyMessage: 'Chua co san pham. Hay tao san pham truoc.',
  },
};

const PRICE_FIELDS = new Set(['price', 'dealer_price', 'compare_at_price', 'unit_price', 'total_amount']);

const SLUG_SOURCE_CANDIDATES = ['name', 'title', 'label'] as const;

export const DynamicForm: React.FC<DynamicFormProps> = ({
  entityName,
  schema,
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const { t } = useTranslation();
  const isSlugManuallyEdited = useRef(false);

  const [relationOptions, setRelationOptions] = useState<Record<string, RelationOption[]>>({});

  const { 
    control, 
    handleSubmit, 
    watch,
    setValue,
    getValues,
    formState: { errors } 
  } = useForm({
    defaultValues: initialData || {},
  });

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

  const fields = useMemo(
    () => Object.entries(schema.properties)
      .filter(([key, prop]) => !prop['x-ui-hidden'] && key !== 'id')
      .sort((a, b) => (a[1]['x-ui-order'] || 0) - (b[1]['x-ui-order'] || 0)),
    [schema.properties]
  );

  const relationKeys = useMemo(
    () => fields.map(([key]) => key).filter((key) => RELATION_FIELDS[key]),
    [fields]
  );

  const uniqueResources = useMemo(
    () => Array.from(new Set(relationKeys.map((key) => RELATION_FIELDS[key].resource))).sort(),
    [relationKeys]
  );

  const hasSlugField = Boolean(schema.properties.slug);
  const slugSourceField = useMemo(
    () => SLUG_SOURCE_CANDIDATES.find((key) => Boolean(schema.properties[key])),
    [schema.properties]
  );
  const watchedSlugSource = slugSourceField ? watch(slugSourceField) : undefined;
  const watchedSlug = watch('slug');

  const initialGeneratedSlug = useMemo(() => {
    if (!slugSourceField) return '';
    const initialSourceValue = typeof initialData?.[slugSourceField] === 'string' ? initialData[slugSourceField] : '';
    return slugify(initialSourceValue);
  }, [initialData, slugSourceField]);

  useEffect(() => {
    let isMounted = true;

    const loadRelationOptions = async () => {
      if (uniqueResources.length === 0) {
        if (isMounted) setRelationOptions({});
        return;
      }

      const fetchedByResource = await Promise.all(
        uniqueResources.map(async (resource) => {
          const rows = await genericApiClient.fetchList(resource, { limit: 500, include_inactive: false });
          return [resource, rows] as const;
        })
      );

      const rowsByResource = Object.fromEntries(fetchedByResource);
      const next: Record<string, RelationOption[]> = {};

      relationKeys.forEach((key) => {
        const resource = RELATION_FIELDS[key].resource;
        const rows = (rowsByResource[resource] || []) as Record<string, unknown>[];
        next[key] = rows
          .filter((row) => typeof row.id === 'string' || typeof row.id === 'number')
          .map((row) => {
            const value = String(row.id);
            const label = String(row.name || row.title || row.slug || row.order_code || value);
            return { value, label };
          });
      });

      if (isMounted) setRelationOptions(next);
    };

    loadRelationOptions().catch(() => {
      if (isMounted) setRelationOptions({});
    });

    return () => {
      isMounted = false;
    };
  }, [relationKeys, uniqueResources]);

  useEffect(() => {
    if (!slugSourceField || !hasSlugField) return;
    if (isSlugManuallyEdited.current) return;

    const currentSourceText = typeof watchedSlugSource === 'string' ? watchedSlugSource : '';
    const nextSlug = slugify(currentSourceText);
    const currentSlug = typeof getValues('slug') === 'string' ? String(getValues('slug')) : '';

    // Keep slug synced with name until user manually edits slug.
    // Existing records retain custom slugs if they differ from auto-generated initial value.
    if (
      currentSlug &&
      initialData?.slug &&
      typeof initialData.slug === 'string' &&
      currentSlug !== initialGeneratedSlug &&
      currentSlug !== initialData.slug
    ) {
      isSlugManuallyEdited.current = true;
      return;
    }

    if (currentSlug !== nextSlug) {
      setValue('slug', nextSlug, { shouldDirty: Boolean(initialData?.slug) });
    }
  }, [
    getValues,
    hasSlugField,
    initialData,
    initialGeneratedSlug,
    slugSourceField,
    setValue,
    watchedSlugSource,
    watchedSlug,
  ]);

  const handleFormSubmit = handleSubmit(async (data) => {
    const payload = { ...data } as Record<string, unknown>;

    for (const [key, value] of Object.entries(data)) {
      if (value instanceof File) {
        const uploaded = await genericApiClient.uploadImage(value);
        payload[key] = uploaded.url;
      }
    }

    await onSubmit(payload);
  });

  return (
    <form onSubmit={handleFormSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {fields.map(([key, prop]) => {
          const fieldLabel = getFieldLabel(key, prop);
          return (
            <div key={key} className={prop.type === 'object' || prop.type === 'array' ? 'md:col-span-2' : ''}>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                {fieldLabel}{PRICE_FIELDS.has(key) ? ` (${t('generic.currency', 'VND')})` : ''}
                {schema.required?.includes(key) && <span className="text-rose-500 ml-1.5">*</span>}
              </label>
              
              <Controller
                name={key}
                control={control}
                rules={{ required: schema.required?.includes(key) }}
                render={({ field }) => (
                  <FormFieldAdapter 
                    fieldKey={key}
                    field={field} 
                    fieldLabel={fieldLabel}
                    schema={prop} 
                    relationOptions={relationOptions[key]}
                    onManualEdit={() => {
                      if (key === 'slug') {
                        isSlugManuallyEdited.current = true;
                      }
                    }}
                    error={errors[key]?.message as string} 
                  />
                )}
              />
              
              {(prop.description || PRICE_FIELDS.has(key) || key === 'color' || key === 'attributes' || (prop['x-ui-widget'] === 'password' && initialData) || RELATION_FIELDS[key]) && (
                <p className="mt-2.5 text-[11px] text-gray-400 font-bold italic leading-relaxed opacity-80">
                  {prop['x-ui-widget'] === 'password' && initialData 
                    ? t('generic.leaveBlankToKeepPassword') + ' ' 
                    : ''}
                  {PRICE_FIELDS.has(key) ? t('generic.priceHint') + ' ' : ''}
                  {key === 'color' ? t('generic.colorHint') + ' ' : ''}
                  {key === 'attributes' ? t('generic.attributesHint') + ' ' : ''}
                  {RELATION_FIELDS[key]
                    ? `${(relationOptions[key]?.length || 0) > 0 ? RELATION_FIELDS[key].hint : RELATION_FIELDS[key].emptyMessage} `
                    : ''}
                  {prop.description}
                </p>
              )}
              
              {errors[key] && (
                <p className="mt-2.5 text-[11px] text-rose-500 font-black uppercase tracking-tighter">{t('generic.fieldRequired')}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-4 pt-10 mt-10 border-t border-gray-50">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
          >
            {t('generic.cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-10 py-4 bg-primary text-white text-xs font-black rounded-2xl shadow-[0_10px_30px_rgba(13,164,135,0.2)] hover:bg-primary/95 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest"
        >
          {isLoading ? t('generic.saving') : initialData ? t('generic.updateRecord') : t('generic.createRecord')}
        </button>
      </div>
    </form>
  );
};


const isFileField = (fieldKey: string, schema: PropertySchema) => {
  const normalizedKey = fieldKey.toLowerCase();
  if (normalizedKey.includes('image') || normalizedKey.includes('logo')) {
    return schema.type === 'string';
  }
  return false;
};

type AttributeRow = {
  id: string;
  key: string;
  value: string;
};

const newAttributeRow = (): AttributeRow => ({
  id: `attr-${Math.random().toString(16).slice(2)}-${Date.now()}`,
  key: '',
  value: '',
});

const AttributesField = ({
  field,
  commonClasses,
}: {
  field: ControllerRenderProps<FieldValues, string>;
  commonClasses: string;
}) => {
  const { t } = useTranslation();
  const parseAttributes = useCallback((value: unknown): AttributeRow[] => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return [];
    return Object.entries(value as Record<string, unknown>).map(([key, attrValue]) => ({
      id: `attr-${key}-${Math.random().toString(16).slice(2)}`,
      key,
      value: attrValue == null ? '' : String(attrValue),
    }));
  }, []);

  const [entries, setEntries] = useState<AttributeRow[]>(() => parseAttributes(field.value));

  useEffect(() => {
    const parsed = parseAttributes(field.value);
    if (entries.length === 0 && parsed.length > 0) {
      setEntries(parsed);
    }
  }, [field.value, parseAttributes, entries.length]);

  const syncFieldValue = (nextEntries: AttributeRow[]) => {
    const payload = nextEntries.reduce<Record<string, string>>((acc, { key, value }) => {
      const trimmedKey = key.trim();
      if (trimmedKey !== '') {
        acc[trimmedKey] = value;
      }
      return acc;
    }, {});

    setEntries(nextEntries);
    if (Object.keys(payload).length > 0) {
      field.onChange(payload);
    } else if (nextEntries.length === 0) {
      field.onChange({});
    }
  };

  const handleKeyChange = (index: number, nextKey: string) => {
    const nextEntries = entries.map((entry, idx) =>
      idx === index ? { ...entry, key: nextKey } : entry
    );
    syncFieldValue(nextEntries);
  };

  const handleValueChange = (index: number, nextValue: string) => {
    const nextEntries = entries.map((entry, idx) =>
      idx === index ? { ...entry, value: nextValue } : entry
    );
    syncFieldValue(nextEntries);
  };

  const handleAddEntry = () => {
    const nextEntries = [...entries, newAttributeRow()];
    setEntries(nextEntries);
  };

  const handleRemoveEntry = (index: number) => {
    const nextEntries = entries.filter((_, idx) => idx !== index);
    syncFieldValue(nextEntries);
  };

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => (
        <div key={entry.id} className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-5">
            <label className="block text-xs text-slate-500 mb-1">{t('generic.attributeName')}</label>
            <input
              type="text"
              value={entry.key}
              onChange={(e) => handleKeyChange(index, e.target.value)}
              placeholder={t('generic.placeholder.example', { example: 'quality' })}
              className={commonClasses}
            />
          </div>
          <div className="col-span-5">
            <label className="block text-xs text-slate-500 mb-1">{t('generic.attributeValue')}</label>
            <input
              type="text"
              value={entry.value}
              onChange={(e) => handleValueChange(index, e.target.value)}
              placeholder={t('generic.placeholder.example', { example: 'premium' })}
              className={commonClasses}
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleRemoveEntry(index)}
              className="px-3 py-2 text-sm text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition"
            >
              {t('generic.remove')}
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAddEntry}
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
      >
        {t('generic.addAttribute')}
      </button>
    </div>
  );
};

const FormFieldAdapter = ({ 
  fieldKey,
  field, 
  fieldLabel,
  schema, 
  relationOptions,
  onManualEdit,
  error 
}: {
  fieldKey: string;
  fieldLabel: string;
  field: ControllerRenderProps<FieldValues, string>;
  schema: PropertySchema;
  relationOptions?: RelationOption[];
  onManualEdit?: () => void;
  error?: string;
}) => {
  const { t } = useTranslation();
  const commonClasses = `w-full px-6 py-4 rounded-2xl border font-bold text-sm transition-all outline-none ${
    error 
      ? 'border-rose-200 focus:ring-4 focus:ring-rose-50/50 bg-rose-50/30' 
      : 'border-gray-100 bg-gray-50/30 focus:border-primary focus:ring-4 focus:ring-primary/5 focus:bg-white'
  }`;

  if (isFileField(fieldKey, schema)) {
    return (
      <div className="space-y-3">
        <label className="flex items-center justify-center w-full px-6 py-10 border-2 border-dashed border-gray-200 rounded-3xl hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group">
          <div className="flex flex-col items-center">
             <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-white transition-colors">
                <Columns className="text-gray-400 group-hover:text-primary" size={20} />
             </div>
             <p className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-primary">Click to upload image</p>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              onManualEdit?.();
              const file = e.target.files?.[0] || null;
              field.onChange(file ?? field.value);
            }}
          />
        </label>
        {typeof field.value === 'string' && field.value ? (
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
             <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0">
                <img src={field.value} alt="Preview" className="w-full h-full object-cover" />
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hiện tại</p>
                <a href={field.value} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary hover:underline truncate block">Xem ảnh đầy đủ</a>
             </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (fieldKey === 'color') {
    const normalizedColor = typeof field.value === 'string'
      ? (field.value.startsWith('#') ? field.value : COLOR_PALETTE.find((opt) => opt.label.toLowerCase() === field.value.toLowerCase())?.value)
      : undefined;
    const colorValue = normalizedColor || '#0da487';

    return (
      <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-soft shrink-0 border-2 border-white">
           <input
             type="color"
             value={colorValue}
             onChange={(e) => field.onChange(e.target.value)}
             className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer"
           />
        </div>
        <input 
          type="text" 
          value={field.value || ''} 
          onChange={(e) => field.onChange(e.target.value)}
          placeholder="#000000"
          className="bg-transparent border-none focus:ring-0 font-black text-gray-900 uppercase tracking-widest w-full"
        />
      </div>
    );
  }

  if (fieldKey === 'attributes') {
    return <AttributesField field={field} commonClasses={commonClasses} />;
  }

  // Static select fields, such as color
  if (STATIC_SELECT_FIELDS[fieldKey]) {
    const options = STATIC_SELECT_FIELDS[fieldKey];
    return (
      <div className="relative">
        <select
          {...field}
          value={field.value ?? ''}
          onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
          className={commonClasses}
        >
          <option value="">{t('generic.selectOption', { field: fieldLabel })}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Known relation fields -> Select with friendly labels
  if (RELATION_FIELDS[fieldKey]) {
    const config = RELATION_FIELDS[fieldKey];
    return (
      <select
        {...field}
        value={field.value ?? ''}
        onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
        className={commonClasses}
      >
        <option value="">{config.placeholder}</option>
        {(relationOptions || []).map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  // Enum -> Select
  if (schema.enum) {
    return (
      <select {...field} className={commonClasses}>
        <option value="">{t('generic.selectOption', { field: fieldLabel })}</option>
        {schema.enum.map((opt) => (
          <option key={String(opt)} value={String(opt)}>{String(opt)}</option>
        ))}
      </select>
    );
  }

  // Boolean -> Toggle/Checkbox
  if (schema.type === 'boolean') {
    return (
      <div className="flex items-center gap-4 p-2">
        <button
          type="button"
          onClick={() => {
            onManualEdit?.();
            field.onChange(!field.value);
          }}
          className={`w-14 h-8 rounded-full transition-all relative ${field.value ? 'bg-primary' : 'bg-gray-200'}`}
        >
          <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${field.value ? 'right-1' : 'left-1'}`} />
        </button>
        <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{field.value ? t('generic.enabled') : t('generic.disabled')}</span>
      </div>
    );
  }

  // Number
  if (schema.type === 'integer' || schema.type === 'number') {
    return (
      <input
        type="number"
        {...field}
        onChange={(e) => {
          onManualEdit?.();
          field.onChange(e.target.valueAsNumber);
        }}
        className={commonClasses}
      />
    );
  }

  // Date
  if (schema.format === 'date-time' || schema.format === 'date') {
    return (
      <input
        type={schema.format === 'date' ? 'date' : 'datetime-local'}
        {...field}
        onChange={(e) => {
          onManualEdit?.();
          field.onChange(e.target.value);
        }}
        className={commonClasses}
      />
    );
  }


  // Text / Email / Password
  const type = schema['x-ui-widget'] || (schema.format === 'email' ? 'email' : 'text');
  const isPriceField = PRICE_FIELDS.has(fieldKey);
  const placeholder = isPriceField
    ? t('generic.placeholder.price', { field: fieldLabel })
    : t('generic.placeholder.default', { field: fieldLabel });

  if (type === 'rich-text') {
    return (
      <textarea
        {...field}
        rows={8}
        placeholder={placeholder}
        className={`${commonClasses} font-mono text-sm leading-relaxed resize-y`}
        onChange={(e) => {
          onManualEdit?.();
          field.onChange(e.target.value);
        }}
        value={field.value ?? ''}
      />
    );
  }

  return (
    <input
      type={type}
      {...field}
      onChange={(e) => {
        onManualEdit?.();
        field.onChange(e.target.value);
      }}
      placeholder={placeholder}
      className={commonClasses}
    />
  );
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
