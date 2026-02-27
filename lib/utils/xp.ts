import { TaskType } from '@/types';

export const XP_TABLE = {
  weekly_task: 10,
  monthly_task: 30,
  weekly_goal_complete: 50,
  monthly_goal_complete: 100,
  study_log: 5,
  buddy_comment: 3,
} as const;

export type XpReason = keyof typeof XP_TABLE;

export function getXpForTask(type: TaskType): number {
  if (type === 'weekly') return XP_TABLE.weekly_task;
  if (type === 'monthly') return XP_TABLE.monthly_task;
  return XP_TABLE.monthly_task;
}

export function calcLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function xpForNextLevel(level: number): number {
  return level * 100;
}

export function xpProgress(xp: number): { level: number; progress: number; needed: number } {
  const level = calcLevel(xp);
  const currentLevelXp = (level - 1) * 100;
  const progress = xp - currentLevelXp;
  const needed = 100;
  return { level, progress, needed };
}
