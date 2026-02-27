'use client';

import { useState, useEffect } from 'react';
import { Room, User } from '@/types';

export function useRoom(roomId: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;
    Promise.all([
      fetch(`/api/rooms?id=${roomId}`).then((r) => r.json()),
      fetch(`/api/users?room_id=${roomId}`).then((r) => r.json()),
    ])
      .then(([roomData, usersData]) => {
        if (roomData.room) setRoom(roomData.room);
        if (usersData.users) setUsers(usersData.users);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [roomId]);

  const refreshUsers = async () => {
    const data = await fetch(`/api/users?room_id=${roomId}`).then((r) => r.json());
    if (data.users) setUsers(data.users);
  };

  return { room, users, loading, refreshUsers };
}
