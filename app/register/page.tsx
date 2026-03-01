'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (authError) {
        throw authError;
      }

      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '登録に失敗しました');
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 text-6xl opacity-10 select-none">⭐</div>
          <div className="absolute top-1/4 right-8 text-5xl opacity-10 select-none">🎮</div>
          <div className="absolute bottom-20 left-1/4 text-7xl opacity-10 select-none">⚔️</div>
          <div className="absolute bottom-10 right-10 text-5xl opacity-10 select-none">🏆</div>
        </div>

        <div className="relative w-full max-w-md">
          <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-8 text-center">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-3">
              確認メールを送信しました
            </h2>
            <p className="text-gray-600 text-sm mb-2">
              <span className="font-bold text-gray-800">{email}</span> に確認メールを送りました。
            </p>
            <p className="text-gray-600 text-sm mb-6">
              メール内のリンクをクリックして登録を完了してください。
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-[#E4000F] text-white font-extrabold text-base rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5 transition-all"
            >
              ログインページへ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center px-4 relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl opacity-10 select-none">⭐</div>
        <div className="absolute top-1/4 right-8 text-5xl opacity-10 select-none">🎮</div>
        <div className="absolute bottom-20 left-1/4 text-7xl opacity-10 select-none">⚔️</div>
        <div className="absolute bottom-10 right-10 text-5xl opacity-10 select-none">🏆</div>
      </div>

      <div className="relative w-full max-w-md">
        {/* ロゴ */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <span className="text-5xl">⚔️</span>
            <p className="mt-2 text-2xl font-extrabold text-white">StudyQuest</p>
          </Link>
        </div>

        {/* カード */}
        <div className="bg-white rounded-2xl border-[3px] border-[#2C2C2C] shadow-[4px_4px_0_#2C2C2C] p-8">
          <h1 className="text-2xl font-extrabold text-gray-800 mb-6 text-center">
            🌟 アカウント登録
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@email.com"
                className="w-full px-4 py-3 bg-white border-[3px] border-[#2C2C2C] rounded-xl text-gray-800 font-medium text-sm focus:outline-none focus:border-[#E4000F] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-1">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="8文字以上で入力"
                className="w-full px-4 py-3 bg-white border-[3px] border-[#2C2C2C] rounded-xl text-gray-800 font-medium text-sm focus:outline-none focus:border-[#E4000F] transition-colors"
              />
              <p className="mt-1 text-xs text-gray-500">8文字以上で設定してください</p>
            </div>

            {error && (
              <p className="text-[#E4000F] text-sm font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full px-6 py-3 bg-[#E4000F] text-white font-extrabold text-base rounded-xl border-[3px] border-[#2C2C2C] shadow-[0_4px_0_#2C2C2C] hover:shadow-[0_6px_0_#2C2C2C] hover:-translate-y-0.5 active:shadow-[0_2px_0_#2C2C2C] active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  登録中...
                </span>
              ) : (
                '登録する'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              すでにアカウントをお持ちの方は{' '}
              <Link href="/login" className="text-[#E4000F] font-bold hover:underline">
                ログイン
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
