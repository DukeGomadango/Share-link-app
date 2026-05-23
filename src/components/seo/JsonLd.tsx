import { getSiteUrl, SITE_CONFIG, siteOgImageUrl } from "@/lib/site";
import { LP_FAQ } from "@/lib/seo/lp-faq";

type JsonLdProps = {
  variant: "home";
};

export function JsonLd({ variant }: JsonLdProps) {
  if (variant !== "home") return null;

  const siteUrl = getSiteUrl();
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const appId = `${siteUrl}/#software`;

  const graph = [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: "Dukegomadango",
      url: siteUrl,
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: siteUrl,
      name: SITE_CONFIG.name,
      description: SITE_CONFIG.lpDescription,
      publisher: { "@id": organizationId },
      inLanguage: "ja-JP",
    },
    {
      "@type": "SoftwareApplication",
      "@id": appId,
      name: SITE_CONFIG.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: siteUrl,
      description: SITE_CONFIG.lpDescription,
      image: siteOgImageUrl(),
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "JPY",
        description: "無料プランあり（容量・保存期間に制限あり）",
      },
      featureList: [
        "キャンペーン単位のファイル配布",
        "受取人ごとの限定リンク",
        "ライブラリ・受取人管理",
        "だんごツール連携",
        "パスキー対応",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: LP_FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": graph,
        }),
      }}
    />
  );
}
