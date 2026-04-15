import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller, ControllerRenderProps, FieldValues } from 'react-hook-form';
import { EntitySchema, PropertySchema } from '../../hooks/useSchema';
import { genericApiClient } from '../../api/generic';

interface DynamicFormProps {
  schema: EntitySchema;
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

interface RelationOption {
  value: string;
  label: string;
}

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

const SLUG_SOURCE_CANDIDATES = ['name', 'title', 'label'] as const;

export const DynamicForm: React.FC<DynamicFormProps> = ({
  schema,
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}) => {
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

  const fields = Object.entries(schema.properties)
    .filter(([key, prop]) => !prop['x-ui-hidden'] && key !== 'id')
    .sort((a, b) => (a[1]['x-ui-order'] || 0) - (b[1]['x-ui-order'] || 0));

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
      const relationKeys = fields.map(([key]) => key).filter((key) => RELATION_FIELDS[key]);
      if (relationKeys.length === 0) {
        if (isMounted) setRelationOptions({});
        return;
      }

      const uniqueResources = Array.from(new Set(relationKeys.map((key) => RELATION_FIELDS[key].resource)));
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
  }, [schema, fields]);

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map(([key, prop]) => (
          <div key={key} className={prop.type === 'object' || prop.type === 'array' ? 'md:col-span-2' : ''}>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {prop.title || key}
              {schema.required?.includes(key) && <span className="text-rose-500 ml-1">*</span>}
            </label>
            
            <Controller
              name={key}
              control={control}
              rules={{ required: schema.required?.includes(key) }}
              render={({ field }) => (
                <FormFieldAdapter 
                  fieldKey={key}
                  field={field} 
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
            
            {(prop.description || (prop['x-ui-widget'] === 'password' && initialData) || RELATION_FIELDS[key]) && (
              <p className="mt-1.5 text-xs text-slate-500 italic">
                {prop['x-ui-widget'] === 'password' && initialData 
                  ? 'Leave blank to keep current password. ' 
                  : ''}
                {RELATION_FIELDS[key]
                  ? `${(relationOptions[key]?.length || 0) > 0 ? RELATION_FIELDS[key].hint : RELATION_FIELDS[key].emptyMessage} `
                  : ''}
                {prop.description}
              </p>
            )}
            
            {errors[key] && (
              <p className="mt-1.5 text-xs text-rose-500 font-medium">Field is required</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 disabled:opacity-50 transition-all"
        >
          {isLoading ? 'Saving...' : initialData ? 'Update Record' : 'Create Record'}
        </button>
      </div>
    </form>
  );
};

const FormFieldAdapter = ({ 
  fieldKey,
  field, 
  schema, 
  relationOptions,
  onManualEdit,
  error 
}: { 
  fieldKey: string;
  field: ControllerRenderProps<FieldValues, string>; 
  schema: PropertySchema; 
  relationOptions?: RelationOption[];
  onManualEdit?: () => void;
  error?: string 
}) => {
  const commonClasses = `w-full px-4 py-2.5 rounded-lg border focus:ring-4 transition-all outline-none ${
    error ? 'border-rose-300 focus:ring-rose-100 bg-rose-50' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'
  }`;

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
        <option value="">Select option...</option>
        {schema.enum.map((opt) => (
          <option key={String(opt)} value={String(opt)}>{String(opt)}</option>
        ))}
      </select>
    );
  }

  // Boolean -> Toggle/Checkbox
  if (schema.type === 'boolean') {
    return (
      <div className="flex items-center mt-2">
        <input
          type="checkbox"
          checked={field.value}
          onChange={(e) => {
            onManualEdit?.();
            field.onChange(e.target.checked);
          }}
          className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
        />
        <span className="ml-2 text-sm text-slate-600">{field.value ? 'Enabled' : 'Disabled'}</span>
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
  
  return (
    <input
      type={type}
      {...field}
      onChange={(e) => {
        onManualEdit?.();
        field.onChange(e.target.value);
      }}
      placeholder={`Enter ${schema.title || ''}...`}
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
