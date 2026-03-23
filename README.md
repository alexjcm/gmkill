# gmkill

Interactive CLI to reclaim disk space by finding and deleting `target/` (Maven) and `build/` (Gradle) folders. Scans up to 6 directory levels deep from your home directory and provides a visual TUI to manage and delete them.

## Features

- **Fast & Deep Scanning**: Scans up to 6 levels deep from `~/` while smartly ignoring non-relevant folders (e.g. `node_modules`, `.git`).
- **Interactive TUI**: Navigates results cleanly using your keyboard.
- **Smart Classification**: Detects Java/Kotlin JVM projects (Maven & Gradle) and consolidates multi-module projects into single entries.
- **Concurrent Size Calculation**: Calculates build folder sizes concurrently without exhausting OS file descriptors.

## Requirements

- Node.js >= 24.0.0

## Running Locally

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the CLI in development mode:
   ```bash
   npm run dev
   ```

## Key Bindings (TUI)

- `↑`/`k` or `↓`/`j`: Move cursor up or down.
- `SPACE`: Select or deselect a project for deletion.
- `a`: Select or deselect all projects.
- `D`: Proceed to delete selected projects.
- `Q` or `ESC`: Quit the application.

## Building and Distributing

To compile the TypeScript project and generate the executable:

```bash
npm run build
```

This creates a `dist/` directory with a local ready-to-use Node binary. You can test the global link locally using:

```bash
npm link
build-kill
```
