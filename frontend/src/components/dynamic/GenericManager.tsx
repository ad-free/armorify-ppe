import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGenericResource } from '../../api/generic';
import { useEntitySchema } from '../../hooks/useSchema';
import { DynamicTable } from './DynamicTable';
import { DynamicForm } from './DynamicForm';
import { Button, FeedbackState, Skeleton } from '@/components/ui/Primitives';

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

  if (isSchemaLoading) return <div role="status" className="card p-6 space-y-4"><p className="text-body">Đang tải cấu hình...</p><Skeleton className="h-48" /></div>;
  if (schemaError) return <FeedbackState variant="error" title="Lỗi tải cấu hình" description={schemaError.message} />;
  if (!schema || !formSchema) return null;

  return (
    <div className="space-y-8 min-w-0">
      {isFormOpen ? (
        <div className="space-y-6 min-w-0">
          <div className="card p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="section-heading">
              {editingItem ? t('generic.editRecord', { title: normalizeSchemaTitle(formSchema.title) }) : t('generic.newRecord', { title: normalizeSchemaTitle(formSchema.title) })}
            </h2>
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}
            >
               Huỷ bỏ
            </Button>
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
          data={(items || []) as Record<string, unknown>[]}
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
