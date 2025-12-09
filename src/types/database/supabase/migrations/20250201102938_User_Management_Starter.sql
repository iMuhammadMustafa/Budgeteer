-- CREATE OR REPLACE FUNCTION auth.tenantid() 
-- RETURNS UUID AS $$
-- BEGIN
--     -- Extract the tenantid from raw_user_meta_data in the JWT claims
--     RETURN current_setting('request.jwt.claims.raw_user_meta_data')::jsonb->>'tenantid'::uuid;
-- END;
-- $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auth.tenantid() 
RETURNS UUID AS $$
DECLARE
    tenantid_text TEXT;
BEGIN
    -- Correctly access tenantid inside user_metadata
    tenantid_text := current_setting('request.jwt.claims', true)::jsonb->'user_metadata'->>'tenantid';

    --((((current_setting('request.jwt.claims'::text, true))::jsonb -> 'user_metadata'::text) ->> 'tenantid'::text))::uuid

    -- If missing or invalid, return NULL
    IF tenantid_text IS NULL OR tenantid_text !~ '^[0-9a-fA-F-]{36}$' THEN
        RETURN NULL;
    END IF;

    RETURN tenantid_text::UUID;
END;
$$ LANGUAGE plpgsql;


-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  email text unique,
  full_name text,
  avatar_url text,
  timezone text,
  tenantid uuid
);
-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles enable row level security;

create policy "Users can insert their own profile." on profiles
for insert with check ((select auth.uid()) = id);

create policy "Users can update own profile." on profiles
for update using ((select auth.uid()) = id);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
-- drop function public.handle_new_user;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, timezone, tenantid)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'avatar_url', 
    NEW.raw_user_meta_data->>'timezone', 
    CAST(NEW.raw_user_meta_data->>'tenantid' AS UUID) -- Properly casting the value to UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
create OR REPLACE trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Set up Storage!
insert into storage.buckets (id, name) values ('avatars', 'avatars');

-- Set up access controls for storage.
-- See https://supabase.com/docs/guides/storage#policy-examples for more details.
create policy "Avatar images are publicly accessible." on storage.objects for select using (bucket_id = 'avatars');

create policy "Anyone can upload an avatar." on storage.objects for insert with check (bucket_id = 'avatars');
