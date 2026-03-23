import EventEmitter from 'node:events';
import path from 'node:path';
import fg from 'fast-glob';
import { resolveScanRoot, normalizePath } from './paths.js';
import { detectProject } from './detector.js';
import { SCAN_DEPTH, IGNORED_DIRS, SUPPORTED_BUILD_SYSTEMS } from './constants.js';
import type { Project } from './types.js';

export interface ScannerEvents {
  /** Fired for each root-level project found (after submodule deduplication). */
  project: [project: Project];
  /** Fired once when the scan is completely finished. */
  done: [];
  /** Fired if an unexpected error occurs during the scan. */
  error: [error: Error];
}

type MutableProject = { -readonly [K in keyof Project]: Project[K] };

/**
 * Scans the user's home directory for JVM projects with existing build folders.
 */
export class Scanner extends EventEmitter {
  async scan(): Promise<void> {
    const root = resolveScanRoot();

    const ignore = [...IGNORED_DIRS].map((d) => `**/${d}/**`);

    const patterns = SUPPORTED_BUILD_SYSTEMS.flatMap((sys) => {
      const indicators = [sys.primaryIndicator, ...(sys.alternativeIndicators ?? [])];
      return indicators.map((ind) => `${root}/**/${ind}`);
    });

    try {
      const files = await fg(patterns, {
        onlyFiles: true,
        deep: SCAN_DEPTH,
        ignore,
        suppressErrors: true,
      });

      // Deduplicate directories (a project may have both build.gradle and build.gradle.kts)
      const candidateDirs = [
        ...new Set(files.map((f) => normalizePath(path.dirname(f)))),
      ];

      // Sort by path so that parent directories always come before their children.
      // This is the key invariant that makes O(n) submodule deduplication correct.
      candidateDirs.sort();

      // Detect each candidate (parallel within each batch)
      const detectedProjects = (
        await Promise.all(candidateDirs.map((dir) => detectProject(dir)))
      ).filter((p): p is Project => p !== null);

      // Deduplicate: emit root projects; increment submoduleCount for children.
      // Since the list is sorted, a parent always appears before its children.
      const emittedRoots: MutableProject[] = [];

      for (const project of detectedProjects) {
        const parent = emittedRoots.find((r) =>
          project.rootPath.startsWith(r.rootPath + '/'),
        );

        if (parent !== undefined) {
          // This project is a submodule
          if (project.buildPath !== null) {
            parent.submoduleBuildPaths.push(project.buildPath);
          }
        } else {
          // This project is a root!
          const mutable: MutableProject = { ...project, submoduleBuildPaths: [] };
          emittedRoots.push(mutable);
        }
      }

      // Filter out root projects that have NO buildPath AND NO submodules
      for (const root of emittedRoots) {
        if (root.buildPath !== null || root.submoduleBuildPaths.length > 0) {
          this.emit('project', { ...root } as Project);
        }
      }
    } catch (error) {
      this.emit(
        'error',
        error instanceof Error ? error : new Error(String(error)),
      );
    } finally {
      this.emit('done');
    }
  }
}
