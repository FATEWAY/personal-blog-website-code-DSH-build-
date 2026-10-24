import { type NextRequest } from "next/server";
import { handleRoute, json, readJsonBody, requireAdminApi } from "@/lib/api";
import { setPostStatus } from "@/lib/db/posts";
import { ValidationError, asRecord } from "@/lib/validation";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<Response> {
  return handleRoute(async () => {
    await requireAdminApi(request);
    const { id } = await params;
    const body = asRecord(await readJsonBody(request));
    const status = body.status;

    if (status !== "draft" && status !== "published") {
      throw new ValidationError({ status: "文章状态不合法" });
    }

    const post = setPostStatus(id, status);
    return json({ post });
  });
}
