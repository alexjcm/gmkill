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

  // Validate build folder existence
  const expectedBuildPath = toBuildPath(dir, buildType);
  const buildPath = await exists(expectedBuildPath) ? expectedBuildPath : null;

  return {
    id: normalizePath(dir),
    rootPath: normalizePath(dir),
    buildPath,
    buildType,
    submoduleBuildPaths: [],
    size: null,
  };
}
