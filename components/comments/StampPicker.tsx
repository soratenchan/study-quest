'use client';

interface StampPickerProps {
  onSelect: (stamp: string) => void;
  selected?: string;
}

const STAMPS = ['🔥', '👏', '💪', '🎉', '✨', '❤️', '🚀', '👍'];

export default function StampPicker({ onSelect, selected }: StampPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {STAMPS.map((stamp) => (
        <button
          key={stamp}
          type="button"
          onClick={() => onSelect(stamp)}
          className={`flex h-10 w-full items-center justify-center rounded-lg text-xl transition-all ${
            selected === stamp
              ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110'
              : 'bg-gray-50 hover:bg-gray-100'
          }`}
        >
          {stamp}
        </button>
      ))}
    </div>
  );
}
