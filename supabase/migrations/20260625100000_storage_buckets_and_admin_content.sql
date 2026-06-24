-- Storage buckets required for notice attachments, resources, gallery, and avatars.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('notice-attachments', 'notice-attachments', false),
  ('resources', 'resources', false),
  ('gallery', 'gallery', false),
  ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;

-- Env-based administrators create content via service role (no Supabase auth user).
ALTER TABLE public.notices ALTER COLUMN posted_by DROP NOT NULL;
ALTER TABLE public.resources ALTER COLUMN uploaded_by DROP NOT NULL;
