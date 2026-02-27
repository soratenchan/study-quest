import { BadgeDefinition, BadgeType } from '@/types';

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    type: 'first_step',
    name: 'First Step',
    emoji: '🌱',
    description: '初めてのタスク完了',
  },
  {
    type: 'on_fire',
    name: 'On Fire',
    emoji: '🔥',
    description: '3日連続タスク完了',
  },
  {
    type: 'monthly_master',
    name: 'Monthly Master',
    emoji: '📅',
    description: '月次目標を100%達成',
  },
  {
    type: 'good_buddy',
    name: 'Good Buddy',
    emoji: '🤝',
    description: 'バディに10回コメント送信',
  },
  {
    type: 'quest_clearer',
    name: 'Quest Clearer',
    emoji: '🏆',
    description: '年間目標を1つ完全達成',
  },
  {
    type: 'speed_runner',
    name: 'Speed Runner',
    emoji: '⚡',
    description: '週次タスクを締切前に全完了',
  },
];

export function getBadgeDefinition(type: BadgeType): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((b) => b.type === type);
}

export function checkBadges(params: {
  totalTasksCompleted: number;
  streakCount: number;
  monthlyGoalAchieved: boolean;
  commentsSent: number;
  yearlyGoalCompleted: boolean;
  weeklyAllDone: boolean;
}): BadgeType[] {
  const earned: BadgeType[] = [];

  if (params.totalTasksCompleted >= 1) earned.push('first_step');
  if (params.streakCount >= 3) earned.push('on_fire');
  if (params.monthlyGoalAchieved) earned.push('monthly_master');
  if (params.commentsSent >= 10) earned.push('good_buddy');
  if (params.yearlyGoalCompleted) earned.push('quest_clearer');
  if (params.weeklyAllDone) earned.push('speed_runner');

  return earned;
}
