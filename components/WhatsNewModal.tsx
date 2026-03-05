'use client';

import { useEffect, useState } from 'react';

// ── バージョンを変えるとユーザーに再表示されます ──
const CURRENT_VERSION = '1.1.0';

const UPDATES: { emoji: string; title: string; desc: string }[] = [
  { emoji: '📅', title: '習慣ヒートマップ', desc: 'ダッシュボードで18週分のアクティビティを確認できます' },
  { emoji: '🎴', title: 'スタンプ応援', desc: 'スタンプがカラフルなゲームカード風にリニューアル' },
  { emoji: '🎮', title: 'ゲーム風アイコン', desc: 'ナビゲーションに独自デザインのアイコンを追加' },
  { emoji: '🏆', title: 'マイページ', desc: 'バッジコレクションとアカウント設定が1か所に' },
  { emoji: '⚔️', title: 'タイマー改善', desc: '起動中はどのページでもミニタイマーが表示されます' },
];

export function WhatsNewModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('whatsNewVersion') !== CURRENT_VERSION) {
      setOpen(true);
    }
  }, []);

  function close() {
    localStorage.setItem('whatsNewVersion', CURRENT_VERSION);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-[60] px-4 pb-20 md:pb-0"
      onClick={close}
    >
      <div
        className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[8px_8px_0_#2C2C2C] w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="bg-[#1A1A2E] px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#FFD700] tracking-widest uppercase">
              Version {CURRENT_VERSION}
            </p>
            <h2 className="text-white font-extrabold text-lg leading-tight">
              アップデート情報 🎉
            </h2>
          </div>
          <button
            onClick={close}
            className="text-gray-400 hover:text-white text-xl font-bold leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 更新内容リスト */}
        <div className="p-5 space-y-2.5">
          {UPDATES.map((u) => (
            <div
              key={u.title}
              className="flex items-start gap-3 p-3 bg-[#FAFAFA] rounded-xl border-[2px] border-gray-200"
            >
              <span className="text-2xl flex-shrink-0 leading-none">{u.emoji}</span>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-[#1A1A1A]">{u.title}</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5">{u.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* フッターボタン */}
        <div className="px-5 pb-5">
          <button
            onClick={close}
            className="w-full py-3 bg-[#FFD700] text-[#1A1A1A] font-extrabold text-sm rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5 transition-all"
          >
            はじめる！
          </button>
        </div>
      </div>
    </div>
  );
}
