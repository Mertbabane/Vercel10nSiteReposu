-- Yazıyor göstergesi + kod görseli. Site bunu ilk istekte kendisi de çalıştırır; elle çalıştırmak da güvenlidir.
CREATE TABLE IF NOT EXISTS chat_typing (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE snippets ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS snippet_image_position text NOT NULL DEFAULT 'below';
