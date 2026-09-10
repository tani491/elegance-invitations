insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'gallery-photos',
    'gallery-photos',
    true,
    15728640,
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'image/avif'
    ]
  )
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read gallery photos" on storage.objects;
create policy "Public can read gallery photos"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'gallery-photos');

drop policy if exists "Photographers can upload gallery photos" on storage.objects;
create policy "Photographers can upload gallery photos"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'gallery-photos');
