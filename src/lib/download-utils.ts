import JSZip from "jszip";

/** 1ファイルあたりの fetch タイムアウト（ミリ秒） */
const FETCH_TIMEOUT_MS = 90_000;

/** 連続ダウンロードの間隔（モバイルブラウザ向け） */
const SEQUENTIAL_DOWNLOAD_GAP_MS = 400;

async function fetchWithTimeout(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}

/**
 * URL からファイルを Blob として取得し、ブラウザでダウンロードを開始させる。
 * @returns blob 経由の保存に成功した場合 true
 */
export async function downloadSingleFile(
  url: string,
  filename: string
): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(url, { credentials: "include" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const blob = await response.blob();
    triggerBlobDownload(blob, filename);
    return true;
  } catch (error) {
    console.error("Download failed:", error);
    window.open(url, "_blank", "noopener,noreferrer");
    return false;
  }
}

export type SequentialDownloadResult = {
  succeeded: number;
  failed: string[];
};

/**
 * 複数ファイルを順番にダウンロード（メモリ・接続負荷を抑える）
 */
export async function downloadFilesSequentially(
  files: Array<{ src: string; filename: string }>,
  options?: {
    onProgress?: (current: number, total: number, filename: string) => void;
    gapMs?: number;
  }
): Promise<SequentialDownloadResult> {
  const failed: string[] = [];
  const gapMs = options?.gapMs ?? SEQUENTIAL_DOWNLOAD_GAP_MS;

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    options?.onProgress?.(i + 1, files.length, file.filename);
    const ok = await downloadSingleFile(file.src, file.filename);
    if (!ok) {
      failed.push(file.filename);
    }
    if (gapMs > 0 && i < files.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, gapMs));
    }
  }

  return {
    succeeded: files.length - failed.length,
    failed,
  };
}

/**
 * 複数のファイルを ZIP にまとめてダウンロード（サブオプション・PC向け）
 */
export async function downloadFilesAsZip(
  files: Array<{ src: string; filename: string }>,
  zipName: string = "download.zip"
) {
  const zip = new JSZip();

  for (const file of files) {
    try {
      const response = await fetchWithTimeout(file.src, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      zip.file(file.filename, blob);
    } catch (error) {
      console.error(`Failed to add file to zip: ${file.filename}`, error);
    }
  }

  const content = await zip.generateAsync({ type: "blob" });
  triggerBlobDownload(content, zipName);
}
