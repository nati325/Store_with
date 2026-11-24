import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
export const MIME_BY_EXT: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };
export const MAX_BYTES = 5 * 1024 * 1024;

/** שומר תמונה שהועלתה ומחזיר את הכתובת הציבורית שלה. זורק שגיאה בעברית אם הקובץ לא תקין. */
export async function saveImage(file: File): Promise<string> {
  const ext = EXT[file.type];
  if (!ext) throw new Error("סוג קובץ לא נתמך (JPG, PNG, WEBP או GIF בלבד)");
  if (file.size > MAX_BYTES) throw new Error("הקובץ גדול מדי (עד 5MB)");
  const buf = Buffer.from(await file.arrayBuffer());
  const sig = buf.subarray(0, 12).toString("latin1");
  const okSig = (ext === "jpg" && buf[0] === 0xff && buf[1] === 0xd8) || (ext === "png" && sig.startsWith("\x89PNG")) || (ext === "gif" && sig.startsWith("GIF8")) || (ext === "webp" && sig.startsWith("RIFF") && sig.slice(8, 12) === "WEBP");
  if (!okSig) throw new Error("תוכן הקובץ אינו תמונה תקינה");
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomBytes(12).toString("hex")}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), buf);
  return `/api/uploads/${name}`;
}
