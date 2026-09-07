alter table if exists public."Theme"
  add column if not exists "bgPrimary" text default '#FAF6F0',
  add column if not exists "cardBg" text default 'rgba(255, 255, 255, 0.85)',
  add column if not exists "accentGold" text default '#D4AF37',
  add column if not exists "textColor" text default '#2D2013',
  add column if not exists "scrollAnimation" text default 'fade-up',
  add column if not exists "backdropUrl" text;

alter table if exists public.themes
  add column if not exists bg_primary text default '#FAF6F0',
  add column if not exists card_bg text default 'rgba(255, 255, 255, 0.85)',
  add column if not exists accent_gold text default '#D4AF37',
  add column if not exists text_color text default '#2D2013',
  add column if not exists scroll_animation text default 'fade-up',
  add column if not exists backdrop_url text;

alter table if exists public."Theme"
  alter column "bgPrimary" drop not null,
  alter column "cardBg" drop not null,
  alter column "accentGold" drop not null,
  alter column "textColor" drop not null,
  alter column "scrollAnimation" drop not null;

alter table if exists public.themes
  alter column bg_primary drop not null,
  alter column card_bg drop not null,
  alter column accent_gold drop not null,
  alter column text_color drop not null,
  alter column scroll_animation drop not null;

do $$
begin
  if to_regclass('public."Theme"') is not null then
    update public."Theme"
    set "bgPrimary" = coalesce("primaryColor", "bgPrimary"),
        "cardBg" = coalesce("secondaryColor", "cardBg"),
        "accentGold" = coalesce("goldColor", "accentGold"),
        "textColor" = coalesce("primaryColor", "textColor"),
        "scrollAnimation" = coalesce("scrollAnimation", 'fade-up');
  end if;
end $$;

do $$
begin
  if to_regclass('public.themes') is not null then
    update public.themes
    set bg_primary = coalesce(primary_color, bg_primary),
        card_bg = coalesce(secondary_color, card_bg),
        accent_gold = coalesce(gold_color, accent_gold),
        text_color = coalesce(primary_color, text_color),
        scroll_animation = coalesce(scroll_animation, 'fade-up');
  end if;
end $$;

alter table if exists public."Theme"
  drop constraint if exists theme_scroll_animation_check,
  add constraint theme_scroll_animation_check
  check ("scrollAnimation" in ('fade-up', 'scale-in', 'slide-stagger'));

alter table if exists public.themes
  drop constraint if exists themes_scroll_animation_check,
  add constraint themes_scroll_animation_check
  check (scroll_animation in ('fade-up', 'scale-in', 'slide-stagger'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'theme-videos',
    'theme-videos',
    true,
    52428800,
    array['video/mp4', 'video/quicktime', 'video/webm', 'video/mov']
  )
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
