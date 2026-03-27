-- SiteStream DMS Database Migration: Add SITE_TEAM Update Policy for Documents

-- Allow SITE_TEAM to update their own documents if they are PENDING or REJECTED
-- This allows them to fix errors after a checker has queried the bill or if they made a mistake before approval.

DROP POLICY IF EXISTS "Site Team can update own pending/rejected docs" ON public.documents;
CREATE POLICY "Site Team can update own pending/rejected docs" ON public.documents
    FOR UPDATE USING (
        public.has_role('SITE_TEAM') AND
        uploaded_by = auth.uid() AND
        (status = 'PENDING' OR status = 'REJECTED')
    );

-- Also ensure SITE_TEAM can view their own sites correctly (already exists in schema but good to have)
-- DROP POLICY IF EXISTS "Users can view assigned sites" ON public.sites;
-- CREATE POLICY "Users can view assigned sites" ON public.sites
--     FOR SELECT USING (
--         EXISTS (SELECT 1 FROM public.user_sites WHERE user_id = auth.uid() AND site_id = id)
--     );
