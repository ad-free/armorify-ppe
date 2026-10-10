export type SpecRow = { label: string; value: string };

export function normalizeSpecs(raw: unknown): SpecRow[] {
  const entries: [unknown, unknown][] = Array.isArray(raw)
    ? raw.flatMap((row) => row && typeof row === 'object' && 'name' in row && 'value' in row
      ? [[row.name, row.value] as [unknown, unknown]] : [])
    : raw && typeof raw === 'object' ? Object.entries(raw) : [];
  return entries.flatMap(([name, value]) => {
    if (typeof name !== 'string' || !name.trim()) return [];
    const text = typeof value === 'string' ? value.trim()
      : typeof value === 'number' && Number.isFinite(value) || typeof value === 'boolean' ? String(value)
      : Array.isArray(value) && value.every((item) => typeof item === 'string' || typeof item === 'boolean' || typeof item === 'number' && Number.isFinite(item)) ? value.map(String).filter((item) => item.trim()).join(', ')
      : value && typeof value === 'object' ? JSON.stringify(value) : '';
    if (!text) return [];
    return [{ label: name.trim().replace(/_/g, ' '), value: text }];
  });
}
