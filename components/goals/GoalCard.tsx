'use client';

import Link from 'next/link';
import { Trash2, ChevronRight } from 'lucide-react';
import type { Goal, Task } from '@/types';
import ProgressBar from '@/components/dashboard/ProgressBar';

interface GoalCardProps {
  goal: Goal;
  tasks: Task[];
  roomId: string;
  onDelete: (id: string) => void;
}

export default function GoalCard({ goal, tasks, roomId, onDelete }: GoalCardProps) {
  const completed = tasks.filter((t) => t.is_completed).length;
  const total = tasks.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-gray-800">
            {goal.title}
          </h3>
          {goal.description && (
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {goal.description}
            </p>
          )}
        </div>
        <button
          onClick={() => onDelete(goal.id)}
          className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
          aria-label="Delete goal"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3">
        <ProgressBar value={percent} label={`${completed}/${total} completed`} color="bg-violet-500" />
      </div>

      <Link
        href={`/room/${roomId}/goals/${goal.id}`}
        className="mt-3 flex items-center justify-end gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
      >
        View tasks
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
