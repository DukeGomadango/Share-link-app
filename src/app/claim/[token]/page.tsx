"use client";

import { useState } from "react";
import { ClaimAuthView } from "@/components/features/claim/ClaimAuthView";
import { ClaimUnopenedView } from "@/components/features/claim/ClaimUnopenedView";
import { ClaimContentView } from "@/components/features/claim/ClaimContentView";
import { mockClaimFiles } from "@/components/features/claim/types";

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
    return <ClaimAuthView onVerify={handleAuth} />;
  }

  // 2. 開封前のワクワク演出フロー
  if (!isOpened) {
    return (
      <ClaimUnopenedView 
        onOpen={() => setIsOpened(true)} 
        expiryDate={expiryDate} 
      />
    );
  }

  // 3. コンテンツ閲覧フロー
  return (
    <ClaimContentView 
      files={mockClaimFiles} 
      expiryDate={expiryDate} 
    />
  );
}
