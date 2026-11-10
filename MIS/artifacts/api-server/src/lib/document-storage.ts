import type { File } from "@google-cloud/storage";
import { ObjectStorageService as CloudStorageService } from "./objectStorage";
import { isLocalRuntime } from "./local-runtime";
import { createLocalUpload, LocalObjectFile, parseLocalTicket } from "./local-storage";
export { ObjectNotFoundError } from "./objectStorage";

/** Leaves the Replit cloud client and ACL implementation unchanged. */
export class ObjectStorageService {
  private cloud = new CloudStorageService();
  async getObjectEntityUploadURL(username?: string, size?: number, contentType?: string) {
    return isLocalRuntime()
      ? createLocalUpload(username || "", size || 0, contentType || "application/octet-stream")
      : this.cloud.getObjectEntityUploadURL();
  }
  normalizeObjectEntityPath(url: string) {
    if (!isLocalRuntime()) return this.cloud.normalizeObjectEntityPath(url);
    if (!url.startsWith("/api/storage/local-upload/")) throw new Error("Invalid local upload URL.");
    return `/objects/uploads/${parseLocalTicket(url.split("/").pop()!).id}`;
  }
  async getObjectEntityFile(objectPath: string): Promise<File | LocalObjectFile> {
    if (!isLocalRuntime()) return this.cloud.getObjectEntityFile(objectPath);
    if (!objectPath.startsWith("/objects/uploads/")) throw new Error("Invalid local document path.");
    const file = new LocalObjectFile(objectPath.replace(/^\/objects\/uploads\//, ""));
    await file.getMetadata();
    return file;
  }
  async downloadObject(file: File | LocalObjectFile, cacheTtlSec?: number) {
    return file instanceof LocalObjectFile ? file.download() : this.cloud.downloadObject(file, cacheTtlSec);
  }
  async searchPublicObject(filePath: string): Promise<File | null> {
    // Local mode never exposes its private document directory as public assets.
    return isLocalRuntime() ? null : this.cloud.searchPublicObject(filePath);
  }
}
