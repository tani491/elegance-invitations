alter table if exists public."Theme"
  add column if not exists "bgPrimary" text not null default '#5C1D24',
  add column if not exists "cardBg" text not null default '#FAF7F2',
  add column if not exists "accentGold" text not null default '#D4AF37',
  add column if not exists "textColor" text not null default '#5C1D24',
  add column if not exists "scrollAnimation" text not null default 'fade-up',
  add column if not exists "backdropUrl" text;

alter table if exists public.themes
  add column if not exists bg_primary text not null default '#5C1D24',
  add column if not exists card_bg text not null default '#FAF7F2',
  add column if not exists accent_gold text not null default '#D4AF37',
  add column if not exists text_color text not null default '#5C1D24',
  add column if not exists scroll_animation text not null default 'fade-up',
  add column if not exists backdrop_url text;

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
