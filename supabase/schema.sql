-- 3D 回憶小屋 — Supabase schema
-- Run via `supabase db reset` (local dev) or the SQL editor on your hosted project.
-- Requires Supabase Auth (auth.users) to be enabled — every row is scoped to auth.uid().

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────
-- rooms: one row per room. Supports future multi-room layouts.
-- ─────────────────────────────────────────────────────────
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '我的小屋',
  layout_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists rooms_user_id_idx on rooms(user_id);

-- ─────────────────────────────────────────────────────────
-- placed_items: catalog items (furniture/decor) placed by the user
-- ─────────────────────────────────────────────────────────
create table if not exists placed_items (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  catalog_id text not null,
  category text not null,
  pos_x double precision not null default 0,
  pos_y double precision not null default 0,
  pos_z double precision not null default 0,
  rotation_y double precision not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists placed_items_room_id_idx on placed_items(room_id);

-- ─────────────────────────────────────────────────────────
-- letters: written/read inside the house
-- ─────────────────────────────────────────────────────────
create table if not exists letters (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  title text not null default '',
  content text not null default '',
  mood_tag text,
  attachment_url text,
  created_at timestamptz not null default now()
);

create index if not exists letters_room_id_idx on letters(room_id);

-- ─────────────────────────────────────────────────────────
-- memory_objects: star bottles, photo frames, gift boxes, etc.
-- ─────────────────────────────────────────────────────────
create table if not exists memory_objects (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  type text not null, -- 'star_bottle' | 'photo_frame' | 'gift_box'
  title text not null default '',
  image_url text,
  note text,
  pos_x double precision not null default 0,
  pos_y double precision not null default 0,
  pos_z double precision not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists memory_objects_room_id_idx on memory_objects(room_id);

-- ─────────────────────────────────────────────────────────
-- Row Level Security — every table is scoped to the owning user via rooms.user_id
-- ─────────────────────────────────────────────────────────
alter table rooms enable row level security;
alter table placed_items enable row level security;
alter table letters enable row level security;
alter table memory_objects enable row level security;

-- Data API grants are explicit because automatic exposure of new tables is
-- disabled for the private project. RLS still scopes every request by owner.
revoke all on table rooms, placed_items, letters, memory_objects from anon;
grant select, insert, update, delete on table rooms, placed_items, letters, memory_objects to authenticated;

create policy "rooms are owned by their user" on rooms
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "placed_items follow room ownership" on placed_items
  for all using (
    exists (select 1 from rooms where rooms.id = placed_items.room_id and rooms.user_id = auth.uid())
  )
  with check (
    exists (select 1 from rooms where rooms.id = placed_items.room_id and rooms.user_id = auth.uid())
  );

create policy "letters follow room ownership" on letters
  for all using (
    exists (select 1 from rooms where rooms.id = letters.room_id and rooms.user_id = auth.uid())
  )
  with check (
    exists (select 1 from rooms where rooms.id = letters.room_id and rooms.user_id = auth.uid())
  );

create policy "memory_objects follow room ownership" on memory_objects
  for all using (
    exists (select 1 from rooms where rooms.id = memory_objects.room_id and rooms.user_id = auth.uid())
  )
  with check (
    exists (select 1 from rooms where rooms.id = memory_objects.room_id and rooms.user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────
-- Storage bucket for letter/memory-object attachments (images)
-- ─────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dearv-private-assets',
  'dearv-private-assets',
  false,
  52428800,
  array[
    'image/png', 'image/jpeg', 'image/webp',
    'model/gltf-binary', 'model/gltf+json',
    'audio/mpeg', 'audio/ogg', 'audio/wav',
    'application/pdf', 'application/octet-stream'
  ]
)
on conflict (id) do update set public = false;

drop policy if exists "owner reads dearv web assets" on storage.objects;
drop policy if exists "owner creates dearv web assets" on storage.objects;
drop policy if exists "owner updates dearv web assets" on storage.objects;
drop policy if exists "owner deletes dearv web assets" on storage.objects;

create policy "owner reads dearv web assets"
  on storage.objects for select to authenticated
  using (bucket_id = 'dearv-private-assets' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "owner creates dearv web assets"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'dearv-private-assets' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "owner updates dearv web assets"
  on storage.objects for update to authenticated
  using (bucket_id = 'dearv-private-assets' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'dearv-private-assets' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "owner deletes dearv web assets"
  on storage.objects for delete to authenticated
  using (bucket_id = 'dearv-private-assets' and auth.uid()::text = (storage.foldername(name))[1]);
