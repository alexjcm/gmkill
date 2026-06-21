import fs from 'node:fs/promises';
import type { BuildType } from './types.js';

/**
 * Verifies if a directory contains standard JVM build output subdirectories.
 * This is a "strict" check to prevent accidental deletion of non-JVM folders.
 */
export async function isJVMBuildFolder(dir: string, type: BuildType): Promise<boolean> {
  const subdirs = type === 'gradle'
    ? ['classes', 'libs', 'resources', 'tmp', 'kotlin', 'reports', 'intermediates', 'outputs', 'test-results', 'generated']
    : ['classes', 'generated-sources', 'maven-status', 'surefire-reports', 'maven-archiver', 'test-classes'];

  try {
    const entries = await fs.readdir(dir);
    const entrySet = new Set(entries);
    return subdirs.some((sub) => entrySet.has(sub));
  } catch {
    return false;
  }
}
