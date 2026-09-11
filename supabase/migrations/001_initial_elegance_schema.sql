create type public.user_role as enum ('admin', 'client');
create type public.plan_tier as enum ('essentielle', 'prestige', 'privilege');
create type public.rsvp_status as enum ('pending', 'confirmed', 'declined');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role public.user_role not null default 'client',
  display_name text,
  wedding_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.themes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tier public.plan_tier not null default 'essentielle',
  preview_video_url text,
  opening_video_url text,
  primary_color text not null default '#5C1D24',
  secondary_color text not null default '#FAF7F2',
  accent_color text not null default '#C5A880',
  gold_color text not null default '#D4AF37',
  title_font text not null default 'Cormorant Garamond',
  animation_type text not null default 'wax_seal_burst',
  preview_gradient text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.weddings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  couple_names jsonb not null,
  wedding_date timestamptz,
  venue_data jsonb,
  dress_code jsonb,
  program jsonb,
  theme_id uuid references public.themes(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  primary_photo_url text,
  official_photo_urls jsonb not null default '[]'::jsonb,
  music_url text,
  invitation_quote text,
  gift_iban text,
  gift_wave text,
  plan_tier public.plan_tier not null default 'essentielle',
  is_active boolean not null default true,
  is_paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_wedding_id_fkey
  foreign key (wedding_id) references public.weddings(id) on delete set null;

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  token text not null unique,
  full_name text not null,
  phone text,
  email text,
  table_name text,
  max_guests integer not null default 1,
  plus_ones integer not null default 0,
  is_vip boolean not null default false,
  rsvp_status public.rsvp_status not null default 'pending',
  dietary_requirements text,
  menu_choice text,
  checked_in boolean not null default false,
  checked_in_at timestamptz,
  checked_in_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index weddings_owner_id_idx on public.weddings(owner_id);
create index weddings_theme_id_idx on public.weddings(theme_id);
create index guests_wedding_id_idx on public.guests(wedding_id);
create index guests_token_idx on public.guests(token);
create index themes_tier_idx on public.themes(tier);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('wedding-photos', 'wedding-photos', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('theme-videos', 'theme-videos', true, 52428800, array['video/mp4', 'video/webm'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.profiles enable row level security;
alter table public.themes enable row level security;
alter table public.weddings enable row level security;
alter table public.guests enable row level security;

create policy "Public can read active themes"
on public.themes for select
to anon, authenticated
using (is_active = true);

create policy "Admins manage themes"
on public.themes for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

create policy "Clients read own wedding"
on public.weddings for select
to authenticated
using (owner_id = (select auth.uid()) or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

create policy "Clients update own wedding"
on public.weddings for update
to authenticated
using (owner_id = (select auth.uid()) or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
with check (owner_id = (select auth.uid()) or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

create policy "Public can read active wedding invitations"
on public.weddings for select
to anon
using (is_active = true);

create policy "Clients read own guests"
on public.guests for select
to authenticated
using (
  exists (
    select 1 from public.weddings w
    where w.id = guests.wedding_id
      and (w.owner_id = (select auth.uid()) or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  )
);

create policy "Clients manage own guests"
on public.guests for all
to authenticated
using (
  exists (
    select 1 from public.weddings w
    where w.id = guests.wedding_id
      and (w.owner_id = (select auth.uid()) or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  )
)
with check (
  exists (
    select 1 from public.weddings w
    where w.id = guests.wedding_id
      and (w.owner_id = (select auth.uid()) or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  )
);

create policy "Authenticated users upload wedding photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'wedding-photos');

create policy "Authenticated users update wedding photos"
on storage.objects for update
to authenticated
using (bucket_id = 'wedding-photos')
with check (bucket_id = 'wedding-photos');

create policy "Admins upload theme videos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'theme-videos'
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
);

create policy "Admins update theme videos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'theme-videos'
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
)
with check (
  bucket_id = 'theme-videos'
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
);
