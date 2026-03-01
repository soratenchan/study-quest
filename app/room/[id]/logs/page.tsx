'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { StudyLog, User } from '@/types';
import { createClient } from '@/lib/supabase/client';

export default function LogsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [memo, setMemo] = useState('');
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [submitting, setSubmitting] = useState(false);

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
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function fetchData() {
    try {
      const [logsRes, usersRes] = await Promise.all([
        fetch(`/api/logs?room_id=${roomId}`),
        fetch(`/api/users?room_id=${roomId}`),
      ]);

      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(Array.isArray(data) ? data : []);
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!memo.trim() || !userId) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          user_id: userId,
          memo: memo.trim(),
          session_date: sessionDate,
        }),
      });

      if (res.ok) {
        setMemo('');
        setSessionDate(new Date().toISOString().split('T')[0]);
        await fetchData();
      }
    } catch {
      // Ignore
    } finally {
      setSubmitting(false);
    }
  }

  function getUserForLog(log: StudyLog): User | undefined {
    if (log.user) return log.user;
    return users.find((u) => u.id === log.user_id);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded-2xl animate-pulse w-32" />
        <div className="h-36 bg-gray-200 rounded-2xl animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-[#1A1A1A]">学習ログ</h1>

      {/* ログ入力フォーム */}
      <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-5">
        <h2 className="font-extrabold text-[#1A1A1A] mb-4">今日の学習を記録</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="今日の学習内容を記録... (例: Reactのhooksを勉強した)"
            rows={3}
            required
            className="w-full px-4 py-3 bg-white border-[3px] border-[#2C2C2C] rounded-xl text-[#1A1A1A] font-medium text-sm focus:outline-none focus:border-[#009AC7] transition-colors resize-none"
          />
          <div className="flex items-center justify-between gap-3">
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="px-4 py-2.5 bg-white border-[3px] border-[#2C2C2C] rounded-xl text-sm font-bold text-[#1A1A1A] focus:outline-none focus:border-[#009AC7] transition-colors"
            />
            <button
              type="submit"
              disabled={submitting || !memo.trim()}
              className="px-6 py-2.5 bg-[#E4000F] text-white font-extrabold text-sm rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '記録中...' : 'ログを追加 +5XP'}
            </button>
          </div>
        </form>
      </div>

      {/* ログタイムライン */}
      {logs.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border-[3px] border-dashed border-[#2C2C2C]">
          <span className="text-5xl">📝</span>
          <p className="mt-4 font-extrabold text-[#1A1A1A] text-lg">まだログがありません</p>
          <p className="text-sm text-gray-500 font-medium mt-1">学習を記録してXPを獲得しましょう</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const user = getUserForLog(log);
            const isCurrentUser = log.user_id === userId;
            return (
              <div
                key={log.id}
                className={`bg-white rounded-2xl border-[3px] border-[#2C2C2C] p-5 transition-all ${
                  isCurrentUser
                    ? 'shadow-[4px_4px_0_#E4000F]'
                    : 'shadow-[4px_4px_0_#009AC7]'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl border-[2px] border-[#2C2C2C] bg-[#FAFAFA] flex items-center justify-center text-xl shadow-[1px_1px_0_#2C2C2C]">
                    {user?.avatar || '👤'}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-extrabold text-[#1A1A1A]">
                      {user?.name || '不明'}
                    </span>
                    {isCurrentUser && (
                      <span className="ml-2 px-2 py-0.5 bg-[#E4000F] text-white text-[10px] font-extrabold rounded-md">
                        あなた
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">
                    📅 {new Date(log.session_date).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <p className="text-sm font-medium text-[#1A1A1A] whitespace-pre-wrap pl-1">{log.memo}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
