# projclean

![NPM Version](https://img.shields.io/npm/v/projclean?style=for-the-badge&logo=npm)
![NPM Downloads](https://img.shields.io/npm/dm/projclean?style=for-the-badge&logo=npm)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D24-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

![Gradle](https://img.shields.io/badge/Gradle-02303A?style=for-the-badge&logo=gradle&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white)

Interactive TUI to reclaim disk space by finding and cleaning `build/` (Gradle) and `target/` (Maven) folders across all your JVM projects. Scans up to 8 directory levels deep from your home directory.

## Features

- **Fast parallel scanning** — uses `fast-glob` with up to 8 levels deep from `~/`, skipping irrelevant folders (`node_modules`, `.git`, `build`, `target`).
- **Safety validation** — verifies standard JVM build artifacts before marking a folder for deletion, preventing accidental removal of non-JVM `build/` directories.
- **Multi-module aware** — consolidates multi-module Gradle/Maven projects (JAR, WAR, EAR, etc.) into a single entry showing accurate module count and combined size.
- **Concurrent size calculation** — folder sizes are computed in parallel with up to 16 concurrent I/O workers while the TUI is already interactive.
- **Clean interactive TUI** — keyboard-driven list with selection, bulk operations, and a confirmation dialog before any deletion.

## Requirements

- Node.js >= 24

## Usage

```bash
npx projclean
```

Or install globally:

```bash
npm install -g projclean
projclean
```

## Key Bindings

| Key | Action |
|-----|--------|
| `↑` / `k` | Move cursor up |
| `↓` / `j` | Move cursor down |
| `g` / `G` | Jump to top / bottom of list |
| `SPACE` | Select / deselect (advances cursor) |
| `ENTER` | Select / deselect (stays on row) |
| `a` | Select / deselect all projects |
| `D` | Delete selected projects |
| `Q` / `ESC` | Quit |

## Running Locally

```bash
git clone https://github.com/alexjcm/projclean.git
cd projclean
npm install
npm run dev
```

## Building

```bash
npm run build
```

Compiles TypeScript to `dist/` and marks the output as executable. Test locally with:

```bash
npm link
projclean
```

## Future Enhancements

- [ ] Support for other ecosystems (Node.js `node_modules`, Python `__pycache__`, etc.)
- [ ] iOS project cleanup (`DerivedData`)
- [ ] Filter / search by project name
