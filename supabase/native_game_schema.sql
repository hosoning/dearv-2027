-- DearV native game extension
-- Apply after `supabase/schema.sql` in the hosted project's SQL editor.

alter table memory_objects
  add column if not exists asset_url text,
  add column if not exists asset_version integer not null default 1,
  add column if not exists display_config jsonb not null default '{}'::jsonb,
  add column if not exists interaction_config jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

alter table placed_items
  add column if not exists scale_x double precision not null default 1,
  add column if not exists scale_y double precision not null default 1,
  add column if not exists scale_z double precision not null default 1,
  add column if not exists state jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists room_runtime_state (
  room_id uuid not null references rooms(id) on delete cascade,
  object_id text not null,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (room_id, object_id)
);

create index if not exists room_runtime_state_room_id_idx
  on room_runtime_state(room_id);

alter table room_runtime_state enable row level security;
revoke all on table room_runtime_state from anon;
grant select, insert, update, delete on table room_runtime_state to authenticated;

drop policy if exists "runtime state follows room ownership" on room_runtime_state;
create policy "runtime state follows room ownership" on room_runtime_state
  for all
  using (
    exists (
      select 1 from rooms
      where rooms.id = room_runtime_state.room_id
        and rooms.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from rooms
      where rooms.id = room_runtime_state.room_id
        and rooms.user_id = auth.uid()
    )
  );

create or replace function set_native_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists memory_objects_native_updated_at on memory_objects;
create trigger memory_objects_native_updated_at
  before update on memory_objects
  for each row execute function set_native_updated_at();

drop trigger if exists placed_items_native_updated_at on placed_items;
create trigger placed_items_native_updated_at
  before update on placed_items
  for each row execute function set_native_updated_at();

drop trigger if exists room_runtime_state_native_updated_at on room_runtime_state;
create trigger room_runtime_state_native_updated_at
  before update on room_runtime_state
  for each row execute function set_native_updated_at();
