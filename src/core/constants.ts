import type { BuildSystemConfig } from './types.js';

/**
 * Maximum directory depth to scan from the user's home directory.
 */
export const SCAN_DEPTH = 8;

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
  {
    type: 'node',
    primaryIndicator: 'package.json',
    outputDir: '',
  },
];

/**
 * Maximum number of concurrent I/O operations during folder size calculation.
 */
export const CONCURRENCY = 16;

/**
 * Node.js specific artifact folder names to calculate and wipe.
 */
export const NODE_TARGETS: readonly string[] = [
  'node_modules', '.npm', '.pnpm-store', '.next', '.nuxt', '.angular',
  '.svelte-kit', '.vite', '.nx', '.turbo', '.parcel-cache', '.rpt2_cache',
  '.eslintcache', '.esbuild', '.cache', '.rollup.cache', 'storybook-static',
  'coverage', '.nyc_output', '.jest', 'gatsby_cache', '.docusaurus',
  '.swc', '.stylelintcache', 'deno_cache', '.astro'
];

/**
 * Directory names to skip entirely during the recursive scan.
 */
export const IGNORED_DIRS: ReadonlySet<string> = new Set([
  // Version Control
  '.git', '.svn', '.hg', '.fossil',
  // System (Cross-platform)
  '.Trash', '.Trashes', '$Recycle.Bin', 'System Volume Information', '.Spotlight-V100', '.fseventsd',
  // macOS specific
  'Applications', 'Library', '*.app',
  // Windows specific
  'Program Files', 'Program Files (x86)', 'Windows', 'AppData', 'ProgramData',
  // Linux specific
  'bin', 'boot', 'dev', 'etc', 'lib', 'lib64', 'media', 'mnt', 'opt', 'proc', 'root', 'run', 'sbin', 'srv', 'sys', 'tmp', 'usr', 'var',
  // Env managers
  '.nvm', '.rvm', '.rustup', '.pyenv', '.rbenv', '.asdf', '.deno',
  // IDEs
  '.idea', '.vs', '.settings',
  // Heavy & specific tools
  'snap', '.flatpak-info', 'node_modules', '__pycache__', 'target', 'build', 'dist', '.cache', '.venv', 'venv'
]);

export const EXIT_CODES = {
  SUCCESS: 0,
  FATAL_ERROR: 1,
  INVALID_ARGUMENT: 2,
  SIGINT: 130,
} as const;
