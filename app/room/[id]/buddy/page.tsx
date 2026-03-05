'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { User, Goal, Task, Badge } from '@/types';
import { xpProgress } from '@/lib/utils/xp';
import { BADGE_DEFINITIONS } from '@/lib/utils/badge';
import { createClient } from '@/lib/supabase/client';

function BuddyXpBar({ user }: { user: User }) {
  const { level, progress, needed } = xpProgress(user.xp);
  const pct = Math.min((progress / needed) * 100, 100);
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
        <span>EXP</span>
        <span>{progress} / {needed}</span>
      </div>
      <div className="h-5 bg-gray-200 rounded-full border-[2px] border-[#2C2C2C] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-full transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs font-bold text-gray-400 mt-1 text-right">Lv.{level} · {user.xp} XP</p>
    </div>
  );
}

function GoalProgressBar({ tasks }: { tasks: Task[] }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.is_completed).length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isLow = progress < 20;

  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
        <span>{completed}/{total} タスク完了</span>
        <span>{progress}%</span>
      </div>
      <div className="h-4 bg-gray-200 rounded-full border-[2px] border-[#2C2C2C] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${
            isLow ? 'from-[#F44336] to-[#E57373]' : 'from-[#4CAF50] to-[#8BC34A]'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default function BuddyPage() {
  const params = useParams();
  const roomId = params.id as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [buddy, setBuddy] = useState<User | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

  function toggleGoal(id: string) {
    setExpandedGoals(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) return;
      const res = await fetch(`/api/users?room_id=${roomId}`);
      if (!res.ok) return;
      const allUsers: User[] = await res.json();
      const me = allUsers.find((u) => u.auth_id === authUser.id);
      if (me) setUserId(me.id);
    });
  }, [roomId]);

  useEffect(() => {
    if (!userId) return;

    async function fetchData() {
      try {
        const usersRes = await fetch(`/api/users?room_id=${roomId}`);
        if (!usersRes.ok) return;
        const users: User[] = await usersRes.json();
        const buddyUser = users.find((u) => u.id !== userId);

        if (!buddyUser) {
          setLoading(false);
          return;
        }

        setBuddy(buddyUser);

        // バディの目標を取得
        const goalsRes = await fetch(`/api/goals?user_id=${buddyUser.id}`);
        if (goalsRes.ok) {
          const data = await goalsRes.json();
          setGoals(Array.isArray(data) ? data : []);
        }

        // バディのバッジを取得
        const supabase = createClient();
        const { data: badgeData } = await supabase
          .from('badges')
          .select('*')
          .eq('user_id', buddyUser.id);
        setBadges(badgeData || []);
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId, roomId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!buddy) {
    return (
      <div className="py-20 text-center">
        <div className="bg-white rounded-2xl border-[3px] border-dashed border-[#2C2C2C] p-12">
          <span className="text-5xl">👥</span>
          <p className="mt-4 text-lg font-extrabold text-[#1A1A1A]">バディがまだ参加していません</p>
          <p className="text-sm text-gray-500 font-medium mt-2">
            ダッシュボードから招待URLをシェアしましょう
          </p>
          <Link
            href={`/room/${roomId}`}
            className="inline-block mt-6 px-6 py-3 bg-[#E4000F] text-white font-extrabold rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 transition-all"
          >
            ダッシュボードへ
          </Link>
        </div>
      </div>
    );
  }

  const acquiredBadgeTypes = new Set(badges.map((b) => b.badge_type));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-[#1A1A1A]">バディの状況</h1>

      {/* バディプロフィールカード */}
      <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl border-[3px] border-[#2C2C2C] bg-[#FAFAFA] flex items-center justify-center text-4xl shadow-[3px_3px_0_#2C2C2C]">
            {buddy.avatar}
          </div>
          <div className="flex-1">
            <p className="text-xl font-extrabold text-[#1A1A1A]">{buddy.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-3 py-1 bg-[#FFD700] text-[#1A1A1A] text-sm font-extrabold rounded-lg border-[2px] border-[#2C2C2C]">
                🏆 Lv.{xpProgress(buddy.xp).level}
              </span>
              {buddy.streak_count > 0 && (
                <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs font-extrabold rounded-lg border-[2px] border-orange-300">
                  🔥 {buddy.streak_count}日連続
                </span>
              )}
            </div>
            <BuddyXpBar user={buddy} />
          </div>
        </div>
      </div>

      {/* バッジ一覧 */}
      {BADGE_DEFINITIONS.some((d) => acquiredBadgeTypes.has(d.type)) && (
        <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-5">
          <h2 className="font-extrabold text-[#1A1A1A] mb-4">獲得バッジ</h2>
          <div className="flex flex-wrap gap-3">
            {BADGE_DEFINITIONS.filter((d) => acquiredBadgeTypes.has(d.type)).map((def) => (
              <div
                key={def.type}
                className="flex flex-col items-center gap-1 p-3 bg-[#FAFAFA] rounded-xl border-[2px] border-[#2C2C2C] shadow-[2px_2px_0_#2C2C2C] min-w-16"
              >
                <span className="text-2xl">{def.emoji}</span>
                <span className="text-xs font-extrabold text-[#1A1A1A] text-center">{def.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 目標一覧 */}
      <div>
        <h2 className="text-lg font-extrabold text-[#1A1A1A] mb-3">目標一覧</h2>
        {goals.length === 0 ? (
          <div className="py-10 text-center bg-white rounded-2xl border-[3px] border-dashed border-[#2C2C2C]">
            <span className="text-4xl">🎯</span>
            <p className="mt-3 font-bold text-gray-500">まだ目標がありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const tasks = goal.tasks || [];
              if (!goal.is_public) {
                return (
                  <div
                    key={goal.id}
                    className="bg-gray-100 rounded-2xl border-[3px] border-gray-300 shadow-[3px_3px_0_#9ca3af] p-5 opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔒</span>
                      <div>
                        <p className="font-extrabold text-gray-500">非公開の目標</p>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">バディが非公開に設定しています</p>
                      </div>
                    </div>
                  </div>
                );
              }

              const expanded = expandedGoals.has(goal.id);
              return (
                <div
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-5 cursor-pointer hover:shadow-[6px_6px_0_#2C2C2C] transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#009AC7] text-white text-xs font-extrabold rounded-lg border-[2px] border-[#007BA3] flex-shrink-0">🌍 公開</span>
                        <h3 className={`font-extrabold text-[#1A1A1A] text-base ${expanded ? '' : 'truncate'}`}>{goal.title}</h3>
                      </div>
                      {goal.description && (
                        <p className={`text-sm text-gray-500 font-medium mt-1.5 ${expanded ? '' : 'line-clamp-2'}`}>{goal.description}</p>
                      )}
                    </div>
                    <span className="text-gray-400 text-xs font-bold flex-shrink-0 mt-1">
                      {expanded ? '▲' : '▼'}
                    </span>
                  </div>

                  {/* タスク一覧 */}
                  {tasks.length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      {(expanded ? tasks : tasks.slice(0, 3)).map((task) => (
                        <div key={task.id} className="flex items-center gap-2 text-sm">
                          <span className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-xs ${task.is_completed ? 'bg-[#4CAF50] text-white' : 'bg-gray-200'}`}>
                            {task.is_completed ? '✓' : ''}
                          </span>
                          <span className={`font-medium ${expanded ? '' : 'truncate'} ${task.is_completed ? 'line-through text-gray-400' : 'text-[#1A1A1A]'}`}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                      {!expanded && tasks.length > 3 && (
                        <p className="text-xs text-[#009AC7] font-bold pl-6">▼ 他 {tasks.length - 3} タスクを見る</p>
                      )}
                    </div>
                  )}

                  {/* 達成率バー */}
                  <GoalProgressBar tasks={tasks} />

                  {/* 応援ボタン */}
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-bold">
                      {expanded ? '▲ 閉じる' : `▼ すべて見る（${tasks.length}タスク）`}
                    </span>
                    <Link
                      href={`/room/${roomId}/comments`}
                      onClick={e => e.stopPropagation()}
                      className="px-4 py-2 bg-white text-[#1A1A1A] font-extrabold text-sm rounded-xl border-[2px] border-[#2C2C2C] shadow-[0_3px_0_#2C2C2C] hover:shadow-[0_5px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_1px_0_#2C2C2C] active:translate-y-0.5 transition-all"
                    >
                      応援する 💪
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
