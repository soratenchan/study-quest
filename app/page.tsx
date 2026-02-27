'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [error, setError] = useState('');

  async function handleCreateRoom() {
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/rooms', { method: 'POST' });
      if (!res.ok) throw new Error('ルームの作成に失敗しました');
      const room = await res.json();
      router.push(`/room/${room.id}/setup`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
      setCreating(false);
    }
  }

  function handleJoinRoom() {
    if (!joinId.trim()) return;
    // Support both full URLs and plain IDs
    let roomId = joinId.trim();
    if (roomId.includes('/room/')) {
      const match = roomId.match(/\/room\/([^/]+)/);
      if (match) roomId = match[1];
    }
    router.push(`/room/${roomId}/setup`);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-indigo-950 via-purple-950 to-gray-950">
      <div className="text-center max-w-xl mx-auto">
        {/* Logo */}
        <div className="mb-8">
          <span className="text-6xl">⚔️</span>
          <h1 className="mt-4 text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            StudyQuest
          </h1>
          <p className="mt-3 text-xl text-gray-300">
            バディと一緒に目標を攻略しよう
          </p>
        </div>

        {/* Feature bullets */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {[
            { emoji: '🎯', text: '目標管理' },
            { emoji: '✨', text: 'XP・レベル' },
            { emoji: '🤝', text: 'バディと共有' },
          ].map((f) => (
            <div
              key={f.text}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-sm text-gray-300"
            >
              <span>{f.emoji}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Create room */}
        <button
          onClick={handleCreateRoom}
          disabled={creating}
          className="w-full max-w-xs mx-auto block px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-lg"
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
            'ルームを作る'
          )}
        </button>

        {error && (
          <p className="mt-3 text-red-400 text-sm">{error}</p>
        )}

        {/* Join room */}
        <div className="mt-10 pt-8 border-t border-white/10">
          <p className="text-gray-400 text-sm mb-3">ルームに参加する</p>
          <div className="flex gap-2 max-w-sm mx-auto">
            <input
              type="text"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              placeholder="ルームIDまたはURLを入力"
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              onClick={handleJoinRoom}
              disabled={!joinId.trim()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors text-sm"
            >
              参加
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
