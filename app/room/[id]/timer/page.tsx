'use client';

import { useTimer, PHASE_CONFIG, DEFAULT_SETTINGS } from '@/contexts/TimerContext';
import type { Phase } from '@/contexts/TimerContext';

export default function TimerPage() {
  const {
    phase, seconds, isRunning, sessions, settings, savedMsg,
    setIsRunning, switchPhase, reset, updateSettings,
  } = useTimer();

  const totalSec = (phase === 'work' ? settings.work : phase === 'shortBreak' ? settings.shortBreak : settings.longBreak) * 60;
  const progress = totalSec > 0 ? (totalSec - seconds) / totalSec : 0;
  const R = 88;
  const circ = 2 * Math.PI * R;
  const dashOffset = circ * (1 - progress);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const { color, label } = PHASE_CONFIG[phase];

  return (
    <div className="space-y-5 max-w-md mx-auto">

      {/* フェーズ切替 */}
      <div className="flex gap-1.5 p-1.5 bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C]">
        {(Object.keys(PHASE_CONFIG) as Phase[]).map(p => (
          <button
            key={p}
            onClick={() => switchPhase(p)}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
              phase === p ? 'text-white shadow-[0_2px_0_rgba(0,0,0,0.25)]' : 'text-gray-500 hover:bg-gray-50'
            }`}
            style={phase === p ? { backgroundColor: PHASE_CONFIG[p].color } : {}}
          >
            {PHASE_CONFIG[p].emoji} {PHASE_CONFIG[p].label}
          </button>
        ))}
      </div>

      {/* タイマー本体 */}
      <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-8 flex flex-col items-center">
        {/* 円形プログレス */}
        <div className="relative w-56 h-56">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r={R} fill="none" stroke="#f3f4f6" strokeWidth="14" />
            <circle
              cx="100" cy="100" r={R}
              fill="none"
              stroke={color}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={dashOffset}
              style={{ transition: isRunning ? 'stroke-dashoffset 1s linear' : 'none' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-extrabold text-[#1A1A1A] tabular-nums">
              {mm}:{ss}
            </span>
            <span className="text-sm font-extrabold mt-1" style={{ color }}>{label}</span>
          </div>
        </div>

        {/* セッションインジケーター */}
        <div className="flex gap-2 mt-5">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="w-3 h-3 rounded-full border-[2px] border-[#2C2C2C] transition-all"
              style={{ backgroundColor: (sessions % 4) >= i ? color : '#e5e7eb' }}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 font-bold mt-1">
          {sessions} セッション完了
        </p>

        {/* コントロール */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={reset}
            className="w-12 h-12 flex items-center justify-center bg-white text-gray-600 font-extrabold text-lg rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5 transition-all"
            title="リセット"
          >
            ↺
          </button>
          <button
            onClick={() => setIsRunning(r => !r)}
            className="flex-1 py-3 text-white font-extrabold text-base rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5 transition-all"
            style={{ backgroundColor: color }}
          >
            {isRunning ? '⏸ 一時停止' : '▶ スタート'}
          </button>
        </div>
      </div>

      {/* 時間設定 */}
      <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-5">
        <h3 className="font-extrabold text-gray-700 text-sm mb-4">⚙️ 時間設定（分）</h3>
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(DEFAULT_SETTINGS) as (keyof typeof DEFAULT_SETTINGS)[]).map(key => (
            <div key={key}>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                {PHASE_CONFIG[key].label}
              </label>
              <input
                type="number"
                min={1} max={60}
                value={settings[key]}
                onChange={e => updateSettings(key, Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border-[3px] border-[#2C2C2C] rounded-xl text-sm font-extrabold text-center focus:outline-none focus:border-[#E4000F] transition-colors"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 保存成功メッセージ */}
      {savedMsg && (
        <div className="p-3 bg-green-50 border-[2px] border-green-400 rounded-xl text-center text-green-700 font-bold text-sm">
          ✓ {savedMsg}
        </div>
      )}
    </div>
  );
}
