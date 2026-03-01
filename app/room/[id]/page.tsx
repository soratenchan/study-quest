'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { User, Goal, Task, Comment, StudyLog } from '@/types';
import { xpProgress } from '@/lib/utils/xp';
import { createClient } from '@/lib/supabase/client';

type FilterPeriod = 'week' | 'month' | 'year';

function XpCard({ user }: { user: User }) {
  const { level, progress, needed } = xpProgress(user.xp);
  const pct = Math.min((progress / needed) * 100, 100);

  return (
    <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-xl border-[3px] border-[#2C2C2C] bg-[#FAFAFA] flex items-center justify-center text-3xl shadow-[2px_2px_0_#2C2C2C]">
          {user.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-[#1A1A1A] text-base truncate">{user.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="px-2 py-0.5 bg-[#FFD700] text-[#1A1A1A] text-xs font-extrabold rounded-lg border-[2px] border-[#2C2C2C]">
              🏆 Lv.{level}
            </span>
            <span className="text-xs text-gray-500 font-bold">{user.xp} XP</span>
          </div>
        </div>
        {user.streak_count > 0 && (
          <div className="flex-shrink-0 px-2 py-1 bg-orange-100 rounded-lg border-[2px] border-orange-400">
            <p className="text-xs font-extrabold text-orange-600">🔥 {user.streak_count}日</p>
          </div>
        )}
      </div>

      {/* XPバー (黄色・HP風) */}
      <div className="mb-1">
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
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterPeriod>('month');
  const [copiedInvite, setCopiedInvite] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) {
        router.replace('/login');
        return;
      }
      const res = await fetch(`/api/users?room_id=${roomId}`);
      if (!res.ok) { router.replace(`/room/${roomId}/setup`); return; }
      const allUsers: User[] = await res.json();
      const me = allUsers.find((u) => u.auth_id === authUser.id);
      if (!me) {
        router.replace(`/room/${roomId}/setup`);
        return;
      }
      setUserId(me.id);
    });
  }, [roomId, router]);

  useEffect(() => {
    if (!userId) return;

    async function fetchData() {
      try {
        const [usersRes, goalsRes, commentsRes, logsRes] = await Promise.all([
          fetch(`/api/users?room_id=${roomId}`),
          fetch(`/api/goals?room_id=${roomId}`),
          fetch(`/api/comments?to_user_id=${userId}`),
          fetch(`/api/logs?room_id=${roomId}`),
        ]);

        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(Array.isArray(data) ? data : []);
        }
        if (goalsRes.ok) {
          const data = await goalsRes.json();
          const goalsArr = Array.isArray(data) ? data : [];
          setGoals(goalsArr);
          const tasks: Task[] = [];
          for (const g of goalsArr) {
            if (g.tasks) tasks.push(...g.tasks);
          }
          setAllTasks(tasks);
        }
        if (commentsRes.ok) {
          const data = await commentsRes.json();
          setComments(Array.isArray(data) ? data : []);
        }
        if (logsRes.ok) {
          const data = await logsRes.json();
          setLogs(Array.isArray(data) ? data : []);
        }
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId, roomId]);

  const unreadCount = useMemo(
    () => comments.filter((c) => !c.is_read).length,
    [comments]
  );

  const filteredTasks = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    if (filter === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (filter === 'month') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }
    return allTasks.filter((t) => {
      if (!t.due_date) return filter === 'year';
      return new Date(t.due_date) >= startDate;
    });
  }, [allTasks, filter]);

  const chartData = useMemo(() => {
    if (users.length < 2) return [];
    return goals.slice(0, 6).map((goal) => {
      const goalTasks = filteredTasks.filter((t) => t.goal_id === goal.id);
      const user1Tasks = goalTasks.filter(() => goal.user_id === users[0]?.id);
      const user2Tasks = goalTasks.filter(() => goal.user_id === users[1]?.id);
      const u1Total = user1Tasks.length;
      const u1Done = user1Tasks.filter((t) => t.is_completed).length;
      const u2Total = user2Tasks.length;
      const u2Done = user2Tasks.filter((t) => t.is_completed).length;
      return {
        name: goal.title.length > 8 ? goal.title.slice(0, 8) + '...' : goal.title,
        [users[0]?.name || 'User 1']: u1Total > 0 ? Math.round((u1Done / u1Total) * 100) : 0,
        [users[1]?.name || 'User 2']: u2Total > 0 ? Math.round((u2Done / u2Total) * 100) : 0,
      };
    });
  }, [goals, filteredTasks, users]);

  const recentActivity = useMemo(() => {
    const activities: { id: string; date: string; icon: string; text: string; userName: string }[] = [];

    for (const t of allTasks) {
      if (t.is_completed && t.completed_at) {
        const goal = goals.find((g) => g.id === t.goal_id);
        const user = users.find((u) => u.id === goal?.user_id);
        activities.push({
          id: `task-${t.id}`,
          date: t.completed_at,
          icon: '✅',
          text: t.title,
          userName: user?.name || '',
        });
      }
    }

    for (const l of logs) {
      const user = users.find((u) => u.id === l.user_id);
      activities.push({
        id: `log-${l.id}`,
        date: l.created_at,
        icon: '📝',
        text: l.memo,
        userName: user?.name || l.user?.name || '',
      });
    }

    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [allTasks, logs, goals, users]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded-2xl animate-pulse w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-36 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="h-36 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
        <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#1A1A1A]">ダッシュボード</h1>
        {unreadCount > 0 && (
          <Link
            href={`/room/${roomId}/comments`}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#E4000F] text-white font-extrabold text-sm rounded-xl border-[2px] border-[#2C2C2C] shadow-[0_3px_0_#2C2C2C] hover:shadow-[0_5px_0_#2C2C2C] hover:-translate-y-0.5 transition-all"
          >
            💬 {unreadCount}件の未読
          </Link>
        )}
      </div>

      {/* ユーザーXPカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((user) => (
          <XpCard key={user.id} user={user} />
        ))}
      </div>

      {/* バディ招待カード */}
      {users.length < 2 && (
        <div className="bg-white rounded-2xl border-[3px] border-dashed border-[#2C2C2C] p-6 text-center">
          <p className="text-2xl mb-2">👥</p>
          <p className="text-lg font-extrabold text-[#1A1A1A] mb-1">バディを待っています</p>
          <p className="text-sm text-gray-500 font-bold mb-4">
            URLをバディに共有してクエストを始めよう！
          </p>
          <div className="flex items-center gap-2 max-w-md mx-auto">
            <input
              readOnly
              value={typeof window !== 'undefined' ? `${window.location.origin}/room/${roomId}/setup` : ''}
              className="flex-1 px-4 py-2.5 bg-[#FAFAFA] border-[2px] border-[#2C2C2C] rounded-xl text-sm text-gray-600 font-medium truncate focus:outline-none"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}/setup`);
                setCopiedInvite(true);
                setTimeout(() => setCopiedInvite(false), 2000);
              }}
              className="px-4 py-2.5 bg-[#E4000F] text-white font-extrabold text-sm rounded-xl border-[2px] border-[#2C2C2C] shadow-[0_3px_0_#2C2C2C] hover:shadow-[0_5px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_1px_0_#2C2C2C] active:translate-y-0.5 transition-all flex-shrink-0"
            >
              {copiedInvite ? '✓ コピー済' : 'コピー'}
            </button>
          </div>
        </div>
      )}

      {/* フィルタータブ */}
      <div className="flex gap-2">
        {(['week', 'month', 'year'] as FilterPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`px-5 py-2 rounded-xl text-sm font-extrabold border-[2px] transition-all ${
              filter === p
                ? 'bg-[#1A1A2E] text-white border-[#2C2C2C] shadow-[0_3px_0_#2C2C2C]'
                : 'bg-white text-[#1A1A1A] border-[#2C2C2C] shadow-[0_3px_0_#2C2C2C] hover:shadow-[0_5px_0_#2C2C2C] hover:-translate-y-0.5'
            }`}
          >
            {p === 'week' ? '週' : p === 'month' ? '月' : '年'}
          </button>
        ))}
      </div>

      {/* チャート */}
      {chartData.length > 0 && users.length >= 2 && (
        <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-5">
          <h2 className="font-extrabold text-[#1A1A1A] mb-4">目標達成率</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #2C2C2C',
                  borderRadius: '12px',
                  fontWeight: 700,
                }}
                labelStyle={{ color: '#1A1A1A' }}
              />
              <Legend />
              <Bar dataKey={users[0]?.name || 'User 1'} fill="#E4000F" radius={[4, 4, 0, 0]} />
              <Bar dataKey={users[1]?.name || 'User 2'} fill="#009AC7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 最近のアクティビティ */}
      {recentActivity.length > 0 && (
        <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-5">
          <h2 className="font-extrabold text-[#1A1A1A] mb-4">最近のアクティビティ</h2>
          <div className="space-y-3">
            {recentActivity.map((act) => (
              <div key={act.id} className="flex items-start gap-3 p-3 bg-[#FAFAFA] rounded-xl border-[2px] border-gray-200">
                <span className="text-lg flex-shrink-0">{act.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1A1A1A] truncate">{act.text}</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    {act.userName} · {new Date(act.date).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
