'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { User, Goal, Task, Comment, StudyLog, Badge } from '@/types';
import { getXpForTask, xpProgress } from '@/lib/utils/xp';
import { BADGE_DEFINITIONS } from '@/lib/utils/badge';
import { createClient } from '@/lib/supabase/client';
import { HeatmapCalendar } from '@/components/HeatmapCalendar';

const USER_COLORS = ['#E4000F', '#009AC7'];

type FilterPeriod = 'week' | 'month' | 'year';

function XpCard({ user, onClick }: { user: User; onClick: () => void }) {
  const { level, progress, needed } = xpProgress(user.xp);
  const pct = Math.min((progress / needed) * 100, 100);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-5 cursor-pointer hover:shadow-[6px_6px_0_#2C2C2C] hover:-translate-y-0.5 transition-all"
    >
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
      <p className="text-xs text-[#4F46E5] font-bold mt-2 text-right">タップしてプロフィールを見る →</p>
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
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profileBadges, setProfileBadges] = useState<Badge[]>([]);

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
        // このルームにいない場合、既存プロフィールのルームにリダイレクト
        const userRes = await fetch(`/api/users?auth_id=${authUser.id}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          const existing = Array.isArray(userData) && userData.length > 0 ? userData[0] : null;
          if (existing && existing.room_id !== roomId) {
            router.replace(`/room/${existing.room_id}`);
            return;
          }
        }
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

  const openProfile = useCallback(async (user: User) => {
    setProfileUser(user);
    setProfileBadges([]);
    const supabase = createClient();
    const { data } = await supabase.from('badges').select('*').eq('user_id', user.id);
    setProfileBadges(data || []);
  }, []);

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
    if (users.length === 0) return [];

    const now = new Date();
    let points: Date[];
    let labelFn: (d: Date) => string;

    if (filter === 'week') {
      points = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - 6 + i);
        d.setHours(0, 0, 0, 0);
        return d;
      });
      labelFn = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
    } else if (filter === 'month') {
      points = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - 29 + i);
        d.setHours(0, 0, 0, 0);
        return d;
      });
      labelFn = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
    } else {
      points = Array.from({ length: 12 }, (_, i) => new Date(now.getFullYear(), i, 1));
      labelFn = (d) => `${d.getMonth() + 1}月`;
    }

    // goal_id → user_id マップ
    const goalUserMap: Record<string, string> = {};
    for (const g of goals) goalUserMap[g.id] = g.user_id;

    // ユーザーごとのXPイベント
    const events: Record<string, { date: Date; xp: number }[]> = {};
    for (const u of users) events[u.id] = [];

    for (const task of allTasks) {
      if (!task.is_completed || !task.completed_at) continue;
      const uid = goalUserMap[task.goal_id];
      if (!uid || !events[uid]) continue;
      events[uid].push({ date: new Date(task.completed_at), xp: getXpForTask(task.type) });
    }
    for (const log of logs) {
      if (!events[log.user_id]) continue;
      events[log.user_id].push({ date: new Date(log.created_at), xp: 5 });
    }

    // ユーザーごとの再構築合計 → 実際のusers.xpに合わせてスケール係数を計算
    const scaleFor: Record<string, number> = {};
    for (const u of users) {
      const reconstructed = events[u.id].reduce((s, e) => s + e.xp, 0);
      scaleFor[u.id] = reconstructed > 0 ? u.xp / reconstructed : 0;
    }

    const today = new Date();
    const rows = points.map((pt) => {
      const nextPt = new Date(pt);
      if (filter === 'year') nextPt.setMonth(pt.getMonth() + 1);
      else nextPt.setDate(pt.getDate() + 1);

      const isCurrent = nextPt > today;
      const row: Record<string, unknown> = { date: labelFn(pt) };
      for (const u of users) {
        if (isCurrent) {
          // 最終点は実際のXPを表示（確実に同期）
          row[u.name] = u.xp;
        } else if (scaleFor[u.id] === 0) {
          // イベント未記録ユーザーは0のまま（最終点のみ補完）
          row[u.name] = 0;
        } else {
          // 再構築した累積値をスケール補正
          const raw = events[u.id]
            .filter((e) => e.date < nextPt)
            .reduce((s, e) => s + e.xp, 0);
          row[u.name] = Math.round(raw * scaleFor[u.id]);
        }
      }
      return row;
    });

    return rows;
  }, [goals, allTasks, logs, users, filter]);

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

  const activityMaps = useMemo(() => {
    const goalUserMap: Record<string, string> = {};
    for (const g of goals) goalUserMap[g.id] = g.user_id;

    const maps = new Map<string, Map<string, number>>();
    for (const u of users) maps.set(u.id, new Map());

    for (const t of allTasks) {
      if (!t.is_completed || !t.completed_at) continue;
      const uid = goalUserMap[t.goal_id];
      if (!uid) continue;
      const map = maps.get(uid);
      if (!map) continue;
      const key = t.completed_at.split('T')[0];
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    for (const log of logs) {
      const map = maps.get(log.user_id);
      if (!map) continue;
      const key = log.created_at.split('T')[0];
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    return maps;
  }, [goals, allTasks, logs, users]);

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
          <XpCard key={user.id} user={user} onClick={() => openProfile(user)} />
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

      {/* 累積XP折れ線グラフ */}
      {chartData.length > 0 && users.length > 0 && (
        <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-5">
          <h2 className="font-extrabold text-[#1A1A1A] mb-1">累積 XP 推移</h2>
          <p className="text-xs text-gray-400 font-medium mb-4">タスク完了・学習ログで獲得したXPの合計</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                fontSize={11}
                interval={filter === 'week' ? 0 : filter === 'month' ? 4 : 0}
              />
              <YAxis stroke="#6b7280" fontSize={11} unit=" XP" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #2C2C2C',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: 13,
                }}
                labelStyle={{ color: '#1A1A1A', fontWeight: 800 }}
                formatter={(v: unknown) => [`${v} XP`]}
              />
              <Legend />
              <ReferenceLine y={0} stroke="#e5e7eb" />
              {users.map((u, i) => (
                <Line
                  key={u.id}
                  type="monotone"
                  dataKey={u.name}
                  stroke={i === 0 ? '#E4000F' : '#009AC7'}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* アクティビティ記録 */}
      {users.length > 0 && (
        <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-5 space-y-5">
          <h2 className="font-extrabold text-[#1A1A1A]">アクティビティ記録</h2>
          {users.map((u, i) => (
            <HeatmapCalendar
              key={u.id}
              name={u.name}
              avatar={u.avatar}
              themeColor={USER_COLORS[i] ?? '#6366F1'}
              activityMap={activityMaps.get(u.id) ?? new Map()}
            />
          ))}
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

      {/* プロフィールモーダル */}
      {profileUser && (() => {
        const { level, progress, needed } = xpProgress(profileUser.xp);
        const pct = Math.min((progress / needed) * 100, 100);
        const acquiredBadgeTypes = new Set(profileBadges.map(b => b.badge_type));
        const isMe = profileUser.id === userId;
        return (
          <div
            className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 px-4 pb-20 md:pb-4"
            onClick={() => setProfileUser(null)}
          >
            <div
              className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[8px_8px_0_#2C2C2C] w-full max-w-sm max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b-[2px] border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl border-[3px] border-[#2C2C2C] bg-[#FAFAFA] flex items-center justify-center text-3xl shadow-[3px_3px_0_#2C2C2C]">
                      {profileUser.avatar}
                    </div>
                    <div>
                      <p className="text-lg font-extrabold text-[#1A1A1A]">{profileUser.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="px-2 py-0.5 bg-[#FFD700] text-[#1A1A1A] text-xs font-extrabold rounded-lg border-[2px] border-[#2C2C2C]">
                          🏆 Lv.{level}
                        </span>
                        <span className="text-xs font-bold text-gray-500">{profileUser.xp} XP</span>
                        {profileUser.streak_count > 0 && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-extrabold rounded-lg border-[2px] border-orange-300">
                            🔥 {profileUser.streak_count}日
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setProfileUser(null)}
                    className="text-gray-400 hover:text-gray-700 font-bold text-lg leading-none ml-2"
                  >
                    ✕
                  </button>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                    <span>EXP</span><span>{progress} / {needed}</span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full border-[2px] border-[#2C2C2C] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>

              <div className="p-5">
                <p className="text-sm font-extrabold text-[#1A1A1A] mb-3">
                  獲得バッジ
                  <span className="ml-2 text-xs text-gray-400 font-bold">
                    {acquiredBadgeTypes.size} / {BADGE_DEFINITIONS.length}
                  </span>
                </p>
                {acquiredBadgeTypes.size === 0 ? (
                  <p className="text-sm text-gray-400 font-medium text-center py-4">まだバッジがありません</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {BADGE_DEFINITIONS.filter(d => acquiredBadgeTypes.has(d.type)).map(def => (
                      <div key={def.type} className="flex flex-col items-center gap-1 p-3 bg-[#FAFAFA] rounded-xl border-[2px] border-[#2C2C2C] shadow-[2px_2px_0_#2C2C2C]">
                        <span className="text-2xl">{def.emoji}</span>
                        <span className="text-xs font-extrabold text-[#1A1A1A] text-center leading-tight">{def.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-5 pb-5">
                {isMe ? (
                  <Link
                    href={`/room/${roomId}/mypage`}
                    onClick={() => setProfileUser(null)}
                    className="block w-full py-3 text-center bg-[#1A1A2E] text-white font-extrabold text-sm rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 transition-all"
                  >
                    ⚙️ マイページへ
                  </Link>
                ) : (
                  <Link
                    href={`/room/${roomId}/comments`}
                    onClick={() => setProfileUser(null)}
                    className="block w-full py-3 text-center bg-white text-[#1A1A1A] font-extrabold text-sm rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 transition-all"
                  >
                    応援する 💪
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
