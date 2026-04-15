export type BuildType = 'gradle' | 'maven' | 'node';

/**
 * Strategy configuration for detecting and handling a build system.
 */
export interface BuildSystemConfig {
  readonly type: BuildType;
  /** Primary identifier (if this exists, we assume this build system type) */
  readonly primaryIndicator: string;
  /** Fallback identifiers */
  readonly alternativeIndicators?: readonly string[];
  /** Name of the folder where compilation output goes */
  readonly outputDir: string;
}

/**
 * Represents a JVM project with a build folder that can be cleaned.
 */
export interface Project {
  /** Unique identifier (same as rootPath, kept separate for referencing in state) */
  readonly id: string;
  /** Absolute path to the project root (where pom.xml / build.gradle lives) */
  readonly rootPath: string;
  /** Absolute paths to all build/target/cache folders to be scrubbed. */
  readonly buildPaths: string[];
  readonly buildType: BuildType;
  /**
   * Size of the build folder in bytes.
   */
  size: number | null;
}

export type ScanStatus = 'scanning' | 'done';

/**
 * Error codes that can occur when deleting a build folder.
 */
export type CleanErrorCode = 'EACCES' | 'EPERM' | 'EBUSY' | 'ENOENT';

export interface CleanError {
  readonly code: CleanErrorCode;
  readonly message: string;
}

export interface CleanResult {
  readonly project: Project;
  /** Bytes actually freed. `null` if the size could not be determined or an error occurred. */
  readonly freed: number | null;
  readonly error?: CleanError;
}
