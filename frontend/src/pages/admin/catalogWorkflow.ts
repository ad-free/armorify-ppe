export const catalogSorts = ['newest', 'name_asc', 'name_desc', 'price_asc', 'price_desc', 'stock_asc'] as const;
export function readCatalogParams(params: URLSearchParams) {
  const rawPage = Number(params.get('page') || 1);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage < 1000000 ? rawPage : 1;
  const limit = [20, 50, 100].includes(Number(params.get('limit'))) ? Number(params.get('limit')) : 20;
  const request: Record<string, string | number | boolean> = { skip: (page - 1) * limit, limit, sort_by: catalogSorts.find(sort => sort === params.get('sort_by')) || 'newest' };
  for (const key of ['q', 'category_id', 'brand_id']) if (params.get(key)?.trim()) request[key] = params.get(key)!.trim();
  for (const key of ['is_active', 'is_featured', 'is_new', 'low_stock']) if (['true', 'false'].includes(params.get(key) || '')) request[key] = params.get(key) === 'true';
  if (['with', 'without'].includes(params.get('variant_mode') || '')) request.variant_mode = params.get('variant_mode')!;
  return { page, limit, request };
}
export function updateCatalogParams(current: URLSearchParams, key: string, value: string) {
  const next = new URLSearchParams(current);
  if (key !== 'page') next.delete('page');
  if (value) next.set(key, value); else next.delete(key);
  return next;
}
export interface CatalogFailure { message: string; fields: Record<string, string>; stale: boolean; cartImpact: boolean }
export function catalogFailure(error: unknown): CatalogFailure {
  const problem = error as { status?: number; details?: unknown; message?: string };
  const fields: Record<string, string> = {};
  let cartImpact = false; let stale = false;
  if (Array.isArray(problem?.details)) for (const item of problem.details) {
    if (item && typeof item === 'object' && typeof item.msg === 'string') {
      const field = Array.isArray(item.loc) ? item.loc.filter((part: unknown) => part !== 'body').join('.') : 'form';
      fields[field] = item.msg;
      cartImpact ||= item.type === 'cart_impact'; stale ||= item.type === 'stale_version';
    }
  }
  stale ||= problem?.status === 409 && !cartImpact && Object.keys(fields).length === 0;
  return { fields, stale, cartImpact, message: typeof problem?.details === 'string' ? problem.details : Object.values(fields)[0] || (problem?.status === 409 ? 'Dữ liệu đã thay đổi. Hãy tải bản mới và kiểm tra trước khi lưu.' : 'Không thể hoàn tất. Kiểm tra dữ liệu và thử lại.') };
}
export function boundedCatalogJson(text: string): Record<string, string | number | boolean> | null {
  if (!text.trim()) return null;
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length > 32) throw new Error('Tối đa 32 cặp khóa/giá trị.');
  const result: Record<string, string | number | boolean> = Object.create(null);
  const keys = new Set<string>();
  for (const [key, item] of Object.entries(value)) {
    const normalized = key.trim();
    if (!normalized || normalized.length > 64 || keys.has(normalized.toLowerCase()) || [...normalized].some(char => char.charCodeAt(0) < 32)) throw new Error('Khóa phải duy nhất và dài 1–64 ký tự.');
    if (typeof item === 'string' ? !item.trim() || item.trim().length > 512 || [...item].some(char => char.charCodeAt(0) < 32) : typeof item !== 'boolean' && (typeof item !== 'number' || !Number.isFinite(item) || Math.abs(item) > 1e12)) throw new Error('Giá trị là chuỗi 1–512 ký tự, số hữu hạn hoặc boolean.');
    keys.add(normalized.toLowerCase()); result[normalized] = typeof item === 'string' ? item.trim() : item as number | boolean;
  }
  if (new TextEncoder().encode(JSON.stringify(result)).length > 8192) throw new Error('JSON tối đa 8192 byte.');
  return result;
}
export interface SpecificationRow { key: string; value: unknown }

export function specificationPayload(rows: SpecificationRow[]) {
  const keys = rows.map(row => row.key.trim().toLowerCase());
  if (new Set(keys).size !== keys.length) throw new Error('Khóa thông số không được trùng nhau.');
  return boundedCatalogJson(JSON.stringify(Object.fromEntries(rows.map(row => [row.key, row.value]))));
}
