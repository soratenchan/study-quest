/* eslint-disable @next/next/no-img-element */
/**
 * 絵文字文字列と画像 URL の両方を扱う汎用アバター表示コンポーネント。
 * 親要素のサイズ・テキストサイズで表示を制御してください。
 */
export function UserAvatar({ avatar }: { avatar: string }) {
  const isUrl = /^https?:\/\//.test(avatar) || avatar.startsWith('blob:') || avatar.startsWith('data:');
  if (isUrl) {
    return <img src={avatar} alt="avatar" className="w-full h-full object-cover" />;
  }
  return <>{avatar}</>;
}
