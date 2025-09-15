-- Create storage buckets for image uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
('events', 'events', true),
('payment-channels', 'payment-channels', true);

-- Set up RLS policies for the buckets
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('events', 'payment-channels'));
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('events', 'payment-channels') AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON storage.objects FOR UPDATE USING (bucket_id IN ('events', 'payment-channels') AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete" ON storage.objects FOR DELETE USING (bucket_id IN ('events', 'payment-channels') AND auth.role() = 'authenticated');
