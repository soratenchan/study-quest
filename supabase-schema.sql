-- =============================================================
-- StudyQuest v2.0 スキーマ
-- 変更点:
--   - usersにauth_id追加 (Supabase Auth連携)
--   - goalsにis_public追加 (バディ公開設定)
--   - RLS: 認証済みユーザーのみallow-all
-- =============================================================

-- ルームテーブル
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  url_token text unique not null default replace(gen_random_uuid()::text, '-', ''),
  created_by uuid,
  created_at timestamptz default now()
);

-- ユーザーテーブル (Supabase Auth連携)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique references auth.users(id) on delete cascade,
  room_id uuid references rooms(id) on delete cascade,
  name text not null,
  avatar text default '🦊',
  xp integer default 0,
  level integer default 1,
  last_task_date date,
  streak_count integer default 0,
  created_at timestamptz default now()
);

-- 目標テーブル
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  description text,
  year integer not null default extract(year from now()),
  is_public boolean default true,
  created_at timestamptz default now()
);

-- タスクテーブル
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references goals(id) on delete cascade,
  title text not null,
  type text not null check (type in ('yearly', 'monthly', 'weekly')),
  due_date date,
  is_completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- コメントテーブル
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references users(id) on delete cascade,
  to_user_id uuid references users(id) on delete cascade,
  content text,
  stamp text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- 勉強会ログテーブル
create table if not exists study_logs (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  memo text not null,
  session_date date not null default current_date,
  created_at timestamptz default now()
);

-- バッジテーブル
create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  badge_type text not null,
  acquired_at timestamptz default now(),
  unique(user_id, badge_type)
);

-- =============================================================
-- Realtime 有効化
-- =============================================================
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table users;
alter publication supabase_realtime add table study_logs;

-- =============================================================
-- Row Level Security (認証済みユーザーのみ)
-- =============================================================
alter table rooms enable row level security;
alter table users enable row level security;
alter table goals enable row level security;
alter table tasks enable row level security;
alter table comments enable row level security;
alter table study_logs enable row level security;
alter table badges enable row level security;

create policy "rooms_auth" on rooms for all to authenticated using (true) with check (true);
create policy "users_auth" on users for all to authenticated using (true) with check (true);
create policy "goals_auth" on goals for all to authenticated using (true) with check (true);
create policy "tasks_auth" on tasks for all to authenticated using (true) with check (true);
create policy "comments_auth" on comments for all to authenticated using (true) with check (true);
create policy "logs_auth" on study_logs for all to authenticated using (true) with check (true);
create policy "badges_auth" on badges for all to authenticated using (true) with check (true);

-- =============================================================
-- v1 → v2 マイグレーション (既存DBに対して実行)
-- 新規セットアップ時は不要
-- =============================================================
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id uuid unique references auth.users(id) on delete cascade;
-- ALTER TABLE goals ADD COLUMN IF NOT EXISTS is_public boolean default true;
-- ALTER TABLE rooms ADD COLUMN IF NOT EXISTS created_by uuid;
-- DROP POLICY IF EXISTS "Allow all" ON rooms;
-- DROP POLICY IF EXISTS "Allow all" ON users;
-- DROP POLICY IF EXISTS "Allow all" ON goals;
-- DROP POLICY IF EXISTS "Allow all" ON tasks;
-- DROP POLICY IF EXISTS "Allow all" ON comments;
-- DROP POLICY IF EXISTS "Allow all" ON study_logs;
-- DROP POLICY IF EXISTS "Allow all" ON badges;
-- CREATE POLICY "rooms_auth" ON rooms FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- CREATE POLICY "users_auth" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- CREATE POLICY "goals_auth" ON goals FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- CREATE POLICY "tasks_auth" ON tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- CREATE POLICY "comments_auth" ON comments FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- CREATE POLICY "logs_auth" ON study_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- CREATE POLICY "badges_auth" ON badges FOR ALL TO authenticated USING (true) WITH CHECK (true);
