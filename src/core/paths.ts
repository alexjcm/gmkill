import os from 'node:os';
import path from 'node:path';
import { truncatePath } from '../utils/format.js';
import { SUPPORTED_BUILD_SYSTEMS } from './constants.js';
import type { BuildType } from './types.js';

/**
 * Returns the user's home directory as the root for scanning,
 * with separators normalized to forward slashes.
 */
export function resolveScanRoot(): string {
  return normalizePath(os.homedir());
}

/**
 * Normalizes path separators to forward slashes for consistent
 * internal storage and fast-glob patterns.
 */
export function normalizePath(p: string): string {
  return path.normalize(p).replaceAll(path.sep, '/');
}

/**
 * Replaces the home directory prefix with '~' if the path is inside it.
 */
export function replaceHomeWithTilde(p: string): string {
  const home = os.homedir().replaceAll(path.sep, '/');
  const normalized = normalizePath(p);
  return normalized.startsWith(home)
    ? `~${normalized.slice(home.length)}`
    : normalized;
}

/**
 * Returns a display-friendly, possibly truncated version of a path.
 */
export function displayPath(p: string, maxWidth: number = 80): string {
  const withTilde = replaceHomeWithTilde(p);
  return truncatePath(withTilde, maxWidth);
}

/**
 * Constructs the absolute path to the build output folder of a project.
 */
export function toBuildPath(projectRoot: string, type: BuildType): string {
  const config = SUPPORTED_BUILD_SYSTEMS.find((s) => s.type === type);
  const folder = config?.outputDir ?? 'build';
  return normalizePath(path.join(projectRoot, folder));
}
