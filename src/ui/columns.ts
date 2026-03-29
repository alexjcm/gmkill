/**
 * Column layout constants shared between ProjectList (headers)
 * and ProjectItem (rows). Centralised here to prevent misalignment.
 */
export const COL_CHECK = 3;
export const COL_MODULES = 8;
export const COL_SIZE = 15;
export const MIN_PATH_WIDTH = 40;

export function calcPathWidth(terminalColumns: number): number {
  return Math.max(MIN_PATH_WIDTH, terminalColumns - (COL_CHECK + COL_MODULES + COL_SIZE + 5));
}
