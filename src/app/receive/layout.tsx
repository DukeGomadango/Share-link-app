import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo/noindex";

export const metadata: Metadata = NOINDEX_METADATA;

export default function ReceiveLayout({ children }: { children: React.ReactNode }) {
  return <div className="no-dango-header min-h-screen flex flex-col">{children}</div>;
}
