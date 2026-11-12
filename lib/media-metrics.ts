export interface MediaMetricsLog {
  fileName?: string;
  rawBytes?: number;
  compressedBytes?: number;
  ocrMs?: number;
  uploadMs?: number;
  recordedAt?: string;
}

export const MEDIA_METRICS_STORAGE_KEY = "docclear_media_metrics";

/**
 * Merges new client media or pipeline timing fields into session & local storage
 * so /evaluate can inspect the latest baseline metrics without losing prior steps.
 */
export function updateMediaMetricsLog(patch: Partial<MediaMetricsLog>): void {
  if (typeof window === "undefined") return;
  try {
    const raw =
      sessionStorage.getItem(MEDIA_METRICS_STORAGE_KEY) ||
      localStorage.getItem(MEDIA_METRICS_STORAGE_KEY);
    const existing: MediaMetricsLog = raw ? JSON.parse(raw) : {};
    const merged: MediaMetricsLog = {
      ...existing,
      ...patch,
      recordedAt: new Date().toISOString(),
    };
    const serialized = JSON.stringify(merged);
    sessionStorage.setItem(MEDIA_METRICS_STORAGE_KEY, serialized);
    localStorage.setItem(MEDIA_METRICS_STORAGE_KEY, serialized);
  } catch {
    // ignore storage errors on quota or private mode restrictions
  }
}
