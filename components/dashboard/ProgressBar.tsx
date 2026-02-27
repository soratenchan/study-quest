'use client';

interface ProgressBarProps {
  value: number;
  label?: string;
  color?: string;
}

export default function ProgressBar({ value, label, color = 'bg-indigo-500' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">{label}</span>
          <span className="text-xs font-semibold text-gray-700">{Math.round(clamped)}%</span>
        </div>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {!label && (
        <p className="mt-1 text-right text-xs font-semibold text-gray-700">
          {Math.round(clamped)}%
        </p>
      )}
    </div>
  );
}
