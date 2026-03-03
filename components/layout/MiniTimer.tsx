'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTimer, PHASE_CONFIG } from '@/contexts/TimerContext';

export default function MiniTimer({ roomId }: { roomId: string }) {
  const { phase, seconds, isRunning, setIsRunning } = useTimer();
  const pathname = usePathname();

  if (pathname.endsWith('/timer')) return null;

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const { color, emoji } = PHASE_CONFIG[phase];

  if (!isRunning && seconds === 0) return null;

  return (
    <div
      className="fixed bottom-[72px] md:bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-white rounded-xl border-[3px] shadow-[4px_4px_0_#2C2C2C] transition-all"
      style={{ borderColor: isRunning ? color : '#2C2C2C' }}
    >
      <span className="text-base leading-none">{emoji}</span>
      <span
        className="text-sm font-extrabold tabular-nums"
        style={{ color: isRunning ? color : '#6b7280' }}
      >
        {mm}:{ss}
      </span>
      <button
        onClick={() => setIsRunning(r => !r)}
        className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg text-white transition-opacity"
        style={{ backgroundColor: isRunning ? color : '#9ca3af' }}
        title={isRunning ? '一時停止' : 'スタート'}
      >
        {isRunning ? '⏸' : '▶'}
      </button>
      <Link
        href={`/room/${roomId}/timer`}
        className="text-xs text-gray-400 font-bold hover:text-gray-700 leading-none"
        title="タイマーページへ"
      >
        →
      </Link>
    </div>
  );
}
