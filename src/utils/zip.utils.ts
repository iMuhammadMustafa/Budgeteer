import JSZip from "jszip";
import { Platform } from "react-native";

/**
 * ZIP file utilities for web platform
 * Uses JSZip library to create ZIP archives
 */

/**
 * Create a ZIP file from multiple files (web only)
 * @param files Array of files with name and content
 * @param zipFileName Name of the ZIP file
 * @returns Promise that resolves when ZIP is downloaded
 */
export async function createAndDownloadZip(
  files: { name: string; content: string }[],
  zipFileName: string,
): Promise<void> {
  if (Platform.OS !== "web") {
    throw new Error("ZIP creation is only supported on web platform");
  }

  try {
    // Dynamically import JSZip only on web
    const zip = new JSZip();

    // Add all files to the ZIP
    files.forEach(file => {
      zip.file(file.name, file.content);
    });

    // Generate the ZIP file
    const blob = await zip.generateAsync({ type: "blob" });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = zipFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error creating ZIP file:", error);
    throw new Error(`Failed to create ZIP file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Download a single file (web only)
 * @param content File content
 * @param fileName File name
 * @param mimeType MIME type of the file
 */
export function downloadFile(content: string, fileName: string, mimeType: string = "text/plain"): void {
  if (Platform.OS !== "web") {
    throw new Error("File download is only supported on web platform");
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Check if ZIP functionality is available
 */
export function isZipSupported(): boolean {
  return Platform.OS === "web";
}
