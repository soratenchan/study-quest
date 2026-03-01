'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/home');
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E4000F] via-[#B8000C] to-[#1A1A2E] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-8xl opacity-10 select-none">⭐</div>
        <div className="absolute top-1/4 right-8 text-7xl opacity-10 select-none">🎮</div>
        <div className="absolute bottom-20 left-1/4 text-9xl opacity-10 select-none">⚔️</div>
        <div className="absolute bottom-10 right-10 text-7xl opacity-10 select-none">🏆</div>
        <div className="absolute top-1/2 left-8 text-6xl opacity-10 select-none">🌟</div>
      </div>

      <div className="relative text-center max-w-2xl mx-auto">
        {/* ロゴ */}
        <div className="mb-10">
          <span className="text-7xl">⚔️</span>
          <h1 className="mt-4 text-6xl font-extrabold text-white tracking-tight drop-shadow-lg">
            StudyQuest
          </h1>
          <p className="mt-4 text-xl text-white/90 font-bold">
            バディと一緒に目標を攻略しよう！
          </p>
        </div>

        {/* 機能ハイライト */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {[
            { emoji: '🎯', text: '目標管理' },
            { emoji: '✨', text: 'XP・レベル' },
            { emoji: '🤝', text: 'バディと共有' },
          ].map((f) => (
            <div
              key={f.text}
              className="flex items-center gap-2 px-5 py-3 bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] font-bold text-gray-800"
            >
              <span className="text-xl">{f.emoji}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        {/* ボタン */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto">
          <Link
            href="/register"
            className="w-full px-6 py-3 bg-[#E4000F] text-white font-extrabold text-base rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5 transition-all text-center"
          >
            はじめる
          </Link>
          <Link
            href="/login"
            className="w-full px-6 py-3 bg-white text-[#2C2C2C] font-extrabold text-base rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5 transition-all text-center"
          >
            ログイン
          </Link>
        </div>
      </div>
    </div>
  );
}
