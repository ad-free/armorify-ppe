import { useQuery } from '@tanstack/react-query';
import { genericApiClient } from '../api/generic';

export interface PropertySchema {
  type: string;
  title?: string;
  description?: string;
  format?: string;
  enum?: unknown[];
  items?: {
    type: string;
    [key: string]: unknown;
  };
  'x-ui-hidden'?: boolean;
  'x-ui-order'?: number;
  'x-ui-widget'?: string;
  'x-ui-priority'?: boolean;
}

export interface EntitySchema {
  title: string;
  type: string;
  properties: Record<string, PropertySchema>;
  required?: string[];
}

/**
 * Hook to fetch and extract schema for a specific entity from the OpenAPI spec
 */
export const useEntitySchema = (entityName: string) => {
  return useQuery({
    queryKey: ['openapi-schema', entityName],
    queryFn: async () => {
      const spec = await genericApiClient.fetchSchema();
      
      // 1. Define explicit mappings for entities that don't follow the pattern
      const entityMap: Record<string, string> = {
        'catalog': 'Category',
        'blog': 'PageContent',
        'cms': 'PageContent',
      };

      // 2. Identify the base name (either from map or capitalized)
      const baseName = entityMap[entityName.toLowerCase()] || 
                      (entityName.charAt(0).toUpperCase() + entityName.slice(1));

      // 3. Components in FastAPI (SQLModel) usually have suffixes
      // We try: BaseNameRead -> BaseName -> lowercase
      const possibleNames = [`${baseName}Read`, baseName, entityName];
      
      let schema = null;
      let usedName = '';

      for (const name of possibleNames) {
        if (spec.components?.schemas?.[name]) {
          schema = spec.components.schemas[name];
          usedName = name;
          break;
        }
      }
      
      if (!schema) {
        console.error('Available schemas:', Object.keys(spec.components?.schemas || {}));
        throw new Error(`Schema for entity "${entityName}" not found. Tried: ${possibleNames.join(', ')}`);
      }
      
      // Store the used schema name in the schema object for form mapping
      return { ...schema, _schemaName: usedName } as EntitySchema & { _schemaName: string };
    },
    staleTime: Infinity,
  });
};
