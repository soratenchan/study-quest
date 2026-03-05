'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

export type Phase = 'work' | 'shortBreak' | 'longBreak';

export const PHASE_CONFIG: Record<Phase, { label: string; color: string; emoji: string }> = {
  work:       { label: '集中',   color: '#4F46E5', emoji: '⚔️' },
  shortBreak: { label: '小休憩', color: '#009AC7', emoji: '☕' },
  longBreak:  { label: '長休憩', color: '#22c55e', emoji: '🌿' },
};

export const DEFAULT_SETTINGS = { work: 25, shortBreak: 5, longBreak: 15 };

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

interface TimerContextValue {
  phase: Phase;
  seconds: number;
  isRunning: boolean;
  sessions: number;
  settings: typeof DEFAULT_SETTINGS;
  showSaveModal: boolean;
  memo: string;
  saving: boolean;
  savedMsg: string;
  setIsRunning: (v: boolean | ((prev: boolean) => boolean)) => void;
  switchPhase: (p: Phase) => void;
  reset: () => void;
  updateSettings: (key: keyof typeof DEFAULT_SETTINGS, val: number) => void;
  setMemo: (v: string) => void;
  handleSaveLog: () => Promise<void>;
  skipSave: () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({
  children,
  roomId,
  userId,
}: {
  children: React.ReactNode;
  roomId: string;
  userId?: string;
}) {
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

  function updateSettings(key: keyof typeof DEFAULT_SETTINGS, val: number) {
    const clamped = Math.max(1, Math.min(60, val));
    setSettings(s => ({ ...s, [key]: clamped }));
    if (phase === key && !isRunning) setSeconds(clamped * 60);
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

  function skipSave() {
    setShowSaveModal(false);
    setMemo('');
  }

  return (
    <TimerContext.Provider value={{
      phase, seconds, isRunning, sessions, settings,
      showSaveModal, memo, saving, savedMsg,
      setIsRunning, switchPhase, reset, updateSettings,
      setMemo, handleSaveLog, skipSave,
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within TimerProvider');
  return ctx;
}
