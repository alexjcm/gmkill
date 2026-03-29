import fs from 'node:fs/promises';
import path from 'node:path';
import { normalizePath, toBuildPath } from './paths.js';
import { SUPPORTED_BUILD_SYSTEMS } from './constants.js';
import type { BuildType, Project } from './types.js';

/**
 * Verifies if a directory contains standard JVM build output subdirectories.
 * This is a "strict" check to prevent accidental deletion of non-JVM folders.
 */
async function isJVMBuildFolder(dir: string, type: BuildType): Promise<boolean> {
  const subdirs = type === 'gradle'
    ? ['classes', 'libs', 'resources', 'tmp', 'kotlin', 'reports', 'intermediates', 'outputs', 'test-results', 'generated']
    : ['classes', 'generated-sources', 'maven-status', 'surefire-reports', 'maven-archiver', 'test-classes'];

  // Run all access checks in parallel — resolves as soon as the first one succeeds.
  try {
    await Promise.any(subdirs.map((sub) => fs.access(path.join(dir, sub))));
    return true;
  } catch {
    return false;
  }
}

/**
 * Attempts to classify and validate a directory as a JVM project.
 */
export async function detectProject(dir: string): Promise<Project | null> {
  let buildType: BuildType | null = null;

  for (const system of SUPPORTED_BUILD_SYSTEMS) {
    const indicators = [system.primaryIndicator, ...(system.alternativeIndicators ?? [])];
    try {
      await Promise.any(indicators.map((ind) => fs.access(path.join(dir, ind))));
      buildType = system.type;
      break;
    } catch {
      // None of this system's indicators exist — try next
    }
  }

  if (buildType === null) return null;

  // Validate build folder existence AND standard contents (safety first!)
  const expectedBuildPath = toBuildPath(dir, buildType);
  let buildPath: string | null = null;

  try {
    await fs.access(expectedBuildPath);
    if (await isJVMBuildFolder(expectedBuildPath, buildType)) {
      buildPath = expectedBuildPath;
    }
  } catch {
    // build folder does not exist — buildPath stays null
  }

  return {
    id: normalizePath(dir),
    rootPath: normalizePath(dir),
    buildPath,
    buildType,
    submoduleBuildPaths: [],
    size: null,
  };
}
