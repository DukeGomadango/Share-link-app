import type { Metadata } from "next";

/** ログイン後・受取・API など、検索に載せないページ向け */
export const NOINDEX_METADATA: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};
