import EventEmitter from 'node:events';
import path from 'node:path';
import fg from 'fast-glob';
import { resolveScanRoot, normalizePath } from './paths.js';
import { detectProject } from './detector.js';
import { SCAN_DEPTH, IGNORED_DIRS, SUPPORTED_BUILD_SYSTEMS } from './constants.js';
import type { Project } from './types.js';

export interface ScannerEvents {
  /** Fired for each root-level project found. */
  project: [project: Project];
  /** Fired when a submodule is found for an already emitted root project. */
  submodule: [data: { parentId: string; buildPath: string }];
  /** Fired once when the scan is completely finished. */
  done: [];
  /** Fired if an unexpected error occurs during the scan. */
  error: [error: Error];
}

/**
 * Scans the user's home directory for JVM projects with existing build folders.
 */
export class Scanner extends EventEmitter {
  constructor(private readonly scanRoot?: string) {
    super();
  }

  async scan(): Promise<void> {
    const root = resolveScanRoot(this.scanRoot);

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
      candidateDirs.sort();

      const roots = new Map<string, Project>();
      const emittedIds = new Set<string>();

      const BATCH_SIZE = 10;
      for (let i = 0; i < candidateDirs.length; i += BATCH_SIZE) {
        const batch = candidateDirs.slice(i, i + BATCH_SIZE);
        const resultsArray = await Promise.all(batch.map((dir) => detectProject(dir)));
        const results = resultsArray.flat();

        for (const project of results) {
          // Find the nearest registered ancestor
          // instead of O(n_roots) linear scan across all known roots.
          const parent = (() => {
            const segments = project.rootPath.split('/');
            for (let i = segments.length - 1; i > 0; i--) {
              const candidate = segments.slice(0, i).join('/');
              const compositeCandidateId = `${candidate}::${project.buildType}`;
              const root = roots.get(compositeCandidateId);
              if (root !== undefined) return root;
            }
            return undefined;
          })();

          if (parent !== undefined) {
            for (const bp of project.buildPaths) {
              if (!parent.buildPaths.includes(bp)) {
                parent.buildPaths.push(bp);
                if (emittedIds.has(parent.id)) {
                  this.emit('submodule', {
                    parentId: parent.id,
                    buildPath: bp,
                  });
                }
              }
            }
            if (!emittedIds.has(parent.id) && parent.buildPaths.length > 0) {
              emittedIds.add(parent.id);
              this.emit('project', { ...parent, buildPaths: [...parent.buildPaths] });
            }
          } else {
            // This is a potential root
            const newRoot: Project = { ...project, buildPaths: [...project.buildPaths] };
            roots.set(newRoot.id, newRoot);

            if (newRoot.buildPaths.length > 0) {
              emittedIds.add(newRoot.id);
              this.emit('project', { ...newRoot });
            }
          }
        }

        // Give the UI a chance to render before the next batch
        await new Promise((resolve) => setImmediate(resolve));
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
