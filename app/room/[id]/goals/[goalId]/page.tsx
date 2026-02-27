'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Goal, Task, TaskType } from '@/types';

const TYPE_LABELS: Record<TaskType, string> = {
  yearly: '年間',
  monthly: '月間',
  weekly: '週間',
};

const TYPE_COLORS: Record<TaskType, string> = {
  yearly: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  monthly: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  weekly: 'text-green-400 bg-green-500/10 border-green-500/20',
};

function TaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg group">
      <button
        onClick={() => onToggle(task.id, !task.is_completed)}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-colors ${
          task.is_completed
            ? 'bg-indigo-500 border-indigo-500'
            : 'border-gray-600 hover:border-indigo-400'
        }`}
      >
        {task.is_completed && (
          <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${task.is_completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
          {task.title}
        </p>
        {task.due_date && (
          <p className="text-xs text-gray-500 mt-0.5">
            期限: {new Date(task.due_date).toLocaleDateString('ja-JP')}
          </p>
        )}
      </div>
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
        title="削除"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const goalId = params.goalId as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // New task form
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<TaskType>('weekly');
  const [newDueDate, setNewDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem(`userId_${roomId}`);
    if (!storedUserId) {
      router.replace(`/room/${roomId}/setup`);
      return;
    }
    setUserId(storedUserId);
  }, [roomId, router]);

  useEffect(() => {
    if (!userId) return;
    fetchGoalAndTasks();
  }, [userId, goalId]);

  async function fetchGoalAndTasks() {
    try {
      const [goalsRes, tasksRes] = await Promise.all([
        fetch(`/api/goals?user_id=${userId}`),
        fetch(`/api/tasks?goal_id=${goalId}`),
      ]);

      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        const allGoals = Array.isArray(goalsData) ? goalsData : [];
        const found = allGoals.find((g: Goal) => g.id === goalId);
        setGoal(found || null);
      }
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(Array.isArray(data) ? data : []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleTask(taskId: string, isCompleted: boolean) {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, is_completed: isCompleted, completed_at: isCompleted ? new Date().toISOString() : null }
          : t
      )
    );

    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, is_completed: isCompleted }),
      });
      if (!res.ok) {
        // Revert on failure
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, is_completed: !isCompleted } : t
          )
        );
      }
    } catch {
      // Revert
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, is_completed: !isCompleted } : t
        )
      );
    }
  }

  async function handleDeleteTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' });
    } catch {
      // Refetch on error
      await fetchGoalAndTasks();
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal_id: goalId,
          title: newTitle.trim(),
          type: newType,
          due_date: newDueDate || null,
        }),
      });

      if (res.ok) {
        setNewTitle('');
        setNewDueDate('');
        setShowForm(false);
        await fetchGoalAndTasks();
      }
    } catch {
      // Ignore
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-800 rounded animate-pulse w-48" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-400">目標が見つかりません</p>
        <Link href={`/room/${roomId}/goals`} className="text-indigo-400 text-sm mt-2 inline-block hover:underline">
          目標一覧に戻る
        </Link>
      </div>
    );
  }

  const tasksByType: Record<TaskType, Task[]> = {
    yearly: tasks.filter((t) => t.type === 'yearly'),
    monthly: tasks.filter((t) => t.type === 'monthly'),
    weekly: tasks.filter((t) => t.type === 'weekly'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/room/${roomId}/goals`}
          className="text-sm text-gray-400 hover:text-gray-200 transition-colors inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          目標一覧
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-100">{goal.title}</h1>
        {goal.description && (
          <p className="mt-1 text-gray-400 text-sm">{goal.description}</p>
        )}
      </div>

      {/* Add task button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
      >
        {showForm ? 'キャンセル' : '+ タスクを追加'}
      </button>

      {/* Add task form */}
      {showForm && (
        <form onSubmit={handleCreateTask} className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 space-y-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
            placeholder="タスクのタイトル"
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <div className="flex gap-3 flex-wrap">
            <div>
              <label className="block text-xs text-gray-400 mb-1">タイプ</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as TaskType)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="yearly">年間</option>
                <option value="monthly">月間</option>
                <option value="weekly">週間</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">期限</label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting || !newTitle.trim()}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {submitting ? '追加中...' : '追加'}
          </button>
        </form>
      )}

      {/* Tasks grouped by type */}
      {(['yearly', 'monthly', 'weekly'] as TaskType[]).map((type) => {
        const typeTasks = tasksByType[type];
        if (typeTasks.length === 0) return null;
        const completed = typeTasks.filter((t) => t.is_completed).length;
        return (
          <div key={type}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-0.5 text-xs font-medium rounded border ${TYPE_COLORS[type]}`}>
                {TYPE_LABELS[type]}
              </span>
              <span className="text-xs text-gray-500">
                {completed}/{typeTasks.length} 完了
              </span>
            </div>
            <div className="space-y-2">
              {typeTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {tasks.length === 0 && !showForm && (
        <div className="py-12 text-center">
          <span className="text-3xl">📋</span>
          <p className="mt-3 text-gray-400">タスクがまだありません</p>
          <p className="text-sm text-gray-500 mt-1">タスクを追加して目標を進めましょう</p>
        </div>
      )}
    </div>
  );
}
