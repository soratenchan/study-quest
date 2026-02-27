'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function Navbar({ roomId }: { roomId: string }) {
  const pathname = usePathname();

  const links = [
    { href: `/room/${roomId}`, label: 'ダッシュボード', icon: '📊' },
    { href: `/room/${roomId}/goals`, label: '目標', icon: '🎯' },
    { href: `/room/${roomId}/logs`, label: 'ログ', icon: '📝' },
    { href: `/room/${roomId}/badges`, label: 'バッジ', icon: '🏅' },
    { href: `/room/${roomId}/comments`, label: 'コメント', icon: '💬' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 md:relative md:border-t-0 md:border-b">
      <div className="max-w-4xl mx-auto px-2">
        <div className="flex items-center justify-around md:justify-start md:gap-1 py-1 md:py-2">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== `/room/${roomId}` && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col md:flex-row items-center gap-0.5 md:gap-2 px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm transition-colors ${
                  isActive
                    ? 'text-indigo-400 bg-indigo-500/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                <span className="text-lg md:text-base">{link.icon}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const roomId = params.id as string;
  const pathname = usePathname();

  // Don't show navbar on setup page
  const isSetupPage = pathname.endsWith('/setup');

  return (
    <div className="min-h-screen flex flex-col">
      {!isSetupPage && <Navbar roomId={roomId} />}
      <main className={`flex-1 max-w-4xl mx-auto w-full px-4 py-6 ${!isSetupPage ? 'pb-24 md:pb-6' : ''}`}>
        {children}
      </main>
    </div>
  );
}
