import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/auth/current";
import { config } from "@/lib/config";
import { getSiteConfig } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireAdminPage();
  const settings = getSiteConfig();

  return (
    <AdminShell
      admin={auth.admin}
      csrfToken={auth.session.csrfToken}
      adminPath={config.adminPath}
      sessionExpiresAt={auth.session.expiresAt}
      siteName={settings.siteName}
      brandLogoUrl={settings.brand.logoUrl}
      brandMark={settings.brand.mark}
      profileName={settings.profile.name}
      avatarUrl={settings.avatarUrl}
    >
      {children}
    </AdminShell>
  );
}
