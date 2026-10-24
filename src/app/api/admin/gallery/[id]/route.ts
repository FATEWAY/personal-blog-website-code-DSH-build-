import { type NextRequest } from "next/server";
import { handleRoute, json, readJsonBody, requireAdminApi } from "@/lib/api";
import { deleteGalleryItem, getGalleryItem, updateGalleryItem } from "@/lib/db/gallery";
import { NotFoundError } from "@/lib/errors";
import { parseGalleryInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext): Promise<Response> {
  return handleRoute(async () => {
    await requireAdminApi(request);
    const { id } = await params;
    const item = getGalleryItem(id);
    if (!item) throw new NotFoundError("照片不存在");
    return json({ item });
  });
}

export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<Response> {
  return handleRoute(async () => {
    await requireAdminApi(request);
    const { id } = await params;
    const input = parseGalleryInput(await readJsonBody(request));
    return json({ item: updateGalleryItem(id, input) });
  });
}

export async function DELETE(request: NextRequest, { params }: RouteContext): Promise<Response> {
  return handleRoute(async () => {
    await requireAdminApi(request);
    const { id } = await params;
    deleteGalleryItem(id);
    return json({ ok: true, id });
  });
}
