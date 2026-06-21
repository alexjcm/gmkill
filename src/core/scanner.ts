import EventEmitter from 'node:events';
import fs from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import path from 'node:path';
import { resolveScanRoot, normalizePath, toBuildPath } from './paths.js';
import { isJVMBuildFolder } from './detector.js';
import { SCAN_DEPTH, IGNORED_DIRS, SUPPORTED_BUILD_SYSTEMS, NODE_TARGETS } from './constants.js';
import type { Project } from './types.js';

/**
 * Scans the user's scan root directory recursively for supported projects.
 * Uses an asynchronous queue-based BFS walker to stream projects in real time.
 */
export class Scanner extends EventEmitter {
  constructor(private readonly scanRoot?: string) {
    super();
  }

  async scan(): Promise<void> {
    const root = resolveScanRoot(this.scanRoot);

    const roots = new Map<string, Project>();
    const emittedIds = new Set<string>();

    const queue: { dir: string; depth: number }[] = [{ dir: root, depth: 1 }];
    let activeReads = 0;
    const CONCURRENCY_LIMIT = 8;

    return new Promise<void>((resolve) => {
      let isDone = false;

      const checkAndProcess = () => {
        if (isDone) return;
        if (queue.length === 0 && activeReads === 0) {
          isDone = true;
          this.emit('done');
          resolve();
          return;
        }

        while (queue.length > 0 && activeReads < CONCURRENCY_LIMIT) {
          const item = queue.shift()!;
          activeReads++;

          processDirectory(item.dir, item.depth)
            .catch((err) => {
              this.emit('error', err);
            })
            .finally(() => {
              activeReads--;
              checkAndProcess();
            });
        }
      };

      const processDirectory = async (currentDir: string, depth: number) => {
        if (depth > SCAN_DEPTH) return;

        const dirName = path.basename(currentDir);
        if (IGNORED_DIRS.has(dirName) || dirName.endsWith('.app')) {
          return;
        }

        let entries: Dirent[];
        try {
          entries = await fs.readdir(currentDir, { withFileTypes: true });
        } catch {
          // Ignore directory read errors (permissions, locked files, etc.)
          return;
        }

        const files = new Set<string>();
        const subdirs = new Set<string>();

        for (const entry of entries) {
          if (entry.isFile()) {
            files.add(entry.name);
          } else if (entry.isDirectory()) {
            subdirs.add(entry.name);
          }
        }

        // Detect projects in this directory
        for (const system of SUPPORTED_BUILD_SYSTEMS) {
          const indicators = [system.primaryIndicator, ...(system.alternativeIndicators ?? [])];
          const hasIndicator = indicators.some((ind) => files.has(ind));

          if (hasIndicator) {
            const buildPaths: string[] = [];

            if (system.type === 'node') {
              for (const target of NODE_TARGETS) {
                if (subdirs.has(target)) {
                  buildPaths.push(normalizePath(path.join(currentDir, target)));
                }
              }
            } else {
              const expectedBuildPath = toBuildPath(currentDir, system.type);
              const expectedBuildFolder = path.basename(expectedBuildPath);
              if (subdirs.has(expectedBuildFolder)) {
                if (await isJVMBuildFolder(expectedBuildPath, system.type)) {
                  buildPaths.push(expectedBuildPath);
                }
              }
            }

            const project: Project = {
              id: `${normalizePath(currentDir)}::${system.type}`,
              rootPath: normalizePath(currentDir),
              buildPaths,
              buildType: system.type,
              size: null,
            };

            // Find the nearest registered ancestor
            const parent = (() => {
              const segments = project.rootPath.split('/');
              for (let i = segments.length - 1; i > 0; i--) {
                const candidate = segments.slice(0, i).join('/');
                const compositeCandidateId = `${candidate}::${project.buildType}`;
                const rootProj = roots.get(compositeCandidateId);
                if (rootProj !== undefined) return rootProj;
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
              const newRoot: Project = { ...project };
              roots.set(newRoot.id, newRoot);

              if (newRoot.buildPaths.length > 0) {
                emittedIds.add(newRoot.id);
                this.emit('project', { ...newRoot });
              }
            }
          }
        }

        // Push subdirectories to queue for further exploration
        for (const entry of entries) {
          if (entry.isDirectory()) {
            queue.push({
              dir: path.join(currentDir, entry.name),
              depth: depth + 1,
            });
          }
        }
      };

      checkAndProcess();
    });
  }
}
