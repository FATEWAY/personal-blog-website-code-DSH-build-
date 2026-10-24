import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getSiteConfig } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = getSiteConfig();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        siteName={settings.siteName}
        brandLogoUrl={settings.brand.logoUrl}
        brandMark={settings.brand.mark}
        brandSubtitle={settings.brand.subtitle}
      />
      <main id="main" className="flex-1 pt-[var(--header-height)]">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
