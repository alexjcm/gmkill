import fs from 'node:fs/promises';
import path from 'node:path';
import { CONCURRENCY } from './constants.js';

/**
 * Calculates the total size of a directory recursively.
 * Handles missing permissions gracefully by ignoring restricted folders.
 *
 * @param dirPath Absolute path to the directory
 * @returns Total size in bytes, or null if the base directory is inaccessible
 */
export async function calculateSize(dirPath: string): Promise<number | null> {
  try {
    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) {
      return stats.size;
    }
  } catch (error) {
    if (isSystemError(error) && ['EACCES', 'EPERM', 'ENOENT', 'EBUSY'].includes(error.code)) {
      return null;
    }
    throw error;
  }

  let totalSize = 0;
  const dirQueue: string[] = [dirPath];
  let activeWorkers = 0;

  return new Promise<number>((resolve, reject) => {
    let hasError = false;

    const processQueue = () => {
      if (hasError) return;

      if (dirQueue.length === 0 && activeWorkers === 0) {
        resolve(totalSize);
        return;
      }

      while (dirQueue.length > 0 && activeWorkers < CONCURRENCY) {
        const currentDir = dirQueue.shift()!;
        activeWorkers++;
        processDirectory(currentDir).finally(() => {
          activeWorkers--;
          processQueue();
        });
      }
    };

    const processDirectory = async (dir: string) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const entryPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            dirQueue.push(entryPath);
          } else {
            // Using stat for accurate size, or assuming file size is small enough
            // For extreme speed, we could skip stat for files, or just stat files concurrently too
            try {
              const fileStat = await fs.stat(entryPath);
              totalSize += fileStat.size;
            } catch (err) {
              if (isSystemError(err) && ['EACCES', 'EPERM', 'ENOENT'].includes(err.code)) continue;
              throw err;
            }
          }
        }
      } catch (err) {
        if (isSystemError(err) && ['EACCES', 'EPERM', 'ENOENT'].includes(err.code)) {
          return;
        }
        hasError = true;
        reject(err);
      }
    };

    processQueue();
  });
}

function isSystemError(err: unknown): err is NodeJS.ErrnoException & { code: string } {
  return err instanceof Error && 'code' in err && typeof (err as any).code === 'string';
}
