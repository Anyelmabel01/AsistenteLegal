-- Migration: Add role column to profiles table

-- Add the role column with a default value
alter table public.profiles
add column role text default 'user' not null;

-- Update existing RLS policies if necessary (optional for now)
-- Example: If admins should bypass later, policies would be updated.
-- For now, existing policies (users manage own profile) remain appropriate.

-- Update the function to handle the new role column (though default handles it)
-- It's good practice to be explicit if needed, but default is fine here.
-- Re-creating function to ensure it exists if needed, or just alter if preferred.
-- Drop existing trigger and function if they exist to recreate cleanly
DROP TRIGGER IF EXISTS on_auth_user_created on auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate function to explicitly set the default role
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'user');
  return new;
end;
$$ language plpgsql security definer;

-- Recreate the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Grant usage on the function to postgres and anon roles if needed for triggers
-- GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
-- GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon; 