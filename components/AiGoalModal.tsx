'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const MAX_DAILY = 5;
const DAILY_KEY = 'aiGoalDaily';

function getDailyCount(): number {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw);
    if (date !== new Date().toISOString().split('T')[0]) return 0;
    return count as number;
  } catch {
    return 0;
  }
}

function incrementDailyCount() {
  const count = getDailyCount() + 1;
  localStorage.setItem(DAILY_KEY, JSON.stringify({
    date: new Date().toISOString().split('T')[0],
    count,
  }));
}

const EXAMPLES = ['英語学習', 'プログラミング', '健康・運動', '資格取得', '読書', '貯金'];

const TYPE_LABEL: Record<string, string> = {
  yearly: '年間',
  monthly: '月次',
  weekly: '週次',
};
const TYPE_COLOR: Record<string, string> = {
  yearly: 'bg-amber-100 text-amber-700 border-amber-300',
  monthly: 'bg-blue-100 text-blue-700 border-blue-300',
  weekly: 'bg-green-100 text-green-700 border-green-300',
};

interface AiTask {
  title: string;
  type: 'yearly' | 'monthly' | 'weekly';
}

interface GeneratedGoal {
  title: string;
  description: string;
  tasks: AiTask[];
}

interface Props {
  roomId: string;
  userId: string;
  year: number;
  onClose: () => void;
  onCreated: () => void;
}

type Step = 'input' | 'generating' | 'preview';

export function AiGoalModal({ roomId, userId, year, onClose, onCreated }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('input');
  const [prompt, setPrompt] = useState('');
  const [streamText, setStreamText] = useState('');
  const [generated, setGenerated] = useState<GeneratedGoal | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTasks, setEditTasks] = useState<AiTask[]>([]);
  const [dailyCount, setDailyCount] = useState(getDailyCount);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dailyRemaining = MAX_DAILY - dailyCount;

  async function generate(userPrompt: string) {
    if (getDailyCount() >= MAX_DAILY) {
      setError('本日の生成上限（5回）に達しました。明日またお試しください。');
      return;
    }
    setStep('generating');
    setStreamText('');
    setError('');
    incrementDailyCount();
    setDailyCount(getDailyCount());

    try {
      const res = await fetch('/api/ai/goal-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt }),
      });

      if (!res.ok || !res.body) throw new Error('生成に失敗しました');

      const reader = res.body.getReader();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += new TextDecoder().decode(value);
        setStreamText(accumulated);
      }

      // JSON を抽出してパース
      const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('生成結果を読み取れませんでした');
      const parsed: GeneratedGoal = JSON.parse(jsonMatch[0]);

      setGenerated(parsed);
      setEditTitle(parsed.title);
      setEditDescription(parsed.description);
      setEditTasks(parsed.tasks);
      setStep('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成中にエラーが発生しました');
      setStep('input');
    }
  }

  function handleRegenerate() {
    if (dailyRemaining <= 0) return;
    generate(prompt);
  }

  function updateTaskTitle(index: number, value: string) {
    setEditTasks((prev) => prev.map((t, i) => (i === index ? { ...t, title: value } : t)));
  }

  function updateTaskType(index: number, value: AiTask['type']) {
    setEditTasks((prev) => prev.map((t, i) => (i === index ? { ...t, type: value } : t)));
  }

  function removeTask(index: number) {
    setEditTasks((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreate() {
    if (!editTitle.trim() || editTasks.length === 0) return;
    setSaving(true);
    setError('');

    try {
      // 1. 目標を作成
      const goalRes = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          year,
          is_public: true,
        }),
      });

      if (!goalRes.ok) throw new Error('目標の作成に失敗しました');
      const goal = await goalRes.json();

      // 2. タスクを順次作成
      for (const task of editTasks) {
        if (!task.title.trim()) continue;
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goal_id: goal.id,
            title: task.title.trim(),
            type: task.type,
          }),
        });
      }

      onCreated();
      onClose();
      router.push(`/room/${roomId}/goals/${goal.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 pb-20 md:pb-4 bg-black/60">
      <div className="w-full max-w-lg bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[8px_8px_0_#2C2C2C] overflow-hidden max-h-[90vh] flex flex-col">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1A1A2E] border-b-[3px] border-[#2C2C2C] flex-shrink-0">
          <div>
            <p className="text-[10px] font-bold text-[#FFD700] tracking-widest uppercase">AI Assistant</p>
            <h2 className="text-base font-extrabold text-white leading-tight">
              {step === 'input' && 'AIで目標を作成'}
              {step === 'generating' && '✨ 目標を生成中...'}
              {step === 'preview' && '提案を確認・編集'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white font-extrabold text-lg transition-colors"
          >
            ×
          </button>
        </div>

        {/* ── STEP 1: 入力 ── */}
        {step === 'input' && (
          <div className="p-6 space-y-5 overflow-y-auto">
            <div>
              <label className="block text-sm font-extrabold text-[#1A1A1A] mb-2">
                やりたいことを教えてください
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="例: 英語を話せるようになりたい、プログラミングでアプリを作りたい..."
                rows={4}
                maxLength={200}
                className="w-full px-4 py-3 bg-white border-[3px] border-[#2C2C2C] rounded-xl text-[#1A1A1A] font-medium text-sm focus:outline-none focus:border-[#4F46E5] transition-colors resize-none"
              />
              <p className="text-xs text-gray-400 font-medium mt-1 text-right">{prompt.length}/200</p>
            </div>

            {/* サジェスト */}
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">例から選ぶ</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setPrompt(ex + 'を上達させたい')}
                    className="px-3 py-1.5 bg-[#FAFAFA] border-[2px] border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:border-[#4F46E5] hover:text-[#4F46E5] hover:bg-[#4F46E5]/5 transition-all"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm font-bold text-[#E4000F] bg-red-50 border-[2px] border-red-200 rounded-xl p-3">
                ⚠ {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-white text-[#1A1A1A] font-extrabold text-sm rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_3px_0_#2C2C2C] hover:shadow-[0_5px_0_#2C2C2C] hover:-translate-y-0.5 transition-all"
              >
                キャンセル
              </button>
              <button
                onClick={() => generate(prompt)}
                disabled={!prompt.trim() || dailyRemaining <= 0}
                className="flex-[2] py-3 bg-[#4F46E5] text-white font-extrabold text-sm rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ✨ 生成する（残り{dailyRemaining}回）
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: 生成中 ── */}
        {step === 'generating' && (
          <div className="p-8 flex flex-col items-center justify-center gap-6 min-h-[280px]">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-[4px] border-[#4F46E5]/20 animate-ping" />
              <div className="absolute inset-0 rounded-full border-[4px] border-t-[#4F46E5] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">✨</div>
            </div>
            <div className="text-center">
              <p className="font-extrabold text-[#1A1A1A]">目標を生成しています...</p>
              <p className="text-xs text-gray-400 font-medium mt-1">AIがあなたに合った目標とタスクを考えています</p>
            </div>
            {streamText && (
              <div className="w-full p-3 bg-[#FAFAFA] rounded-xl border-[2px] border-gray-200 font-mono text-xs text-gray-500 max-h-32 overflow-y-auto">
                {streamText}
                <span className="inline-block w-1.5 h-3.5 bg-[#4F46E5] ml-0.5 animate-pulse align-middle" />
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: プレビュー・編集 ── */}
        {step === 'preview' && generated && (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* 目標タイトル */}
              <div>
                <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wide mb-1.5">
                  目標タイトル
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={40}
                  className="w-full px-4 py-3 bg-white border-[3px] border-[#2C2C2C] rounded-xl text-[#1A1A1A] font-extrabold text-sm focus:outline-none focus:border-[#4F46E5] transition-colors"
                />
              </div>

              {/* 説明 */}
              <div>
                <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wide mb-1.5">
                  説明
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  maxLength={100}
                  className="w-full px-4 py-3 bg-white border-[3px] border-[#2C2C2C] rounded-xl text-[#1A1A1A] font-medium text-sm focus:outline-none focus:border-[#4F46E5] transition-colors resize-none"
                />
              </div>

              {/* タスク一覧 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">
                    タスク ({editTasks.length}件)
                  </label>
                  <span className="text-xs text-gray-400 font-medium">タイトルや種別を編集できます</span>
                </div>
                <div className="space-y-2">
                  {editTasks.map((task, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 bg-[#FAFAFA] rounded-xl border-[2px] border-gray-200">
                      <select
                        value={task.type}
                        onChange={(e) => updateTaskType(i, e.target.value as AiTask['type'])}
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-lg border-[2px] cursor-pointer flex-shrink-0 ${TYPE_COLOR[task.type]}`}
                      >
                        {(['yearly', 'monthly', 'weekly'] as const).map((t) => (
                          <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => updateTaskTitle(i, e.target.value)}
                        maxLength={30}
                        className="flex-1 bg-transparent text-sm font-bold text-[#1A1A1A] focus:outline-none min-w-0"
                      />
                      <button
                        onClick={() => removeTask(i)}
                        className="text-gray-300 hover:text-[#E4000F] transition-colors flex-shrink-0 text-sm font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm font-bold text-[#E4000F] bg-red-50 border-[2px] border-red-200 rounded-xl p-3">
                  ⚠ {error}
                </p>
              )}
            </div>

            {/* フッター */}
            <div className="flex-shrink-0 p-4 border-t-[2px] border-gray-100 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={handleRegenerate}
                  disabled={dailyRemaining <= 0}
                  className="flex-1 py-2.5 bg-white text-[#1A1A1A] font-extrabold text-sm rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_3px_0_#2C2C2C] hover:shadow-[0_5px_0_#2C2C2C] hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  🔄 再生成（残り{dailyRemaining}回）
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving || !editTitle.trim() || editTasks.length === 0}
                  className="flex-[2] py-2.5 bg-[#4F46E5] text-white font-extrabold text-sm rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? '作成中...' : 'この目標で作成する 🎯'}
                </button>
              </div>
              <button
                onClick={() => setStep('input')}
                className="w-full text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors py-1"
              >
                ← 入力に戻る
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
