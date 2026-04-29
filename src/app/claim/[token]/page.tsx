"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClaimAuthView } from "@/components/features/claim/ClaimAuthView";
import { ClaimUnopenedView } from "@/components/features/claim/ClaimUnopenedView";
import { ClaimContentView } from "@/components/features/claim/ClaimContentView";
import { mockClaimFiles } from "@/components/features/claim/types";

// 共通のページ遷移バリアント（Calm UI: 控えめだが心地よい遷移）
const pageVariants = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  enter: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const, // easeOutQuint - 滑らかな減速
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -8,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 1, 1] as const, // easeInQuad - 控えめな加速
    },
  },
};

// 開封時の特別なバリアント（「プレゼントの箱を開ける」感覚）
const unboxVariants = {
  initial: { opacity: 0, scale: 0.9, rotateX: -8 },
  enter: {
    opacity: 1,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as const,
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    scale: 1.05,
    y: -20,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 1, 1] as const,
    },
  },
};

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

  // 現在のフェーズキーを計算（AnimatePresence 用）
  const phaseKey = !isAuthenticated ? "auth" : !isOpened ? "unopened" : "content";

  return (
    <AnimatePresence mode="wait">
      {/* 1. 未認証フロー */}
      {phaseKey === "auth" && (
        <motion.div
          key="auth"
          variants={pageVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          className="w-full"
        >
          <ClaimAuthView onVerify={handleAuth} />
        </motion.div>
      )}

      {/* 2. 開封前のワクワク演出フロー */}
      {phaseKey === "unopened" && (
        <motion.div
          key="unopened"
          variants={pageVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          className="w-full"
        >
          <ClaimUnopenedView
            onOpen={() => setIsOpened(true)}
            expiryDate={expiryDate}
          />
        </motion.div>
      )}

      {/* 3. コンテンツ閲覧フロー（開封アニメーション） */}
      {phaseKey === "content" && (
        <motion.div
          key="content"
          variants={unboxVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          className="w-full"
          style={{ perspective: "1200px" }}
        >
          <ClaimContentView
            files={mockClaimFiles}
            expiryDate={expiryDate}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
