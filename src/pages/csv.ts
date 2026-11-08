/** Küçük bir CSV indirme yardımcısı (UTF-8 BOM ile, Excel'de Türkçe karakterler bozulmaz). */
export function toCsv(rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    let s = String(v)
    if (/^[=+\-@]/.test(s)) s = `'${s}` // CSV formül enjeksiyonuna karşı
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return rows.map((r) => r.map(esc).join(';')).join('\n')
}
export function downloadCsv(name: string, rows: (string | number)[][]): void {
  const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
