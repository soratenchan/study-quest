'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BADGE_DEFINITIONS } from '@/lib/utils/badge';
import type { Badge, BadgeType } from '@/types';

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
      className={`p-4 rounded-xl border text-center transition-all ${
        acquired
          ? 'bg-indigo-600/10 border-indigo-500/30'
          : 'bg-gray-800/30 border-gray-700/50 opacity-50'
      }`}
    >
      <span className={`text-4xl block ${acquired ? '' : 'grayscale'}`}>{emoji}</span>
      <p className={`mt-2 text-sm font-medium ${acquired ? 'text-gray-100' : 'text-gray-500'}`}>
        {name}
      </p>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
      {acquired && acquiredAt && (
        <p className="mt-2 text-xs text-indigo-400">
          {new Date(acquiredAt).toLocaleDateString('ja-JP')} 取得
        </p>
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
    const storedUserId = localStorage.getItem(`userId_${roomId}`);
    if (!storedUserId) {
      router.replace(`/room/${roomId}/setup`);
      return;
    }
    setUserId(storedUserId);
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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-800 rounded animate-pulse w-40" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">バッジ</h1>
        <p className="mt-1 text-sm text-gray-400">
          {acquiredCount} / {BADGE_DEFINITIONS.length} バッジ取得済み
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
          style={{ width: `${(acquiredCount / BADGE_DEFINITIONS.length) * 100}%` }}
        />
      </div>

      {/* Badge grid */}
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
