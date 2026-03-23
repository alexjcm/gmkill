/**
 * Visual helpers with no business logic and no external dependencies.
 */

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

/**
 * Truncates a path string to fit within `maxWidth` characters,
 * always preserving the final path segment (the project folder name).
 *
 * @example
 * truncatePath('/Users/john/workspace/myapp', 24) // "~/…/workspace/myapp"
 * truncatePath('/Users/john/myapp', 40)            // "~/…/myapp"  (home replaced)
 */
export function truncatePath(p: string, maxWidth: number): string {
  // Normalize separators for display
  const normalized = p.replaceAll('\\', '/');

  if (normalized.length <= maxWidth) {
    return normalized;
  }

  const segments = normalized.split('/');
  const last = segments[segments.length - 1] ?? '';
  const prefix = '~/…/';
  const available = maxWidth - prefix.length - last.length;

  if (available <= 0) {
    // Path segment alone is wider than the terminal — just show the last segment
    return last;
  }

  // Walk backwards from second-to-last segment to fill available space
  const middle: string[] = [];
  for (let i = segments.length - 2; i >= 0; i--) {
    const segment = segments[i] ?? '';
    const candidate = [segment, ...middle].join('/');
    if (candidate.length > available) break;
    middle.unshift(segment);
  }

  return `${prefix}${middle.length > 0 ? middle.join('/') + '/' : ''}${last}`;
}
