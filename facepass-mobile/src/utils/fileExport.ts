import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform, Alert } from "react-native";
import { API_URL } from "@/lib/api/apiSlice";

/**
 * Downloads an authenticated Excel (.xlsx) or CSV (.csv) report from the FacePass
 * backend into a temporary cache file and triggers the native iOS/Android Share Sheet.
 */
export async function exportAndShareSessionReport({
  endpointPath,
  filename,
  mimeType,
  token,
}: {
  endpointPath: string;
  filename: string;
  mimeType: string;
  token: string | null;
}): Promise<void> {
  const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
  const cleanEndpoint = endpointPath.startsWith("/")
    ? endpointPath.slice(1)
    : endpointPath;
  const fullUrl = `${baseUrl}${cleanEndpoint}`;

  if (Platform.OS === "web") {
    const res = await fetch(fullUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      throw new Error(`Export failed (${res.status})`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    return;
  }

  const targetUri = `${FileSystem.cacheDirectory}${filename}`;

  try {
    const downloadRes = await FileSystem.downloadAsync(fullUrl, targetUri, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (downloadRes.status !== 200) {
      throw new Error(`Failed to generate export (HTTP ${downloadRes.status})`);
    }

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(downloadRes.uri, {
        mimeType,
        dialogTitle: `Export ${filename}`,
      });
    } else {
      Alert.alert("Export Saved", `Saved report to ${downloadRes.uri}`);
    }
  } finally {
    try {
      await FileSystem.deleteAsync(targetUri, { idempotent: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Writes an in-memory CSV string to cache and opens the native Share Sheet.
 */
export async function shareCsvString({
  csvContent,
  filename,
}: {
  csvContent: string;
  filename: string;
}): Promise<void> {
  if (Platform.OS === "web") {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return;
  }

  const targetUri = `${FileSystem.cacheDirectory}${filename}`;
  try {
    await FileSystem.writeAsStringAsync(targetUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(targetUri, {
        mimeType: "text/csv",
        dialogTitle: `Share ${filename}`,
      });
    }
  } finally {
    try {
      await FileSystem.deleteAsync(targetUri, { idempotent: true });
    } catch {
      // Ignore
    }
  }
}
