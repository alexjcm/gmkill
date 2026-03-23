import type { BuildSystemConfig } from './types.js';

/**
 * Maximum directory depth to scan from the user's home directory.
 */
export const SCAN_DEPTH = 6;

/**
 * Registry of supported build systems. Order determines precedence.
 */
export const SUPPORTED_BUILD_SYSTEMS: readonly BuildSystemConfig[] = [
  {
    type: 'gradle',
    primaryIndicator: 'build.gradle',
    alternativeIndicators: ['build.gradle.kts'],
    outputDir: 'build',
  },
  {
    type: 'maven',
    primaryIndicator: 'pom.xml',
    outputDir: 'target',
  },
];

/**
 * Maximum number of concurrent I/O operations during folder size calculation.
 */
export const CONCURRENCY = 16;

/**
 * Directory names to skip entirely during the recursive scan.
 */
export const IGNORED_DIRS: ReadonlySet<string> = new Set([
  '.git',
  '.idea',
  '.vscode',
  'node_modules',
  'target',
  'build',
]);

/**
 * Standardized exit codes used across the CLI to eliminate magic numbers.
 */
export const EXIT_CODES = {
  SUCCESS: 0,
  FATAL_ERROR: 1,
  INVALID_ARGUMENT: 2,
  SIGINT: 130,
} as const;
