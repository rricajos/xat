import { mkdir, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

function getFileType(mimeType: string): number {
  if (mimeType.startsWith("image/")) return 0; // IMAGE
  if (mimeType.startsWith("audio/")) return 1; // AUDIO
  if (mimeType.startsWith("video/")) return 2; // VIDEO
  return 3; // FILE
}

export async function saveFile(
  accountId: number,
  file: File,
): Promise<{
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileType: number;
  publicUrl: string;
}> {
  const dir = join(UPLOAD_DIR, String(accountId));
  await mkdir(dir, { recursive: true });

  const ext = extname(file.name) || "";
  const uniqueName = `${randomUUID()}${ext}`;
  const storagePath = join(dir, uniqueName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(storagePath, buffer);

  return {
    storagePath,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    fileSize: file.size,
    fileType: getFileType(file.type),
    publicUrl: `/api/v1/uploads/${accountId}/${uniqueName}`,
  };
}
