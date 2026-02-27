'use client';

import { Trash2 } from 'lucide-react';
import type { Task, TaskType } from '@/types';
import Badge from '@/components/ui/Badge';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const typeBadge: Record<TaskType, { label: string; variant: 'info' | 'default' | 'warning' }> = {
  weekly: { label: 'Weekly', variant: 'info' },
  monthly: { label: 'Monthly', variant: 'default' },
  yearly: { label: 'Yearly', variant: 'warning' },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const badge = typeBadge[task.type];

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2.5 transition-colors hover:bg-gray-50">
      <input
        type="checkbox"
        checked={task.is_completed}
        onChange={() => onToggle(task.id)}
        className="h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />

      <div className="min-w-0 flex-1">
        <span
          className={`block truncate text-sm ${
            task.is_completed ? 'text-gray-400 line-through' : 'text-gray-800'
          }`}
        >
          {task.title}
        </span>
        {task.due_date && (
          <span className="text-xs text-gray-400">{formatDate(task.due_date)}</span>
        )}
      </div>

      <Badge variant={badge.variant}>{badge.label}</Badge>

      <button
        onClick={() => onDelete(task.id)}
        className="shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
        aria-label="Delete task"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
