import { type NextRequest } from "next/server";
import { handleRoute, json, readJsonBody, requireAdminApi } from "@/lib/api";
import { deletePost, getAdminPost, updatePost } from "@/lib/db/posts";
import { NotFoundError } from "@/lib/errors";
import { asRecord, parsePostInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext): Promise<Response> {
  return handleRoute(async () => {
    await requireAdminApi(request);
    const { id } = await params;
    const post = getAdminPost(id);
    if (!post) throw new NotFoundError("文章不存在");
    return json({ post });
  });
}

export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<Response> {
  return handleRoute(async () => {
    await requireAdminApi(request);
    const { id } = await params;
    const body = await readJsonBody(request);
    const input = parsePostInput(body);
    const record = asRecord(body);
    const expectedUpdatedAt =
      typeof record.expectedUpdatedAt === "string" ? record.expectedUpdatedAt : null;

    const result = updatePost(id, input, expectedUpdatedAt);
    return json({ post: result.post });
  });
}

export async function DELETE(request: NextRequest, { params }: RouteContext): Promise<Response> {
  return handleRoute(async () => {
    await requireAdminApi(request);
    const { id } = await params;
    deletePost(id);
    return json({ ok: true, id });
  });
}
