'use client';

import { useState, useEffect, useRef } from 'react';
import type { Comment, User } from '@/types';
import { UserAvatar } from '@/components/UserAvatar';

const STAMPS = [
  { emoji: '👍', label: 'いいね',   color: '#3B82F6' },
  { emoji: '🎉', label: 'やった！', color: '#F59E0B' },
  { emoji: '💪', label: 'ガンバレ', color: '#E4000F' },
  { emoji: '🔥', label: '燃えてる', color: '#F97316' },
  { emoji: '⭐', label: 'スゴイ',   color: '#EAB308' },
  { emoji: '❤️', label: '応援',     color: '#EC4899' },
  { emoji: '👏', label: '拍手',     color: '#8B5CF6' },
  { emoji: '🚀', label: 'GO！',     color: '#6366F1' },
  { emoji: '✨', label: 'キラキラ', color: '#F59E0B' },
  { emoji: '🙌', label: 'やったね', color: '#10B981' },
  { emoji: '💯', label: '完璧',     color: '#E4000F' },
  { emoji: '🎯', label: 'ナイス',   color: '#009AC7' },
];

interface Props {
  roomId: string;
  userId: string | undefined;
  isOpen: boolean;
  onClose: () => void;
  onRead: () => void;
}

export function CommentsDrawer({ roomId, userId, isOpen, onClose, onRead }: Props) {
  const [buddyId, setBuddyId]       = useState<string | null>(null);
  const [buddyUser, setBuddyUser]   = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [comments, setComments]     = useState<Comment[]>([]);
  const [loading, setLoading]       = useState(false);
  const [message, setMessage]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showStamps, setShowStamps] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ドロワーが開くたびにデータ取得
  useEffect(() => {
    if (!isOpen || !userId) return;
    setLoading(true);

    (async () => {
      try {
        const usersRes = await fetch(`/api/users?room_id=${roomId}`);
        if (usersRes.ok) {
          const allUsers: User[] = await usersRes.json();
          const me    = allUsers.find((u) => u.id === userId) ?? null;
          const buddy = allUsers.find((u) => u.id !== userId) ?? null;
          setCurrentUser(me);
          setBuddyUser(buddy);
          setBuddyId(buddy?.id ?? null);
        }

        const commentsRes = await fetch(`/api/comments?room_id=${roomId}`);
        if (commentsRes.ok) {
          const data: Comment[] = await commentsRes.json();
          const sorted = [...data].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          setComments(sorted);

          const unreadIds = sorted
            .filter((c) => c.to_user_id === userId && !c.is_read)
            .map((c) => c.id);
          for (const id of unreadIds) {
            fetch('/api/comments', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, is_read: true }),
            }).catch(() => {});
          }
          if (unreadIds.length > 0) onRead();
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // 新着メッセージで末尾スクロール
  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments, isOpen]);

  async function sendComment(content: string | null, stamp: string | null) {
    if (!userId || !buddyId) return;
    if (!content && !stamp) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_user_id: userId, to_user_id: buddyId, content, stamp }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [...prev, newComment]);
        setMessage('');
        setShowStamps(false);
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* バックドロップ */}
      <div
        className={`md:hidden fixed inset-0 bg-black/50 z-[55] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* ドロワー本体 */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-3xl border-t-[3px] border-x-[3px] border-[#2C2C2C] shadow-[0_-6px_0_#2C2C2C] flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height: '85dvh' }}
      >
        {/* ハンドル */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 pb-3 border-b-[2px] border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-extrabold text-[#1A1A1A]">コメント</h2>
            {buddyUser && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FAFAFA] border-[2px] border-[#2C2C2C] rounded-xl shadow-[0_1px_0_#2C2C2C]">
                <span className="text-sm leading-none">{buddyUser.avatar}</span>
                <span className="text-xs font-extrabold text-[#1A1A1A]">{buddyUser.name}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* メッセージエリア */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {!loading && !buddyId && (
            <div className="py-16 text-center">
              <span className="text-4xl">💬</span>
              <p className="mt-3 font-extrabold text-[#1A1A1A]">バディがまだいません</p>
              <p className="text-sm text-gray-400 font-medium mt-1">バディが参加したらメッセージを送れます</p>
            </div>
          )}

          {!loading && buddyId && comments.length === 0 && (
            <div className="py-12 text-center bg-[#FAFAFA] rounded-2xl border-[2px] border-dashed border-gray-300">
              <span className="text-4xl">👋</span>
              <p className="mt-3 font-extrabold text-[#1A1A1A]">最初のメッセージを送ろう</p>
            </div>
          )}

          {comments.map((comment) => {
            const isMine  = comment.from_user_id === userId;
            const sender  = isMine ? currentUser : buddyUser;
            const stampDef = comment.stamp ? STAMPS.find((s) => s.emoji === comment.stamp) : null;
            return (
              <div key={comment.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end gap-2 max-w-[80%] ${isMine ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-8 rounded-xl border-[2px] border-[#2C2C2C] bg-[#FAFAFA] flex items-center justify-center text-base flex-shrink-0 shadow-[1px_1px_0_#2C2C2C] overflow-hidden">
                    <UserAvatar avatar={sender?.avatar ?? '👤'} />
                  </div>
                  <div>
                    {comment.stamp ? (
                      <div
                        className="px-4 py-2 rounded-2xl border-[2px] flex flex-col items-center gap-0.5"
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
                        <span className="text-3xl leading-none">{comment.stamp}</span>
                        {stampDef && (
                          <span className="text-[10px] font-extrabold leading-none" style={{ color: stampDef.color }}>
                            {stampDef.label}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className={`px-3 py-2 rounded-2xl text-sm font-bold border-[2px] border-[#2C2C2C] ${
                        isMine
                          ? 'bg-[#E4000F] text-white shadow-[2px_2px_0_#B8000C]'
                          : 'bg-white text-[#1A1A1A] shadow-[2px_2px_0_#2C2C2C]'
                      }`}>
                        {comment.content}
                      </div>
                    )}
                    <p className={`text-[10px] font-medium text-gray-400 mt-0.5 ${isMine ? 'text-right' : ''}`}>
                      {new Date(comment.created_at).toLocaleString('ja-JP', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
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
          <div className="grid grid-cols-4 gap-2 mx-4 p-3 bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] mb-2 flex-shrink-0">
            {STAMPS.map((stamp) => (
              <button
                key={stamp.emoji}
                onClick={() => sendComment(null, stamp.emoji)}
                disabled={submitting}
                className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl transition-all disabled:opacity-50 hover:scale-105 active:scale-95 border-[2px]"
                style={{
                  borderColor: stamp.color,
                  backgroundColor: `${stamp.color}18`,
                  boxShadow: `0 2px 0 ${stamp.color}66`,
                }}
              >
                <span className="text-xl leading-none">{stamp.emoji}</span>
                <span className="text-[9px] font-extrabold leading-none mt-0.5" style={{ color: stamp.color }}>
                  {stamp.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* 入力フォーム */}
        {buddyId && (
          <form
            onSubmit={(e) => { e.preventDefault(); if (message.trim()) sendComment(message.trim(), null); }}
            className="flex items-center gap-2 px-4 pt-2 pb-8 flex-shrink-0 border-t-[2px] border-gray-100"
          >
            <button
              type="button"
              onClick={() => setShowStamps(!showStamps)}
              className={`p-2.5 rounded-xl border-[3px] transition-all font-extrabold text-base flex-shrink-0 ${
                showStamps
                  ? 'bg-[#FFD700] border-[#2C2C2C] shadow-[0_2px_0_#2C2C2C]'
                  : 'bg-white border-[#2C2C2C] shadow-[0_3px_0_#2C2C2C] hover:shadow-[0_5px_0_#2C2C2C] hover:-translate-y-0.5'
              }`}
            >
              😊
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="メッセージを入力..."
              className="flex-1 px-3 py-2.5 bg-white border-[3px] border-[#2C2C2C] rounded-xl text-sm font-bold text-[#1A1A1A] placeholder:text-gray-400 placeholder:font-medium focus:outline-none focus:border-[#009AC7] transition-colors shadow-[0_3px_0_#2C2C2C]"
            />
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="px-4 py-2.5 bg-[#E4000F] text-white font-extrabold text-sm rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              送信
            </button>
          </form>
        )}
      </div>
    </>
  );
}
