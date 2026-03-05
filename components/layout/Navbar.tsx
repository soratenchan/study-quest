"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  IconDashboard,
  IconGoal,
  IconBuddy,
  IconLog,
  IconComment,
  IconTimer,
  IconMyPage,
} from "@/components/icons/NavIcons";
import { CommentsDrawer } from "@/components/CommentsDrawer";

interface NavbarProps {
  roomId: string;
  userId?: string;
}

const NAV_ITEMS: {
  href: (id: string) => string;
  label: string;
  icon: ReactNode;
  exact: boolean;
  isComment?: boolean;
}[] = [
  {
    href: (id) => `/room/${id}`,
    label: "ダッシュ",
    icon: <IconDashboard />,
    exact: true,
  },
  {
    href: (id) => `/room/${id}/goals`,
    label: "目標",
    icon: <IconGoal />,
    exact: false,
  },
  {
    href: (id) => `/room/${id}/buddy`,
    label: "バディ",
    icon: <IconBuddy />,
    exact: false,
  },
  {
    href: (id) => `/room/${id}/logs`,
    label: "ログ",
    icon: <IconLog />,
    exact: false,
  },
  {
    href: (id) => `/room/${id}/comments`,
    label: "コメント",
    icon: <IconComment />,
    exact: false,
    isComment: true,
  },
  {
    href: (id) => `/room/${id}/timer`,
    label: "タイマー",
    icon: <IconTimer />,
    exact: false,
  },
  {
    href: (id) => `/room/${id}/mypage`,
    label: "マイページ",
    icon: <IconMyPage />,
    exact: false,
  },
];

export default function Navbar({ roomId, userId }: NavbarProps) {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [copied, setCopied] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ページ遷移時にドロワーを閉じる
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!userId) return;
    if (pathname.includes("/comments") || drawerOpen) {
      setUnread(0);
      return;
    }
    fetch(`/api/comments?to_user_id=${userId}&unread=true`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setUnread(data.length);
      })
      .catch(() => {});
  }, [userId, pathname, drawerOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/room/${roomId}/setup`,
      );
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
            <Link
              href={`/room/${roomId}`}
              className="flex items-center gap-2 flex-shrink-0 justify-start"
            >
              <Image
                src="/study-quest-logo.png"
                alt="StudyQuest"
                width={90}
                height={90}
                className="rounded-lg"
              />
              <span className="font-extrabold text-white text-base tracking-wide whitespace-nowrap">
                StudyQuest
              </span>
            </Link>

            {/* ナビリンク */}
            <div className="flex items-center gap-0.5">
              {NAV_ITEMS.map((item) => {
                const href = item.href(roomId);
                const isActive = item.exact
                  ? pathname === href
                  : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative flex items-center gap-1 px-2 py-2 rounded-lg transition-all ${
                      isActive
                        ? "bg-white/15 shadow-[0_2px_0_rgba(255,255,255,0.1)]"
                        : "opacity-40 hover:opacity-90 hover:bg-white/10"
                    }`}
                  >
                    <span className="w-[18px] h-[18px] flex items-center justify-center flex-shrink-0">
                      {item.icon}
                    </span>
                    <span
                      className={`text-xs font-bold whitespace-nowrap ${isActive ? "text-white" : "text-gray-300"}`}
                    >
                      {item.label}
                    </span>
                    {item.isComment && unread > 0 && (
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
                {copied ? "✓ コピー済" : "🔗 招待"}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* モバイル下部固定バー（コメントを除いた6項目） */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A2E] border-t-[3px] border-[#2C2C2C]">
        <div className="flex items-center py-1">
          {NAV_ITEMS.filter((item) => !item.isComment).map((item) => {
            const href = item.href(roomId);
            const isActive = item.exact
              ? pathname === href
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-all ${
                  isActive ? "opacity-100" : "opacity-35 hover:opacity-70"
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  {item.icon}
                </span>
                <span
                  className={`text-[9px] font-bold leading-none ${isActive ? "text-white" : "text-gray-400"}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* コメント浮遊ボタン（モバイルのみ） */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="md:hidden fixed bottom-[72px] left-4 z-40 w-12 h-12 bg-[#1A1A2E] rounded-2xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] flex items-center justify-center transition-all hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5"
      >
        <IconComment size={22} />
        {unread > 0 && (
          <span className="absolute -top-2 -right-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#E4000F] text-[10px] font-extrabold text-white px-1 border-[2px] border-[#1A1A2E]">
            {unread}
          </span>
        )}
      </button>

      {/* コメントドロワー */}
      <CommentsDrawer
        roomId={roomId}
        userId={userId}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onRead={() => setUnread(0)}
      />
    </>
  );
}
