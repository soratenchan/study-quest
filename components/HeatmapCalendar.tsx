'use client';
import { useMemo } from 'react';

interface Props {
  name: string;
  avatar: string;
  themeColor: string;
  activityMap: Map<string, number>;
}

const DOW_LABELS = ['日', '', '火', '', '木', '', '土'];

function cellColor(count: number, hex: string): string {
  if (count === 0) return '#E5E7EB';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (count === 1) return `rgba(${r},${g},${b},0.3)`;
  if (count <= 3) return `rgba(${r},${g},${b},0.65)`;
  return hex;
}

function toKey(d: Date) {
  return d.toISOString().split('T')[0];
}

export function HeatmapCalendar({ name, avatar, themeColor, activityMap }: Props) {
  const { weeks, monthLabels, totalActiveDays, totalCount } = useMemo(() => {
    const COLS = 18;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 週の始まり（日曜）に揃える
    const start = new Date(today);
    start.setDate(today.getDate() - COLS * 7 + 1);
    start.setDate(start.getDate() - start.getDay());

    const days: (Date | null)[] = [];
    const cur = new Date(start);
    while (cur <= today) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    while (days.length % 7 !== 0) days.push(null);

    // 7日ごとに列にまとめる
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    // 月ラベル（その列に1日がある場合に表示）
    const monthLabels = weeks.map((week, wi) => {
      if (wi === 0) {
        const fd = week.find(Boolean);
        return fd ? `${(fd as Date).getMonth() + 1}月` : null;
      }
      const first = week.find(d => d && d.getDate() === 1) as Date | undefined;
      return first ? `${first.getMonth() + 1}月` : null;
    });

    const totalActiveDays = [...activityMap.keys()].filter(k => (activityMap.get(k) ?? 0) > 0).length;
    const totalCount = [...activityMap.values()].reduce((s, v) => s + v, 0);

    return { weeks, monthLabels, totalActiveDays, totalCount };
  }, [activityMap]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl leading-none">{avatar}</span>
        <span className="text-sm font-extrabold text-[#1A1A1A]">{name}</span>
        <div className="ml-auto flex items-center gap-3 text-xs font-bold text-gray-500">
          <span>{totalActiveDays} 日間</span>
          <span>{totalCount} 件</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-0">
          {/* 曜日ラベル */}
          <div className="flex flex-col mr-[3px] mt-[18px]">
            {DOW_LABELS.map((lbl, i) => (
              <div key={i} className="h-[12px] mb-[2px] flex items-center justify-end w-5">
                <span className="text-[8px] text-gray-400 font-bold">{lbl}</span>
              </div>
            ))}
          </div>

          {/* 週ごとの列 */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col mr-[2px]">
              {/* 月ラベル */}
              <div className="h-[18px] flex items-end pb-[2px]">
                <span className="text-[8px] text-gray-400 font-bold whitespace-nowrap">
                  {monthLabels[wi] ?? ''}
                </span>
              </div>
              {/* 7日分のセル */}
              {week.map((day, di) => {
                const count = day ? (activityMap.get(toKey(day)) ?? 0) : 0;
                const isEmpty = !day || day > new Date();
                return (
                  <div
                    key={di}
                    title={day ? `${toKey(day)}: ${count} 件` : ''}
                    className="w-[12px] h-[12px] rounded-[2px] mb-[2px] transition-colors"
                    style={{ backgroundColor: isEmpty ? 'transparent' : cellColor(count, themeColor) }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 凡例 */}
      <div className="flex items-center gap-1 mt-1 justify-end">
        <span className="text-[9px] text-gray-400 font-bold">少</span>
        {[0, 1, 2, 4].map(n => (
          <div
            key={n}
            className="w-[11px] h-[11px] rounded-[2px] border border-gray-200"
            style={{ backgroundColor: cellColor(n, themeColor) }}
          />
        ))}
        <span className="text-[9px] text-gray-400 font-bold">多</span>
      </div>
    </div>
  );
}
