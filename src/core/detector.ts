import fs from 'node:fs/promises';
import path from 'node:path';
import { normalizePath, toBuildPath } from './paths.js';
import { SUPPORTED_BUILD_SYSTEMS } from './constants.js';
import type { BuildType, Project } from './types.js';

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifies if a directory contains standard JVM build output subdirectories.
 * This is a "strict" check to prevent accidental deletion of non-JVM folders.
 */
async function isJVMBuildFolder(dir: string, type: BuildType): Promise<boolean> {
  const subdirs = type === 'gradle' 
    ? ['classes', 'libs', 'resources', 'tmp', 'kotlin', 'reports', 'intermediates', 'outputs', 'test-results', 'generated']
    : ['classes', 'generated-sources', 'maven-status', 'surefire-reports', 'maven-archiver', 'test-classes'];

  // Check for the existence of AT LEAST one standard subdirectory
  // We check up to the first 10 specified folders for high coverage.
  for (const sub of subdirs) {
    if (await exists(path.join(dir, sub))) return true;
  }
  return false;
}

/**
 * Attempts to classify and validate a directory as a JVM project.
 */
export async function detectProject(dir: string): Promise<Project | null> {
  let buildType: BuildType | null = null;

  for (const system of SUPPORTED_BUILD_SYSTEMS) {
    if (await exists(path.join(dir, system.primaryIndicator))) {
      buildType = system.type;
      break;
    }
    
    if (system.alternativeIndicators) {
      for (const alt of system.alternativeIndicators) {
        if (await exists(path.join(dir, alt))) {
          buildType = system.type;
          break;
        }
      }
    }
    if (buildType !== null) break;
  }

  if (buildType === null) return null;

  // Validate build folder existence AND standard contents (safety first!)
  const expectedBuildPath = toBuildPath(dir, buildType);
  let buildPath: string | null = null;
  
  if (await exists(expectedBuildPath)) {
    // Perform a fast heuristic check to ensure it's a real JVM build folder
    if (await isJVMBuildFolder(expectedBuildPath, buildType)) {
      buildPath = expectedBuildPath;
    }
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
