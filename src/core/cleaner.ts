import fs from 'node:fs/promises';
import { CONCURRENCY } from './constants.js';
import type { Project, CleanResult, CleanErrorCode } from './types.js';

function getActionableMessage(code: string): string {
  switch (code) {
    case 'EACCES':
      return 'No permission to delete. Run with sudo or adjust folder permissions.';
    case 'EPERM':
    case 'EBUSY':
      return 'Folder is in use by another process. Close IDE or run: ./gradlew --stop';
    case 'ENOENT':
      return 'Folder no longer exists — probably deleted earlier.';
    default:
      return `Unknown error (${code}). Check system logs.`;
  }
}

/**
 * Deletes the build folders of the given projects.
 */
export async function cleanProjects(projects: Project[]): Promise<CleanResult[]> {
  const results: CleanResult[] = [];
  let index = 0;

  const workers = Array.from({ length: Math.min(CONCURRENCY, projects.length) }).map(async () => {
    while (index < projects.length) {
      const project = projects[index++];
      if (!project) continue; // TS safety

      try {
        const paths = project.buildPaths;
        await Promise.all(paths.map(p => fs.rm(p, { recursive: true, force: true })));
        
        results.push({
          project,
          freed: project.size, // Assuming we trust the snapshot sized before cleaning
        });
      } catch (err) {
        let code: CleanErrorCode = 'ENOENT'; // fallback
        if (err instanceof Error && 'code' in err && typeof err.code === 'string') {
          // Coerce to known code or default message
          const c = err.code as string;
          if (['EACCES', 'EPERM', 'EBUSY', 'ENOENT'].includes(c)) {
            code = c as CleanErrorCode;
          }
        }
        
        results.push({
          project,
          freed: null,
          error: {
            code,
            message: getActionableMessage(code)
          }
        });
      }
    }
  });

  await Promise.all(workers);
  return results;
}
