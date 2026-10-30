import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

export interface EphemeralMediaFile {
  uri: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
}

/**
 * Privacy Guardrail #3: Biometric images/videos must NEVER be stored persistently
 * on lecturer client devices.
 *
 * This helper streams a captured/selected media file directly to an AWS S3
 * presigned URL with native progress tracking and immediately purges the local
 * temporary cache file inside a `finally` block.
 */
export async function uploadMediaToPresignedUrlAndPurge({
  presignedUrl,
  file,
  onProgress,
}: {
  presignedUrl: string;
  file: EphemeralMediaFile;
  onProgress?: (percent: number) => void;
}): Promise<void> {
  try {
    if (Platform.OS === "web") {
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.mimeType,
        },
        body: blob,
      });
      if (!uploadRes.ok) {
        throw new Error(`S3 Upload failed (${uploadRes.status})`);
      }
      onProgress?.(100);
      return;
    }

    const uploadTask = FileSystem.createUploadTask(
      presignedUrl,
      file.uri,
      {
        httpMethod: "PUT",
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          "Content-Type": file.mimeType,
        },
      },
      (data) => {
        if (data.totalBytesExpectedToSend > 0 && onProgress) {
          const pct = Math.min(
            99,
            Math.round(
              (data.totalBytesSent / data.totalBytesExpectedToSend) * 100
            )
          );
          onProgress(pct);
        }
      }
    );

    const result = await uploadTask.uploadAsync();
    if (!result || result.status < 200 || result.status >= 300) {
      throw new Error(
        `S3 Upload failed with status ${result ? result.status : "unknown"}`
      );
    }
    onProgress?.(100);
  } finally {
    await purgeEphemeralFile(file.uri);
  }
}

/**
 * Deletes a temporary file from the app cache so zero biometric images remain on device.
 */
export async function purgeEphemeralFile(uri?: string | null): Promise<void> {
  if (!uri || Platform.OS === "web") return;
  try {
    if (uri.startsWith("file://")) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch {
    // Ignore if already deleted or OS-managed read-only asset
  }
}
