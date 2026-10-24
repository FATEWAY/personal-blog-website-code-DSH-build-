import fs from "node:fs/promises";
import path from "node:path";
import { config } from "@/lib/config";

const MIME_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".avif": "image/avif",
};

function notFound(): Response {
  return new Response("Not Found", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path: segments } = await params;

  if (!Array.isArray(segments) || segments.length === 0 || segments.length > 8) {
    return notFound();
  }

  const isSafe = segments.every(
    (segment) =>
      segment.length > 0 &&
      segment.length <= 128 &&
      /^[a-zA-Z0-9._-]+$/.test(segment) &&
      segment !== "." &&
      segment !== "..",
  );
  if (!isSafe) return notFound();

  const extension = path.extname(segments[segments.length - 1]).toLowerCase();
  const contentType = MIME_TYPES[extension];
  if (!contentType) return notFound();

  const root = path.resolve(config.uploadDir);
  const target = path.resolve(root, ...segments);
  if (!target.startsWith(`${root}${path.sep}`)) return notFound();

  try {
    const stat = await fs.stat(target);
    if (!stat.isFile()) return notFound();

    const file = await fs.readFile(target);
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(stat.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; img-src 'self'",
      },
    });
  } catch {
    return notFound();
  }
}
