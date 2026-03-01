'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Goal, Task } from '@/types';
import { createClient } from '@/lib/supabase/client';

function GoalCard({
  goal,
  onDelete,
  onTogglePublic,
}: {
  goal: Goal & { tasks?: Task[] };
  onDelete: (id: string) => void;
  onTogglePublic: (id: string, current: boolean) => void;
}) {
  const tasks = goal.tasks || [];
  const completed = tasks.filter((t) => t.is_completed).length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isLow = progress < 20;

  return (
    <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-5 hover:shadow-[6px_6px_0_#2C2C2C] hover:-translate-y-0.5 transition-all">
      <div className="flex items-start justify-between gap-3">
        <Link href={`goals/${goal.id}`} className="flex-1 min-w-0">
          <h3 className="font-extrabold text-[#1A1A1A] text-base truncate">{goal.title}</h3>
          {goal.description && (
            <p className="text-sm text-gray-500 font-medium mt-1 line-clamp-2">{goal.description}</p>
          )}
        </Link>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* is_public トグル */}
          <button
            onClick={() => onTogglePublic(goal.id, goal.is_public)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border-[2px] text-xs font-extrabold transition-all ${
              goal.is_public
                ? 'bg-[#009AC7] text-white border-[#007BA3] shadow-[0_2px_0_#007BA3]'
                : 'bg-gray-100 text-gray-500 border-gray-300 shadow-[0_2px_0_#9ca3af]'
            }`}
            title={goal.is_public ? 'バディに公開中' : '非公開'}
          >
            {goal.is_public ? '🌍' : '🔒'}
          </button>
          {/* 削除ボタン */}
          <button
            onClick={() => onDelete(goal.id)}
            className="p-1.5 text-gray-400 hover:text-[#E4000F] hover:bg-red-50 rounded-lg transition-colors border-[2px] border-transparent hover:border-red-200"
            title="削除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* 進捗バー */}
      <div className="mt-4">
        <div className="flex justify-between text-xs font-bold text-gray-500 mb-1.5">
          <span>{completed}/{total} タスク完了</span>
          <span>{progress}%</span>
        </div>
        <div className="h-5 bg-gray-200 rounded-full border-[2px] border-[#2C2C2C] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${
              isLow ? 'from-[#F44336] to-[#E57373]' : 'from-[#4CAF50] to-[#8BC34A]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* タスク種別カウント */}
      <div className="flex gap-2 mt-3 flex-wrap">
        {(['yearly', 'monthly', 'weekly'] as const).map((type) => {
          const count = tasks.filter((t) => t.type === type).length;
          const doneCount = tasks.filter((t) => t.type === type && t.is_completed).length;
          if (count === 0) return null;
          const colors: Record<string, string> = {
            yearly: 'bg-amber-100 text-amber-700 border-amber-300',
            monthly: 'bg-blue-100 text-blue-700 border-blue-300',
            weekly: 'bg-green-100 text-green-700 border-green-300',
          };
          return (
            <span key={type} className={`px-2 py-0.5 text-xs font-extrabold rounded-lg border-[2px] ${colors[type]}`}>
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
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) { router.replace('/login'); return; }
      const res = await fetch(`/api/users?room_id=${roomId}`);
      if (!res.ok) { router.replace(`/room/${roomId}/setup`); return; }
      const allUsers = await res.json();
      const me = Array.isArray(allUsers) ? allUsers.find((u: { auth_id: string; id: string }) => u.auth_id === authUser.id) : null;
      if (!me) { router.replace(`/room/${roomId}/setup`); return; }
      setUserId(me.id);
    });
  }, [roomId, router]);

  useEffect(() => {
    if (!userId) return;
    fetchGoals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          is_public: isPublic,
        }),
      });

      if (res.ok) {
        setTitle('');
        setDescription('');
        setIsPublic(true);
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

  async function handleTogglePublic(goalId: string, currentValue: boolean) {
    // Optimistic update
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, is_public: !currentValue } : g))
    );
    try {
      await fetch('/api/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: goalId, is_public: !currentValue }),
      });
    } catch {
      // Revert on failure
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, is_public: currentValue } : g))
      );
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded-2xl animate-pulse w-32" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#1A1A1A]">目標</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-[#E4000F] text-white font-extrabold text-sm rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5 transition-all"
        >
          + 目標を追加
        </button>
      </div>

      {/* 年選択 */}
      <div className="flex gap-2">
        {[year - 1, year, year + 1].map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`px-5 py-2 rounded-xl text-sm font-extrabold border-[2px] transition-all ${
              year === y
                ? 'bg-[#1A1A2E] text-white border-[#2C2C2C] shadow-[0_3px_0_#2C2C2C]'
                : 'bg-white text-[#1A1A1A] border-[#2C2C2C] shadow-[0_3px_0_#2C2C2C] hover:shadow-[0_5px_0_#2C2C2C] hover:-translate-y-0.5'
            }`}
          >
            {y}年
          </button>
        ))}
      </div>

      {/* 目標一覧 */}
      {goals.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border-[3px] border-dashed border-[#2C2C2C]">
          <span className="text-5xl">🎯</span>
          <p className="mt-4 font-extrabold text-[#1A1A1A] text-lg">まだ目標がありません</p>
          <p className="text-sm text-gray-500 font-medium mt-1">最初の目標を追加してクエストを始めましょう</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onDelete={handleDeleteGoal}
              onTogglePublic={handleTogglePublic}
            />
          ))}
        </div>
      )}

      {/* 新規目標モーダル */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[8px_8px_0_#2C2C2C] animate-bounce-in">
            {/* タイトルバー */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#E4000F] rounded-t-xl border-b-[3px] border-[#2C2C2C]">
              <h2 className="text-base font-extrabold text-white">新しい目標</h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white font-extrabold text-lg transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div>
                  <label className="block text-sm font-extrabold text-[#1A1A1A] mb-1.5">タイトル</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="目標のタイトル"
                    className="w-full px-4 py-3 bg-white border-[3px] border-[#2C2C2C] rounded-xl text-[#1A1A1A] font-medium text-sm focus:outline-none focus:border-[#009AC7] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-extrabold text-[#1A1A1A] mb-1.5">説明（任意）</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="目標の詳細"
                    rows={3}
                    className="w-full px-4 py-3 bg-white border-[3px] border-[#2C2C2C] rounded-xl text-[#1A1A1A] font-medium text-sm focus:outline-none focus:border-[#009AC7] transition-colors resize-none"
                  />
                </div>
                {/* 公開設定 */}
                <div className="flex items-center gap-3 p-4 bg-[#FAFAFA] rounded-xl border-[2px] border-[#2C2C2C]">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#009AC7] border-[2px] border-[#2C2C2C]"></div>
                  </label>
                  <div>
                    <p className="text-sm font-extrabold text-[#1A1A1A]">
                      {isPublic ? '🌍 バディに公開する' : '🔒 非公開にする'}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">
                      {isPublic ? 'バディページで目標が見えます' : 'あなただけが見れます'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 bg-white text-[#1A1A1A] font-extrabold text-sm rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_3px_0_#2C2C2C] hover:shadow-[0_5px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_1px_0_#2C2C2C] active:translate-y-0.5 transition-all"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !title.trim()}
                    className="px-5 py-2.5 bg-[#E4000F] text-white font-extrabold text-sm rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_3px_0_#2C2C2C] hover:shadow-[0_5px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_1px_0_#2C2C2C] active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? '作成中...' : '作成'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
