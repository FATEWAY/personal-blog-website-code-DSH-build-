import { type NextRequest } from "next/server";
import { handleRoute, json, readJsonBody, requireAdminApi } from "@/lib/api";
import { createPost, listAdminPosts } from "@/lib/db/posts";
import type { PostStatus } from "@/lib/types";
import { parsePostInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  return handleRoute(async () => {
    await requireAdminApi(request);

    const params = request.nextUrl.searchParams;
    const statusRaw = params.get("status") ?? "all";
    const status: PostStatus | "all" =
      statusRaw === "draft" || statusRaw === "published" ? statusRaw : "all";
    const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);

    const result = listAdminPosts({
      query: params.get("query") ?? "",
      status,
      page,
      pageSize: 50,
    });

    return json(result);
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  return handleRoute(async () => {
    await requireAdminApi(request);
    const input = parsePostInput(await readJsonBody(request));
    const post = createPost(input);
    return json({ post }, 201);
  });
}
