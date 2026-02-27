'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Comment, User } from '@/types';

const STAMPS = ['👍', '🎉', '💪', '🔥', '⭐', '❤️', '👏', '🚀', '✨', '🙌', '💯', '🎯'];

export default function CommentsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [buddyId, setBuddyId] = useState<string | null>(null);
  const [buddyUser, setBuddyUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showStamps, setShowStamps] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    async function fetchData() {
      try {
        // Fetch users to find buddy
        const usersRes = await fetch(`/api/users?room_id=${roomId}`);
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          const allUsers: User[] = Array.isArray(usersData) ? usersData : [];
          const me = allUsers.find((u) => u.id === userId);
          const buddy = allUsers.find((u) => u.id !== userId);
          setCurrentUser(me || null);
          setBuddyUser(buddy || null);
          setBuddyId(buddy?.id || null);
        }

        // Fetch comments for both directions
        const [sentRes, receivedRes] = await Promise.all([
          fetch(`/api/comments?from_user_id=${userId}`),
          fetch(`/api/comments?to_user_id=${userId}`),
        ]);

        const allComments: Comment[] = [];
        if (sentRes.ok) {
          const data = await sentRes.json();
          if (Array.isArray(data)) allComments.push(...data);
        }
        if (receivedRes.ok) {
          const data = await receivedRes.json();
          if (Array.isArray(data)) allComments.push(...data);
        }

        // Dedupe and sort by created_at
        const uniqueMap = new Map<string, Comment>();
        for (const c of allComments) {
          uniqueMap.set(c.id, c);
        }
        setComments(
          Array.from(uniqueMap.values()).sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        );

        // Mark received as read
        const unreadIds = allComments
          .filter((c) => c.to_user_id === userId && !c.is_read)
          .map((c) => c.id);
        if (unreadIds.length > 0) {
          for (const cId of unreadIds) {
            fetch('/api/comments', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: cId, is_read: true }),
            }).catch(() => {});
          }
        }
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId, roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  async function sendComment(content: string | null, stamp: string | null) {
    if (!userId || !buddyId) return;
    if (!content && !stamp) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_user_id: userId,
          to_user_id: buddyId,
          content,
          stamp,
        }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [...prev, newComment]);
        setMessage('');
        setShowStamps(false);
      }
    } catch {
      // Ignore
    } finally {
      setSubmitting(false);
    }
  }

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    sendComment(message.trim(), null);
  }

  function handleSendStamp(stamp: string) {
    sendComment(null, stamp);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-800 rounded animate-pulse w-40" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!buddyId) {
    return (
      <div className="py-16 text-center">
        <span className="text-4xl">💬</span>
        <p className="mt-4 text-gray-400">バディがまだいません</p>
        <p className="text-sm text-gray-500 mt-1">
          バディが参加したらメッセージを送れます
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-120px)]">
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-2xl font-bold text-gray-100">コメント</h1>
        {buddyUser && (
          <span className="text-sm text-gray-400">
            with {buddyUser.avatar} {buddyUser.name}
          </span>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {comments.length === 0 && (
          <div className="py-12 text-center">
            <span className="text-3xl">👋</span>
            <p className="mt-3 text-gray-400">最初のメッセージを送ろう</p>
          </div>
        )}

        {comments.map((comment) => {
          const isMine = comment.from_user_id === userId;
          const sender = isMine ? currentUser : buddyUser;

          return (
            <div
              key={comment.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end gap-2 max-w-[80%] ${isMine ? 'flex-row-reverse' : ''}`}>
                <span className="text-lg flex-shrink-0">{sender?.avatar || '👤'}</span>
                <div>
                  {comment.stamp ? (
                    <div
                      className={`px-4 py-3 rounded-2xl text-4xl ${
                        isMine ? 'bg-indigo-600/20' : 'bg-gray-800/50'
                      }`}
                    >
                      {comment.stamp}
                    </div>
                  ) : (
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm ${
                        isMine
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-800 text-gray-200'
                      }`}
                    >
                      {comment.content}
                    </div>
                  )}
                  <p className={`text-xs text-gray-500 mt-1 ${isMine ? 'text-right' : ''}`}>
                    {new Date(comment.created_at).toLocaleString('ja-JP', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Stamp picker */}
      {showStamps && (
        <div className="grid grid-cols-6 gap-2 p-3 bg-gray-800/50 rounded-xl border border-gray-700/50 mb-3">
          {STAMPS.map((stamp) => (
            <button
              key={stamp}
              onClick={() => handleSendStamp(stamp)}
              disabled={submitting}
              className="text-2xl p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {stamp}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowStamps(!showStamps)}
          className={`p-2.5 rounded-xl transition-colors ${
            showStamps ? 'bg-indigo-600/20 text-indigo-400' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
          title="スタンプ"
        >
          😊
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="メッセージを入力..."
          className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          type="submit"
          disabled={submitting || !message.trim()}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
        >
          送信
        </button>
      </form>
    </div>
  );
}
