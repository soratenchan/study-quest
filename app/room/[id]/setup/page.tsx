'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
    async function init() {
      try {
        const supabase = createClient();

        // 認証チェック
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.replace('/login');
          return;
        }

        // 既にプロフィールが存在するか確認 (1ユーザー = 1ルーム)
        const existingRes = await fetch(`/api/users?auth_id=${authUser.id}`);
        if (existingRes.ok) {
          const existingUsers = await existingRes.json();
          const existingUser = Array.isArray(existingUsers) && existingUsers.length > 0
            ? existingUsers[0]
            : null;
          if (existingUser) {
            // 既存のルームにリダイレクト（別ルームの招待でもそのまま既存ルームへ）
            router.replace(`/room/${existingUser.room_id}`);
            return;
          }
        }

        // ルームのメンバーを取得
        const membersRes = await fetch(`/api/users?room_id=${roomId}`);
        if (membersRes.ok) {
          const data = await membersRes.json();
          setMembers(Array.isArray(data) ? data : []);
        }
      } catch {
        // エラーは無視して続行
      } finally {
        setLoading(false);
      }
    }

    init();
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

      router.push(`/room/${roomId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
        <div className="text-white font-bold animate-pulse">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl opacity-10 select-none">⭐</div>
        <div className="absolute top-1/4 right-8 text-5xl opacity-10 select-none">🎮</div>
        <div className="absolute bottom-20 left-1/4 text-7xl opacity-10 select-none">⚔️</div>
        <div className="absolute bottom-10 right-10 text-5xl opacity-10 select-none">🏆</div>
      </div>

      <div className="relative w-full max-w-md">
        {/* ロゴ */}
        <div className="text-center mb-6">
          <span className="text-5xl">⚔️</span>
          <p className="mt-2 text-2xl font-extrabold text-white">StudyQuest</p>
        </div>

        {/* カード */}
        <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-gray-800">
              プロフィールを設定しよう
            </h1>
            <p className="mt-2 text-gray-500 text-sm">
              冒険に出発する前に、名前とアバターを選んでください
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 名前入力 */}
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1">
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
                className="w-full px-4 py-3 bg-white border-[3px] border-[#2C2C2C] rounded-xl text-gray-800 font-medium text-sm focus:outline-none focus:border-[#E4000F] transition-colors"
              />
              <p className="mt-1 text-xs text-gray-400">{name.length}/20</p>
            </div>

            {/* アバター選択 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                アバター
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAvatar(a)}
                    className={`text-3xl p-2 rounded-xl transition-all border-[2px] ${
                      avatar === a
                        ? 'bg-[#E4000F]/10 border-[#E4000F] scale-110'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-[#E4000F] text-sm font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full px-6 py-3 bg-[#E4000F] text-white font-extrabold text-base rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* 既存メンバー表示 */}
          {members.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border-[2px] border-gray-200">
              <p className="text-sm font-bold text-gray-600 mb-3">このルームのメンバー</p>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border-[2px] border-gray-200">
                    <span>{m.avatar}</span>
                    <span className="text-sm font-medium text-gray-700">{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
