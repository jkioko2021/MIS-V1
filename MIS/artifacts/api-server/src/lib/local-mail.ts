import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { OutboundEmail } from "./business-notifications";
import { localDataDirectory } from "./local-runtime";

/** Private development outbox; no emails or OTP codes are logged or sent externally. */
export async function captureLocalEmail(email: OutboundEmail): Promise<void> {
  const directory = path.join(localDataDirectory(), "mail");
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const id = createHash("sha256").update(email.idempotencyKey).digest("hex");
  try {
    await writeFile(path.join(directory, `${id}.json`),
      JSON.stringify({ ...email, capturedAt: new Date().toISOString() }, null, 2),
      { flag: "wx", mode: 0o600 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
}
