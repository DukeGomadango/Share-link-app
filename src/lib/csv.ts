/** RFC 4180 風に CSV フィールドをエスケープする */
export function escapeCsvField(v: string): string {
  if (/[",\n\r]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
