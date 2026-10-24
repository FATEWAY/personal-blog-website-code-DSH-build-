import { NextResponse, type NextRequest } from "next/server";
import { json } from "@/lib/api";
import { searchPublished } from "@/lib/db/posts";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const query = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
    if (!query) {
      return json(
        { results: [] },
        200,
        { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" },
      );
    }

    const posts = searchPublished(query, 6);
    return NextResponse.json(
      {
        results: posts.map((post) => ({
          slug: post.slug,
          title: post.title,
          summary: post.summary,
          publishedAt: post.publishedAt,
          category: post.category?.name ?? null,
        })),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    console.error("[search] failed", error);
    return json({ error: { message: "搜索暂时不可用" } }, 503);
  }
}
