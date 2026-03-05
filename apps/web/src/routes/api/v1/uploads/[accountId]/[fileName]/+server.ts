import type { RequestHandler } from "./$types";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { error } from "@sveltejs/kit";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".json": "application/json",
  ".zip": "application/zip",
};

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) error(401, "Unauthorized");

  const { accountId, fileName } = params;

  // Basic path traversal protection
  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    error(400, "Invalid file name");
  }

  const filePath = join(UPLOAD_DIR, accountId, fileName);

  try {
    const data = await readFile(filePath);
    const ext = "." + (fileName.split(".").pop() ?? "");
    const contentType = MIME_MAP[ext.toLowerCase()] || "application/octet-stream";

    return new Response(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    error(404, "File not found");
  }
};
