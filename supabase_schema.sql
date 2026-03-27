-- SiteStream DMS Database Schema

-- Create Custom Types
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('ADMIN', 'SITE_TEAM', 'CHECKER', 'ACCOUNTS');
DROP TYPE IF EXISTS document_status CASCADE;
CREATE TYPE document_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Sites Table
CREATE TABLE IF NOT EXISTS public.sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles Table (Extends Supabase Auth Auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'SITE_TEAM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User_Sites Table (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS public.user_sites (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, site_id)
);

-- Vendors Table
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    pan_gst TEXT,
    state TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID REFERENCES public.sites(id) ON DELETE RESTRICT NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES public.vendors(id),
    amount DECIMAL(12, 2) NOT NULL,
    document_date DATE DEFAULT CURRENT_DATE,
    invoice_number TEXT,
    unique_code TEXT,
    state TEXT,
    file_url TEXT NOT NULL,
    status document_status DEFAULT 'PENDING',
    remarks TEXT,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to check user role without triggering recursive RLS
CREATE OR REPLACE FUNCTION public.has_role(allowed_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = allowed_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to automatically create a profile when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 'SITE_TEAM');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Set Up Row Level Security (RLS) policies

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 1. Sites Policies
-- Admins can do everything
DROP POLICY IF EXISTS "Admins can manage sites" ON public.sites;
CREATE POLICY "Admins can manage sites" ON public.sites
    FOR ALL USING (public.has_role('ADMIN'));
-- Everyone else can view active sites they are assigned to
DROP POLICY IF EXISTS "Users can view assigned sites" ON public.sites;
CREATE POLICY "Users can view assigned sites" ON public.sites
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_sites WHERE user_id = auth.uid() AND site_id = id)
    );

-- 2. Profiles Policies
-- Admins can do everything
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
CREATE POLICY "Admins can manage profiles" ON public.profiles
    FOR ALL USING (public.has_role('ADMIN'));
-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (id = auth.uid());

-- 3. User_Sites Policies
-- Admins can manage assignments
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.user_sites;
CREATE POLICY "Admins can manage assignments" ON public.user_sites
    FOR ALL USING (public.has_role('ADMIN'));
-- Users can view their own assignments
DROP POLICY IF EXISTS "Users can view own assignments" ON public.user_sites;
CREATE POLICY "Users can view own assignments" ON public.user_sites
    FOR SELECT USING (user_id = auth.uid());

-- 4. Documents Policies
-- Accounts and Admin can view all
DROP POLICY IF EXISTS "Accounts and Admin can view all docs" ON public.documents;
CREATE POLICY "Accounts and Admin can view all docs" ON public.documents
    FOR SELECT USING (
        public.has_role('ADMIN') OR public.has_role('ACCOUNTS')
    );
-- Accounts and Admin can update all
DROP POLICY IF EXISTS "Accounts and Admin can update all docs" ON public.documents;
CREATE POLICY "Accounts and Admin can update all docs" ON public.documents
    FOR UPDATE USING (
        public.has_role('ADMIN') OR public.has_role('ACCOUNTS')
    );

-- Site Team can SELECT and INSERT only for their assigned sites
DROP POLICY IF EXISTS "Site Team or Admin can insert docs" ON public.documents;
CREATE POLICY "Site Team or Admin can insert docs" ON public.documents
    FOR INSERT WITH CHECK (
        public.has_role('ADMIN') OR (
            public.has_role('SITE_TEAM') AND
            EXISTS (SELECT 1 FROM public.user_sites WHERE user_id = auth.uid() AND site_id = documents.site_id)
        )
    );
DROP POLICY IF EXISTS "Site Team can view own site docs" ON public.documents;
CREATE POLICY "Site Team can view own site docs" ON public.documents
    FOR SELECT USING (
        public.has_role('SITE_TEAM') AND
        EXISTS (SELECT 1 FROM public.user_sites WHERE user_id = auth.uid() AND site_id = documents.site_id)
    );

-- Checkers can SELECT and UPDATE status only for their assigned sites
DROP POLICY IF EXISTS "Checkers can update assigned site docs" ON public.documents;
CREATE POLICY "Checkers can update assigned site docs" ON public.documents
    FOR UPDATE USING (
        public.has_role('CHECKER') AND
        EXISTS (SELECT 1 FROM public.user_sites WHERE user_id = auth.uid() AND site_id = documents.site_id)
    );
DROP POLICY IF EXISTS "Checkers can view assigned site docs" ON public.documents;
CREATE POLICY "Checkers can view assigned site docs" ON public.documents
    FOR SELECT USING (
        public.has_role('CHECKER') AND
        EXISTS (SELECT 1 FROM public.user_sites WHERE user_id = auth.uid() AND site_id = documents.site_id)
    );
