const BYTES_IN_KB = 1024;
const BYTES_IN_MB = 1024 * 1024;
const BYTES_IN_GB = 1024 * 1024 * 1024;

/**
 * Converts a byte count into a human-readable string.
 *
 * @example
 * formatBytes(358_400_000)  // "341.8 MB"
 * formatBytes(2_147_483_648) // "2.0 GB"
 * formatBytes(512)           // "512 B"
 */
export function formatBytes(bytes: number): string {
  if (bytes >= BYTES_IN_GB) {
    return `${(bytes / BYTES_IN_GB).toFixed(1)} GB`;
  }
  if (bytes >= BYTES_IN_MB) {
    return `${(bytes / BYTES_IN_MB).toFixed(1)} MB`;
  }
  if (bytes >= BYTES_IN_KB) {
    return `${(bytes / BYTES_IN_KB).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}
