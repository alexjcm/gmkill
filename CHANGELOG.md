# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Replaced `fast-glob` with a custom asynchronous, queue-based streaming BFS directory walker, enabling instant TUI feedback as projects are discovered.

### Changed
- Parallelized directory size calculations for `fs.stat` queries, resulting in 5x-10x faster sizing of large folders like `node_modules`.
- Optimized project detection by removing redundant `fs.access` disk queries for build indicators and Node.js target directories.

### Fixed
- Fixed directory walker to ignore hidden configuration directories (e.g., `.npm`, `.vscode`, `.antigravity`, `.devin`, `.windsurf`) unless explicitly set as the scan root.

## [1.2.0] - 2026-05-10

### Changed
- Enabled incremental rendering, capped render FPS, and switched the TUI to the terminal alternate screen for a cleaner interactive experience.
- Improved terminal resize handling by moving list layout sizing to Ink's `useWindowSize()` hook.
- Added lightweight screen reader semantics and clearer accessible instructions for list navigation and delete confirmation.
- Added post-clean batch summaries showing cleaned project count and total space released for each cleanup operation.
- Refined the TUI visual hierarchy with a centralized color palette, stronger row selection states, improved focus/selection contrast, and a darker dedicated shortcuts footer.
- Raised the minimum supported Node.js version to 22.

### Fixed
- Fixed session total space released so projects deleted while still sizing are now measured at delete-time instead of contributing `0 B`.

## [1.1.0] - 2026-04-14

### Added
- Multi-ecosystem support: Node.js/JavaScript detection.
- Fast-cleaning of Node targets (`node_modules`, `.next`, `dist`, `.astro`, `.vercel`, etc.).
- CLI parameter support: Start scanning from any custom directory instead of default `~/` (e.g., `npx projclean .`).

### Changed
- Massively optimized concurrent `fs` operations to handle heavy JS projects safely without deep globbing.
- Restructured internal architecture for composite IDs enabling hybrid Java/Node.js monorepo support.

## [1.0.0] 2026-03-29

### Added
- Initial release.
- Interactive CLI for scanning Maven `target/` and Gradle `build/` folders.
- Concurrent size calculation and secure interactive TUI.
