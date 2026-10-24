import { type NextRequest } from "next/server";
import { handleRoute, json, readJsonBody, requireAdminApi } from "@/lib/api";
import { loadSiteSettings, saveSiteSettings } from "@/lib/db/settings";
import { parseSiteSettingsInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  return handleRoute(async () => {
    await requireAdminApi(request);
    return json({ settings: loadSiteSettings() });
  });
}

export async function PATCH(request: NextRequest): Promise<Response> {
  return handleRoute(async () => {
    await requireAdminApi(request);
    const settings = parseSiteSettingsInput(await readJsonBody(request));
    const saved = saveSiteSettings(settings);
    return json({ settings: saved });
  });
}
