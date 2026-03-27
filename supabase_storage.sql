-- SiteStream DMS: Supabase Storage Setup
-- Run this in your Supabase SQL Editor to create the storage bucket for document uploads.

-- 1. Create the storage bucket (public = true so we can get public URLs for file preview)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policy: SITE_TEAM users can upload files to their own folder
CREATE POLICY "Site team and admins can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (public.has_role('SITE_TEAM') OR public.has_role('ADMIN'))
);

-- 3. Storage Policy: All authenticated users can view/read documents
CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- 4. Storage Policy: Admins can delete any document
CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  public.has_role('ADMIN')
);
