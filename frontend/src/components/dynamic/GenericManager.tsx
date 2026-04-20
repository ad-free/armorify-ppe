import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGenericResource } from '../../api/generic';
import { useEntitySchema } from '../../hooks/useSchema';
import { DynamicTable } from './DynamicTable';
import { DynamicForm } from './DynamicForm';

interface GenericManagerProps {
  entityName: string;
}

const humanizeEntity = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b([a-z])/g, (match) => match.toUpperCase());

export const GenericManager: React.FC<GenericManagerProps> = ({ entityName }) => {
  const [params, setParams] = useState({ skip: 0, limit: 10, sort_by: 'id' });
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // 1. Fetch table schema + form schemas (create/update)
  const { data: readSchema, isLoading: isReadSchemaLoading, error: readSchemaError } = useEntitySchema(entityName, 'read');
  const { data: createSchema, isLoading: isCreateSchemaLoading, error: createSchemaError } = useEntitySchema(entityName, 'create');
  const { data: updateSchema, isLoading: isUpdateSchemaLoading, error: updateSchemaError } = useEntitySchema(entityName, 'update');

  // 2. Fetch Data
  const { t } = useTranslation();
  const entityLabel = t(`admin.menu.${entityName}`, { defaultValue: humanizeEntity(entityName) });

  const normalizeSchemaTitle = (title?: string) => {
    if (!title) return entityLabel;
    return /(?:Read|Create|Update|Detail|List|Schema)$/.test(title) ? entityLabel : title;
  };

  const {
    items,
    isLoading: isDataLoading,
    create,
    update,
    remove,
    restore,
  } = useGenericResource(entityName, params);

  const handleCreate = async (data: Record<string, unknown>) => {
    await create(data);
    setIsFormOpen(false);
  };

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!editingItem) return;
    await update({ id: (editingItem as { id: string | number }).id, data });
    setEditingItem(null);
    setIsFormOpen(false);
  };

  const isSchemaLoading = isReadSchemaLoading || isCreateSchemaLoading || isUpdateSchemaLoading;
  const schemaError = readSchemaError || createSchemaError || updateSchemaError;
  const schema = readSchema;
  const formSchema = editingItem
    ? (updateSchema || createSchema || readSchema)
    : (createSchema || updateSchema || readSchema);

  if (isSchemaLoading) return <LoadingSpinner />;
  if (schemaError) return <ErrorDisplay message={schemaError.message} />;
  if (!schema || !formSchema) return null;

  return (
    <div className="space-y-8 min-w-0">
      {isFormOpen ? (
        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.03)] animate-in fade-in slide-in-from-bottom-6 duration-500">
          <div className="flex items-center justify-between mb-10 border-b border-gray-50 pb-6">
            <h3 className="text-xl font-black text-gray-900">
              {editingItem ? t('generic.editRecord', { title: normalizeSchemaTitle(formSchema.title) }) : t('generic.newRecord', { title: normalizeSchemaTitle(formSchema.title) })}
            </h3>
            <button
               onClick={() => setIsFormOpen(false)}
               className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-rose-500 transition-colors"
            >
               Huỷ bỏ
            </button>
          </div>
          <DynamicForm 
            entityName={entityName}
            schema={formSchema}
            initialData={editingItem}
            onSubmit={editingItem ? handleUpdate : handleCreate}
            onCancel={() => setIsFormOpen(false)}
          />
        </div>
      ) : (
        <DynamicTable 
          entityName={entityName}
          schema={schema}
          data={items || []}
          isLoading={isDataLoading}
          onAdd={() => { setEditingItem(null); setIsFormOpen(true); }}
          onEdit={(row) => { setEditingItem(row); setIsFormOpen(true); }}
          onDelete={remove}
          onRestore={restore}
          onSort={(field) => setParams(p => ({ ...p, sort_by: field }))}
        />
      )}
    </div>
  );
};


// Simplified UI components for demo
const LoadingSpinner = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center p-24 space-y-6">
      <div className="w-14 h-14 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
      <span className="text-gray-400 font-black text-xs uppercase tracking-[0.2em]">{t('generic.loadingSchema')}</span>
    </div>
  );
};


const ErrorDisplay = ({ message }: { message: string }) => {
  const { t } = useTranslation();
  return (
    <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
      <h4 className="font-bold">{t('generic.schemaError')}</h4>
      <p>{message}</p>
    </div>
  );
};
