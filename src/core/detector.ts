import fs from 'node:fs/promises';
import path from 'node:path';
import { normalizePath, toBuildPath } from './paths.js';
import { SUPPORTED_BUILD_SYSTEMS, NODE_TARGETS } from './constants.js';
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
export async function detectProject(dir: string): Promise<Project[]> {
  const detected: Project[] = [];

  for (const system of SUPPORTED_BUILD_SYSTEMS) {
    const indicators = [system.primaryIndicator, ...(system.alternativeIndicators ?? [])];
    try {
      await Promise.any(indicators.map((ind) => fs.access(path.join(dir, ind))));
      const buildPaths: string[] = [];

      if (system.type === 'node') {
        const checks = NODE_TARGETS.map(async (target) => {
          const targetPath = path.join(dir, target);
          try {
            await fs.access(targetPath);
            buildPaths.push(normalizePath(targetPath));
          } catch {
            // target directory does not exist
          }
        });
        await Promise.all(checks);
      } else {
        const expectedBuildPath = toBuildPath(dir, system.type);
        try {
          await fs.access(expectedBuildPath);
          if (await isJVMBuildFolder(expectedBuildPath, system.type)) {
            buildPaths.push(expectedBuildPath);
          }
        } catch {
          // JVM build folder does not exist
        }
      }

      detected.push({
        id: `${normalizePath(dir)}::${system.type}`,
        rootPath: normalizePath(dir),
        buildPaths,
        buildType: system.type,
        size: null,
      });
    } catch {
      // None of this system's indicators exist — try next
    }
  }

  return detected;
}
