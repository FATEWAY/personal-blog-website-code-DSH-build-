import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { config } from "@/lib/config";
import { getSiteConfig } from "@/lib/site-data";

const themeScript = `(function(){try{var root=document.documentElement;var stored=localStorage.getItem("fw-theme");var dark=stored?stored==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;root.classList.toggle("dark",dark);root.style.colorScheme=dark?"dark":"light";root.classList.add("js");}catch(e){document.documentElement.classList.add("js");}})();`;

export function generateMetadata(): Metadata {
  const settings = getSiteConfig();
  const title = `${settings.siteName} — ${settings.tagline}`;

  return {
    metadataBase: new URL(config.siteUrl),
    title: {
      default: title,
      template: `%s · ${settings.siteName}`,
    },
    description: settings.description,
    applicationName: settings.siteName,
    alternates: {
      types: { "application/rss+xml": "/rss.xml" },
    },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      url: "/",
      siteName: settings.siteName,
      title,
      description: settings.description,
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: `${settings.siteName} — ${settings.tagline}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: settings.description,
      images: ["/og.png"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e0f" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-bg text-ink antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
