"use client";

import { useEffect, useState } from "react";

export function MSWProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    async function enableMocking() {
      // 開発環境＆モック有効時のみ起動
      if (
        process.env.NODE_ENV !== "development" ||
        process.env.NEXT_PUBLIC_API_MOCKING !== "enabled"
      ) {
        setMswReady(true);
        return;
      }

      // クライアント側（ブラウザ）のワーカーを動的インポート
      const { worker } = await import("@/mocks/browser");
      await worker.start({
        onUnhandledRequest: "bypass",
      });
      setMswReady(true);
    }

    enableMocking();
  }, []);

  // MSWの準備ができるまでレンダリングを遅延するか、そのままレンダリングするか
  // モックデータが必要なコンポーネントが即座にFetchを走らせることを考慮し、準備完了を待つ
  if (!mswReady) {
    return null;
  }

  return <>{children}</>;
}
