import type { Metadata } from "next";
import { getSiteUrl, SITE_CONFIG, siteOgImageUrl } from "@/lib/site";

type BuildPageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  /** true のとき title をそのまま使う（テンプレートを付けない） */
  absoluteTitle?: boolean;
};

export function buildPageMetadata({
  title,
  description,
  path,
  keywords,
  absoluteTitle = false,
}: BuildPageMetadataOptions): Metadata {
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${getSiteUrl()}${canonicalPath === "/" ? "" : canonicalPath}`;
  const ogImage = siteOgImageUrl();

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    keywords,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      locale: "ja_JP",
      url,
      title,
      description,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: SITE_CONFIG.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      creator: SITE_CONFIG.twitterCreator,
    },
  };
}
