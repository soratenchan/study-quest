'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [myUser, setMyUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joinInput, setJoinInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      setAuthUser(user);

      // 自分が参加中のルームを取得
      const res = await fetch(`/api/users?auth_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        const existing = Array.isArray(data) && data.length > 0 ? data[0] : null;
        setMyUser(existing);
      }

      setLoading(false);
    });
  }, [router]);

  async function handleCreateRoom() {
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/rooms', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'ルームの作成に失敗しました');
      }
      const room = await res.json();
      router.push(`/room/${room.id}/setup`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
      setCreating(false);
    }
  }

  function handleJoin() {
    const val = joinInput.trim();
    if (!val) return;

    // 招待URLかトークンかを判別
    // /join/[token] 形式のURL
    if (val.includes('/join/')) {
      const match = val.match(/\/join\/([^/?#]+)/);
      if (match) {
        router.push(`/join/${match[1]}`);
        return;
      }
    }
    // /room/[id]/setup 形式のURL
    if (val.includes('/room/')) {
      const match = val.match(/\/room\/([^/]+)/);
      if (match) {
        router.push(`/join/${match[1]}`);
        return;
      }
    }
    // プレーンなトークン or ID
    router.push(`/join/${val}`);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
        <div className="text-white font-bold animate-pulse">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E] px-4 py-8 relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl opacity-5 select-none">⭐</div>
        <div className="absolute top-1/4 right-8 text-5xl opacity-5 select-none">🎮</div>
        <div className="absolute bottom-20 left-1/4 text-7xl opacity-5 select-none">⚔️</div>
        <div className="absolute bottom-10 right-10 text-5xl opacity-5 select-none">🏆</div>
      </div>

      <div className="relative max-w-lg mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-white/60 text-sm">こんにちは！</p>
            <p className="text-white font-bold text-lg truncate max-w-[220px]">
              {authUser?.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-white/10 text-white font-bold text-sm rounded-xl border-[2px] border-white/20 hover:bg-white/20 transition-colors"
          >
            ログアウト
          </button>
        </div>

        {/* ロゴ */}
        <div className="text-center mb-10">
          <span className="text-5xl">⚔️</span>
          <h1 className="mt-2 text-3xl font-extrabold text-white">StudyQuest</h1>
          <p className="mt-1 text-white/70 text-sm">バディと一緒に目標を攻略しよう！</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#E4000F]/20 border-[2px] border-[#E4000F] rounded-xl">
            <p className="text-[#E4000F] text-sm font-bold">{error}</p>
          </div>
        )}

        {/* 参加中のルーム */}
        {myUser && (
          <div className="mb-6">
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2 px-1">参加中のルーム</p>
            <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl border-[3px] border-[#2C2C2C] bg-[#FAFAFA] flex items-center justify-center text-3xl shadow-[2px_2px_0_#2C2C2C] flex-shrink-0">
                  {myUser.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-gray-800 text-base truncate">{myUser.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="px-2 py-0.5 bg-[#FFD700] text-[#1A1A1A] text-xs font-extrabold rounded-lg border-[2px] border-[#2C2C2C]">
                      🏆 Lv.{myUser.level}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {myUser.room_id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/room/${myUser.room_id}`)}
                  className="flex-shrink-0 px-5 py-2.5 bg-[#E4000F] text-white font-extrabold text-sm rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5 transition-all"
                >
                  入る →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ルームを作成 */}
        <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-6 mb-6">
          <div className="text-center mb-4">
            <span className="text-4xl">🏰</span>
            <h2 className="mt-2 text-xl font-extrabold text-gray-800">新しいルームをつくる</h2>
            <p className="mt-1 text-gray-500 text-sm">バディと一緒に新しい冒険を始めよう</p>
          </div>
          <button
            onClick={handleCreateRoom}
            disabled={creating}
            className="w-full px-6 py-3 bg-[#E4000F] text-white font-extrabold text-base rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                作成中...
              </span>
            ) : (
              '+ 新しいルームをつくる'
            )}
          </button>
        </div>

        {/* 招待リンクで参加 */}
        <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-6">
          <div className="text-center mb-4">
            <span className="text-4xl">🤝</span>
            <h2 className="mt-2 text-xl font-extrabold text-gray-800">招待リンクで参加</h2>
            <p className="mt-1 text-gray-500 text-sm">バディから受け取ったURLまたはトークンを入力</p>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="招待URLまたはトークンを入力"
              className="w-full px-4 py-3 bg-white border-[3px] border-[#2C2C2C] rounded-xl text-gray-800 font-medium text-sm focus:outline-none focus:border-[#009AC7] transition-colors"
            />
            <button
              onClick={handleJoin}
              disabled={!joinInput.trim()}
              className="w-full px-6 py-3 bg-[#009AC7] text-white font-extrabold text-base rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ルームに参加する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
