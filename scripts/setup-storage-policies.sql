-- Setup RLS policies for storage.objects (not storage.buckets)
-- The buckets should already exist, we just need proper policies

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Create new policies for storage.objects
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload" ON storage.objects 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update" ON storage.objects 
FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete" ON storage.objects 
FOR DELETE USING (true);

-- Make sure the buckets exist and are public
UPDATE storage.buckets 
SET public = true 
WHERE id IN ('events', 'payment-channels', 'notification-templates');
