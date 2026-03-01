export interface Room {
  id: string;
  url_token: string;
  created_by: string | null;
  created_at: string;
}

export interface User {
  id: string;
  auth_id: string | null;
  room_id: string;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  last_task_date: string | null;
  streak_count: number;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  year: number;
  is_public: boolean;
  created_at: string;
  tasks?: Task[];
}

export type TaskType = 'yearly' | 'monthly' | 'weekly';

export interface Task {
  id: string;
  goal_id: string;
  title: string;
  type: TaskType;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string | null;
  stamp: string | null;
  is_read: boolean;
  created_at: string;
  from_user?: User;
}

export interface StudyLog {
  id: string;
  room_id: string;
  user_id: string;
  memo: string;
  session_date: string;
  created_at: string;
  user?: User;
}

export interface Badge {
  id: string;
  user_id: string;
  badge_type: string;
  acquired_at: string;
}

export type BadgeType =
  | 'first_step'
  | 'on_fire'
  | 'monthly_master'
  | 'good_buddy'
  | 'quest_clearer'
  | 'speed_runner';

export interface BadgeDefinition {
  type: BadgeType;
  name: string;
  emoji: string;
  description: string;
}

export interface XpEvent {
  userId: string;
  amount: number;
  reason: string;
}
