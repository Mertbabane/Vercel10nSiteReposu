import { neon } from '@neondatabase/serverless';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/* eslint-disable @typescript-eslint/no-explicit-any */
let _sql: any;
const sql: any = ((...args: any[]) => {
  _sql ||= neon(process.env.DATABASE_URL as string);
  return _sql(...args);
}) as any;

const SECRET = process.env.JWT_SECRET || '';
const COOKIE = 'session';
const MAX_AGE = 60 * 60 * 24 * 30;

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/* ---------- JWT (HS256) ---------- */
const b64 = (s: string | Buffer) => Buffer.from(s).toString('base64url');

function signToken(sub: string): string {
  const head = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + MAX_AGE }));
  const sig = createHmac('sha256', SECRET).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${sig}`;
}

function verifyToken(token: string): string | null {
  const [head, body, sig] = token.split('.');
  if (!head || !body || !sig) return null;
  const expected = createHmac('sha256', SECRET).update(`${head}.${body}`).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now() / 1000) return null;
    return payload.sub as string;
  } catch {
    return null;
  }
}

/* ---------- Şifre ---------- */
function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(pw, salt, 64).toString('hex')}`;
}

function checkPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, 'hex');
  const b = scryptSync(pw, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ---------- Yardımcılar ---------- */
function getUserId(req: any): string | null {
  const raw: string = req.headers.cookie || '';
  const m = raw.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`));
  return m ? verifyToken(m.slice(COOKIE.length + 1)) : null;
}

function setCookie(res: any, value: string, maxAge: number, req: any) {
  const forwardedProto = String(req.headers?.['x-forwarded-proto'] || '').split(',')[0].trim();
  const secure = process.env.NODE_ENV === 'production' || forwardedProto === 'https';
  res.setHeader('Set-Cookie', `${COOKIE}=${value}; HttpOnly; ${secure ? 'Secure; ' : ''}SameSite=Lax; Path=/; Max-Age=${maxAge}`);
}

async function isAdminUser(userId: string): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM user_roles WHERE user_id = ${userId} AND role = 'admin'`;
  return rows.length > 0;
}

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || 'admin@gmail.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function ensureRoles(userId: string, email: string) {
  await sql`INSERT INTO user_roles (user_id, role) VALUES (${userId}, 'user') ON CONFLICT DO NOTHING`;
  if (adminEmails().includes(email)) {
    await sql`INSERT INTO user_roles (user_id, role) VALUES (${userId}, 'admin') ON CONFLICT DO NOTHING`;
  }
}

function requireUser(req: any): string {
  const id = getUserId(req);
  if (!id) throw new HttpError(401, 'Giriş yapmalısın.');
  return id;
}

async function requireAdmin(req: any): Promise<string> {
  const id = requireUser(req);
  if (!(await isAdminUser(id))) throw new HttpError(403, 'Bu işlem için admin yetkisi gerekli.');
  return id;
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const SHADER_STYLES = ['none', 'gradient', 'radial', 'solid'];
const clampInt = (v: unknown, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(Number(v) || 0)));

/* ---------- Ana handler ---------- */
export default async function handler(req: any, res: any) {
  try {
    const url = new URL(req.url, 'http://localhost');
    // Vercel rewrites nested paths to /api/handler?__path=auth/signup.
    // Locally, Express passes the original /api/... pathname through unchanged.
    const routePath = url.searchParams.has('__path')
      ? (url.searchParams.get('__path') || '')
      : url.pathname.replace(/^\/api\/?/, '');
    const seg = routePath.split('/').filter(Boolean);
    const method: string = req.method;
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const send = (data: unknown, status = 200) => res.status(status).json(data);

    if (!process.env.DATABASE_URL) {
      throw new HttpError(503, 'DATABASE_URL eksik. Neon bağlantı adresini Replit Secrets veya Vercel Environment Variables bölümüne ekle.');
    }

    // A standalone check helps distinguish a missing connection from a missing schema.
    if (seg[0] === 'health' && method === 'GET') {
      try {
        const [state] = await sql`
          SELECT
            to_regclass('public.users') IS NOT NULL AS users,
            to_regclass('public.profiles') IS NOT NULL AS profiles,
            to_regclass('public.user_roles') IS NOT NULL AS user_roles,
            to_regclass('public.snippets') IS NOT NULL AS snippets,
            to_regclass('public.languages') IS NOT NULL AS languages,
            to_regclass('public.site_settings') IS NOT NULL AS site_settings`;
        const missingTables = Object.entries(state || {})
          .filter(([, exists]) => !exists)
          .map(([table]) => table);
        if (missingTables.length) {
          return send({
            ok: false,
            database: 'connected',
            schemaReady: false,
            missingTables,
            error: 'neon/schema.sql dosyasını Neon SQL Editor içinde çalıştır.',
          }, 503);
        }
        return send({ ok: true, database: 'connected', schemaReady: true });
      } catch (err) {
        console.error('Neon sağlık kontrolü başarısız:', err);
        return send({
          ok: false,
          database: 'unavailable',
          schemaReady: false,
          error: 'Neon bağlantısı kurulamadı. DATABASE_URL değerini ve Neon bağlantı ayarlarını kontrol et.',
        }, 503);
      }
    }

    if (SECRET.length < 32) {
      throw new HttpError(503, 'JWT_SECRET eksik veya kısa. En az 32 karakterlik bir değeri Replit Secrets ya da Vercel Environment Variables bölümüne ekle.');
    }

    /* ----- AUTH ----- */
    if (seg[0] === 'auth') {
      if (seg[1] === 'signup' && method === 'POST') {
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '');
        const username = String(body.username || '').trim();
        if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, 'Geçerli bir e-posta adresi girin.');
        if (!password) throw new HttpError(400, 'Şifre boş olamaz.');
        if (username.length < 3 || username.length > 30) {
          throw new HttpError(400, 'Kullanıcı adı 3-30 karakter olmalı.');
        }
        const dup = await sql`SELECT 1 FROM users WHERE email = ${email}`;
        if (dup.length) throw new HttpError(409, 'Bu e-posta zaten kayıtlı.');
        const dupName = await sql`SELECT 1 FROM profiles WHERE lower(username) = lower(${username})`;
        if (dupName.length) throw new HttpError(409, 'Bu kullanıcı adı zaten alınmış.');

        const [user] = await sql`
          INSERT INTO users (email, password_hash, last_login_at)
          VALUES (${email}, ${hashPassword(password)}, now()) RETURNING id, email`;
        await sql`INSERT INTO profiles (user_id, username) VALUES (${user.id}, ${username})`;
        await ensureRoles(user.id, email);
        setCookie(res, signToken(user.id), MAX_AGE, req);
        return send({ user: { id: user.id, email: user.email } }, 201);
      }

      if (seg[1] === 'login' && method === 'POST') {
        const email = String(body.email || '').trim().toLowerCase();
        const rows = await sql`SELECT id, email, password_hash FROM users WHERE email = ${email}`;
        if (!rows.length || !checkPassword(String(body.password || ''), rows[0].password_hash)) {
          throw new HttpError(401, 'E-posta veya şifre hatalı.');
        }
        await sql`UPDATE users SET last_login_at = now() WHERE id = ${rows[0].id}`;
        await ensureRoles(rows[0].id, rows[0].email);
        setCookie(res, signToken(rows[0].id), MAX_AGE, req);
        return send({ user: { id: rows[0].id, email: rows[0].email } });
      }

      if (seg[1] === 'logout' && method === 'POST') {
        setCookie(res, '', 0, req);
        return send({ success: true });
      }

      if (seg[1] === 'me' && method === 'GET') {
        const id = getUserId(req);
        if (!id) return send({ user: null, profile: null, isAdmin: false });
        const users = await sql`SELECT id, email FROM users WHERE id = ${id}`;
        if (!users.length) return send({ user: null, profile: null, isAdmin: false });
        const profiles = await sql`SELECT * FROM profiles WHERE user_id = ${id}`;
        return send({ user: users[0], profile: profiles[0] || null, isAdmin: await isAdminUser(id) });
      }
    }

    /* ----- SNIPPETS ----- */
    if (seg[0] === 'snippets') {
      if (seg.length === 1 && method === 'GET') {
        const lang = url.searchParams.get('language') || null;
        const q = (url.searchParams.get('q') || '').trim() || null;
        const owner = url.searchParams.get('user_id') || null;
        const limit = Math.min(Number(url.searchParams.get('limit')) || 200, 500);
        const rows = await sql`
          SELECT s.*, json_build_object('username', p.username) AS profiles
          FROM snippets s LEFT JOIN profiles p ON p.user_id = s.user_id
          WHERE (${lang}::text IS NULL OR s.language = ${lang})
            AND (${owner}::uuid IS NULL OR s.user_id = ${owner})
            AND (${q}::text IS NULL OR s.title ILIKE '%' || ${q} || '%' OR s.description ILIKE '%' || ${q} || '%')
          ORDER BY s.created_at DESC
          LIMIT ${limit}`;
        return send(rows);
      }

      if (seg.length === 1 && method === 'POST') {
        const userId = requireUser(req);
        const title = String(body.title || '').trim();
        const code = String(body.code || '');
        if (!title || !code.trim()) throw new HttpError(400, 'Başlık ve kod zorunlu.');
        const [row] = await sql`
          INSERT INTO snippets (user_id, title, description, language, code)
          VALUES (${userId}, ${title}, ${body.description || null}, ${body.language || 'python'}, ${code})
          RETURNING *`;
        return send(row, 201);
      }

      const id = seg[1];
      if (id && !/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(400, 'Geçersiz id.');

      if (id && seg.length === 2 && method === 'GET') {
        const rows = await sql`
          SELECT s.*, json_build_object('username', p.username) AS profiles
          FROM snippets s LEFT JOIN profiles p ON p.user_id = s.user_id
          WHERE s.id = ${id}`;
        return send(rows[0] || null);
      }

      if (id && seg[2] === 'view' && method === 'POST') {
        await sql`UPDATE snippets SET views = views + 1 WHERE id = ${id}`;
        return send({ success: true });
      }

      if (id && seg.length === 2 && (method === 'PUT' || method === 'DELETE')) {
        const userId = requireUser(req);
        const existing = await sql`SELECT user_id FROM snippets WHERE id = ${id}`;
        if (!existing.length) throw new HttpError(404, 'Kod bulunamadı.');
        if (existing[0].user_id !== userId && !(await isAdminUser(userId))) {
          throw new HttpError(403, 'Bu kodu değiştirme yetkin yok.');
        }
        if (method === 'DELETE') {
          await sql`DELETE FROM snippets WHERE id = ${id}`;
          return send({ success: true });
        }
        const [row] = await sql`
          UPDATE snippets SET
            title = COALESCE(${body.title ?? null}, title),
            description = COALESCE(${body.description ?? null}, description),
            language = COALESCE(${body.language ?? null}, language),
            code = COALESCE(${body.code ?? null}, code),
            updated_at = now()
          WHERE id = ${id} RETURNING *`;
        return send(row);
      }
    }

    /* ----- PROFİL ----- */
    if (seg[0] === 'profiles' && seg[1] && method === 'GET') {
      const rows = await sql`SELECT * FROM profiles WHERE username = ${decodeURIComponent(seg[1])}`;
      return send(rows[0] || null);
    }

    /* ----- HERKESE AÇIK: site ayarları, diller ----- */
    if (seg[0] === 'site-settings' && method === 'GET') {
      const rows = await sql`SELECT * FROM site_settings WHERE id = 1`;
      return send(rows[0] || null);
    }

    if (seg[0] === 'languages' && method === 'GET') {
      return send(await sql`SELECT * FROM languages ORDER BY sort_order, label`);
    }

    /* ----- ADMIN ----- */
    if (seg[0] === 'admin') {
      // Vercel Blob yükleme tamamlandı bildirimi Vercel'den gelir (çerez yok)
      const isBlobCallback = seg[1] === 'blob-upload' && body?.type === 'blob.upload-completed';
      const adminId = isBlobCallback ? '' : await requireAdmin(req);

      // Vercel Blob bağlı mı? (arayüz, yükleme başarısız olursa net bir mesaj göstermek için sorar)
      if (seg[1] === 'blob-status' && method === 'GET') {
        return send({ enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN) });
      }

      if (seg[1] === 'blob-upload' && method === 'POST') {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          throw new HttpError(501, 'Dosya yükleme için Vercel Blob bağlanmamış. Video bağlantısı (URL) kullanabilirsin.');
        }
        const { handleUpload } = await import('@vercel/blob/client');
        const json = await handleUpload({
          body,
          request: req,
          onBeforeGenerateToken: async () => ({
            allowedContentTypes: ['video/*', 'image/*'],
            maximumSizeInBytes: 100 * 1024 * 1024,
            addRandomSuffix: true,
          }),
          onUploadCompleted: async () => {},
        });
        return send(json);
      }

      if (seg[1] === 'snippets' && seg.length === 2 && method === 'GET') {
        return send(await sql`
          SELECT s.*, json_build_object('username', p.username) AS profiles
          FROM snippets s LEFT JOIN profiles p ON p.user_id = s.user_id
          ORDER BY s.created_at DESC`);
      }

      if (seg[1] === 'users' && seg.length === 2 && method === 'GET') {
        return send(await sql`
          SELECT p.*, u.email, u.last_login_at,
                 (SELECT count(*)::int FROM snippets s WHERE s.user_id = p.user_id) AS snippet_count
          FROM profiles p JOIN users u ON u.id = p.user_id
          ORDER BY p.created_at DESC`);
      }

      if (seg[1] === 'users' && seg[2] && method === 'PUT') {
        const username = String(body.username || '').trim();
        if (username.length < 3) throw new HttpError(400, 'Kullanıcı adı en az 3 karakter olmalı.');
        const taken = await sql`
          SELECT 1 FROM profiles WHERE lower(username) = lower(${username}) AND user_id <> ${seg[2]}`;
        if (taken.length) throw new HttpError(409, 'Bu kullanıcı adı zaten alınmış.');
        const [row] = await sql`
          UPDATE profiles SET username = ${username}, bio = ${body.bio || null}, updated_at = now()
          WHERE user_id = ${seg[2]} RETURNING *`;
        return send(row);
      }

      if (seg[1] === 'users' && seg[2] && method === 'DELETE') {
        if (seg[2] === adminId) throw new HttpError(400, 'Kendi hesabını silemezsin.');
        await sql`DELETE FROM users WHERE id = ${seg[2]}`;
        return send({ success: true });
      }

      if (seg[1] === 'site-settings' && method === 'PUT') {
        const has = (k: string) => k in body;
        const text = (k: string, fallback: string | null = null) =>
          body[k] === undefined || body[k] === null || body[k] === '' ? fallback : String(body[k]);

        if (has('accent_color') && !HEX.test(body.accent_color)) throw new HttpError(400, 'Geçersiz vurgu rengi.');
        if (has('bg_color') && !HEX.test(body.bg_color)) throw new HttpError(400, 'Geçersiz arka plan rengi.');
        if (has('shader_color') && !HEX.test(body.shader_color)) throw new HttpError(400, 'Geçersiz shader rengi.');
        if (has('shader_style') && !SHADER_STYLES.includes(body.shader_style)) {
          throw new HttpError(400, 'Geçersiz shader stili.');
        }
        if (has('site_title') && !String(body.site_title).trim()) throw new HttpError(400, 'Site adı boş olamaz.');

        const rotation = has('video_rotation') ? [0, 90, 180, 270].includes(Number(body.video_rotation)) ? Number(body.video_rotation) : 0 : null;

        const [row] = await sql`
          UPDATE site_settings SET
            background_video_url = CASE WHEN ${has('background_video_url')}::boolean THEN ${text('background_video_url')}::text ELSE background_video_url END,
            site_title = CASE WHEN ${has('site_title')}::boolean THEN ${text('site_title', '10n-Girls')}::text ELSE site_title END,
            site_description = CASE WHEN ${has('site_description')}::boolean THEN ${text('site_description')}::text ELSE site_description END,
            show_stats = CASE WHEN ${has('show_stats')}::boolean THEN ${Boolean(body.show_stats)}::boolean ELSE show_stats END,
            video_blur = CASE WHEN ${has('video_blur')}::boolean THEN ${clampInt(body.video_blur, 0, 30)}::int ELSE video_blur END,
            video_rotation = CASE WHEN ${has('video_rotation')}::boolean THEN ${rotation}::int ELSE video_rotation END,
            video_flip_h = CASE WHEN ${has('video_flip_h')}::boolean THEN ${Boolean(body.video_flip_h)}::boolean ELSE video_flip_h END,
            video_flip_v = CASE WHEN ${has('video_flip_v')}::boolean THEN ${Boolean(body.video_flip_v)}::boolean ELSE video_flip_v END,
            video_fit = CASE WHEN ${has('video_fit')}::boolean THEN ${Boolean(body.video_fit)}::boolean ELSE video_fit END,
            accent_color = CASE WHEN ${has('accent_color')}::boolean THEN ${text('accent_color', '#ffffff')}::text ELSE accent_color END,
            bg_color = CASE WHEN ${has('bg_color')}::boolean THEN ${text('bg_color', '#000000')}::text ELSE bg_color END,
            shader_color = CASE WHEN ${has('shader_color')}::boolean THEN ${text('shader_color', '#000000')}::text ELSE shader_color END,
            shader_opacity = CASE WHEN ${has('shader_opacity')}::boolean THEN ${clampInt(body.shader_opacity, 0, 100)}::int ELSE shader_opacity END,
            shader_style = CASE WHEN ${has('shader_style')}::boolean THEN ${text('shader_style', 'gradient')}::text ELSE shader_style END,
            updated_at = now()
          WHERE id = 1 RETURNING *`;
        return send(row);
      }

      if (seg[1] === 'languages') {
        const icon = body.icon ? String(body.icon).slice(0, 16) : null;
        const iconUrl = body.icon_url ? String(body.icon_url) : null;
        if (iconUrl && (iconUrl.length > 1_500_000 || !/^(data:image\/|https?:\/\/)/.test(iconUrl))) {
          throw new HttpError(400, 'Geçersiz veya çok büyük görsel.');
        }

        if (seg.length === 2 && method === 'POST') {
          const value = String(body.value || '').trim().toLowerCase().replace(/[^a-z0-9#+_-]/g, '');
          const label = String(body.label || '').trim();
          if (!value || !label) throw new HttpError(400, 'Dil adı ve kodu gerekli.');
          const dup = await sql`SELECT 1 FROM languages WHERE value = ${value}`;
          if (dup.length) throw new HttpError(409, 'Bu dil kodu zaten mevcut.');
          const [row] = await sql`
            INSERT INTO languages (value, label, icon, icon_url, sort_order)
            VALUES (${value}, ${label}, ${icon}, ${iconUrl}, ${Number(body.sort_order) || 0}) RETURNING *`;
          retu
