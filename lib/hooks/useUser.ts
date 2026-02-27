'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';

export function useUser(roomId: string) {
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedId = localStorage.getItem(`userId_${roomId}`);
    setUserId(storedId);
  }, [roomId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetch(`/api/users?id=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  return { userId, user, loading, setUser };
}
