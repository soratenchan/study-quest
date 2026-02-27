-- StudyQuest Database Schema
-- Run this in your Supabase SQL editor

create table rooms (
  id uuid primary key default gen_random_uuid(),
  url_token text unique not null default gen_random_uuid()::text,
  created_at timestamptz default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  name text not null,
  avatar text default '🦊',
  xp integer default 0,
  level integer default 1,
  last_task_date date,
  streak_count integer default 0,
  created_at timestamptz default now()
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  description text,
  year integer not null default extract(year from now()),
  created_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references goals(id) on delete cascade,
  title text not null,
  type text not null check (type in ('yearly', 'monthly', 'weekly')),
  due_date date,
  is_completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references users(id) on delete cascade,
  to_user_id uuid references users(id) on delete cascade,
  content text,
  stamp text,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table study_logs (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  memo text not null,
  session_date date not null default current_date,
  created_at timestamptz default now()
);

create table badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  badge_type text not null,
  acquired_at timestamptz default now(),
  unique(user_id, badge_type)
);

-- Enable Realtime for real-time updates
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table users;
alter publication supabase_realtime add table study_logs;

-- Row Level Security (RLS) - optional but recommended
-- For MVP without auth, you can disable RLS or allow all operations
alter table rooms enable row level security;
alter table users enable row level security;
alter table goals enable row level security;
alter table tasks enable row level security;
alter table comments enable row level security;
alter table study_logs enable row level security;
alter table badges enable row level security;

-- Allow all operations for MVP (no auth)
create policy "Allow all" on rooms for all using (true) with check (true);
create policy "Allow all" on users for all using (true) with check (true);
create policy "Allow all" on goals for all using (true) with check (true);
create policy "Allow all" on tasks for all using (true) with check (true);
create policy "Allow all" on comments for all using (true) with check (true);
create policy "Allow all" on study_logs for all using (true) with check (true);
create policy "Allow all" on badges for all using (true) with check (true);
