import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import util from 'node:util';
import React from 'react';
import { render } from 'ink';
import { App } from './ui/App.js';
import { logger } from './ui/logger.js';
import { EXIT_CODES } from './core/constants.js';

// Get current directory for reading package.json
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getVersion(): string {
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function printHelp() {
  const v = getVersion();
  console.log(`
  gmkill v${v}

  Interactive CLI to detect and clean Maven target/ and Gradle build/ folders.
  Scans up to 6 levels deep from your home directory to find valid JVM projects.

  Usage:
    build-kill

  Flags:
    --version     Print version and exit
    --help        Print this help message and exit

  Shortcuts (when running):
    ↑/k, ↓/j      Navigate project list
    SPACE         Select/Deselect project for cleanup
    a             Select/Deselect all projects
    D             Initiate deletion of selected projects
    Q, ESC        Quit the application
  `);
}

function checkNodeVersion() {
  const v = process.versions.node;
  const major = parseInt(v.split('.')[0] || '0', 10);
  if (major < 24) {
    logger.error(`This CLI requires Node.js 24 or higher. You are using v${v}`);
    process.exit(EXIT_CODES.FATAL_ERROR);
  }
}

async function main() {
  let values;
  try {
    const parsed = util.parseArgs({
      options: {
        version: { type: 'boolean', short: 'v' },
        help: { type: 'boolean', short: 'h' },
      },
      strict: true,
    });
    values = parsed.values;
  } catch (err) {
    logger.error('Invalid argument.', err);
    process.exit(EXIT_CODES.INVALID_ARGUMENT);
  }

  if (values.version) {
    logger.info(`gmkill v${getVersion()}`);
    process.exit(EXIT_CODES.SUCCESS);
  }

  if (values.help) {
    printHelp();
    process.exit(EXIT_CODES.SUCCESS);
  }

  checkNodeVersion();

  // Ink handles Ctrl+C when exitOnCtrlC is true. We set it to false and
  // gracefully tear down manually within App using useApp().exit()
  render(React.createElement(App), {
    exitOnCtrlC: false,
    incrementalRendering: true,
  });

  // Fallback cleanup purely for UX (restoring cursor) in case of hard crash
  process.on('exit', () => {
    process.stdout.write('\x1B[?25h');
  });
}

main().catch((err) => {
  logger.error('Unexpected fatal error', err);
  process.exit(EXIT_CODES.FATAL_ERROR);
});
