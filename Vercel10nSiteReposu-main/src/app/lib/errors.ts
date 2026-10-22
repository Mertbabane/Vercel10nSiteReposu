const MAP: [RegExp, string][] = [
  [/invalid login credentials/i, 'E-posta veya şifre hatalı.'],
  [/user already registered|already been registered/i, 'Bu e-posta zaten kayıtlı.'],
  [/duplicate key.*username/i, 'Bu kullanıcı adı zaten alınmış.'],
  [/duplicate key/i, 'Bu kayıt zaten mevcut.'],
  [/permission denied/i, 'Bu işlem için yetkiniz yok.'],
  [/failed to fetch|networkerror|network request failed/i, 'Bağlantı hatası. İnternetinizi kontrol edin.'],
];

export function trError(message: string | null | undefined): string {
  if (!message) return 'Bilinmeyen bir hata oluştu.';
  for (const [re, tr] of MAP) {
    if (re.test(message)) return tr;
  }
  return message;
}
