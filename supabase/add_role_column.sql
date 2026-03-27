-- Sites Stream DMS Database Migration: Add Role Column

-- 1. Create the user_role enum type if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('ADMIN', 'SITE_TEAM', 'CHECKER', 'ACCOUNTS');
    END IF;
END$$;

-- 2. Add the role column to the profiles table if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role user_role NOT NULL DEFAULT 'SITE_TEAM';
    END IF;
END$$;

-- 3. Update the handle_new_user function to ensure it correctly assigns the role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
    'SITE_TEAM'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = COALESCE(public.profiles.role, EXCLUDED.role);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
