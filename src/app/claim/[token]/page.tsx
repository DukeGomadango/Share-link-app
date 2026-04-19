"use client";

import { useState } from "react";
import { AudioPlayer } from "@/components/shared/AudioPlayer";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { CountdownBadge } from "@/components/shared/CountdownBadge";
import { Button } from "@/components/ui/button";
import { Gift, Fingerprint } from "lucide-react";

export default function ClaimPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  
  // モック: 有効期限を3日後に設定
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 3);

  const handleAuth = () => {
    // パスキー（WebAuthn）認証のモック
    setTimeout(() => {
      setIsAuthenticated(true);
    }, 800);
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
  return (
    <div className="w-full space-y-8 animate-in slide-in-from-bottom-12 fade-in duration-700 py-8">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-foreground">A special delivery</h2>
          <p className="text-emerald-500 text-sm mt-1.5 font-medium tracking-wide">CONFIDENTIAL</p>
        </div>
        <CountdownBadge expiresAt={expiryDate} />
      </div>

      <div className="space-y-10">
        {/* 画像コンテンツ */}
        <ImageViewer 
          src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=800&auto=format&fit=crop" 
          watermarkText="uid-fana-2026" 
        />
        
        {/* 音声コンテンツ */}
        <AudioPlayer 
          src="https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg"  // モック音声
          title="Secret Morning Voice" 
        />
      </div>
      
      <div className="pt-8 pb-4 text-center">
        <p className="text-xs text-muted-foreground/60">
          This link is unique to your device.<br/>If you lose access, please contact the sender.
        </p>
      </div>
    </div>
  );
}
