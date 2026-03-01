'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BADGE_DEFINITIONS } from '@/lib/utils/badge';
import type { Badge } from '@/types';

function BadgeCard({
  emoji,
  name,
  description,
  acquired,
  acquiredAt,
}: {
  emoji: string;
  name: string;
  description: string;
  acquired: boolean;
  acquiredAt?: string;
}) {
  return (
    <div
      className={`p-4 rounded-2xl border-[3px] text-center transition-all ${
        acquired
          ? 'bg-white border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] hover:shadow-[6px_6px_0_#2C2C2C] hover:-translate-y-0.5'
          : 'bg-gray-100 border-gray-300 shadow-[2px_2px_0_#9ca3af] opacity-50'
      }`}
    >
      <span className={`text-4xl block ${acquired ? '' : 'grayscale'}`}>{emoji}</span>
      <p className={`mt-2 text-sm font-extrabold ${acquired ? 'text-[#1A1A1A]' : 'text-gray-400'}`}>
        {name}
      </p>
      <p className="mt-1 text-xs font-medium text-gray-500">{description}</p>
      {acquired && acquiredAt && (
        <p className="mt-2 text-xs font-bold text-[#009AC7]">
          {new Date(acquiredAt).toLocaleDateString('ja-JP')} 取得
        </p>
      )}
      {!acquired && (
        <p className="mt-2 text-xs font-bold text-gray-400">未取得</p>
      )}
    </div>
  );
}

export default function BadgesPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

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

    async function fetchBadges() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('badges')
          .select('*')
          .eq('user_id', userId);
        setBadges(data || []);
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }
    fetchBadges();
  }, [userId]);

  const acquiredMap = useMemo(() => {
    const map = new Map<string, Badge>();
    for (const b of badges) {
      map.set(b.badge_type, b);
    }
    return map;
  }, [badges]);

  const acquiredCount = acquiredMap.size;
  const totalCount = BADGE_DEFINITIONS.length;
  const pct = totalCount > 0 ? Math.round((acquiredCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded-2xl animate-pulse w-40" />
        <div className="h-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1A]">バッジ</h1>
          <p className="mt-1 text-sm font-bold text-gray-500">
            {acquiredCount} / {totalCount} 取得済み
          </p>
        </div>
        {acquiredCount > 0 && (
          <span className="px-4 py-2 bg-[#FFD700] text-[#1A1A1A] font-extrabold text-sm rounded-xl border-[2px] border-[#2C2C2C] shadow-[0_2px_0_#2C2C2C]">
            {pct}% コンプリート
          </span>
        )}
      </div>

      {/* 進捗バー */}
      <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-4">
        <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
          <span>コレクション進捗</span>
          <span>{acquiredCount} / {totalCount}</span>
        </div>
        <div className="h-6 bg-gray-200 rounded-full border-[2px] border-[#2C2C2C] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-full transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* バッジグリッド */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {BADGE_DEFINITIONS.map((def) => {
          const badge = acquiredMap.get(def.type);
          return (
            <BadgeCard
              key={def.type}
              emoji={def.emoji}
              name={def.name}
              description={def.description}
              acquired={!!badge}
              acquiredAt={badge?.acquired_at}
            />
          );
        })}
      </div>
    </div>
  );
}
