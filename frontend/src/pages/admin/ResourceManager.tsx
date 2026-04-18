import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { GenericManager } from '../../components/dynamic/GenericManager';

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
    <AdminLayout>
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
          <span>{t('admin.resourceManager.breadcrumb')}</span>
          <span>/</span>
          <span className="text-primary">{activeEntityLabel}</span>
        </div>
        <p className="text-sm text-slate-500 max-w-3xl">{entityHelpText}</p>
      </div>
      
      <GenericManager entityName={activeEntity} />
    </AdminLayout>
  );
};

export default ResourceManagerPage;
