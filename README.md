# projclean

![NPM Version](https://img.shields.io/npm/v/projclean?style=for-the-badge&logo=npm)
![NPM Downloads](https://img.shields.io/npm/dm/projclean?style=for-the-badge&logo=npm)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![ESLint](https://img.shields.io/badge/ESLint_10-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)

![Gradle](https://img.shields.io/badge/Gradle-02303A?style=for-the-badge&logo=gradle&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white)

Interactive CLI to reclaim disk space by finding and deleting `build/` (Gradle) and `target/` (Maven) folders. Scans up to 8 directory levels deep from your home directory and provides a visual TUI to manage and delete them.

## Features

- **Fast & Deep Scanning**: Scans up to 8 levels deep from `~/` while smartly ignoring non-relevant folders (e.g. `node_modules`, `.git`).
- **Interactive TUI**: Navigates results cleanly using your keyboard.
- **Smart Classification**: Detects Java/Kotlin JVM projects (Gradle & Maven) and consolidates multi-module projects into single entries.
- **Improved Security**: Validates build folders using fast heuristics (verifies standard JVM artifacts) before marking them for deletion.

## Requirements

- Node.js >= 24

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
- `SPACE` / `ENTER`: Select or deselect a project for deletion.
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
projclean
```

## Future Enhancements

- [ ] Support for other ecosystems (Node.js/npm, Python, etc.) to clean `node_modules` and `dist` folders.
- [ ] Support for iOS project cleanup (DerivedData).
