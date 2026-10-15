-- 10n-Girls - Neon (Postgres) şeması.
-- Neon panelinde SQL Editor'e yapıştırıp bir kez çalıştır. Tekrar çalıştırmak güvenlidir.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  bio text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  language text NOT NULL DEFAULT 'python',
  code text NOT NULL,
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_snippets_created_at ON snippets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets (language);
CREATE INDEX IF NOT EXISTS idx_snippets_user_id ON snippets (user_id);

CREATE TABLE IF NOT EXISTS languages (
  value text PRIMARY KEY,
  label text NOT NULL,
  icon text,
  icon_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_settings (
  id integer PRIMARY KEY DEFAULT 1,
  background_video_url text,
  site_title text NOT NULL DEFAULT '10n-Girls',
  site_description text,
  show_stats boolean NOT NULL DEFAULT true,
  video_blur integer NOT NULL DEFAULT 0,
  video_rotation integer NOT NULL DEFAULT 0,
  video_flip_h boolean NOT NULL DEFAULT false,
  video_flip_v boolean NOT NULL DEFAULT false,
  video_fit boolean NOT NULL DEFAULT true,
  -- Görünüm ayarları (admin paneli > Görünüm)
  accent_color text NOT NULL DEFAULT '#ffffff',
  bg_color text NOT NULL DEFAULT '#000000',
  shader_color text NOT NULL DEFAULT '#000000',
  shader_opacity integer NOT NULL DEFAULT 50,
  shader_style text NOT NULL DEFAULT 'gradient',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row_only CHECK (id = 1)
);

INSERT INTO site_settings (id, background_video_url, site_title, site_description)
VALUES (1, 'https://cdn.coverr.co/videos/coverr-typing-on-a-laptop-2582/1080p.mp4', '10n-Girls', 'Kod paylaş, kopyala, çalıştır')
ON CONFLICT (id) DO NOTHING;

INSERT INTO languages (value, label, icon, sort_order) VALUES
('python','Python','🐍',1),('csharp','C#','🔵',2),('javascript','JavaScript','🟨',3),('typescript','TypeScript','🔷',4),
('java','Java','☕',5),('cpp','C++','➕',6),('c','C','🔵',7),('go','Go','🟦',8),('rust','Rust','🦀',9),('ruby','Ruby','💎',10),
('php','PHP','🐘',11),('html','HTML','🌐',12),('css','CSS','🎨',13),('sql','SQL','🗄️',14),('bash','Bash','⚙️',15),
('kotlin','Kotlin','🟪',16),('swift','Swift','🍎',17),('text','Düz Metin','📄',18)
ON CONFLICT (value) DO NOTHING;

-- Kayıt olduktan sonra kendini admin yapmak istersen (e-postanı yaz):
-- INSERT INTO user_roles (user_id, role) SELECT id, 'admin' FROM users WHERE email = 'senin@email.com' ON CONFLICT DO NOTHING;
