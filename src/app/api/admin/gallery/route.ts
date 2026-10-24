import { type NextRequest } from "next/server";
import { handleRoute, json, readJsonBody, requireAdminApi } from "@/lib/api";
import { createGalleryItem, listAllGallery } from "@/lib/db/gallery";
import { parseGalleryInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  return handleRoute(async () => {
    await requireAdminApi(request);
    return json({ items: listAllGallery() });
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  return handleRoute(async () => {
    await requireAdminApi(request);
    const input = parseGalleryInput(await readJsonBody(request));
    const item = createGalleryItem(input);
    return json({ item }, 201);
  });
}
