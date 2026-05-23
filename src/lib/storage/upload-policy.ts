/**
 * アップロード許可 MIME / 拡張子（チェックリスト §2）。
 * 実行可能・HTML/SVG 等は拒否。配布向けメディア・アーカイブ・文書を許可。
 */

const BLOCKED_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".com",
  ".scr",
  ".msi",
  ".dll",
  ".html",
  ".htm",
  ".xhtml",
  ".svg",
  ".js",
  ".mjs",
  ".cjs",
  ".php",
  ".asp",
  ".aspx",
  ".jsp",
  ".vbs",
  ".ps1",
  ".sh",
  ".jar",
  ".app",
  ".dmg",
  ".deb",
  ".rpm",
  ".reg",
  ".hta",
  ".wsf",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".bmp",
  ".ico",
  ".mp3",
  ".wav",
  ".ogg",
  ".m4a",
  ".aac",
  ".flac",
  ".webm",
  ".mp4",
  ".mov",
  ".m4v",
  ".avi",
  ".mkv",
  ".pdf",
  ".zip",
  ".7z",
  ".rar",
  ".gz",
  ".txt",
  ".csv",
  ".json",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
]);

const ALLOWED_MIME_EXACT = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-7z-compressed",
  "application/gzip",
  "application/x-gzip",
  "application/vnd.rar",
  "application/x-rar-compressed",
  "application/json",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const ALLOWED_MIME_PREFIXES = ["image/", "audio/", "video/"] as const;

export type UploadPolicyReject = {
  ok: false;
  error: "disallowed_type";
  message: string;
};

export type UploadPolicyAccept = { ok: true };

export function getFileExtension(filename: string): string {
  const base = filename.trim().split(/[/\\]/).pop() ?? filename;
  const dot = base.lastIndexOf(".");
  if (dot <= 0) {
    return "";
  }
  return base.slice(dot).toLowerCase();
}

function mimeAllowed(contentType: string, ext: string): boolean {
  const mime = contentType.split(";")[0]?.trim().toLowerCase() || "application/octet-stream";

  if (ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p))) {
    return true;
  }
  if (ALLOWED_MIME_EXACT.has(mime)) {
    return true;
  }
  if (mime === "application/octet-stream" && ext && ALLOWED_EXTENSIONS.has(ext)) {
    return true;
  }
  return false;
}

/**
 * ファイル名と Content-Type がアップロード方針に合うか検証する。
 */
export function validateUploadPolicy(
  filename: string,
  contentType: string
): UploadPolicyAccept | UploadPolicyReject {
  const ext = getFileExtension(filename);

  if (ext && BLOCKED_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      error: "disallowed_type",
      message: "この形式のファイルはアップロードできません",
    };
  }

  if (!mimeAllowed(contentType, ext)) {
    return {
      ok: false,
      error: "disallowed_type",
      message: "この形式のファイルはアップロードできません",
    };
  }

  if (!ext && contentType === "application/octet-stream") {
    return {
      ok: false,
      error: "disallowed_type",
      message: "ファイル名に拡張子が必要です",
    };
  }

  return { ok: true };
}
