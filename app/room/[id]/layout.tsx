'use client';

import { useParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/layout/Navbar';

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
    // まずlocalStorageから取得 (非認証MVP向け)
    const stored = localStorage.getItem(`userId_${roomId}`);
    if (stored) {
      setUserId(stored);
      return;
    }
    // Supabase Authからfallback
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

  // セットアップページではナビ非表示
  const isSetupPage = pathname.endsWith('/setup');

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {!isSetupPage && <Navbar roomId={roomId} userId={userId} />}
      <main className={`flex-1 max-w-4xl mx-auto w-full px-4 py-6 ${!isSetupPage ? 'pb-28 md:pb-8' : ''}`}>
        {children}
      </main>
    </div>
  );
}
