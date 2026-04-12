import React from 'react';
import { useForm, Controller, ControllerRenderProps, FieldValues } from 'react-hook-form';
import { EntitySchema, PropertySchema } from '../../hooks/useSchema';

interface DynamicFormProps {
  schema: EntitySchema;
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  schema,
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const { 
    control, 
    handleSubmit, 
    formState: { errors } 
  } = useForm({
    defaultValues: initialData || {},
  });

  const fields = Object.entries(schema.properties)
    .filter(([key, prop]) => !prop['x-ui-hidden'] && key !== 'id')
    .sort((a, b) => (a[1]['x-ui-order'] || 0) - (b[1]['x-ui-order'] || 0));

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
                  field={field} 
                  schema={prop} 
                  error={errors[key]?.message as string} 
                />
              )}
            />
            
            {(prop.description || (prop['x-ui-widget'] === 'password' && initialData)) && (
              <p className="mt-1.5 text-xs text-slate-500 italic">
                {prop['x-ui-widget'] === 'password' && initialData 
                  ? 'Leave blank to keep current password. ' 
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
  field, 
  schema, 
  error 
}: { 
  field: ControllerRenderProps<FieldValues, string>; 
  schema: PropertySchema; 
  error?: string 
}) => {
  const commonClasses = `w-full px-4 py-2.5 rounded-lg border focus:ring-4 transition-all outline-none ${
    error ? 'border-rose-300 focus:ring-rose-100 bg-rose-50' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'
  }`;

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
          onChange={(e) => field.onChange(e.target.checked)}
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
        onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
      placeholder={`Enter ${schema.title || ''}...`}
      className={commonClasses}
    />
  );
};
