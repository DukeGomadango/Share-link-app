import Link from "next/link";

/** campaignId 不明の `/claim` 直アクセス用（チェックイン後は `/claim/session/[campaignId]` へ遷移） */
export default function ClaimRootPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-8 text-center space-y-4">
      <p className="text-muted-foreground text-sm max-w-md">
        受け取りは、ライバーから共有された受付ページの URL からチェックインしてください。チェックイン後、自動的に正しい受け取り画面へ移動します。
      </p>
      <Link href="/" className="text-sm text-emerald-600 hover:underline">
        トップへ
      </Link>
    </div>
  );
}
