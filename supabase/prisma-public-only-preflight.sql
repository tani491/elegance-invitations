-- Run this once before `npx prisma db push` if the database still contains
-- legacy Supabase-auth-coupled tables from `001_initial_elegance_schema.sql`.
--
-- Prisma is now intentionally restricted to the `public` schema only.
-- These old foreign keys point from `public` to `auth.users`, which forces
-- Prisma to inspect Supabase's internal `auth` schema and can trigger:
-- ERROR: must be owner of table oauth_authorizations

alter table if exists public.profiles
  drop constraint if exists profiles_id_fkey;

alter table if exists public.weddings
  drop constraint if exists weddings_owner_id_fkey;
