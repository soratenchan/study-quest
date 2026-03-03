'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Phase = 'work' | 'shortBreak' | 'longBreak';

const PHASE_CONFIG: Record<Phase, { label: string; color: string; emoji: string }> = {
  work:       { label: '集中',   color: '#E4000F', emoji: '⚔️' },
  shortBreak: { label: '小休憩', color: '#009AC7', emoji: '☕' },
  longBreak:  { label: '長休憩', color: '#22c55e', emoji: '🌿' },
};

const DEFAULT_SETTINGS = { work: 25, shortBreak: 5, longBreak: 15 };

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // AudioContext unavailable
  }
}

export default function TimerPage() {
  const params = useParams();
  const roomId = params.id as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('work');
  const [seconds, setSeconds] = useState(DEFAULT_SETTINGS.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef(phase);
  const sessionsRef = useRef(sessions);
  const settingsRef = useRef(settings);
  phaseRef.current = phase;
  sessionsRef.current = sessions;
  settingsRef.current = settings;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) return;
      const res = await fetch(`/api/users?room_id=${roomId}`);
      if (!res.ok) return;
      const users = await res.json();
      const me = (users as { auth_id: string; id: string }[]).find(u => u.auth_id === authUser.id);
      if (me) setUserId(me.id);
    });
  }, [roomId]);

  const handleSessionComplete = useCallback(() => {
    setIsRunning(false);
    beep();

    const cur = phaseRef.current;
    const s = settingsRef.current;

    if (cur === 'work') {
      const newSessions = sessionsRef.current + 1;
      setSessions(newSessions);
      if (newSessions % 4 === 0) {
        setPhase('longBreak');
        setSeconds(s.longBreak * 60);
      } else {
        setPhase('shortBreak');
        setSeconds(s.shortBreak * 60);
      }
      setShowSaveModal(true);
    } else {
      setPhase('work');
      setSeconds(s.work * 60);
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            handleSessionComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, handleSessionComplete]);

  function switchPhase(next: Phase) {
    setIsRunning(false);
    setPhase(next);
    const dur = next === 'work' ? settings.work : next === 'shortBreak' ? settings.shortBreak : settings.longBreak;
    setSeconds(dur * 60);
  }

  function reset() {
    setIsRunning(false);
    const dur = phase === 'work' ? settings.work : phase === 'shortBreak' ? settings.shortBreak : settings.longBreak;
    setSeconds(dur * 60);
  }

  async function handleSaveLog() {
    if (!userId || !memo.trim()) return;
    setSaving(true);
    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: roomId, user_id: userId, memo: memo.trim() }),
    });
    if (res.ok) {
      setSavedMsg('ログを保存しました！');
      setTimeout(() => setSavedMsg(''), 3000);
    }
    setSaving(false);
    setShowSaveModal(false);
    setMemo('');
  }

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
            <span
              className="text-5xl font-extrabold text-[#1A1A1A] tabular-nums"
            >
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
          {([
            ['work', '集中'],
            ['shortBreak', '小休憩'],
            ['longBreak', '長休憩'],
          ] as [keyof typeof settings, string][]).map(([key, lbl]) => (
            <div key={key}>
              <label className="block text-xs font-bold text-gray-500 mb-1">{lbl}</label>
              <input
                type="number"
                min={1} max={60}
                value={settings[key]}
                onChange={e => {
                  const val = Math.max(1, Math.min(60, Number(e.target.value)));
                  setSettings(s => ({ ...s, [key]: val }));
                  if (phase === key && !isRunning) setSeconds(val * 60);
                }}
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

      {/* ログ保存モーダル */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[8px_8px_0_#2C2C2C] p-6 w-full max-w-sm">
            <div className="text-center mb-5">
              <span className="text-5xl">🎉</span>
              <h3 className="mt-2 text-lg font-extrabold text-gray-800">集中セッション完了！</h3>
              <p className="text-sm text-gray-500 mt-1">学習ログを記録しますか？</p>
            </div>
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="今日の学習内容（例：英単語50個）"
              rows={3}
              className="w-full px-3 py-2 border-[3px] border-[#2C2C2C] rounded-xl text-sm font-medium focus:outline-none focus:border-[#E4000F] resize-none"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setShowSaveModal(false); setMemo(''); }}
                className="flex-1 py-2.5 bg-white text-gray-600 font-extrabold text-sm rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_3px_0_#2C2C2C] active:shadow-[0_1px_0_#2C2C2C] active:translate-y-0.5 transition-all"
              >
                スキップ
              </button>
              <button
                onClick={handleSaveLog}
                disabled={saving || !memo.trim()}
                className="flex-1 py-2.5 bg-[#E4000F] text-white font-extrabold text-sm rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_3px_0_#2C2C2C] hover:shadow-[0_5px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_1px_0_#2C2C2C] active:translate-y-0.5 transition-all disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
