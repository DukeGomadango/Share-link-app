"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Image as ImageIcon, FolderArchive, ArrowRight, Check, Copy, Link as LinkIcon, User, Sparkles } from "lucide-react";

interface BurstParticle {
  id: number;
  x: number;
  y: number;
  endX: number;
  endY: number;
  color: string;
  size: number;
}

const EMERALD_BURST_COLORS = [
  "oklch(0.645 0.165 158.452)", // Emerald
  "oklch(0.75 0.12 165.0)",     // Mint
  "oklch(0.8 0.1 170.0)",      // Aqua
  "oklch(0.9 0.08 160.0)",     // Light green
  "oklch(0.55 0.14 150.0)"     // Forest emerald
];

export function InteractiveTransferConsole() {
  const [draggedFile, setDraggedFile] = useState<string | null>(null);
  const [transferLogs, setTransferLogs] = useState<Array<{ id: string; name: string; file: string; url: string; copied: boolean }>>([]);
  const [particles, setParticles] = useState<BurstParticle[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);

  const files = [
    { id: "file-mp3", name: "感謝ボイス_01.mp3", type: "audio", icon: Music, size: "12.4 MB" },
    { id: "file-png", name: "配信限定イラスト.png", type: "image", icon: ImageIcon, size: "4.8 MB" },
    { id: "file-zip", name: "記念ボイスパック.zip", type: "archive", icon: FolderArchive, size: "82.1 MB" },
  ];

  const listeners = [
    { id: "user-a", name: "リスナー A (IRIAM)", platform: "IRIAM" },
    { id: "user-b", name: "リスナー B (YouTube)", platform: "YouTube" },
    { id: "user-c", name: "リスナー C (X/Twitter)", platform: "X" },
  ];

  // パーティクル演出の発火
  const triggerBurst = useCallback((x: number, y: number) => {
    const newParticles: BurstParticle[] = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const distance = 50 + Math.random() * 70;
      const endX = Math.cos(angle) * distance;
      const endY = Math.sin(angle) * distance;

      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        endX,
        endY,
        color: EMERALD_BURST_COLORS[i % EMERALD_BURST_COLORS.length]!,
        size: 3 + Math.random() * 4,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  }, []);

  const handleDragStart = (fileName: string) => {
    setDraggedFile(fileName);
  };

  const handleDrop = (e: React.DragEvent, listenerName: string) => {
    e.preventDefault();
    if (!draggedFile) return;

    // クリック位置（ドロップ位置）の相対座標の取得
    if (consoleRef.current) {
      const rect = consoleRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      triggerBurst(x, y);
    }

    // ダミーの専用限定URLを生成
    const countVal = particleIdRef.current++;
    const uniqueId = `LINK-${1000 + countVal}`;
    const url = `https://dango.share/claim/${uniqueId}`;

    setTransferLogs((prev) => [
      {
        id: uniqueId,
        name: listenerName,
        file: draggedFile,
        url,
        copied: false,
      },
      ...prev.slice(0, 2), // 最大3件表示
    ]);

    setDraggedFile(null);
  };

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setTransferLogs((prev) =>
      prev.map((log) => (log.id === id ? { ...log, copied: true } : log))
    );
    setTimeout(() => {
      setTransferLogs((prev) =>
        prev.map((log) => (log.id === id ? { ...log, copied: false } : log))
      );
    }, 2000);
  };

  return (
    <div
      ref={consoleRef}
      className="relative w-full max-w-4xl mx-auto rounded-3xl border border-border/80 bg-background/40 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-primary/10 overflow-hidden"
    >
      {/* 背景のエメラルドオーブ */}
      <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-primary/8 blur-3xl pointer-events-none" />

      {/* パーティクルレイヤー */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, x: p.x, y: p.y, scale: 1 }}
              animate={{ opacity: 0, x: p.x + p.endX, y: p.y + p.endY, scale: 0.2 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              onAnimationComplete={() => setParticles((prev) => prev.filter((part) => part.id !== p.id))}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                background: p.color,
                boxShadow: `0 0 8px ${p.color}, 0 0 16px ${p.color}50`,
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* タイトルエリア */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-5 mb-6">
        <div>
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] block mb-1">
            Playable Mock Experience
          </span>
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            だんごリンク生成シミュレーター
          </h3>
        </div>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          ファイルをドラッグしてリスナーにドロップ。本人専用の請求リンクが発行されるプロセスを即座に体験できます。
        </p>
      </div>

      {/* メイングローパネル */}
      <div className="grid gap-6 md:grid-cols-12 relative z-10">
        {/* 左カラム: 配布用ファイルライブラリ */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              1. ファイルをドラッグ
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {files.map((file) => {
              const Icon = file.icon;
              return (
                <div
                  key={file.id}
                  draggable
                  onDragStart={() => handleDragStart(file.name)}
                  className="flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-background/60 hover:bg-primary/5 hover:border-primary/40 active:scale-98 transition-all duration-200 cursor-grab active:cursor-grabbing select-none shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-all duration-200">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{file.name}</p>
                      <p className="text-[11px] text-muted-foreground">{file.size}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 中央矢印 */}
        <div className="hidden md:flex md:col-span-1 items-center justify-center">
          <ArrowRight className="size-6 text-muted-foreground/40 animate-pulse" />
        </div>

        {/* 右カラム: 受取人（リスナー）ドロップエリア */}
        <div className="md:col-span-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              2. リスナーカードにドロップ
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {listeners.map((user) => (
              <div
                key={user.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, user.name)}
                className="flex items-center justify-between p-5 rounded-2xl border-2 border-dashed border-border/80 bg-background/20 hover:bg-primary/5 hover:border-primary/50 transition-all duration-200 min-h-[82px] group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all duration-200">
                    <User className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{user.name}</p>
                    <p className="text-[11px] text-muted-foreground">{user.platform} 配信リスナー</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground/60 border border-muted-foreground/20 rounded-full px-2 py-0.5 group-hover:border-primary/45 group-hover:text-primary transition-all duration-200">
                  DROP HERE
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 限定URL発行ログパネル（最下部） */}
      <AnimatePresence>
        {transferLogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-8 border-t border-border/40 pt-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="size-4 text-primary animate-pulse" />
              <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                本人専用の受け取りリンクが生成されました
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {transferLogs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-[#f8faf9]/50 dark:bg-muted/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <LinkIcon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {log.name} への配布URL
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">{log.file}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-medium text-primary bg-primary/10 rounded-lg px-2.5 py-1">
                      {log.url}
                    </span>
                    <button
                      onClick={() => handleCopy(log.id, log.url)}
                      className={`flex size-8 items-center justify-center rounded-lg border transition-all duration-200 ${
                        log.copied
                          ? "bg-primary border-primary text-white"
                          : "bg-background border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {log.copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
