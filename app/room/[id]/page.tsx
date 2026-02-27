'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { User, Goal, Task, Comment, StudyLog } from '@/types';
import { xpProgress } from '@/lib/utils/xp';

type FilterPeriod = 'week' | 'month' | 'year';

function XpDisplay({ user }: { user: User }) {
  const { level, progress, needed } = xpProgress(user.xp);
  return (
    <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{user.avatar}</span>
        <div>
          <p className="font-semibold text-gray-100">{user.name}</p>
          <p className="text-xs text-gray-400">Lv.{level} / {user.xp} XP</p>
        </div>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
          style={{ width: `${Math.min((progress / needed) * 100, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{progress}/{needed} XP to next level</p>
      {user.streak_count > 0 && (
        <p className="text-xs text-orange-400 mt-1">🔥 {user.streak_count}日連続</p>
      )}
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
          // Collect all tasks from goals
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
        // Ignore fetch errors
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

  // Filter tasks by period
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

  // Build chart data
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

  // Recent activity
  const recentActivity = useMemo(() => {
    const activities: { id: string; date: string; icon: string; text: string; userName: string }[] = [];

    // Completed tasks
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

    // Study logs
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

    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [allTasks, logs, goals, users]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-800 rounded animate-pulse w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-32 bg-gray-800 rounded-xl animate-pulse" />
        </div>
        <div className="h-64 bg-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">ダッシュボード</h1>
        {unreadCount > 0 && (
          <Link
            href={`/room/${roomId}/comments`}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/20 text-indigo-400 rounded-full text-sm hover:bg-indigo-600/30 transition-colors"
          >
            💬 {unreadCount}件の未読
          </Link>
        )}
      </div>

      {/* Users XP display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((user) => (
          <XpDisplay key={user.id} user={user} />
        ))}
      </div>

      {/* Waiting for buddy */}
      {users.length < 2 && (
        <div className="p-6 bg-gray-800/50 rounded-xl border border-dashed border-gray-600 text-center">
          <p className="text-lg text-gray-300 mb-2">バディを待っています...</p>
          <p className="text-sm text-gray-500 mb-4">
            以下のURLをバディに共有してください
          </p>
          <div className="flex items-center gap-2 max-w-md mx-auto">
            <input
              readOnly
              value={typeof window !== 'undefined' ? `${window.location.origin}/room/${roomId}/setup` : ''}
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 truncate"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}/setup`);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
            >
              コピー
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['week', 'month', 'year'] as FilterPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === p
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {p === 'week' ? '週' : p === 'month' ? '月' : '年'}
          </button>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && users.length >= 2 && (
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
          <h2 className="text-sm font-medium text-gray-400 mb-4">目標達成率</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Bar dataKey={users[0]?.name || 'User 1'} fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey={users[1]?.name || 'User 2'} fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
          <h2 className="text-sm font-medium text-gray-400 mb-4">最近のアクティビティ</h2>
          <div className="space-y-3">
            {recentActivity.map((act) => (
              <div key={act.id} className="flex items-start gap-3 text-sm">
                <span>{act.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 truncate">{act.text}</p>
                  <p className="text-xs text-gray-500">
                    {act.userName} - {new Date(act.date).toLocaleDateString('ja-JP')}
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
