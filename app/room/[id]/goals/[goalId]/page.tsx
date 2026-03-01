'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Goal, Task, TaskType } from '@/types';
import { getXpForTask } from '@/lib/utils/xp';

const TYPE_LABELS: Record<TaskType, string> = {
  yearly: '年間',
  monthly: '月間',
  weekly: '週間',
};

const TYPE_COLORS: Record<TaskType, string> = {
  yearly: 'bg-amber-100 text-amber-700 border-amber-400',
  monthly: 'bg-blue-100 text-blue-700 border-blue-400',
  weekly: 'bg-green-100 text-green-700 border-green-400',
};

interface XpPopup {
  id: string;
  amount: number;
  x: number;
  y: number;
}

function TaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (id: string, completed: boolean, e: React.MouseEvent) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border-[2px] transition-all group ${
      task.is_completed
        ? 'bg-green-50 border-green-300'
        : 'bg-white border-[#2C2C2C] shadow-[2px_2px_0_#2C2C2C]'
    }`}>
      {/* チェックボックス */}
      <button
        onClick={(e) => onToggle(task.id, !task.is_completed, e)}
        className={`flex-shrink-0 w-7 h-7 rounded-lg border-[3px] transition-all flex items-center justify-center ${
          task.is_completed
            ? 'bg-[#4CAF50] border-[#388E3C] shadow-[0_2px_0_#388E3C]'
            : 'border-[#2C2C2C] bg-white hover:border-[#4CAF50] hover:bg-green-50'
        }`}
      >
        {task.is_completed && (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${task.is_completed ? 'text-gray-400 line-through' : 'text-[#1A1A1A]'}`}>
          {task.title}
        </p>
        {task.due_date && (
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            期限: {new Date(task.due_date).toLocaleDateString('ja-JP')}
          </p>
        )}
      </div>

      {/* XPバッジ */}
      <span className="text-xs font-extrabold text-[#FFD700] bg-[#1A1A2E] px-2 py-0.5 rounded-lg border-[2px] border-[#2C2C2C] flex-shrink-0">
        +{getXpForTask(task.type)}XP
      </span>

      {/* 削除ボタン */}
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-[#E4000F] hover:bg-red-50 rounded-lg transition-all border-[2px] border-transparent hover:border-red-200"
        title="削除"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  const [xpPopups, setXpPopups] = useState<XpPopup[]>([]);

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

  const fetchGoalAndTasks = useCallback(async () => {
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
  }, [userId, goalId]);

  useEffect(() => {
    if (!userId) return;
    fetchGoalAndTasks();
  }, [userId, goalId, fetchGoalAndTasks]);

  async function handleToggleTask(taskId: string, isCompleted: boolean, e: React.MouseEvent) {
    // XPポップアップ (完了にするとき)
    if (isCompleted) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        const xp = getXpForTask(task.type);
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const popupId = `${Date.now()}-${taskId}`;
        setXpPopups((prev) => [
          ...prev,
          { id: popupId, amount: xp, x: rect.left + rect.width / 2, y: rect.top },
        ]);
        setTimeout(() => {
          setXpPopups((prev) => prev.filter((p) => p.id !== popupId));
        }, 1300);
      }
    }

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
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, is_completed: !isCompleted } : t
          )
        );
      }
    } catch {
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

  const completed = tasks.filter((t) => t.is_completed).length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded-2xl animate-pulse w-48" />
        <div className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="py-16 text-center">
        <p className="font-bold text-gray-500">目標が見つかりません</p>
        <Link href={`/room/${roomId}/goals`} className="text-[#E4000F] font-extrabold text-sm mt-2 inline-block hover:underline">
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
      {/* XPポップアップ (fixed overlay) */}
      {xpPopups.map((popup) => (
        <div
          key={popup.id}
          className="fixed z-[9999] pointer-events-none animate-xp-pop font-extrabold text-lg text-[#FFD700]"
          style={{
            left: popup.x,
            top: popup.y,
            transform: 'translateX(-50%)',
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          }}
        >
          +{popup.amount} XP ✨
        </div>
      ))}

      {/* ヘッダー */}
      <div>
        <Link
          href={`/room/${roomId}/goals`}
          className="inline-flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-[#1A1A1A] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          目標一覧
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold text-[#1A1A1A]">{goal.title}</h1>
        {goal.description && (
          <p className="mt-1 text-gray-500 font-medium text-sm">{goal.description}</p>
        )}
      </div>

      {/* 全体進捗バー */}
      {total > 0 && (
        <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-5">
          <div className="flex justify-between text-sm font-extrabold text-[#1A1A1A] mb-2">
            <span>全体進捗</span>
            <span>{progress}%</span>
          </div>
          <div className="h-6 bg-gray-200 rounded-full border-[2px] border-[#2C2C2C] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${
                progress < 20 ? 'from-[#F44336] to-[#E57373]' : 'from-[#4CAF50] to-[#8BC34A]'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs font-bold text-gray-400 mt-1.5 text-right">{completed} / {total} タスク完了</p>
        </div>
      )}

      {/* タスク追加ボタン */}
      <button
        onClick={() => setShowForm(!showForm)}
        className={`px-5 py-2.5 font-extrabold text-sm rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5 transition-all ${
          showForm
            ? 'bg-gray-100 text-[#1A1A1A]'
            : 'bg-[#E4000F] text-white'
        }`}
      >
        {showForm ? 'キャンセル' : '+ タスクを追加'}
      </button>

      {/* タスク追加フォーム */}
      {showForm && (
        <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-5">
          <form onSubmit={handleCreateTask} className="space-y-4">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              placeholder="タスクのタイトル"
              className="w-full px-4 py-3 bg-white border-[3px] border-[#2C2C2C] rounded-xl text-[#1A1A1A] font-medium text-sm focus:outline-none focus:border-[#009AC7] transition-colors"
            />
            <div className="flex gap-3 flex-wrap">
              <div>
                <label className="block text-xs font-extrabold text-[#1A1A1A] mb-1.5">タイプ</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as TaskType)}
                  className="px-3 py-2.5 bg-white border-[3px] border-[#2C2C2C] rounded-xl text-sm font-bold text-[#1A1A1A] focus:outline-none focus:border-[#009AC7] transition-colors"
                >
                  <option value="yearly">年間</option>
                  <option value="monthly">月間</option>
                  <option value="weekly">週間</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[#1A1A1A] mb-1.5">期限</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="px-3 py-2.5 bg-white border-[3px] border-[#2C2C2C] rounded-xl text-sm font-bold text-[#1A1A1A] focus:outline-none focus:border-[#009AC7] transition-colors"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting || !newTitle.trim()}
              className="px-6 py-2.5 bg-[#E4000F] text-white font-extrabold text-sm rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_3px_0_#2C2C2C] hover:shadow-[0_5px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_1px_0_#2C2C2C] active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '追加中...' : '追加'}
            </button>
          </form>
        </div>
      )}

      {/* タスク一覧 (タイプ別) */}
      {(['yearly', 'monthly', 'weekly'] as TaskType[]).map((type) => {
        const typeTasks = tasksByType[type];
        if (typeTasks.length === 0) return null;
        const doneCount = typeTasks.filter((t) => t.is_completed).length;
        return (
          <div key={type}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-3 py-1 text-xs font-extrabold rounded-lg border-[2px] ${TYPE_COLORS[type]}`}>
                {TYPE_LABELS[type]}
              </span>
              <span className="text-xs font-bold text-gray-400">
                {doneCount}/{typeTasks.length} 完了
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

      {/* 空状態 */}
      {tasks.length === 0 && !showForm && (
        <div className="py-12 text-center bg-white rounded-2xl border-[3px] border-dashed border-[#2C2C2C]">
          <span className="text-4xl">📋</span>
          <p className="mt-3 font-extrabold text-[#1A1A1A]">タスクがまだありません</p>
          <p className="text-sm text-gray-500 font-medium mt-1">タスクを追加して目標を進めましょう</p>
        </div>
      )}
    </div>
  );
}
