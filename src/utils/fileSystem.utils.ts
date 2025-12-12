import { Platform } from "react-native";

/**
 * File System utilities with compatibility for different expo-file-system versions
 * This provides a consistent API regardless of the expo-file-system version
 */

// Define types for the file system operations
interface WriteOptions {
  encoding?: "utf8";
}

interface ReadOptions {
  encoding?: "utf8";
}

/**
 * Get the document directory path
 * Works with both old and new expo-file-system APIs
 */
export function getDocumentDirectory(): string {
  if (Platform.OS === "web") {
    return "";
  }

  // Try new API first
  try {
    const { Paths } = require("expo-file-system");
    if (Paths?.document?.uri) {
      return Paths.document.uri;
    }
  } catch {
    // Fall through to legacy API
  }

  // Fall back to legacy API
  try {
    const FileSystem = require("expo-file-system");
    if (FileSystem.documentDirectory) {
      return FileSystem.documentDirectory;
    }
  } catch {
    // Return empty string if neither API is available
  }

  return "";
}

/**
 * Write string to file
 * Works with both old and new expo-file-system APIs
 */
export async function writeAsStringAsync(fileUri: string, contents: string, options?: WriteOptions): Promise<void> {
  if (Platform.OS === "web") {
    throw new Error("File writing is not supported on web");
  }

  try {
    const FileSystem = require("expo-file-system");

    // Try new API
    if (FileSystem.File) {
      const file = new FileSystem.File(fileUri);
      await file.write(contents);
      return;
    }

    // Fall back to legacy API
    if (FileSystem.writeAsStringAsync) {
      await FileSystem.writeAsStringAsync(fileUri, contents, {
        encoding: FileSystem.EncodingType?.UTF8 || "utf8",
      });
      return;
    }

    throw new Error("No compatible file system API found");
  } catch (error) {
    console.error("Error writing file:", error);
    throw error;
  }
}

/**
 * Read string from file
 * Works with both old and new expo-file-system APIs
 */
export async function readAsStringAsync(fileUri: string, options?: ReadOptions): Promise<string> {
  if (Platform.OS === "web") {
    throw new Error("File reading is not supported on web");
  }

  try {
    const FileSystem = require("expo-file-system");

    // Try new API
    if (FileSystem.File) {
      const file = new FileSystem.File(fileUri);
      const content = await file.text();
      return content;
    }

    // Fall back to legacy API
    if (FileSystem.readAsStringAsync) {
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType?.UTF8 || "utf8",
      });
      return content;
    }

    throw new Error("No compatible file system API found");
  } catch (error) {
    console.error("Error reading file:", error);
    throw error;
  }
}
