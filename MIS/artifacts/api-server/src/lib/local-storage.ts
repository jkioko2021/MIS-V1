import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Router, type Request, type Response } from "express";
import { requireAuth } from "./auth-middleware";
import { isLocalRuntime, localDataDirectory } from "./local-runtime";
import { ObjectNotFoundError } from "./objectStorage";

export const LOCAL_UPLOAD_LIMIT = 25 * 1024 * 1024;
type Ticket = { id: string; username: string; size: number; contentType: string; expires: number };
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const root = () => path.join(localDataDirectory(), "documents");
const signature = (value: string) => createHmac("sha256", process.env.SESSION_SECRET!).update(value).digest("base64url");

export function createLocalUpload(username: string, size: number, contentType: string) {
  if (!username || !Number.isSafeInteger(size) || size <= 0 || size > LOCAL_UPLOAD_LIMIT) {
    throw new Error("Local uploads must contain between 1 byte and 25 MiB.");
  }
  const ticket: Ticket = { id: randomUUID(), username, size, contentType, expires: Date.now() + 900_000 };
  const encoded = Buffer.from(JSON.stringify(ticket)).toString("base64url");
  return `/api/storage/local-upload/${encoded}.${signature(encoded)}`;
}

export function parseLocalTicket(value: string): Ticket {
  const [encoded, supplied, extra] = value.split(".");
  if (!encoded || !supplied || extra || value.length > 4096) throw new Error("Invalid upload ticket.");
  const expected = Buffer.from(signature(encoded));
  const actual = Buffer.from(supplied);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error("Invalid upload ticket.");
  const ticket = JSON.parse(Buffer.from(encoded, "base64url").toString()) as Ticket;
  if (!idPattern.test(ticket.id) || !Number.isSafeInteger(ticket.size) || ticket.size <= 0
    || ticket.size > LOCAL_UPLOAD_LIMIT || typeof ticket.username !== "string"
    || typeof ticket.contentType !== "string" || !Number.isFinite(ticket.expires)
    || ticket.expires <= Date.now()) throw new Error("Invalid or expired upload ticket.");
  return ticket;
}

export class LocalObjectFile {
  constructor(readonly id: string) {
    if (!idPattern.test(id)) throw new ObjectNotFoundError();
  }
  async getMetadata(): Promise<[{ size: string; contentType: string }]> {
    try {
      const [info, metadata] = await Promise.all([
        stat(path.join(root(), this.id)),
        readFile(path.join(root(), `${this.id}.json`), "utf8"),
      ]);
      const parsed = JSON.parse(metadata) as { size: number; contentType: string };
      if (!info.isFile() || info.size !== parsed.size) throw new Error("Incomplete object.");
      return [{ size: String(info.size), contentType: parsed.contentType }];
    } catch { throw new ObjectNotFoundError(); }
  }
  async download(): Promise<globalThis.Response> {
    const [metadata] = await this.getMetadata();
    const body = Readable.toWeb(createReadStream(path.join(root(), this.id))) as ReadableStream;
    return new globalThis.Response(body, { headers: {
      "Content-Type": metadata.contentType, "Content-Length": metadata.size,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
  }
}

/** Mounted before JSON parsing because a JSON document is still a raw file upload. */
export const localUploadRouter = Router();
localUploadRouter.put("/storage/local-upload/:ticket", requireAuth, async (req: Request, res: Response) => {
  if (!isLocalRuntime()) { res.sendStatus(404); return; }
  let ticket: Ticket;
  try { ticket = parseLocalTicket(String(req.params.ticket)); }
  catch { res.status(400).json({ error: "Invalid or expired upload ticket." }); return; }
  if (ticket.username !== req.user?.username) { res.sendStatus(403); return; }
  if (req.headers["content-type"] !== ticket.contentType) {
    res.status(400).json({ error: "The upload content type does not match its ticket." }); return;
  }
  await mkdir(root(), { recursive: true, mode: 0o700 });
  const destination = path.join(root(), ticket.id);
  // Acquire ownership of this path before streaming. A replay cannot overwrite it.
  let ownsFile = false;
  try {
    await writeFile(destination, "", { flag: "wx", mode: 0o600 });
    ownsFile = true;
    let bytes = 0;
    const limiter = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        bytes += chunk.length;
        callback(bytes > ticket.size ? new Error("Upload too large.") : null, chunk);
      },
    });
    await pipeline(req, limiter, createWriteStream(destination, { flags: "r+" }));
    if (bytes !== ticket.size) throw new Error("Upload size does not match its ticket.");
    await writeFile(`${destination}.json`, JSON.stringify({
      size: bytes, contentType: ticket.contentType, owner: ticket.username,
    }), { flag: "wx", mode: 0o600 });
    res.sendStatus(204);
  } catch (error) {
    if (ownsFile) await unlink(destination).catch(() => {});
    if (!res.destroyed && !res.headersSent) {
      res.status((error as NodeJS.ErrnoException).code === "EEXIST" ? 409 : 400)
        .json({ error: "Upload failed or ticket has already been used." });
    }
  }
});
