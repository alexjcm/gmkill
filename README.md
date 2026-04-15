# projclean

![NPM Version](https://img.shields.io/npm/v/projclean?style=for-the-badge&logo=npm)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D24-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

![Gradle](https://img.shields.io/badge/Gradle-02303A?style=for-the-badge&logo=gradle&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white)

Interactive TUI to reclaim disk space by finding and cleaning deep compile caches, `node_modules`, `build/` (Gradle) and `target/` (Maven) folders across all your Node.js and JVM projects. Scans up to 8 directory levels deep from your local directory or home.

## Features
- **Multi-ecosystem support** — wipes `target/` for Maven, `build/` for Gradle, and 26 standard development targets for Node (`node_modules`, `.next`, `.vite`, `.astro`, etc.).
- **Fast parallel scanning** — uses `fast-glob` from any directory, natively skipping deep cache traps.
- **Safety validation** — verifies standard build artifacts before marking a folder for deletion.
- **Multi-module aware** — consolidates multi-module Gradle/Maven projects (JAR, WAR, EAR, etc.) into a single entry showing accurate module count and combined size.
- **Concurrent size calculation** — folder sizes are computed in parallel with up to 16 concurrent I/O workers while the TUI is already interactive.
- **Clean interactive TUI** — keyboard-driven list with selection, bulk operations, and a confirmation dialog before any deletion.

## Requirements

- Node.js >= 20

```bash
npx projclean
```

### Installation
```bash
npm install -g projclean
```

## Key Bindings

| Key | Action |
|-----|--------|
| `↑` | Move cursor up |
| `↓` | Move cursor down |
| `g` / `G` | Jump to top / bottom of list |
| `SPACE` | Select / deselect (advances cursor) |
| `ENTER` | Select / deselect (stays on row) |
| `a` | Select / deselect all projects |
| `D` | Delete selected projects |
| `Q` / `ESC` | Quit |

## Running Locally

```bash
npm install
npm run dev
```

## Building

```bash
npm run build

npm link
projclean
```
