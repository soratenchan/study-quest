'use client';

import { useParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/layout/Navbar';
import MiniTimer from '@/components/layout/MiniTimer';
import { TimerProvider, useTimer } from '@/contexts/TimerContext';

// グローバル保存モーダル（どのページでも表示される）
function SaveModal() {
  const { showSaveModal, memo, saving, setMemo, handleSaveLog, skipSave } = useTimer();
  if (!showSaveModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[8px_8px_0_#2C2C2C] p-6 w-full max-w-sm">
        <div className="text-center mb-5">
          <span className="text-5xl">🎉</span>
          <h3 className="mt-2 text-lg font-extrabold text-gray-800">集中セッション完了！</h3>
          <p className="text-sm text-gray-500 mt-1">学習ログを記録しますか？</p>
        </div>
        <textarea
          value={memo}
          onChange={e => setMemo(e.target.value)}
          placeholder="今日の学習内容（例：英単語50個）"
          rows={3}
          className="w-full px-3 py-2 border-[3px] border-[#2C2C2C] rounded-xl text-sm font-medium focus:outline-none focus:border-[#E4000F] resize-none"
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={skipSave}
            className="flex-1 py-2.5 bg-white text-gray-600 font-extrabold text-sm rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_3px_0_#2C2C2C] active:shadow-[0_1px_0_#2C2C2C] active:translate-y-0.5 transition-all"
          >
            スキップ
          </button>
          <button
            onClick={handleSaveLog}
            disabled={saving || !memo.trim()}
            className="flex-1 py-2.5 bg-[#E4000F] text-white font-extrabold text-sm rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_3px_0_#2C2C2C] hover:shadow-[0_5px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_1px_0_#2C2C2C] active:translate-y-0.5 transition-all disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoomLayoutInner({
  children,
  roomId,
  userId,
  isSetupPage,
}: {
  children: React.ReactNode;
  roomId: string;
  userId: string | undefined;
  isSetupPage: boolean;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {!isSetupPage && <Navbar roomId={roomId} userId={userId} />}
      <main className={`flex-1 max-w-4xl mx-auto w-full px-4 py-6 ${!isSetupPage ? 'pb-28 md:pb-8' : ''}`}>
        {children}
      </main>
      {!isSetupPage && <MiniTimer roomId={roomId} />}
      <SaveModal />
    </div>
  );
}

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const roomId = params.id as string;
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const stored = localStorage.getItem(`userId_${roomId}`);
    if (stored) {
      setUserId(stored);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) return;
      const res = await fetch(`/api/users?room_id=${roomId}`);
      if (!res.ok) return;
      const users = await res.json();
      const found = Array.isArray(users)
        ? users.find((u: { auth_id: string; id: string }) => u.auth_id === authUser.id)
        : null;
      if (found) setUserId(found.id);
    });
  }, [roomId]);

  const isSetupPage = pathname.endsWith('/setup');

  return (
    <TimerProvider roomId={roomId} userId={userId}>
      <RoomLayoutInner
        roomId={roomId}
        userId={userId}
        isSetupPage={isSetupPage}
      >
        {children}
      </RoomLayoutInner>
    </TimerProvider>
  );
}
