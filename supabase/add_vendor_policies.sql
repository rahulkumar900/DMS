-- SiteStream DMS Database Migration: Add Vendor RLS Policies

-- 1. Enable RLS on the vendors table
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- 2. Allow all authenticated users to view vendors (for searching/autocomplete)
DROP POLICY IF EXISTS "Allow authenticated users to view all vendors" ON public.vendors;
CREATE POLICY "Allow authenticated users to view all vendors" ON public.vendors
    FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Allow authenticated users to create new vendors
DROP POLICY IF EXISTS "Allow authenticated users to insert vendors" ON public.vendors;
CREATE POLICY "Allow authenticated users to insert vendors" ON public.vendors
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4. Admins can manage vendors (update/delete)
DROP POLICY IF EXISTS "Admins can manage vendors" ON public.vendors;
CREATE POLICY "Admins can manage vendors" ON public.vendors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );
