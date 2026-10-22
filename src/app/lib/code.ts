/**
 * Kopyalanan/yapıştırılan koddaki görünmez karakterleri temizler.
 * NBSP, sıfır genişlikli boşluk, BOM ve CRLF satır sonları VS Code ve Python'da
 * "invalid non-printable character" / girinti hatalarına neden olur.
 */
export function cleanCode(code: string): string {
  return code
    .replace(/\r\n?/g, '\n')
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .replace(/[ \t]+$/gm, '');
}
