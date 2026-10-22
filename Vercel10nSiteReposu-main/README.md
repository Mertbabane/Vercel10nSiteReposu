# 10n-Girls

Vite + React arayüzü, Neon PostgreSQL veritabanı ve tek bir API sunucusu içerir. API hem Replit/yerel geliştirmede Express ile hem de Vercel'de `api/` içindeki Vercel Function üzerinden çalışır.

## Replit'te çalıştırma

1. Neon'da bir PostgreSQL projesi oluştur.
2. Neon SQL Editor'de `neon/schema.sql` dosyasının tamamını bir kez çalıştır.
3. Neon'un **pooled connection** adresini kopyala. Adres `postgresql://` ile başlamalı ve `sslmode=require` içermeli.
4. Replit'te **Tools → Secrets** bölümüne şunları ekle:

   | Secret adı | Değer |
   |---|---|
   | `DATABASE_URL` | Neon bağlantı adresi |
   | `JWT_SECRET` | En az 32 karakterlik, tahmin edilemeyen rastgele metin |
   | `ADMIN_EMAILS` | Admin olacak e-posta adresin |

   Bu değerleri sohbete, kaynak koduna veya GitHub'a koyma.
5. `npm install` ardından `npm run dev` çalıştır.
6. Uygulama açıldıktan sonra `/api/health` adresini ziyaret et. Başarılı cevap `{"ok":true,"database":"connected","schemaReady":true}` olur. `missingTables` görünürse 2. adımdaki şemayı çalıştır; `DATABASE_URL` ya da bağlantı hatası görünürse Secret'ı ve Neon URL'sini kontrol et.

İlk admin hesabı için `ADMIN_EMAILS` değerindeki adresle kayıt ol. İsteğe bağlı video dosyası yükleme Vercel Blob token'ı ister; bu token yoksa video URL'si kullanabilirsin.

## Vercel'e dağıtım

1. Depoyu Vercel'e aktar; framework ayarı **Vite** olmalı.
2. **Settings → Environment Variables** bölümüne yukarıdaki `DATABASE_URL`, `JWT_SECRET` ve `ADMIN_EMAILS` değişkenlerini ekle.
3. `neon/schema.sql` dosyasını Neon SQL Editor'de çalıştır ve projeyi yeniden dağıt.
4. Dağıtım sonrasında `/api/health` adresinden veritabanı ve tablo durumunu doğrula.

## Yerel geliştirme

```sh
npm install
npm run dev
```

Yerelde `.env` kullanıyorsan yalnızca kendi makinenin dışında paylaşma. Dosya Git'e eklenmeyecek şekilde `.gitignore` içine alınmıştır. `npm run check` TypeScript kontrolünü, `npm run build` ise üretim arayüzü derlemesini çalıştırır.
