'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Room } from '@/types';

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchRoom() {
      try {
        // まずトークンとして検索
        const res = await fetch(`/api/rooms?token=${encodeURIComponent(token)}`);
        if (res.ok) {
          const data = await res.json();
          setRoom(data);
          setLoading(false);
          return;
        }

        // 次にIDとして検索
        const res2 = await fetch(`/api/rooms?id=${encodeURIComponent(token)}`);
        if (res2.ok) {
          const data = await res2.json();
          setRoom(data);
          setLoading(false);
          return;
        }

        setError('ルームが見つかりませんでした。招待リンクを確認してください。');
      } catch {
        setError('ルームの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchRoom();
    }
  }, [token]);

  function handleJoin() {
    if (!room) return;
    router.push(`/room/${room.id}/setup`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
        <div className="text-white font-bold animate-pulse">ルームを確認中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center px-4 relative overflow-hidden">
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
          <Link href="/" className="inline-block">
            <span className="text-5xl">⚔️</span>
            <p className="mt-2 text-2xl font-extrabold text-white">StudyQuest</p>
          </Link>
        </div>

        {error ? (
          <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-8 text-center">
            <div className="text-5xl mb-4">😢</div>
            <h2 className="text-xl font-extrabold text-gray-800 mb-3">
              ルームが見つかりません
            </h2>
            <p className="text-[#E4000F] text-sm font-medium mb-6">{error}</p>
            <Link
              href="/home"
              className="inline-block px-6 py-3 bg-[#E4000F] text-white font-extrabold text-base rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5 transition-all"
            >
              ホームに戻る
            </Link>
          </div>
        ) : room ? (
          <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-8 text-center">
            <div className="text-5xl mb-4">🤝</div>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-2">
              ルームに参加しますか？
            </h2>
            <p className="text-gray-500 text-sm mb-2">
              バディからの招待を受け取りました
            </p>
            <p className="text-gray-400 text-xs mb-8 font-mono bg-gray-100 rounded-lg px-3 py-2">
              Room ID: {room.id.slice(0, 8)}...
            </p>
            <div className="space-y-3">
              <button
                onClick={handleJoin}
                className="w-full px-6 py-3 bg-[#E4000F] text-white font-extrabold text-base rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5 transition-all"
              >
                参加する
              </button>
              <Link
                href="/home"
                className="block w-full px-6 py-3 bg-white text-[#2C2C2C] font-extrabold text-base rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5 transition-all text-center"
              >
                キャンセル
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
