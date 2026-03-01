'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { createClient } from '@/lib/supabase/client';

export function useUser(roomId: string) {
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      setLoading(true);
      try {
        // Supabase Auth セッションから auth_id を取得
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          setLoading(false);
          return;
        }

        // users テーブルから auth_id + room_id で検索
        const res = await fetch(`/api/users?room_id=${roomId}`);
        if (!res.ok) throw new Error('Failed to fetch users');
        const users: User[] = await res.json();

        const found = users.find((u) => u.auth_id === authUser.id);
        if (found) {
          setUserId(found.id);
          setUser(found);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [roomId]);

  return { userId, user, loading, setUser };
}

// 認証済みユーザーのauth_idを取得するユーティリティ
export function useAuthUser() {
  const [authId, setAuthId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthId(user?.id ?? null);
      setLoading(false);
    });
  }, []);

  return { authId, loading };
}
