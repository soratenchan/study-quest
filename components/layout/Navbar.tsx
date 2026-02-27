'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Copy, Check, Swords } from 'lucide-react';

interface NavbarProps {
  roomId: string;
  userId: string;
}

const NAV_LINKS = [
  { label: 'Dashboard', path: '' },
  { label: 'Goals', path: '/goals' },
  { label: 'Badges', path: '/badges' },
  { label: 'Logs', path: '/logs' },
];

export default function Navbar({ roomId, userId }: NavbarProps) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch(`/api/comments?to_user_id=${userId}&unread=true`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        if (Array.isArray(data)) setUnread(data.length);
      })
      .catch(() => {});
  }, [userId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + `/room/${roomId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  const basePath = `/room/${roomId}`;

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-lg px-4">
        {/* Top row */}
        <div className="flex h-12 items-center justify-between">
          <Link href={basePath} className="flex items-center gap-1.5">
            <Swords className="h-5 w-5 text-indigo-600" />
            <span className="text-base font-bold text-gray-800">StudyQuest</span>
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
              aria-label="Copy room URL"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>

            <Link
              href={`${basePath}/comments`}
              className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
              aria-label="Comments"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {NAV_LINKS.map((link) => {
            const href = `${basePath}${link.path}`;
            const isActive =
              link.path === ''
                ? pathname === basePath
                : pathname.startsWith(href);

            return (
              <Link
                key={link.path}
                href={href}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
