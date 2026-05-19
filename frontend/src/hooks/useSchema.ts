import { useQuery } from '@tanstack/react-query';
import { genericApiClient } from '../api/generic';

export interface PropertySchema {
  type?: string;
  title?: string;
  description?: string;
  format?: string;
  enum?: unknown[];
  anyOf?: PropertySchema[];
  allOf?: PropertySchema[];
  $ref?: string;
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

type SchemaMode = 'read' | 'create' | 'update';

type OpenApiSchema = {
  type?: string;
  title?: string;
  description?: string;
  format?: string;
  enum?: unknown[];
  properties?: Record<string, PropertySchema>;
  required?: string[];
  anyOf?: OpenApiSchema[];
  allOf?: OpenApiSchema[];
  $ref?: string;
  [key: string]: unknown;
};

const extractRefName = (ref?: string): string | null => {
  if (!ref) return null;
  const parts = ref.split('/');
  return parts[parts.length - 1] || null;
};

const resolveSchemaNode = (
  node: OpenApiSchema | undefined,
  components: Record<string, OpenApiSchema>,
  seen = new Set<string>()
): OpenApiSchema => {
  if (!node) return {};

  if (node.$ref) {
    const refName = extractRefName(node.$ref);
    if (refName && !seen.has(refName) && components[refName]) {
      seen.add(refName);
      const resolvedRef = resolveSchemaNode(components[refName], components, seen);
      return { ...resolvedRef, ...node, $ref: undefined };
    }
  }

  if (node.allOf?.length) {
    const merged = node.allOf.reduce<OpenApiSchema>(
      (acc, current) => ({ ...acc, ...resolveSchemaNode(current, components, new Set(seen)) }),
      {}
    );
    return { ...merged, ...node, allOf: undefined };
  }

  if (node.anyOf?.length) {
    const resolvedAnyOf = node.anyOf.map((item) => resolveSchemaNode(item, components, new Set(seen)));
    const nonNullOption = resolvedAnyOf.find((item) => item.type !== 'null');
    if (nonNullOption) {
      return {
        ...nonNullOption,
        ...node,
        anyOf: undefined,
        enum: nonNullOption.enum || node.enum,
        type: nonNullOption.type || node.type,
        format: nonNullOption.format || node.format,
      };
    }
    return { ...node, anyOf: undefined };
  }

  return node;
};

const normalizeEntitySchema = (
  schema: OpenApiSchema,
  components: Record<string, OpenApiSchema>
): EntitySchema => {
  const properties = schema.properties || {};
  const normalizedProperties = Object.entries(properties).reduce<Record<string, PropertySchema>>((acc, [key, value]) => {
    const resolved = resolveSchemaNode(value as OpenApiSchema, components);
    acc[key] = resolved as PropertySchema;
    return acc;
  }, {});

  return {
    title: schema.title || 'Entity',
    type: schema.type || 'object',
    properties: normalizedProperties,
    required: schema.required || [],
  };
};

/**
 * Hook to fetch and extract schema for a specific entity from the OpenAPI spec
 */
export const useEntitySchema = (entityName: string, mode: SchemaMode = 'read') => {
  return useQuery({
    queryKey: ['openapi-schema', entityName, mode],
    queryFn: async () => {
      const spec = await genericApiClient.fetchSchema();
      
      // 1. Define explicit mappings for entities that don't follow the pattern
      const entityMap: Record<string, string> = {
        'catalog': 'Category',
        'blog': 'BlogPost',
        'cms': 'PageContent',
        'brand': 'Brand',
        'branch': 'Brand',
        'product_image': 'ProductImage',
        'product-image': 'ProductImage',
        'quote': 'QuoteRequest',
        'banner': 'Banner',
        'review': 'Review',
        'flash-sale': 'FlashSale',
        'flash_sale': 'FlashSale',
      };

      // 2. Identify the base name (either from map or capitalized)
      const baseName = entityMap[entityName.toLowerCase()] || 
                      (entityName.charAt(0).toUpperCase() + entityName.slice(1));

      // 3. Components in FastAPI commonly use Read/Create/Update suffixes.
      // We prioritize the requested mode, then gracefully fall back.
      const modeCandidates: Record<SchemaMode, string[]> = {
        read: [`${baseName}Read`, baseName, entityName],
        create: [`${baseName}Create`, `${baseName}Update`, `${baseName}Read`, baseName, entityName],
        update: [`${baseName}Update`, `${baseName}Create`, `${baseName}Read`, baseName, entityName],
      };
      const possibleNames = modeCandidates[mode];
      
      let schema = null;
      let usedName = '';

      const schemas = spec?.components?.schemas;
      if (!schemas) {
        console.error('OpenAPI spec is missing components/schemas:', spec);
        throw new Error(`Invalid OpenAPI spec from server. Could not find any schemas.`);
      }

      for (const name of possibleNames) {
        if (schemas[name]) {
          schema = schemas[name];
          usedName = name;
          break;
        }
      }
      
      if (!schema) {
        const available = Object.keys(schemas);
        console.error(`Schema for "${entityName}" not found. Available:`, available);
        throw new Error(`Schema for entity "${entityName}" not found. Tried: ${possibleNames.join(', ')}. Available: ${available.slice(0, 10).join(', ')}...`);
      }
      
      const normalizedSchema = normalizeEntitySchema(schema as OpenApiSchema, schemas as Record<string, OpenApiSchema>);

      // Store the used schema name in the schema object for form mapping
      return { ...normalizedSchema, _schemaName: usedName } as EntitySchema & { _schemaName: string };
    },
    staleTime: Infinity,
  });
};
