import React from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { GenericManager } from '../../components/dynamic/GenericManager';

export const ResourceManagerPage: React.FC = () => {
  const { entityId } = useParams<{ entityId: string }>();
  const activeEntity = entityId || 'product';

  return (
    <AdminLayout>
      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">
        <span>Admin</span>
        <span>/</span>
        <span className="text-primary">{activeEntity}</span>
      </div>
      
      <GenericManager entityName={activeEntity} />
    </AdminLayout>
  );
};

export default ResourceManagerPage;
