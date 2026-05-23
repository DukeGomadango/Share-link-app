import { redirect } from "next/navigation";
import { LandingPage } from "@/components/marketing/LandingPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { SITE_CONFIG } from "@/lib/site";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = buildPageMetadata({
  title: SITE_CONFIG.defaultTitle,
  description: SITE_CONFIG.lpDescription,
  path: "/",
  absoluteTitle: true,
  keywords: [
    "だんごシェアリンク",
    "ファイル共有",
    "配信 特典 配布",
    "IRIAM 特典",
    "YouTube 配信 特典",
    "限定リンク",
    "配信者 ファイル配布",
    "クリエイター 配布",
    "だんごツール",
    "返礼品 配布",
    "特典 音声 配布",
  ],
});

export default async function HomePage() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/dashboard");
    }
  } catch {
    /* ローカル未設定時は LP を表示 */
  }

  return (
    <>
      <JsonLd variant="home" />
      <LandingPage />
    </>
  );
}
