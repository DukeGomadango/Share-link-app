import JSZip from "jszip";

/**
 * URL からファイルを Blob として取得し、ブラウザでダウンロードを開始させる
 */
export async function downloadSingleFile(url: string, filename: string) {
  try {
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download failed:", error);
    // 失敗した場合はフォールバックとして別タブで開く
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * 複数のファイルを ZIP にまとめてダウンロードさせる
 */
export async function downloadFilesAsZip(
  files: Array<{ src: string; filename: string }>,
  zipName: string = "download.zip"
) {
  const zip = new JSZip();
  
  // 各ファイルをフェッチして ZIP に追加
  const downloadPromises = files.map(async (file) => {
    try {
      const response = await fetch(file.src, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      zip.file(file.filename, blob);
    } catch (error) {
      console.error(`Failed to add file to zip: ${file.filename}`, error);
    }
  });

  await Promise.all(downloadPromises);
  
  // ZIP を生成
  const content = await zip.generateAsync({ type: "blob" });
  const blobUrl = window.URL.createObjectURL(content);
  
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = zipName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  window.URL.revokeObjectURL(blobUrl);
}
