import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/settings-form";
import { config } from "@/lib/config";
import { loadSiteSettings } from "@/lib/db/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "站点设置",
};

export default function AdminSettingsPage() {
  const settings = loadSiteSettings();

  return (
    <SettingsForm
      initial={settings}
      maxMb={Math.round(config.maxUploadBytes / (1024 * 1024))}
    />
  );
}
