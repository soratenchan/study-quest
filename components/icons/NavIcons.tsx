import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/** ダッシュ — ゲームコントローラー (インディゴ) */
export function IconDashboard({ size = 22, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      {/* 本体 */}
      <path
        d="M5 9h14c1.7 0 3 1.2 3.4 2.8l.4 3.2a2.2 2.2 0 0 1-2.2 2.5c-.9 0-1.7-.5-2.1-1.2L18 16H6l-.5.3c-.4.7-1.2 1.2-2.1 1.2A2.2 2.2 0 0 1 1.2 15L1.6 11.8C2 10.2 3.3 9 5 9z"
        stroke="#6366F1" strokeWidth="2" strokeLinejoin="round" fill="#6366F1" fillOpacity="0.15"
      />
      {/* 十字キー */}
      <rect x="7" y="11.5" width="4" height="1.8" rx="0.9" fill="#6366F1"/>
      <rect x="8.1" y="10.4" width="1.8" height="4" rx="0.9" fill="#6366F1"/>
      {/* ボタン A（ピンク） */}
      <circle cx="15.5" cy="11.5" r="1.3" fill="#EC4899"/>
      {/* ボタン B（黄緑） */}
      <circle cx="17.5" cy="13.5" r="1.3" fill="#22C55E"/>
      {/* スタートボタン */}
      <rect x="11" y="12.5" width="2" height="1.2" rx="0.6" fill="#6366F1" opacity="0.6"/>
    </svg>
  );
}

/** 目標 — 剣（上向き, ゴールド刀身・茶色グリップ） */
export function IconGoal({ size = 22, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      {/* 刃（シルバー） */}
      <path d="M12 2 L14 13 L12 15 L10 13 Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1"/>
      {/* 刃の光沢 */}
      <path d="M12 3 L12.8 10 L12 11" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.7"/>
      {/* 鍔（ゴールド） */}
      <path d="M7.5 13.5 L16.5 13.5 L15.5 15.5 L8.5 15.5 Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1"/>
      {/* グリップ（茶色） */}
      <rect x="11" y="15.5" width="2" height="5" rx="1" fill="#92400E"/>
      {/* 柄頭 */}
      <ellipse cx="12" cy="21" rx="2" ry="1.2" fill="#F59E0B" stroke="#D97706" strokeWidth="1"/>
    </svg>
  );
}

/** バディ — 2人のシルエット（エメラルド） */
export function IconBuddy({ size = 22, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      {/* 左キャラ・頭 */}
      <circle cx="8" cy="6.5" r="3" fill="#10B981"/>
      {/* 左キャラ・体 */}
      <path
        d="M2 20v-1.5A4.5 4.5 0 0 1 6.5 14h3A4.5 4.5 0 0 1 14 18.5V20"
        stroke="#10B981" strokeWidth="2.2" strokeLinecap="round"
      />
      {/* 右キャラ・頭（薄め） */}
      <circle cx="17" cy="6.5" r="2.5" fill="#6EE7B7"/>
      {/* 右キャラ・体（薄め） */}
      <path
        d="M14.5 20v-1A3.5 3.5 0 0 1 18 15.5h1.5A3.5 3.5 0 0 1 23 19v1"
        stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round"
      />
    </svg>
  );
}

/** ログ — 巻き物（オレンジ/アンバー） */
export function IconLog({ size = 22, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      {/* 巻き物本体 */}
      <rect x="5" y="4" width="14" height="16" rx="2" fill="#FED7AA" stroke="#F97316" strokeWidth="2"/>
      {/* 左のロール */}
      <path d="M5 4 Q3.5 4 3.5 6.5 Q3.5 9 5 9" stroke="#F97316" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M5 15 Q3.5 15 3.5 17.5 Q3.5 20 5 20" stroke="#F97316" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* テキスト行 */}
      <line x1="8.5" y1="9"  x2="15.5" y2="9"  stroke="#C2410C" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="8.5" y1="12" x2="15.5" y2="12" stroke="#C2410C" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="8.5" y1="15" x2="12.5" y2="15" stroke="#C2410C" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

/** コメント — RPGダイアログボックス（ブルー） */
export function IconComment({ size = 22, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      {/* 矩形ボックス */}
      <rect x="2" y="3" width="20" height="14" rx="2.5" fill="#BFDBFE" stroke="#3B82F6" strokeWidth="2"/>
      {/* 下向き三角 */}
      <path d="M9 17 L12 21.5 L15 17" fill="#3B82F6" stroke="#3B82F6" strokeWidth="1.5" strokeLinejoin="round"/>
      {/* テキスト行 */}
      <line x1="5.5" y1="8.5"  x2="18.5" y2="8.5"  stroke="#1D4ED8" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="5.5" y1="12.5" x2="14.5" y2="12.5" stroke="#1D4ED8" strokeWidth="1.8" strokeLinecap="round"/>
      {/* 点滅カーソル */}
      <rect x="15.5" y="11" width="2" height="3" rx="0.5" fill="#3B82F6"/>
    </svg>
  );
}

/** タイマー — 砂時計（バイオレット） */
export function IconTimer({ size = 22, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      {/* 上のバー */}
      <rect x="4" y="2" width="16" height="2.5" rx="1.2" fill="#7C3AED"/>
      {/* 下のバー */}
      <rect x="4" y="19.5" width="16" height="2.5" rx="1.2" fill="#7C3AED"/>
      {/* 上半分（残り砂）*/}
      <path d="M5.5 4.5 L12 12 L18.5 4.5 Z" fill="#DDD6FE" stroke="#8B5CF6" strokeWidth="1.5" strokeLinejoin="round"/>
      {/* 下半分（落ちた砂） */}
      <path d="M5.5 19.5 L12 12 L18.5 19.5 Z" fill="#8B5CF6" stroke="#7C3AED" strokeWidth="1.5" strokeLinejoin="round"/>
      {/* 落下中の砂つぶ */}
      <circle cx="12" cy="12.5" r="1.2" fill="#7C3AED"/>
    </svg>
  );
}

/** マイページ — 王冠（ゴールド） */
export function IconMyPage({ size = 22, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      {/* 王冠の基部 */}
      <rect x="3" y="16" width="18" height="3.5" rx="1.5" fill="#F59E0B"/>
      {/* 王冠の山形 */}
      <path
        d="M3 16 L3 9 L7.5 13 L12 5 L16.5 13 L21 9 L21 16 Z"
        fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round"
      />
      {/* 頂点の宝石（ルビー） */}
      <circle cx="12" cy="5" r="2" fill="#EF4444" stroke="#B91C1C" strokeWidth="1"/>
      {/* 左右の宝石（サファイア） */}
      <circle cx="3.5" cy="9.5" r="1.4" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="0.8"/>
      <circle cx="20.5" cy="9.5" r="1.4" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="0.8"/>
    </svg>
  );
}
