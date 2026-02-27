'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Goal, Task } from '@/types';

function GoalCard({ goal, onDelete }: { goal: Goal & { tasks?: Task[] }; onDelete: (id: string) => void }) {
  const tasks = goal.tasks || [];
  const completed = tasks.filter((t) => t.is_completed).length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-colors">
      <div className="flex items-start justify-between">
        <Link
          href={`goals/${goal.id}`}
          className="flex-1 min-w-0"
        >
          <h3 className="font-semibold text-gray-100 truncate">{goal.title}</h3>
          {goal.description && (
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{goal.description}</p>
          )}
        </Link>
        <button
          onClick={() => onDelete(goal.id)}
          className="ml-2 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          title="削除"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{completed}/{total} タスク</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Task type counts */}
      <div className="flex gap-3 mt-3">
        {(['yearly', 'monthly', 'weekly'] as const).map((type) => {
          const count = tasks.filter((t) => t.type === type).length;
          const doneCount = tasks.filter((t) => t.type === type && t.is_completed).length;
          if (count === 0) return null;
          return (
            <span key={type} className="text-xs text-gray-500">
              {type === 'yearly' ? '年' : type === 'monthly' ? '月' : '週'}: {doneCount}/{count}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

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
    fetchGoals();
  }, [userId, year]);

  async function fetchGoals() {
    try {
      const res = await fetch(`/api/goals?user_id=${userId}&year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setGoals(Array.isArray(data) ? data : []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !userId) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          title: title.trim(),
          description: description.trim() || null,
          year,
        }),
      });

      if (res.ok) {
        setTitle('');
        setDescription('');
        setShowModal(false);
        await fetchGoals();
      }
    } catch {
      // Ignore
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteGoal(goalId: string) {
    try {
      const res = await fetch(`/api/goals?id=${goalId}`, { method: 'DELETE' });
      if (res.ok) {
        setGoals((prev) => prev.filter((g) => g.id !== goalId));
      }
    } catch {
      // Ignore
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-800 rounded animate-pulse w-32" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">目標</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          + 目標を追加
        </button>
      </div>

      {/* Year selector */}
      <div className="flex gap-2">
        {[year - 1, year, year + 1].map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              year === y
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {y}年
          </button>
        ))}
      </div>

      {/* Goals list */}
      {goals.length === 0 ? (
        <div className="py-16 text-center">
          <span className="text-4xl">🎯</span>
          <p className="mt-4 text-gray-400">まだ目標がありません</p>
          <p className="text-sm text-gray-500 mt-1">最初の目標を追加してクエストを始めましょう</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onDelete={handleDeleteGoal} />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md bg-gray-900 rounded-2xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">新しい目標</h2>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">タイトル</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="目標のタイトル"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">説明（任意）</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="目標の詳細"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
                >
                  {submitting ? '作成中...' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
