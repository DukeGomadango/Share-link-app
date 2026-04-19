import { ReactNode } from "react";

export default function ClaimLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden relative selection:bg-emerald-500/30">
      {/* アンビエント（環境光）エフェクト */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 max-w-md bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none -z-10" />
      
      <main className="w-full max-w-md w-full relative z-10 flex flex-col items-center">
        {children}
      </main>
    </div>
  );
}
