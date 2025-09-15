-- Create storage buckets for image uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('events', 'events', true, 5242880, '{"image/*"}'),
  ('payment-channels', 'payment-channels', true, 5242880, '{"image/*"}'),
  ('notification-templates', 'notification-templates', true, 5242880, '{"image/*"}')
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create storage policies for public access
CREATE POLICY IF NOT EXISTS "Public Access" ON storage.objects FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can upload" ON storage.objects 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated users can update" ON storage.objects 
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated users can delete" ON storage.objects 
FOR DELETE USING (auth.role() = 'authenticated');

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
