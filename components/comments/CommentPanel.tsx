'use client';

import { useState, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import type { Comment } from '@/types';
import StampPicker from './StampPicker';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface CommentPanelProps {
  fromUserId: string;
  toUserId: string;
}

type Tab = 'received' | 'sent';

export default function CommentPanel({ fromUserId, toUserId }: CommentPanelProps) {
  const [tab, setTab] = useState<Tab>('received');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [stamp, setStamp] = useState<string | undefined>();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(
        tab === 'received'
          ? { to_user_id: fromUserId }
          : { from_user_id: fromUserId }
      );
      const res = await fetch(`/api/comments?${params}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
        if (tab === 'received') {
          setUnreadCount(data.filter((c: Comment) => !c.is_read).length);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [tab, fromUserId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Mark as read when viewing received tab
  useEffect(() => {
    if (tab === 'received' && comments.length > 0) {
      const unread = comments.filter((c) => !c.is_read);
      if (unread.length > 0) {
        fetch('/api/comments', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to_user_id: fromUserId }),
        }).then(() => setUnreadCount(0));
      }
    }
  }, [tab, comments, fromUserId]);

  const handleSend = async () => {
    if (!text.trim() && !stamp) return;
    setSending(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_user_id: fromUserId,
          to_user_id: toUserId,
          content: text.trim() || null,
          stamp: stamp || null,
        }),
      });
      if (res.ok) {
        setText('');
        setStamp(undefined);
        if (tab === 'sent') fetchComments();
      }
    } finally {
      setSending(false);
    }
  };

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Tab header */}
      <div className="flex border-b border-gray-100">
        {(['received', 'sent'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-center text-sm font-medium transition-colors ${
              tab === t
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'received' ? 'Received' : 'Sent'}
            {t === 'received' && unreadCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <p className="text-center text-sm text-gray-400">Loading...</p>
        ) : comments.length === 0 ? (
          <p className="text-center text-sm text-gray-400">No comments yet</p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className={`rounded-lg border border-gray-100 p-3 ${
                !c.is_read && tab === 'received' ? 'bg-indigo-50/50' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="font-medium text-gray-600">
                  {c.from_user?.name || 'Buddy'}
                </span>
                <span>{formatTime(c.created_at)}</span>
              </div>
              <div className="mt-1">
                {c.stamp && <span className="text-2xl">{c.stamp}</span>}
                {c.content && (
                  <p className="text-sm text-gray-700">{c.content}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Send form */}
      <div className="border-t border-gray-100 p-4 space-y-3">
        <StampPicker onSelect={setStamp} selected={stamp} />
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              placeholder="Write a comment..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
          <Button
            size="md"
            loading={sending}
            onClick={handleSend}
            disabled={!text.trim() && !stamp}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
