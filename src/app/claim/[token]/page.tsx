"use client";

import { useState } from "react";
import { AudioPlayer } from "@/components/shared/AudioPlayer";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { CountdownBadge } from "@/components/shared/CountdownBadge";
import { Button } from "@/components/ui/button";
import { Gift, Fingerprint, Download, CheckSquare, Square, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// モックデータ: 受け取るファイルのリスト
const mockFiles = [
  {
    id: "f1",
    type: "image" as const,
    src: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=800&auto=format&fit=crop",
    filename: "special_photo_01.jpg",
    title: "Special Photo 01",
    watermarkText: "uid-fana-2026",
  },
  {
    id: "f2",
    type: "audio" as const,
    src: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg",
    filename: "secret_morning_voice.ogg",
    title: "Secret Morning Voice",
  },
];

export default function ClaimPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  
  // モック: 有効期限を3日後に設定
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 3);

  const handleAuth = () => {
    // パスキー（WebAuthn）認証のモック
    setTimeout(() => {
      setIsAuthenticated(true);
    }, 800);
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedFileIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedFileIds(newSelected);
  };

  const selectAll = () => {
    if (selectedFileIds.size === mockFiles.length) {
      setSelectedFileIds(new Set()); // すべて解除
    } else {
      setSelectedFileIds(new Set(mockFiles.map(f => f.id))); // すべて選択
    }
  };

  // 個別ダウンロードのモック
  const handleDownloadSingle = (fileId: string) => {
    const file = mockFiles.find(f => f.id === fileId);
    if (!file) return;
    
    // 実際のダウンロード処理の代わりにアラート（本番ではブラウザの機能やAPI経由でファイルを提供）
    console.log(`Downloading: ${file.filename}`);
    alert(`「${file.filename}」のダウンロードを開始します`);
  };

  // 選択・一括ダウンロードのモック
  const handleDownloadSelected = async () => {
    if (selectedFileIds.size === 0) {
      // 選択されていない場合は「すべてダウンロード」として振る舞う
      setSelectedFileIds(new Set(mockFiles.map(f => f.id)));
      
      // 状態の更新を待つために少し遅延
      setIsDownloading(true);
      setTimeout(() => {
        setIsDownloading(false);
        alert(`全 ${mockFiles.length} 件のファイルをZIPでダウンロードします`);
      }, 1000);
      return;
    }

    setIsDownloading(true);
    // モックのダウンロード処理（ZIPへの圧縮などを想定）
    setTimeout(() => {
      setIsDownloading(false);
      alert(`選択した ${selectedFileIds.size} 件のファイルをダウンロードします`);
    }, 1000);
  };

  // 1. 未認証フロー
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-10 animate-in fade-in duration-1000">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center ring-4 ring-emerald-500/20 shadow-[-0_0_60px_#10B98133]">
          <Fingerprint className="w-10 h-10 text-emerald-500" />
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight">Secure Content</h1>
          <p className="text-muted-foreground/80 max-w-[250px] mx-auto text-sm leading-relaxed">
            This gift is protected. Please verify your identity to access the contents.
          </p>
        </div>
        <Button 
          onClick={handleAuth} 
          className="rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white px-8 h-14 text-lg backdrop-blur-md shadow-[0_0_20px_oklch(0.645_0.165_158.452/0.2)] border border-emerald-500/50 transition-all hover:scale-105"
        >
          <Fingerprint className="w-5 h-5 mr-3" />
          Verify Identity
        </Button>
      </div>
    );
  }

  // 2. 開封前のワクワク演出フロー
  if (!isOpened) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12 animate-in zoom-in-95 duration-700">
        <div className="space-y-5 flex flex-col items-center">
          <CountdownBadge expiresAt={expiryDate} />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">
            You Received a Gift!
          </h1>
          <p className="text-muted-foreground/80 text-sm">From: Spring Voice Gacha 2026</p>
        </div>
        
        {/* 開封アニメーションボタン（Phase 6でリッチ化予定） */}
        <button 
          onClick={() => setIsOpened(true)}
          className="relative group focus:outline-none"
        >
          <div className="absolute -inset-6 bg-emerald-500/30 blur-2xl rounded-full group-hover:bg-emerald-500/40 transition duration-700" />
          <div className="relative w-44 h-44 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/50 transform transition-all duration-300 group-hover:scale-105 group-hover:-rotate-3 group-active:scale-95">
            <Gift className="w-20 h-20 text-white" strokeWidth={1.5} />
          </div>
          <p className="mt-8 text-sm font-bold tracking-[0.2em] text-emerald-500 uppercase animate-pulse">
            Tap to Open
          </p>
        </button>
      </div>
    );
  }

  // 3. コンテンツ閲覧フロー
  const allSelected = selectedFileIds.size === mockFiles.length && mockFiles.length > 0;
  
  return (
    <div className="w-full space-y-6 animate-in slide-in-from-bottom-12 fade-in duration-700 py-6 pb-32">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-3xl font-bold text-foreground">A special delivery</h2>
          <p className="text-emerald-500 text-sm mt-1.5 font-medium tracking-wide">CONFIDENTIAL</p>
        </div>
        <CountdownBadge expiresAt={expiryDate} />
      </div>

      <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {mockFiles.length} items
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={selectAll}
          className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
        >
          {allSelected ? (
            <><CheckSquare className="w-4 h-4 mr-2" /> Deselect All</>
          ) : (
            <><Square className="w-4 h-4 mr-2" /> Select All</>
          )}
        </Button>
      </div>

      <div className="space-y-10">
        {mockFiles.map((file) => {
          const isSelected = selectedFileIds.has(file.id);
          
          return (
            <div 
              key={file.id} 
              className={cn(
                "relative group rounded-3xl transition-all duration-300 p-2",
                isSelected 
                  ? "bg-emerald-500/10 ring-2 ring-emerald-500/50 shadow-[0_0_30px_#10B98122]" 
                  : "hover:bg-accent/50"
              )}
            >
              {/* 選択チェックボックス領域 */}
              <div 
                className="absolute -top-3 -left-3 z-20 cursor-pointer bg-background rounded-full p-0.5 shadow-sm"
                onClick={() => toggleSelection(file.id)}
              >
                {isSelected ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 fill-emerald-500/20" />
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center bg-background/50 backdrop-blur-sm group-hover:border-emerald-500/50 transition-colors" />
                )}
              </div>

              {/* 個別ダウンロードボタン */}
              <div className="absolute -top-3 -right-3 z-20">
                <Button
                  size="icon"
                  className="rounded-full shadow-lg bg-background border border-border text-foreground hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all hover:scale-110 h-10 w-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadSingle(file.id);
                  }}
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>

              {/* コンテンツ本体 */}
              <div className="pt-2">
                {file.type === "image" && (
                  <div className="space-y-3">
                    <ImageViewer src={file.src} watermarkText={file.watermarkText || "protected"} />
                    <p className="text-center text-sm font-medium text-muted-foreground">{file.title}</p>
                  </div>
                )}
                
                {file.type === "audio" && (
                  <AudioPlayer src={file.src} title={file.title || "Audio File"} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="pt-8 pb-4 text-center">
        <p className="text-xs text-muted-foreground/60">
          This link is unique to your device.<br/>If you lose access, please contact the sender.
        </p>
      </div>

      {/* フローティング アクションバー */}
      <div className="fixed bottom-6 left-0 right-0 px-4 z-50 animate-in slide-in-from-bottom-10 flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm glass rounded-full p-2 flex items-center justify-between border border-border shadow-2xl shadow-emerald-500/10">
          <div className="px-4 text-sm font-medium">
            {selectedFileIds.size > 0 ? (
              <span className="text-emerald-500">{selectedFileIds.size} Selected</span>
            ) : (
              <span className="text-muted-foreground">Download Complete Bundle</span>
            )}
          </div>
          <Button 
            onClick={handleDownloadSelected}
            disabled={isDownloading}
            className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 shadow-[0_0_15px_oklch(0.645_0.165_158.452/0.3)] transition-all hover:scale-105"
          >
            {isDownloading ? (
              <span className="animate-pulse">Preparing...</span>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {selectedFileIds.size === 0 ? "Save All" : "Save Selected"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
