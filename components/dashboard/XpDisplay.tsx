'use client';

import type { User } from '@/types';
import { xpProgress } from '@/lib/utils/xp';
import ProgressBar from './ProgressBar';

interface XpDisplayProps {
  user: User;
}

export default function XpDisplay({ user }: XpDisplayProps) {
  const { level, progress, needed } = xpProgress(user.xp);
  const percent = Math.round((progress / needed) * 100);

  return (
    <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 p-4 text-white shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-2xl">
        {user.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold">{user.name}</span>
          <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
            Lv. {level}
          </span>
        </div>
        <div className="mt-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-white/80">
            <span>{progress} / {needed} XP</span>
            <span>Total: {user.xp} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
