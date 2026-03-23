export const logger = {
  info: (msg: string) => console.log(`  ${msg}`),
  success: (msg: string) => console.log(`✔ ${msg}`),
  warn: (msg: string) => console.warn(`⚠ ${msg}`),
  error: (msg: string, err?: unknown) => {
    console.error(`✖ ${msg}`);
    if (err instanceof Error) console.error(`  ${err.message}`);
  },
};
