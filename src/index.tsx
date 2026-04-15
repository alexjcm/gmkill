#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import util from 'node:util';
import React from 'react';
import { render } from 'ink';
import { App } from './ui/App.js';
import { logger } from './ui/logger.js';
import { EXIT_CODES } from './core/constants.js';
import { formatBytes } from './utils/format.js';

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
  projclean v${v}

  Interactive CLI to detect and clean Node.js, Maven target/ and Gradle build/ folders.
  Scans up to 8 directory levels deep to find valid projects.

  Usage:
    projclean [path]

  Example:
    projclean .          # Scan current directory
    projclean ~/code     # Scan specific folder

  Flags:
    --version, -v Print version and exit
    --help, -h    Print this help message and exit

  Shortcuts (when running):
    ↑/k, ↓/j      Navigate project list
    g / G         Jump to top / bottom
    SPACE         Select/Deselect project (advances cursor)
    ENTER         Select/Deselect project (stays on row)
    a             Select/Deselect all projects
    D             Initiate deletion of selected projects
    Q, ESC        Quit the application
  `);
}

function checkNodeVersion() {
  const v = process.versions.node;
  const major = parseInt(v.split('.')[0] || '0', 10);
  if (major < 20) {
    logger.error(`This CLI requires Node.js 20 or higher. You are using v${v}`);
    process.exit(EXIT_CODES.FATAL_ERROR);
  }
}

async function main() {
  let values, positionals;
  try {
    const parsed = util.parseArgs({
      options: {
        version: { type: 'boolean', short: 'v' },
        help: { type: 'boolean', short: 'h' },
      },
      allowPositionals: true,
      strict: true,
    });
    values = parsed.values;
    positionals = parsed.positionals;
  } catch (err) {
    logger.error('Invalid argument.', err);
    process.exit(EXIT_CODES.INVALID_ARGUMENT);
  }

  if (values.version) {
    logger.info(`projclean v${getVersion()}`);
    process.exit(EXIT_CODES.SUCCESS);
  }

  if (values.help) {
    printHelp();
    process.exit(EXIT_CODES.SUCCESS);
  }

  checkNodeVersion();

  // Track cumulative space freed across the session
  let totalFreedInSession = 0;
  const handleSpaceFreed = (bytes: number) => {
    totalFreedInSession += bytes;
  };

  const scanRoot = positionals[0];

  const { waitUntilExit } = render(React.createElement(App, { onSpaceFreed: handleSpaceFreed, scanRoot }), {
    exitOnCtrlC: false,
  });

  await waitUntilExit();

  console.log(`\n  Space released: ${formatBytes(totalFreedInSession)}\n`);

  process.on('exit', () => {
    process.stdout.write('\x1B[?25h');
  });
}

main().catch((err) => {
  logger.error('Unexpected fatal error', err);
  process.exit(EXIT_CODES.FATAL_ERROR);
});
