import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller, ControllerRenderProps, FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Columns, X } from 'lucide-react';
import { EntitySchema, PropertySchema } from '../../hooks/useSchema';
import { genericApiClient } from '../../api/generic';
import { RichTextEditor } from '../ui/RichTextEditor';

import { authToast } from '../../lib/toast';
import { getMediaUrl } from '../../lib/api';
import { Button } from '@/components/ui/Primitives';

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
    placeholder: 'Chọn danh mục...',
    hint: 'Chọn danh mục mà sản phẩm này thuộc về.',
    emptyMessage: 'Chưa có danh mục. Hãy tạo danh mục trước.',
  },
  brand_id: {
    resource: 'brand',
    placeholder: 'Chọn thương hiệu...',
    hint: 'Chọn thương hiệu đồng hành cho sản phẩm này.',
    emptyMessage: 'Chưa có thương hiệu. Hãy tạo thương hiệu trước.',
  },
  branch_id: {
    resource: 'brand',
    placeholder: 'Chọn thương hiệu (Branch)...',
    hint: 'Chọn thương hiệu đồng hành cho sản phẩm này.',
    emptyMessage: 'Chưa có thương hiệu. Hãy tạo thương hiệu trước.',
  },
  parent_id: {
    resource: 'catalog',
    placeholder: 'Không có danh mục cha',
    hint: 'Danh mục cha dùng để tạo cấu trúc danh mục cấp con.',
    emptyMessage: 'Chưa có danh mục để chọn danh mục cha.',
  },
  product_id: {
    resource: 'product',
    placeholder: 'Chọn sản phẩm...',
    hint: 'Chọn sản phẩm mà hình ảnh này thuộc về.',
    emptyMessage: 'Chưa có sản phẩm. Hãy tạo sản phẩm trước.',
  },
  product_ids: {
    resource: 'product',
    placeholder: 'Chọn danh sách sản phẩm...',
    hint: 'Chọn nhiều sản phẩm để tham gia chiến dịch.',
    emptyMessage: 'Chưa có sản phẩm nào.',
  },
  items: {
    resource: 'product',
    placeholder: 'Thêm sản phẩm vào deal...',
    hint: 'Chọn sản phẩm và nhập tỷ lệ % giảm giá.',
    emptyMessage: 'Chưa có sản phẩm nào.',
  },
};

const PRICE_FIELDS = new Set(['price', 'dealer_price', 'compare_at_price', 'unit_price', 'total_amount']);

const SLUG_SOURCE_CANDIDATES = ['name', 'title', 'label'] as const;

const CurrencyInput: React.FC<{ field: ControllerRenderProps<FieldValues, string>; commonClasses: string; inputProps: React.InputHTMLAttributes<HTMLInputElement> }> = ({ field, commonClasses, inputProps }) => {
  const formatValue = (val: string | number | null | undefined) => {
    if (val === undefined || val === null || val === '') return '';
    const num = parseFloat(val.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const [displayValue, setDisplayValue] = useState(formatValue(field.value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const numericValue = rawValue ? parseInt(rawValue, 10) : 0;
    setDisplayValue(new Intl.NumberFormat('vi-VN').format(numericValue));
    field.onChange(numericValue);
  };

  return (
    <div className="relative group">
      <input
        {...inputProps}
        ref={field.ref}
        onBlur={field.onBlur}
        type="text"
        value={displayValue}
        onChange={handleChange}
        className={`${commonClasses} pr-16`}
        placeholder="0"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-caption">
        VND
      </div>
    </div>
  );
};

export const DynamicForm: React.FC<DynamicFormProps> = ({
  entityName,
  schema,
  initialData,
  onSubmit,
  onCancel,
  isLoading: externalLoading,
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
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: initialData || {},
  });
  const isLoading = externalLoading || isSubmitting;

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
      if (value === '') {
        // Convert empty strings to null for the backend
        payload[key] = null;
      } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
        // Convert local datetime-local string to UTC ISO string
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          payload[key] = date.toISOString();
        }
      }
    }

    // Special handling for flash-sale items to ensure they are never null if the field exists
    if (['flash-sale', 'flash_sale'].includes(entityName.toLowerCase()) && payload.items === null) {
      payload.items = [];
    }

    await onSubmit(payload);
  });

  const mainFieldKeys = new Set(['name', 'title', 'description', 'content', 'specifications', 'attributes', 'summary', 'body']);

  const mainFields = fields.filter(([key, prop]) =>
    mainFieldKeys.has(key) ||
    prop.type === 'object' ||
    prop.type === 'array' ||
    prop['x-ui-widget'] === 'rich-text'
  );

  const sideFields = fields.filter(([key]) =>
    !mainFields.some(([mKey]) => mKey === key)
  );

  const renderField = (key: string, prop: PropertySchema) => {
    const fieldLabel = getFieldLabel(key, prop);
    return (
      <div key={key}>
        <label htmlFor={`field-${entityName}-${key}`} className="field-label">
          {fieldLabel}{PRICE_FIELDS.has(key) ? ` (${t('generic.currency', 'VND')})` : ''}
          {schema.required?.includes(key) && <span className="text-destructive ml-1">*</span>}
        </label>

        <Controller
          name={key}
          control={control}
          rules={{ required: schema.required?.includes(key) }}
          render={({ field }) => (
            <FormFieldAdapter
              entityName={entityName}
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
              error={errors[key] ? t('generic.fieldRequired') : undefined}
            />
          )}
        />

        {(prop.description || PRICE_FIELDS.has(key) || key === 'color' || RELATION_FIELDS[key]) && (
          <p className="mt-2 text-caption">
            {prop.description}
          </p>
        )}

        {errors[key] && (
          <p id={`field-${entityName}-${key}-error`} role="alert" className="field-error">{t('generic.fieldRequired')}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6" aria-busy={isLoading || undefined}>
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main Content Column */}
        <div className="flex-1 space-y-6 min-w-0">
          <div className="card p-4 sm:p-6 space-y-6">
            <div className="border-b border-border pb-4">
              <h2 className="section-heading">Thông tin chính</h2>
            </div>
            {mainFields.map(([key, prop]) => renderField(key, prop))}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="w-full xl:w-80 space-y-6 shrink-0">
          <div className="card p-4 sm:p-6 space-y-6">
            <div className="border-b border-border pb-4">
              <h2 className="section-heading">Thiết lập & Phân loại</h2>
            </div>
            {sideFields.map(([key, prop]) => renderField(key, prop))}
          </div>
        </div>
      </div>

      {/* Form actions */}
      <div className="pt-2">
        <div className="card p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-5">
            <div className="relative flex items-center justify-center">
              {isLoading ? (
                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              ) : (
                <div className="w-11 h-11 rounded-md bg-primary-soft flex items-center justify-center text-primary">
                  <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                </div>
              )}
            </div>
            <div className="hidden sm:block">
              <h3 className="text-caption mb-0.5">Hệ thống sẵn sàng</h3>
              <p className="text-sm font-semibold text-foreground">
                {isLoading ? 'Đang thực thi lệnh lưu...' : initialData ? 'Cập nhật thay đổi ngay' : 'Tạo mới bản ghi này'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <Button variant="secondary"
                type="button"
                onClick={onCancel}
                disabled={isLoading}
              >
                {t('generic.cancel')}
              </Button>
            )}
            <Button
              type="submit"
              loading={isLoading}
            >
              {isLoading ? t('generic.saving') : initialData ? t('generic.updateRecord') : t('generic.createRecord')}
            </Button>
          </div>
        </div>
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
  labels = {},
}: {
  field: ControllerRenderProps<FieldValues, string>;
  commonClasses: string;
  labels?: {
    name?: string;
    value?: string;
    add?: string;
    placeholderKey?: string;
    placeholderValue?: string;
  };
}) => {
  const { t } = useTranslation();

  const labelName = labels.name || t('generic.attributeName');
  const labelValue = labels.value || t('generic.attributeValue');
  const labelAdd = labels.add || t('generic.addAttribute');
  const placeholderKey = labels.placeholderKey || t('generic.placeholder.example', { example: 'color' });
  const placeholderValue = labels.placeholderValue || t('generic.placeholder.example', { example: 'red' });
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
        <div key={entry.id} className="flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor={`${entry.id}-key`} className="field-label">{labelName}</label>
            <input
              type="text"
              id={`${entry.id}-key`}
              value={entry.key}
              onChange={(e) => handleKeyChange(index, e.target.value)}
              placeholder={placeholderKey}
              className={commonClasses}
            />
          </div>
          <div className="min-w-0 flex-1">
            <label htmlFor={`${entry.id}-value`} className="field-label">{labelValue}</label>
            <input
              type="text"
              id={`${entry.id}-value`}
              value={entry.value}
              onChange={(e) => handleValueChange(index, e.target.value)}
              placeholder={placeholderValue}
              className={commonClasses}
            />
          </div>
          <div className="w-full sm:w-auto">
            <Button variant="danger"
              type="button"
              onClick={() => handleRemoveEntry(index)}
            >
              {t('generic.remove')}
            </Button>
          </div>
        </div>
      ))}
      <Button variant="secondary"
        type="button"
        onClick={handleAddEntry}
      >
        {labelAdd}
      </Button>
    </div>
  );
};

const FlashSaleItemsField = ({
  field,
  relationOptions = [],
  commonClasses,
}: {
  field: ControllerRenderProps<FieldValues, string>;
  relationOptions: RelationOption[];
  commonClasses: string;
}) => {
  const items = Array.isArray(field.value) ? (field.value as Record<string, unknown>[]) : [];

  const handleAddItem = (productId: string) => {
    if (items.some((item) => (item.product_id as string) === productId)) return;
    field.onChange([...items, { product_id: productId, discount_percent: 10 }]);
  };

  const handleRemoveItem = (productId: string) => {
    field.onChange(items.filter((item) => (item.product_id as string) !== productId));
  };

  const handleUpdateDiscount = (productId: string, percent: number) => {
    field.onChange(items.map((item) => 
      (item.product_id as string) === productId ? { ...item, discount_percent: percent } : item
    ));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {(items as Array<{ product_id: string; discount_percent: number }>).map((item) => {
          const productId = item.product_id;
          const product = relationOptions.find(o => o.value === productId);
          return (
            <div key={item.product_id} className="card flex flex-wrap items-center gap-3 p-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{product?.label || item.product_id}</p>
                <p className="text-caption mt-1">Sản phẩm tham gia deal</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="relative">
                  <input
                    type="number"
                    aria-label={`Giảm giá: ${product?.label || item.product_id}`}
                    value={item.discount_percent}
                    onChange={(e) => handleUpdateDiscount(item.product_id, Number(e.target.value))}
                    className="field w-24 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-caption">%</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.product_id)}
                  aria-label={`Xóa sản phẩm: ${product?.label || item.product_id}`}
                  className="btn btn-ghost btn-icon text-destructive"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <select
        aria-label="Thêm sản phẩm vào chiến dịch"
        className={commonClasses}
        onChange={(e) => {
          if (e.target.value) {
            handleAddItem(e.target.value);
            e.target.value = '';
          }
        }}
      >
        <option value="">Thêm sản phẩm vào chiến dịch...</option>
        {relationOptions.map(opt => (
          <option key={opt.value} value={opt.value} disabled={items.some((i) => (i.product_id as string) === opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

const FormFieldAdapter = ({
  entityName,
  fieldKey,
  field,
  fieldLabel,
  schema,
  relationOptions,
  onManualEdit,
  error
}: {
  entityName: string;
  fieldKey: string;
  fieldLabel: string;
  field: ControllerRenderProps<FieldValues, string>;
  schema: PropertySchema;
  relationOptions?: RelationOption[];
  onManualEdit?: () => void;
  error?: string;
}) => {
  const { t } = useTranslation();
  const commonClasses = 'field';
  const accessibilityProps = {
    id: `field-${entityName}-${fieldKey}`,
    'aria-label': fieldLabel,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `field-${entityName}-${fieldKey}-error` : undefined,
  };
  const [isUploading, setIsUploading] = useState(false);

  if (isFileField(fieldKey, schema)) {
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      onManualEdit?.();
      setIsUploading(true);
      try {
        const uploaded = await genericApiClient.uploadImage(file);
        field.onChange(uploaded.url);
        authToast.success('Tải ảnh thành công!', 'Ảnh đã sẵn sàng để lưu.');
      } catch (error) {
        console.error('Upload error:', error);
        authToast.error('Tải ảnh thất bại', 'Vui lòng kiểm tra lại kết nối hoặc định dạng ảnh.');
      } finally {
        setIsUploading(false);
      }
    };
    return (
      <div className="space-y-4">
        <label className={`card relative flex items-center justify-center w-full px-4 py-6 border-dashed cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-primary ${isUploading ? 'bg-muted' : 'hover:border-primary'}`}>
          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-md flex items-center justify-center mb-3 bg-muted text-muted-foreground">
              {isUploading ? <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /> : <Columns size={24} />}
            </div>
            <p className="text-sm font-semibold">{isUploading ? 'Đang xử lý dữ liệu...' : 'Nhấn để tải hình ảnh lên'}</p>
            <p className="text-caption mt-2">Định dạng JPG, PNG, WEBP. Giới hạn kích thước được kiểm tra trên máy chủ.</p>
          </div>
          <input type="file" {...accessibilityProps} accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleFileChange} disabled={isUploading} />
        </label>

        {typeof field.value === 'string' && field.value ? (
          <div className="card flex items-center gap-3 p-4">
            <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0 p-1">
              <img src={getMediaUrl(field.value)} alt="Preview" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-caption">Đã tải lên thành công</p>
              </div>
              <a
                href={field.value}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-bold text-gray-900 hover:text-primary transition-colors truncate block"
              >
                {field.value.split('/').pop()}
              </a>
            </div>
            <button
              type="button"
              onClick={() => field.onChange(null)}
              aria-label={`Xóa ảnh: ${fieldLabel}`}
              className="btn btn-ghost btn-icon text-destructive"
            >
              <X size={18} />
            </button>
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
      <div className="card flex items-center gap-3 p-4">
        <div className="relative w-11 h-11 rounded-md overflow-hidden shrink-0 border border-border">
          <input
            type="color"
            aria-label={`${fieldLabel}: chọn màu`}
            value={colorValue}
            onChange={(e) => field.onChange(e.target.value)}
            className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer"
          />
        </div>
        <input
          type="text"
          {...accessibilityProps}
          value={field.value || ''}
          onChange={(e) => field.onChange(e.target.value)}
          placeholder="#000000"
          className="field"
        />
      </div>
    );
  }

  if (fieldKey === 'items' && (entityName === 'flash-sale' || entityName === 'flash_sale')) {
    return (
      <FlashSaleItemsField
        field={field}
        relationOptions={relationOptions || []}
        commonClasses={commonClasses}
      />
    );
  }

  if (fieldKey === 'attributes' || fieldKey === 'specifications') {
    const isSpecs = fieldKey === 'specifications';
    return (
      <AttributesField
        field={field}
        commonClasses={commonClasses}
        labels={{
          name: isSpecs ? t('generic.specName', 'Tên thông số') : undefined,
          value: isSpecs ? t('generic.specValue', 'Giá trị') : undefined,
          add: isSpecs ? t('generic.addSpec', 'Thêm thông số') : undefined,
          placeholderKey: isSpecs ? t('generic.placeholder.example', { example: 'Chất liệu' }) : undefined,
          placeholderValue: isSpecs ? t('generic.placeholder.example', { example: 'Cotton 100%' }) : undefined,
        }}
      />
    );
  }

  // Static select fields, such as color
  if (STATIC_SELECT_FIELDS[fieldKey]) {
    const options = STATIC_SELECT_FIELDS[fieldKey];
    return (
      <div className="relative">
        <select
          {...field}
          {...accessibilityProps}
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
    const isMulti = schema.type === 'array';
    
    if (isMulti) {
      const selectedIds = Array.isArray(field.value) ? field.value : [];
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 p-4 bg-muted rounded-md border border-border min-h-[100px]">
            {selectedIds.length === 0 && (
              <span className="text-caption">Chưa chọn sản phẩm nào...</span>
            )}
            {selectedIds.map((id: string) => {
              const opt = (relationOptions || []).find(o => o.value === id);
              return (
                <div key={id} className="bg-surface pl-3 rounded-md border border-border flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{opt?.label || id}</span>
                  <button
                    type="button"
                    onClick={() => field.onChange(selectedIds.filter((i: string) => i !== id))}
                    aria-label={`Bỏ chọn: ${opt?.label || id}`}
                    className="btn btn-ghost btn-icon text-destructive"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
          <select
            {...accessibilityProps}
            className={commonClasses}
            onChange={(e) => {
              const val = e.target.value;
              if (val && !selectedIds.includes(val)) {
                field.onChange([...selectedIds, val]);
              }
              e.target.value = '';
            }}
          >
            <option value="">{config.placeholder}</option>
            {(relationOptions || []).map((opt) => (
              <option key={opt.value} value={opt.value} disabled={selectedIds.includes(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <select
        {...field}
        {...accessibilityProps}
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
      <select {...field} {...accessibilityProps} value={field.value ?? ''} className={commonClasses}>
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
          {...accessibilityProps}
          role="switch"
          aria-checked={Boolean(field.value)}
          onClick={() => {
            onManualEdit?.();
            field.onChange(!field.value);
          }}
          className={`w-14 h-11 rounded-md transition-colors relative ${field.value ? 'bg-primary' : 'bg-muted border border-input'}`}
        >
          <span aria-hidden="true" className={`absolute top-2 w-6 h-6 rounded-sm bg-surface transition-all ${field.value ? 'right-1' : 'left-1'}`} />
        </button>
        <span className="text-caption">{field.value ? t('generic.enabled') : t('generic.disabled')}</span>
      </div>
    );
  }

  // Price
  if (PRICE_FIELDS.has(fieldKey)) {
    return <CurrencyInput field={field} commonClasses={commonClasses} inputProps={accessibilityProps} />;
  }

  // Number
  if (schema.type === 'integer' || schema.type === 'number') {
    return (
      <input
        type="number"
        {...field}
        {...accessibilityProps}
        value={field.value ?? ''}
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
        {...accessibilityProps}
        value={field.value ?? ''}
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
      <RichTextEditor
        value={field.value ?? ''}
        onChange={(val) => {
          onManualEdit?.();
          field.onChange(val);
        }}
        placeholder={placeholder}
        className=""
      />
    );
  }

  return (
    <input
      type={type}
      {...field}
      {...accessibilityProps}
      value={field.value ?? ''}
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
