'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { User } from '@/types';

const AVATARS = ['🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🦋', '🦄', '🌟', '💫', '🎯'];

export default function SetupPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🦊');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user already set up
    const existingUserId = localStorage.getItem(`userId_${roomId}`);
    if (existingUserId) {
      router.replace(`/room/${roomId}`);
      return;
    }

    // Fetch existing room members
    async function fetchMembers() {
      try {
        const res = await fetch(`/api/users?room_id=${roomId}`);
        if (res.ok) {
          const data = await res.json();
          setMembers(Array.isArray(data) ? data : []);
        }
      } catch {
        // Ignore fetch errors for members
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, [roomId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, name: name.trim(), avatar }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'プロフィールの作成に失敗しました');
      }

      const user = await res.json();
      localStorage.setItem(`userId_${roomId}`, user.id);
      router.push(`/room/${roomId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">⚔️</span>
          <h1 className="mt-4 text-2xl font-bold text-gray-100">
            プロフィールを設定しよう
          </h1>
          <p className="mt-2 text-gray-400 text-sm">
            冒険に出発する前に、名前とアバターを選んでください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              名前
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              required
              placeholder="表示名を入力"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <p className="mt-1 text-xs text-gray-500">{name.length}/20</p>
          </div>

          {/* Avatar picker */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              アバター
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  className={`text-3xl p-2 rounded-xl transition-all ${
                    avatar === a
                      ? 'bg-indigo-600/30 border-2 border-indigo-500 scale-110'
                      : 'bg-gray-800 border-2 border-transparent hover:bg-gray-700'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-lg"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                設定中...
              </span>
            ) : (
              '冒険を始める'
            )}
          </button>
        </form>

        {/* Existing members */}
        {members.length > 0 && (
          <div className="mt-8 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
            <p className="text-sm text-gray-400 mb-3">このルームのメンバー</p>
            <div className="flex gap-3">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 rounded-full">
                  <span>{m.avatar}</span>
                  <span className="text-sm text-gray-300">{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
