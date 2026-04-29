import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { MSWProvider } from "@/components/msw-provider";
import { I18nProvider } from "@/lib/i18n";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "だんごシェアリンク | 安全で、美しい。次世代のファイル共有",
  description: "直感的な操作で、大切なデータを誰とでもシームレスに共有しよう。だんごシェアリンクは、安全性と美しさを兼ね備えた次世代のファイル共有サービスです。",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "だんごシェアリンク",
    description: "安全で、美しい。次世代のファイル共有",
    url: "https://share.dango.app", // 仮のURL、必要に応じて変更してください
    siteName: "だんごシェアリンク",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "だんごシェアリンク",
    description: "安全で、美しい。次世代のファイル共有",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased min-h-screen flex flex-col bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <MSWProvider>
              {children}
            </MSWProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
