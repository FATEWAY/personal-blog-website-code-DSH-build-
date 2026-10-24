import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { type NextRequest } from "next/server";
import { handleRoute, json, requireAdminApi } from "@/lib/api";
import { config } from "@/lib/config";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const MAX_INPUT_PIXELS = 40_000_000;
const MAX_OUTPUT_BYTES = 10 * 1024 * 1024;

type ImageFormat = "jpeg" | "png" | "webp";

function detectImageType(buffer: Buffer): ImageFormat | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }
  const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(pngMagic)) {
    return "png";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export async function POST(request: NextRequest): Promise<Response> {
  return handleRoute(async () => {
    await requireAdminApi(request);

    const maxMb = Math.round(config.maxUploadBytes / (1024 * 1024));
    const declaredLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(declaredLength) && declaredLength > config.maxUploadBytes + 1024 * 1024) {
      throw new AppError(413, `图片不能超过 ${maxMb} MB`, "FILE_TOO_LARGE");
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new AppError(400, "上传内容格式不正确", "INVALID_FORM_DATA");
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new AppError(400, "请选择要上传的图片", "NO_FILE");
    }
    if (file.size === 0) {
      throw new AppError(400, "文件内容为空", "EMPTY_FILE");
    }
    if (file.size > config.maxUploadBytes) {
      throw new AppError(413, `图片不能超过 ${maxMb} MB`, "FILE_TOO_LARGE");
    }

    const input = Buffer.from(await file.arrayBuffer());
    if (input.length > config.maxUploadBytes) {
      throw new AppError(413, `图片不能超过 ${maxMb} MB`, "FILE_TOO_LARGE");
    }

    const detected = detectImageType(input);
    if (!detected) {
      throw new AppError(415, "仅支持 JPEG、PNG、WebP 格式的图片", "UNSUPPORTED_TYPE");
    }

    let output: Buffer;
    let width = 0;
    let height = 0;

    try {
      const metadata = await sharp(input, {
        failOn: "error",
        limitInputPixels: MAX_INPUT_PIXELS,
      }).metadata();

      if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) {
        throw new Error("Unexpected image format");
      }
      if (!metadata.width || !metadata.height) {
        throw new Error("Image has no dimensions");
      }

      const processed = await sharp(input, {
        failOn: "error",
        limitInputPixels: MAX_INPUT_PIXELS,
      })
        .rotate()
        .resize({ width: 2400, withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer({ resolveWithObject: true });

      output = processed.data;
      width = processed.info.width;
      height = processed.info.height;
    } catch (error) {
      console.error("[upload] image processing failed:", error);
      throw new AppError(415, "无法处理这张图片，请确认文件未损坏", "IMAGE_INVALID");
    }

    if (output.length > MAX_OUTPUT_BYTES) {
      throw new AppError(413, "处理后的图片仍然过大，请压缩后重试", "FILE_TOO_LARGE");
    }

    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const directory = path.join(config.uploadDir, year, month);
    await fs.mkdir(directory, { recursive: true });

    const filename = `${randomUUID()}.webp`;
    await fs.writeFile(path.join(directory, filename), output, { flag: "wx", mode: 0o644 });

    return json(
      {
        url: `/media/${year}/${month}/${filename}`,
        width,
        height,
        bytes: output.length,
      },
      201,
    );
  });
}
