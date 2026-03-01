'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface NavbarProps {
  roomId: string;
  userId?: string;
}

const NAV_ITEMS = [
  { href: (id: string) => `/room/${id}`, label: 'ダッシュ', icon: '📊', exact: true },
  { href: (id: string) => `/room/${id}/goals`, label: '目標', icon: '🎯', exact: false },
  { href: (id: string) => `/room/${id}/buddy`, label: 'バディ', icon: '👥', exact: false },
  { href: (id: string) => `/room/${id}/logs`, label: 'ログ', icon: '📝', exact: false },
  { href: (id: string) => `/room/${id}/badges`, label: 'バッジ', icon: '🏅', exact: false },
  { href: (id: string) => `/room/${id}/comments`, label: 'コメント', icon: '💬', exact: false },
];

export default function Navbar({ roomId, userId }: NavbarProps) {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/comments?to_user_id=${userId}&unread=true`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        if (Array.isArray(data)) setUnread(data.length);
      })
      .catch(() => {});
  }, [userId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}/setup`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <>
      {/* デスクトップ上部ナビ */}
      <nav className="hidden md:block sticky top-0 z-40 bg-[#1A1A2E] border-b-[3px] border-[#2C2C2C]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* ロゴ */}
            <Link href={`/room/${roomId}`} className="flex items-center gap-2">
              <span className="text-xl">⚔️</span>
              <span className="font-extrabold text-white text-lg tracking-wide">StudyQuest</span>
            </Link>

            {/* ナビリンク */}
            <div className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const href = item.href(roomId);
                const isActive = item.exact
                  ? pathname === href
                  : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-[#E4000F] text-white shadow-[0_2px_0_#B8000C]'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                    {item.label === 'コメント' && unread > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FFD700] text-[10px] font-extrabold text-[#1A1A1A] px-1">
                        {unread}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* 右側ボタン群 */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg border border-white/20 transition-colors"
              >
                {copied ? '✓ コピー済' : '🔗 招待'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* モバイル下部固定バー */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A2E] border-t-[3px] border-[#2C2C2C]">
        <div className="flex items-center justify-around py-1.5 px-2">
          {NAV_ITEMS.map((item) => {
            const href = item.href(roomId);
            const isActive = item.exact
              ? pathname === href
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'text-[#FFD700]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[9px] font-bold">{item.label}</span>
                {item.label === 'コメント' && unread > 0 && (
                  <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E4000F] text-[9px] font-extrabold text-white px-1">
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
