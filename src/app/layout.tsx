import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/lib/i18n";
import { GlobalScrollbarActivity } from "@/components/shared/GlobalScrollbarActivity";
import { Toaster } from "sonner";
import { GoogleAnalytics } from "@/components/seo/GoogleAnalytics";
import { getSiteUrl, SITE_CONFIG, siteOgImageUrl } from "@/lib/site";

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const defaultOgImage = siteOgImageUrl();

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_CONFIG.defaultTitle,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  applicationName: SITE_CONFIG.name,
  authors: [{ name: "Dukegomadango" }],
  creator: "Dukegomadango",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: SITE_CONFIG.name,
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    images: [defaultOgImage],
    creator: SITE_CONFIG.twitterCreator,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  ...(googleSiteVerification
    ? { verification: { google: googleSiteVerification } }
    : {}),
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
            <GoogleAnalytics />
            <GlobalScrollbarActivity />
            <Toaster richColors closeButton position="top-center" />
            <style dangerouslySetInnerHTML={{ __html: `
              body:has(.dashboard-root) dango-header {
                display: none !important;
              }
              body:not(:has(.dashboard-root)) header.sticky {
                display: none !important;
              }
              @media (min-width: 768px) {
                body:not(:has(.dashboard-root)) {
                  padding-top: 92px;
                }
              }
            `}} />
            <dango-header active-tool="share" portal-url={process.env.NODE_ENV === "production" ? "https://dango-portal.vercel.app" : "http://localhost:3000"}></dango-header>
            <Script src={process.env.NODE_ENV === "production" ? "https://dango-portal.vercel.app/dango-header.js" : "http://localhost:3000/dango-header.js"} strategy="afterInteractive" />
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
