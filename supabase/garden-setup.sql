-- Garden World moments (Instagram-style posts for every hobby) — run in your
-- Supabase project (Dashboard → SQL Editor → New query → paste → Run).
-- Safe to run more than once, and safe on top of the earlier photo-gallery version.

-- 1. A public bucket for the photo files (anyone can view, nobody can write
--    directly — uploads only work through the site's short-lived signed URLs).
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- 2. Posts: one hobby, one caption, an optional place and day.
--    `interest` is the hobby's id from src/data/profile.js (e.g. 'nature').
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  interest text not null,
  caption text not null default '' check (char_length(caption) <= 2000),
  place text not null default '' check (char_length(place) <= 100),
  taken_on date,
  created_at timestamptz not null default now()
);

-- 3. Photos: the files of each post, in order.
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  caption text not null default '',
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  created_at timestamptz not null default now()
);
alter table public.photos add column if not exists post_id uuid references public.posts (id) on delete cascade;
alter table public.photos add column if not exists position integer not null default 0;
create index if not exists photos_post_id_idx on public.photos (post_id, position);

-- 4. Photos uploaded with the earlier gallery: each becomes a Photography post.
do $$
declare
  photo record;
  new_post uuid;
begin
  for photo in select id, caption, created_at from public.photos where post_id is null loop
    insert into public.posts (interest, caption, created_at)
    values ('photography', photo.caption, photo.created_at)
    returning id into new_post;
    update public.photos set post_id = new_post, position = 0 where id = photo.id;
  end loop;
end $$;

-- 5. Row level security on, with no policies: the public (anon) key can't read
--    or write either table. Only the site's server (service role) can.
alter table public.posts enable row level security;
alter table public.photos enable row level security;
