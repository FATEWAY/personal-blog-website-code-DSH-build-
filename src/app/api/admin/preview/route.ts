import { type NextRequest } from "next/server";
import { handleRoute, json, readJsonBody, requireAdminApi } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { renderMarkdown } from "@/lib/markdown/render";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  return handleRoute(async () => {
    await requireAdminApi(request);
    const body = (await readJsonBody(request)) as { content?: unknown };
    const content = typeof body.content === "string" ? body.content : "";

    if (content.length > 200_000) {
      throw new AppError(413, "正文过长，无法预览", "CONTENT_TOO_LARGE");
    }

    const rendered = await renderMarkdown(content);
    return json({ html: rendered.html, headings: rendered.headings });
  });
}
