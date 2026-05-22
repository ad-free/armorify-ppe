import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { GenericManager } from '../../components/dynamic/GenericManager';
import { ProductManager } from '../../components/admin/ProductManager';

export const ResourceManagerPage: React.FC = () => {
  const { t } = useTranslation();
  const { entityId } = useParams<{ entityId: string }>();
  const activeEntity = entityId || 'product';

  const entityHelpText = activeEntity === 'variant'
    ? t('admin.resourceManager.helpVariant')
    : activeEntity === 'product'
      ? t('admin.resourceManager.helpProduct')
      : t('admin.resourceManager.helpDefault', { entity: activeEntity.replace(/_/g, ' ') });

  const activeEntityLabel = t(`admin.menu.${activeEntity}`, { defaultValue: activeEntity.replace(/_/g, ' ').replace(/\b([a-z])/g, (match) => match.toUpperCase()) });

  return (
    <AdminLayout title={activeEntityLabel} subtitle={entityHelpText}>
      {activeEntity === 'product' ? (
        <ProductManager />
      ) : (
        <GenericManager entityName={activeEntity} />
      )}
    </AdminLayout>
  );
};



export default ResourceManagerPage;
