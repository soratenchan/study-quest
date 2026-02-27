import type { BadgeDefinition } from '@/types';

interface BadgeCardProps {
  badge: BadgeDefinition;
  acquired: boolean;
  acquiredAt?: string;
}

export default function BadgeCard({ badge, acquired, acquiredAt }: BadgeCardProps) {
  return (
    <div
      className={`flex flex-col items-center rounded-xl border p-4 text-center transition-all ${
        acquired
          ? 'border-indigo-200 bg-gradient-to-b from-indigo-50 to-white shadow-sm'
          : 'border-gray-100 bg-gray-50 opacity-50 grayscale'
      }`}
    >
      <span className="text-4xl" role="img" aria-label={badge.name}>
        {badge.emoji}
      </span>
      <h4 className="mt-2 text-sm font-semibold text-gray-800">{badge.name}</h4>
      <p className="mt-0.5 text-xs text-gray-500">{badge.description}</p>
      {acquired && acquiredAt && (
        <p className="mt-2 text-[10px] text-indigo-500 font-medium">
          {new Date(acquiredAt).toLocaleDateString('ja-JP')}
        </p>
      )}
    </div>
  );
}
