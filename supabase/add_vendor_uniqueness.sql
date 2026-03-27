-- SiteStream DMS Database Migration: Add Vendor Uniqueness

-- Add a unique index on pan_gst to ensure no duplicates, while allowing multiple NULLs
CREATE UNIQUE INDEX IF NOT EXISTS vendors_pan_gst_unique_idx 
ON public.vendors (pan_gst) 
WHERE pan_gst IS NOT NULL;

-- Note: The 'name' column is already UNIQUE as per the initial schema.
-- If you want to make it case-insensitive unique:
-- ALTER TABLE public.vendors DROP CONSTRAINT IF EXISTS vendors_name_key;
-- CREATE UNIQUE INDEX IF NOT EXISTS vendors_name_case_insensitive_idx ON public.vendors (LOWER(name));
