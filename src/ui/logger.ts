import fs from 'node:fs';

export const logger = {
  info: (msg: string) => console.log(`  ${msg}`),
  success: (msg: string) => console.log(`✔ ${msg}`),
  warn: (msg: string) => console.warn(`⚠ ${msg}`),
  error: (msg: string, err?: unknown) => {
    // Only log to file in development mode
    if (process.env['NODE_ENV'] === 'development') {
      const logMsg = `[${new Date().toISOString()}] ✖ ${msg}${err instanceof Error ? `: ${err.message}` : ''}\n`;
      try {
        fs.appendFileSync('projclean.log', logMsg);
      } catch {
        // Fallback or ignore if write fails
      }
    }
    
    // Original console error (may be hidden by Ink)
    console.error(`✖ ${msg}`);
    if (err instanceof Error) console.error(`  ${err.message}`);
  },
};
