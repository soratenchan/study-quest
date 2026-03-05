'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Comment, User } from '@/types';
import { createClient } from '@/lib/supabase/client';

const STAMPS = [
  { emoji: '👍', label: 'いいね', color: '#3B82F6' },
  { emoji: '🎉', label: 'やった！', color: '#F59E0B' },
  { emoji: '💪', label: 'ガンバレ', color: '#E4000F' },
  { emoji: '🔥', label: '燃えてる', color: '#F97316' },
  { emoji: '⭐', label: 'スゴイ', color: '#EAB308' },
  { emoji: '❤️', label: '応援', color: '#EC4899' },
  { emoji: '👏', label: '拍手', color: '#8B5CF6' },
  { emoji: '🚀', label: 'GO！', color: '#6366F1' },
  { emoji: '✨', label: 'キラキラ', color: '#F59E0B' },
  { emoji: '🙌', label: 'やったね', color: '#10B981' },
  { emoji: '💯', label: '完璧', color: '#E4000F' },
  { emoji: '🎯', label: 'ナイス', color: '#009AC7' },
];

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

  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showStamps, setShowStamps] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    async function fetchData() {
      try {
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

        // room_id で双方向まとめて取得
        const commentsRes = await fetch(`/api/comments?room_id=${roomId}`);
        if (commentsRes.ok) {
          const data = await commentsRes.json();
          const allComments: Comment[] = Array.isArray(data) ? data : [];
          setComments(
            allComments.sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
          );

          // 既読処理（自分宛の未読のみ）
          const unreadIds = allComments
            .filter((c) => c.to_user_id === userId && !c.is_read)
            .map((c) => c.id);
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

  function handleSendStamp(emoji: string) {
    sendComment(null, emoji);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded-2xl animate-pulse w-40" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!buddyId) {
    return (
      <div className="py-20 text-center">
        <div className="bg-white rounded-2xl border-[3px] border-dashed border-[#2C2C2C] p-12">
          <span className="text-5xl">💬</span>
          <p className="mt-4 text-lg font-extrabold text-[#1A1A1A]">バディがまだいません</p>
          <p className="text-sm text-gray-500 font-medium mt-2">
            バディが参加したらメッセージを送れます
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-120px)]">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-extrabold text-[#1A1A1A]">コメント</h1>
        {buddyUser && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-[2px] border-[#2C2C2C] rounded-xl shadow-[0_2px_0_#2C2C2C]">
            <span>{buddyUser.avatar}</span>
            <span className="text-sm font-extrabold text-[#1A1A1A]">{buddyUser.name}</span>
          </div>
        )}
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {comments.length === 0 && (
          <div className="py-12 text-center bg-white rounded-2xl border-[3px] border-dashed border-[#2C2C2C]">
            <span className="text-4xl">👋</span>
            <p className="mt-3 font-extrabold text-[#1A1A1A]">最初のメッセージを送ろう</p>
          </div>
        )}

        {comments.map((comment) => {
          const isMine = comment.from_user_id === userId;
          const sender = isMine ? currentUser : buddyUser;
          const stampDef = comment.stamp ? STAMPS.find(s => s.emoji === comment.stamp) : null;

          return (
            <div
              key={comment.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end gap-2 max-w-[80%] ${isMine ? 'flex-row-reverse' : ''}`}>
                <div className="w-9 h-9 rounded-xl border-[2px] border-[#2C2C2C] bg-[#FAFAFA] flex items-center justify-center text-lg flex-shrink-0 shadow-[1px_1px_0_#2C2C2C]">
                  {sender?.avatar || '👤'}
                </div>
                <div>
                  {comment.stamp ? (
                    <div
                      className="px-5 py-3 rounded-2xl border-[2px] shadow-[2px_2px_0] flex flex-col items-center gap-1"
                      style={stampDef ? {
                        borderColor: stampDef.color,
                        backgroundColor: `${stampDef.color}18`,
                        boxShadow: `2px 2px 0 ${stampDef.color}66`,
                      } : {
                        borderColor: '#2C2C2C',
                        backgroundColor: isMine ? '#FFF3CD' : 'white',
                        boxShadow: '2px 2px 0 #2C2C2C',
                      }}
                    >
                      <span className="text-4xl leading-none">{comment.stamp}</span>
                      {stampDef && (
                        <span className="text-xs font-extrabold leading-none" style={{ color: stampDef.color }}>
                          {stampDef.label}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm font-bold border-[2px] border-[#2C2C2C] ${
                        isMine
                          ? 'bg-[#E4000F] text-white shadow-[2px_2px_0_#B8000C]'
                          : 'bg-white text-[#1A1A1A] shadow-[2px_2px_0_#2C2C2C]'
                      }`}
                    >
                      {comment.content}
                    </div>
                  )}
                  <p className={`text-xs font-medium text-gray-400 mt-1 ${isMine ? 'text-right' : ''}`}>
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

      {/* スタンプピッカー */}
      {showStamps && (
        <div className="grid grid-cols-4 gap-2 p-3 bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] mb-3">
          {STAMPS.map((stamp) => (
            <button
              key={stamp.emoji}
              onClick={() => handleSendStamp(stamp.emoji)}
              disabled={submitting}
              className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl transition-all disabled:opacity-50 hover:scale-105 active:scale-95 border-[2px] shadow-[0_2px_0]"
              style={{
                borderColor: stamp.color,
                backgroundColor: `${stamp.color}18`,
                boxShadow: `0 2px 0 ${stamp.color}66`,
              }}
            >
              <span className="text-2xl leading-none">{stamp.emoji}</span>
              <span className="text-[9px] font-extrabold leading-none mt-0.5" style={{ color: stamp.color }}>
                {stamp.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 入力エリア */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowStamps(!showStamps)}
          className={`p-3 rounded-xl border-[3px] transition-all font-extrabold text-lg ${
            showStamps
              ? 'bg-[#FFD700] border-[#2C2C2C] shadow-[0_2px_0_#2C2C2C]'
              : 'bg-white border-[#2C2C2C] shadow-[0_3px_0_#2C2C2C] hover:shadow-[0_5px_0_#2C2C2C] hover:-translate-y-0.5'
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
          className="flex-1 px-4 py-3 bg-white border-[3px] border-[#2C2C2C] rounded-xl text-sm font-bold text-[#1A1A1A] placeholder:text-gray-400 placeholder:font-medium focus:outline-none focus:border-[#009AC7] transition-colors shadow-[0_3px_0_#2C2C2C]"
        />
        <button
          type="submit"
          disabled={submitting || !message.trim()}
          className="px-5 py-3 bg-[#E4000F] text-white font-extrabold text-sm rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          送信
        </button>
      </form>
    </div>
  );
}
