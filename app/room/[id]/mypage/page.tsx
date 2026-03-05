'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BADGE_DEFINITIONS } from '@/lib/utils/badge';
import { xpProgress } from '@/lib/utils/xp';
import { UserAvatar } from '@/components/UserAvatar';
import type { User, Badge } from '@/types';

// Supabase Storage の "avatars" バケットを Public で作成してください
// Dashboard > Storage > New bucket > Name: avatars, Public: ON

const AVATARS = [
  '🦊', '🐻', '🐼', '🐨', '🦁', '🐯',
  '🐸', '🦋', '🦄', '🌟', '💫', '🎯',
  '🐉', '🦅', '🐬', '🌈', '⚡', '🔥',
  '❄️', '🌙', '☀️', '🎸', '🎮', '🐙',
];

type Tab = 'badges' | 'settings';

export default function MyPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('badges');

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) { router.replace('/login'); return; }
      const res = await fetch(`/api/users?room_id=${roomId}`);
      if (!res.ok) { router.replace(`/room/${roomId}/setup`); return; }
      const allUsers = await res.json();
      const me = Array.isArray(allUsers)
        ? allUsers.find((u: { auth_id: string }) => u.auth_id === authUser.id)
        : null;
      if (!me) { router.replace(`/room/${roomId}/setup`); return; }
      setUser(me);
      setName(me.name);
      setAvatar(me.avatar);
      const { data: badgeData } = await supabase.from('badges').select('*').eq('user_id', me.id);
      setBadges(badgeData || []);
      setLoading(false);
    });
  }, [roomId, router]);

  const acquiredMap = useMemo(() => {
    const map = new Map<string, Badge>();
    for (const b of badges) map.set(b.badge_type, b);
    return map;
  }, [badges]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    const preview = URL.createObjectURL(file);
    setAvatarFile(file);
    setAvatarPreview(preview);
    // ファイル選択時は絵文字選択を解除
    setAvatar('');
  }

  function clearFileSelection(restoreAvatar?: string) {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
    if (restoreAvatar !== undefined) setAvatar(restoreAvatar);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSave() {
    if (!user || !name.trim()) return;
    setSaving(true);
    setError('');

    let finalAvatar = avatar;

    if (avatarFile) {
      const supabase = createClient();
      const path = `${user.id}/avatar`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });

      if (uploadError) {
        setError('画像のアップロードに失敗しました: ' + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      // キャッシュバスティング用タイムスタンプを付与
      finalAvatar = `${urlData.publicUrl}?t=${Date.now()}`;
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarFile(null);
      setAvatarPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }

    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, name: name.trim(), avatar: finalAvatar }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUser(updated);
      setAvatar(updated.avatar);
      setSavedMsg('変更を保存しました！');
      setTimeout(() => setSavedMsg(''), 3000);
    } else {
      setError('保存に失敗しました');
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="h-36 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-12 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!user) return null;

  const { level, progress, needed } = xpProgress(user.xp);
  const pct = Math.min((progress / needed) * 100, 100);
  const acquiredCount = acquiredMap.size;
  const totalCount = BADGE_DEFINITIONS.length;
  const badgePct = totalCount > 0 ? Math.round((acquiredCount / totalCount) * 100) : 0;
  const hasChanges = name.trim() !== user.name || avatar !== user.avatar || avatarFile !== null;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold text-[#1A1A1A]">マイページ</h1>

      {/* プロフィールカード */}
      <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl border-[3px] border-[#2C2C2C] bg-[#FAFAFA] flex items-center justify-center text-4xl shadow-[3px_3px_0_#2C2C2C] flex-shrink-0 overflow-hidden">
            <UserAvatar avatar={user.avatar} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-extrabold text-[#1A1A1A] truncate">{user.name}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="px-3 py-1 bg-[#FFD700] text-[#1A1A1A] text-sm font-extrabold rounded-lg border-[2px] border-[#2C2C2C]">
                🏆 Lv.{level}
              </span>
              <span className="text-sm font-bold text-gray-500">{user.xp} XP</span>
              {user.streak_count > 0 && (
                <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs font-extrabold rounded-lg border-[2px] border-orange-300">
                  🔥 {user.streak_count}日連続
                </span>
              )}
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                <span>EXP</span><span>{progress} / {needed}</span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full border-[2px] border-[#2C2C2C] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-full transition-all duration-1000"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* タブ切替 */}
      <div className="flex gap-1.5 p-1.5 bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C]">
        {([['badges', '🏅 バッジ'], ['settings', '⚙️ アカウント設定']] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-extrabold rounded-xl transition-all ${
              tab === t
                ? 'bg-[#1A1A2E] text-white shadow-[0_2px_0_rgba(0,0,0,0.3)]'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── バッジタブ ── */}
      {tab === 'badges' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-4">
            <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
              <span>コレクション進捗</span>
              <span>{acquiredCount} / {totalCount}（{badgePct}%）</span>
            </div>
            <div className="h-5 bg-gray-200 rounded-full border-[2px] border-[#2C2C2C] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-full transition-all duration-1000"
                style={{ width: `${badgePct}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {BADGE_DEFINITIONS.map((def) => {
              const badge = acquiredMap.get(def.type);
              return (
                <div
                  key={def.type}
                  className={`p-4 rounded-2xl border-[3px] text-center transition-all ${
                    badge
                      ? 'bg-white border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] hover:shadow-[6px_6px_0_#2C2C2C] hover:-translate-y-0.5'
                      : 'bg-gray-100 border-gray-300 shadow-[2px_2px_0_#9ca3af] opacity-50'
                  }`}
                >
                  <span className={`text-4xl block ${badge ? '' : 'grayscale'}`}>{def.emoji}</span>
                  <p className={`mt-2 text-sm font-extrabold ${badge ? 'text-[#1A1A1A]' : 'text-gray-400'}`}>
                    {def.name}
                  </p>
                  <p className="mt-1 text-xs font-medium text-gray-500">{def.description}</p>
                  {badge
                    ? <p className="mt-2 text-xs font-bold text-[#009AC7]">{new Date(badge.acquired_at).toLocaleDateString('ja-JP')} 取得</p>
                    : <p className="mt-2 text-xs font-bold text-gray-400">未取得</p>
                  }
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 設定タブ ── */}
      {tab === 'settings' && (
        <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-6 space-y-6">
          {/* 名前 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">表示名</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={20}
              placeholder="表示名を入力"
              className="w-full px-4 py-3 bg-white border-[3px] border-[#2C2C2C] rounded-xl text-gray-800 font-medium text-sm focus:outline-none focus:border-[#4F46E5] transition-colors"
            />
            <p className="mt-1 text-xs text-gray-400">{name.length}/20</p>
          </div>

          {/* アバター */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">アバター</label>

            {/* 写真アップロード */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-[#FAFAFA] rounded-xl border-[2px] border-gray-200">
              <div className="w-16 h-16 rounded-xl border-[3px] border-[#2C2C2C] bg-white flex items-center justify-center text-3xl shadow-[2px_2px_0_#2C2C2C] flex-shrink-0 overflow-hidden">
                {avatarPreview
                  ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  : <UserAvatar avatar={avatar || user.avatar} />
                }
              </div>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-white border-[2px] border-[#2C2C2C] rounded-xl text-sm font-bold shadow-[0_2px_0_#2C2C2C] hover:shadow-[0_4px_0_#2C2C2C] hover:-translate-y-0.5 transition-all">
                  📷 写真を選ぶ
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                {avatarFile && (
                  <button
                    type="button"
                    onClick={() => clearFileSelection(user?.avatar ?? '')}
                    className="text-xs text-gray-400 font-bold hover:text-gray-600 text-left transition-colors"
                  >
                    写真を取り消す ✕
                  </button>
                )}
              </div>
            </div>

            {/* 絵文字グリッド */}
            <p className="text-xs font-bold text-gray-500 mb-2">または絵文字から選ぶ</p>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => clearFileSelection(a)}
                  className={`text-2xl p-2 rounded-xl transition-all border-[2px] ${
                    !avatarFile && avatar === a
                      ? 'bg-[#4F46E5]/10 border-[#4F46E5] scale-110 shadow-[0_2px_0_#4F46E5]'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* プレビュー */}
          <div className="flex items-center gap-3 p-4 bg-[#FAFAFA] rounded-xl border-[2px] border-gray-200">
            <div className="w-14 h-14 rounded-xl border-[3px] border-[#2C2C2C] bg-white flex items-center justify-center text-3xl shadow-[2px_2px_0_#2C2C2C] overflow-hidden">
              {avatarPreview
                ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                : <UserAvatar avatar={avatar || user.avatar} />
              }
            </div>
            <div>
              <p className="font-extrabold text-[#1A1A1A]">{name || '（名前を入力）'}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">プレビュー</p>
            </div>
          </div>

          {error && (
            <p className="text-[#E4000F] text-sm font-medium">{error}</p>
          )}
          {savedMsg && (
            <div className="p-3 bg-green-50 border-[2px] border-green-400 rounded-xl text-center text-green-700 font-bold text-sm">
              ✓ {savedMsg}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !hasChanges}
            className="w-full py-3 bg-[#1A1A2E] text-white font-extrabold text-base rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : hasChanges ? '変更を保存する' : '変更なし'}
          </button>
        </div>
      )}
    </div>
  );
}
