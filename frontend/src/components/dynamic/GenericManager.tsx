import React, { useState } from 'react';
import { useGenericResource } from '../../api/generic';
import { useEntitySchema } from '../../hooks/useSchema';
import { DynamicTable } from './DynamicTable';
import { DynamicForm } from './DynamicForm';

interface GenericManagerProps {
  entityName: string;
}

export const GenericManager: React.FC<GenericManagerProps> = ({ entityName }) => {
  const [params, setParams] = useState({ skip: 0, limit: 10, sort_by: 'id' });
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // 1. Fetch table schema + form schemas (create/update)
  const { data: readSchema, isLoading: isReadSchemaLoading, error: readSchemaError } = useEntitySchema(entityName, 'read');
  const { data: createSchema, isLoading: isCreateSchemaLoading, error: createSchemaError } = useEntitySchema(entityName, 'create');
  const { data: updateSchema, isLoading: isUpdateSchemaLoading, error: updateSchemaError } = useEntitySchema(entityName, 'update');

  // 2. Fetch Data
  const { 
    items, 
    isLoading: isDataLoading, 
    create, 
    update, 
    remove,
    restore
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
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 capitalize break-words">{schema.title || entityName}</h2>
          <p className="text-sm sm:text-base text-slate-500 break-words">Manage your {entityName} records and their metadata.</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => { setEditingItem(null); setIsFormOpen(true); }}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Create New
          </button>
        )}
      </div>

      {isFormOpen ? (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-lg font-bold text-slate-800 mb-6">
            {editingItem ? `Edit ${formSchema.title}` : `New ${formSchema.title}`}
          </h3>
          <DynamicForm 
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
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center p-20 space-y-4">
    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    <span className="text-slate-600 font-medium">Bootstrapping schema...</span>
  </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
  <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
    <h4 className="font-bold">Schema Resolution Error</h4>
    <p>{message}</p>
  </div>
);
