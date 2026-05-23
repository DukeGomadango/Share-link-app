/** 利用シーン（LP・/use-cases ページ・構造化データで共有） */
export const LP_USE_CASES = [
  {
    slug: "streaming-rewards",
    title: "配信・返礼品の配布",
    description:
      "イベント本番や定期配信の特典音声・画像を、キャンペーン単位で整理。受取人ごとに限定リンクを発行し、誤配布を防ぎます。",
    keywords: ["配信 特典", "返礼品", "IRIAM", "YouTube"],
  },
  {
    slug: "event-limited-files",
    title: "イベント限定データの配布",
    description:
      "オフラインイベントやコラボの資料 ZIP、壁紙パックなどを、参加者だけが取得できるリンクで配布できます。",
    keywords: ["限定配布", "イベント", "ZIP"],
  },
  {
    slug: "gacha-integration",
    title: "だんごツール連携",
    description:
      "ガチャ結果とファイル配布を連携。配布タブからだんごシェアリンクへつなぎ、当選者へのファイル届けを自動化しやすくします。",
    keywords: ["だんごツール", "ガチャ", "連携"],
  },
] as const;
