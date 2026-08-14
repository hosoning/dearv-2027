-- DearV Telegram progress and feedback bridge.
-- The Edge Function is the only writer. Nothing is exposed to anon/authenticated.

create extension if not exists "pgcrypto";

create table if not exists telegram_feedback (
  id uuid primary key default gen_random_uuid(),
  telegram_chat_id bigint not null,
  telegram_user_id bigint,
  telegram_message_id bigint not null,
  message text not null check (char_length(message) between 1 and 4000),
  status text not null default 'new' check (status in ('new', 'reviewed', 'accepted', 'done', 'dismissed')),
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (telegram_chat_id, telegram_message_id)
);

create table if not exists project_progress (
  id uuid primary key default gen_random_uuid(),
  phase text not null default 'development',
  summary text not null,
  status text not null default 'running' check (status in ('running', 'success', 'failure', 'cancelled')),
  commit_sha text,
  details_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists telegram_feedback_status_created_at_idx
  on telegram_feedback(status, created_at desc);
create index if not exists project_progress_created_at_idx
  on project_progress(created_at desc);

alter table telegram_feedback enable row level security;
alter table project_progress enable row level security;
revoke all on table telegram_feedback, project_progress from anon, authenticated;

comment on table telegram_feedback is
  'Private feedback received from the owner through the DearV Telegram bot.';
comment on table project_progress is
  'Build/deploy milestones used by the Telegram /status command.';
