import { $ } from "bun";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync, unlinkSync, existsSync } from "node:fs";
import type { ImageBlock } from "../api/chat.js";

export async function getClipboardImage(): Promise<ImageBlock | null> {
  if (process.platform !== "darwin") return null;

  const tmpPath = join(tmpdir(), `ntrp-clip-${Date.now()}.png`);
  try {
    await $`osascript -e 'set imageData to the clipboard as "PNGf"' -e 'set fileRef to open for access POSIX file "${tmpPath}" with write permission' -e 'set eof fileRef to 0' -e 'write imageData to fileRef' -e 'close access fileRef'`
      .nothrow()
      .quiet();

    if (!existsSync(tmpPath)) return null;

    const buf = readFileSync(tmpPath);
    if (buf.length === 0) return null;

    return { media_type: "image/png", data: buf.toString("base64") };
  } catch {
    return null;
  } finally {
    try { unlinkSync(tmpPath); } catch {}
  }
}
