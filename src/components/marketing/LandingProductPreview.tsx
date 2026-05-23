/** LP ヒーロー用の製品 UI モック（画像アセット不要・LCP 向けに軽量） */
export function LandingProductPreview() {
  return (
    <div
      className="relative mx-auto mt-12 max-w-4xl"
      aria-hidden
    >
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-primary/20 via-primary/5 to-transparent blur-2xl" />
      <div className="glass relative overflow-hidden rounded-2xl border border-border/80 shadow-2xl shadow-primary/10">
        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
          <span className="size-2.5 rounded-full bg-red-400/80" />
          <span className="size-2.5 rounded-full bg-amber-400/80" />
          <span className="size-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-2 text-xs text-muted-foreground">だんごシェアリンク — キャンペーン</span>
        </div>
        <div className="grid gap-0 md:grid-cols-[200px_1fr]">
          <aside className="hidden border-r border-border/60 bg-muted/20 p-4 md:block">
            <div className="space-y-2">
              {["ダッシュボード", "キャンペーン", "ライブラリ", "受取人"].map((label, i) => (
                <div
                  key={label}
                  className={`rounded-lg px-3 py-2 text-xs font-medium ${
                    i === 1 ? "bg-primary/15 text-primary" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>
          </aside>
          <div className="space-y-4 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">春の配信特典</p>
                <p className="text-lg font-semibold">返礼品キャンペーン</p>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-primary">
                配布中
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { name: "特典ボイス A", type: "audio" },
                { name: "サムネ画像", type: "image" },
                { name: "資料.zip", type: "zip" },
              ].map((file) => (
                <div
                  key={file.name}
                  className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3"
                >
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{file.type}</p>
                  <p className="mt-1 truncate text-sm font-medium">{file.name}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {["リスナー A", "リスナー B"].map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-3 py-2.5"
                >
                  <span className="text-sm font-medium">{name}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                    リンク発行済
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
