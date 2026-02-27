'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { StudyLog, User } from '@/types';

export default function LogsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [memo, setMemo] = useState('');
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
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
    fetchData();
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
        <div className="h-8 bg-gray-800 rounded animate-pulse w-32" />
        <div className="h-32 bg-gray-800 rounded-xl animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">学習ログ</h1>

      {/* Log form */}
      <form onSubmit={handleSubmit} className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 space-y-3">
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="今日の学習内容を記録..."
          rows={3}
          required
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
        />
        <div className="flex items-center justify-between">
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={submitting || !memo.trim()}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {submitting ? '記録中...' : 'ログを追加'}
          </button>
        </div>
      </form>

      {/* Logs timeline */}
      {logs.length === 0 ? (
        <div className="py-12 text-center">
          <span className="text-3xl">📝</span>
          <p className="mt-3 text-gray-400">まだログがありません</p>
          <p className="text-sm text-gray-500 mt-1">学習を記録してXPを獲得しましょう</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const user = getUserForLog(log);
            const isCurrentUser = log.user_id === userId;
            return (
              <div
                key={log.id}
                className={`p-4 rounded-xl border ${
                  isCurrentUser
                    ? 'bg-indigo-600/5 border-indigo-500/20'
                    : 'bg-purple-600/5 border-purple-500/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{user?.avatar || '👤'}</span>
                  <span className="text-sm font-medium text-gray-200">
                    {user?.name || '不明'}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {new Date(log.session_date).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{log.memo}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
