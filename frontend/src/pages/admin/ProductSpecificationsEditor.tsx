import { Button } from '@/components/ui/Primitives';
import type { SpecificationRow } from './catalogWorkflow';


export function ProductSpecificationsEditor({ rows, onChange, error }: {
  rows: SpecificationRow[]; onChange: (rows: SpecificationRow[]) => void; error?: string;
}) {
  const change = (index: number, field: 'key' | 'value', value: string) => onChange(rows.map((row, i) => i === index ? { ...row, [field]: value } : row));
  return <div className="space-y-3" aria-describedby={error ? 'specifications-error' : undefined}>
    <p className="text-caption">Tối đa 32 thông số / 8192 byte. Khóa 1–64 ký tự, giá trị 1–512 ký tự. Chỉ nhập thông tin do quản trị viên xác minh; không suy diễn tiêu chuẩn PPE.</p>
    {rows.map((row, index) => <div key={index} className="grid min-w-0 gap-3 sm:grid-cols-[1fr_2fr_auto]">
      <div><label className="field-label" htmlFor={`spec-key-${index}`}>Khóa thông số {index + 1}</label><input id={`spec-key-${index}`} className="field" maxLength={64} value={row.key} aria-invalid={Boolean(error)} onChange={event => change(index, 'key', event.target.value)} /></div>
      <div><label className="field-label" htmlFor={`spec-value-${index}`}>Giá trị thông số {index + 1}</label><input id={`spec-value-${index}`} className="field" maxLength={512} value={typeof row.value === 'object' ? JSON.stringify(row.value) : String(row.value ?? '')} aria-invalid={Boolean(error)} onChange={event => change(index, 'value', event.target.value)} /></div>
      <Button variant="secondary" className="sm:self-end" onClick={() => onChange(rows.filter((_, i) => i !== index))} aria-label={`Xóa thông số ${index + 1}`}>Xóa</Button>
    </div>)}
    {error && <p id="specifications-error" className="field-error">{error}</p>}
    <Button variant="secondary" disabled={rows.length >= 32} onClick={() => onChange([...rows, { key: '', value: '' }])}>Thêm thông số</Button>
  </div>;
}
